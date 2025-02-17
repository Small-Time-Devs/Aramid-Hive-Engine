import OpenAI from 'openai';
import { config } from '../../../config/config.mjs';
import { storeAutoTraderConversation, getAssistantThread, storeAssistantThread } from '../../../db/dynamo.mjs';

const openai = new OpenAI();
const ASSISTANT_NAME = 'AutoTrader';
let mainThread = null;
let currentlyProcessing = false;

// Initialize thread from storage or create new one
async function initializeThread() {
    try {
        if (config.llmSettings.openAI.assistants.useAutoTraderSameThread) {
            const existingThreadId = await getAssistantThread(ASSISTANT_NAME);
            
            if (existingThreadId) {
                console.log('🧵 Recovered existing AutoTrader thread:', existingThreadId);
                return { id: existingThreadId };
            } else {
                const newThread = await openai.beta.threads.create();
                await storeAssistantThread(ASSISTANT_NAME, newThread.id);
                console.log('🧵 Created new AutoTrader thread:', newThread.id);
                return newThread;
            }
        } else {
            // Don't store the thread ID if we're not using persistent threads
            const newThread = await openai.beta.threads.create();
            console.log('🧵 Created new temporary thread:', newThread.id);
            return newThread;
        }
    } catch (error) {
        console.error('Error initializing AutoTrader thread:', error);
        throw error;
    }
}

// Only initialize persistent thread if configured to use same thread
if (config.llmSettings.openAI.assistants.useAutoTraderSameThread) {
    (async () => {
        try {
            mainThread = await initializeThread();
            console.log(`🔄 AutoTrader initialized with persistent thread: ${mainThread.id}`);
        } catch (error) {
            console.error('❌ Failed to initialize AutoTrader thread:', error);
            process.exit(1); // Exit if we can't initialize the thread
        }
    })();
}

// Helper function to convert metadata values to strings
function sanitizeMetadata(metadata) {
    const sanitized = {};
    for (const [key, value] of Object.entries(metadata)) {
        sanitized[key] = value === null || value === undefined ? '' : String(value);
    }
    return sanitized;
}

function summarizeRiskData(rugCheckRisks) {
    try {
        const risks = JSON.parse(rugCheckRisks);
        const riskLevels = risks.map(r => r.level);
        return `risks:${risks.length},danger:${riskLevels.filter(l => l === 'danger').length},warn:${riskLevels.filter(l => l === 'warn').length}`;
    } catch (e) {
        return 'risks:unknown';
    }
}

async function processSingleMessage(userInput) {
    try {
        // Create new thread for each message if not using persistent thread
        const thread = config.llmSettings.openAI.assistants.useAutoTraderSameThread 
            ? mainThread 
            : await initializeThread();

        if (!thread) {
            throw new Error('Thread initialization failed. Service not ready.');
        }

        // Only handle concurrent processing for persistent threads
        if (config.llmSettings.openAI.assistants.useAutoTraderSameThread && currentlyProcessing) {
            console.log('Waiting for previous message to complete...');
            await new Promise(resolve => {
                const checkInterval = setInterval(() => {
                    if (!currentlyProcessing) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 500);
            });
        }

        currentlyProcessing = true;

        const userMessage = await openai.beta.threads.messages.create(thread.id, {
            role: "user",
            content: JSON.stringify(userInput, null, 2),
            metadata: sanitizeMetadata({
                messageType: 'input_data',
                priceUSD: userInput.PriceUSD,
                liquidityUSD: userInput.LiquidityUSD,
                marketCap: userInput.MarketCap,
                timeCreated: userInput.TimeCreated,
                riskSummary: summarizeRiskData(userInput.rugCheckRisks),
                priceChange24h: userInput.PriceChange24h,
                volume24h: userInput.Volume24h
            })
        });

        const run = await openai.beta.threads.runs.create(thread.id, {
            assistant_id: config.llmSettings.openAI.assistants.autoTrader
        });

        const response = await waitForCompletion(run.id, thread.id);
        
        await storeAutoTraderConversation({
            message_id: userMessage.id,
            thread_id: thread.id,
            timestamp: new Date().toISOString(),
            user_message: {
                content: JSON.stringify(userInput, null, 2),
                metadata: userMessage.metadata,
                timestamp: new Date().toISOString()
            },
            assistant_response: {
                content: JSON.stringify(response.agentConfigurations, null, 2),
                message_id: response.lastMessage.id,
                metadata: {
                    analysis_completed: true,
                    token_address: userInput.ContractAddress,
                    decision_summary: response.agentConfigurations?.[1]?.decision || 'No decision',
                    price_usd: userInput.PriceUSD,
                    liquidity_usd: userInput.LiquidityUSD,
                    market_cap: userInput.MarketCap,
                    trading_volume_24h: userInput.Volume24h
                },
                timestamp: new Date().toISOString()
            }
        });

        // Clean up temporary thread if not using persistent threads
        if (!config.llmSettings.openAI.assistants.useAutoTraderSameThread) {
            try {
                await openai.beta.threads.del(thread.id);
                console.log('🧹 Cleaned up temporary thread:', thread.id);
            } catch (cleanupError) {
                console.warn('Warning: Failed to cleanup temporary thread:', cleanupError);
            }
        }

        return response.agentConfigurations;

    } catch (error) {
        throw error;
    } finally {
        currentlyProcessing = false;
    }
}

// Update waitForCompletion to accept threadId parameter
async function waitForCompletion(runId, threadId) {
    const maxAttempts = 30; // Reduced from 60 to 30 seconds
    const checkInterval = 2000; // Check every 2 seconds instead of 1
    let attempts = 0;

    while (attempts < maxAttempts) {
        try {
            const runStatus = await openai.beta.threads.runs.retrieve(threadId, runId);
            
            // Only log status changes
            if (attempts === 0 || runStatus.status !== 'in_progress') {
                console.log(`Run status: ${runStatus.status}`);
            }

            if (runStatus.status === 'completed') {
                const messages = await openai.beta.threads.messages.list(threadId);
                const lastMessage = messages.data[0];
                console.log('\n🤖 Assistant Raw Response:\n', lastMessage.content[0].text.value);
                const agentConfigurations = await processResponse(lastMessage);
                return { agentConfigurations, lastMessage };
            }

            if (runStatus.status === 'failed' || runStatus.status === 'cancelled' || runStatus.status === 'expired') {
                throw new Error(`Assistant run ${runStatus.status}`);
            }

            await new Promise(resolve => setTimeout(resolve, checkInterval));
            attempts++;
        } catch (error) {
            console.error('Error checking run status:', error);
            throw error;
        }
    }

    throw new Error('Assistant timed out');
}

async function processResponse(lastMessage) {
    try {
        if (!lastMessage?.content?.[0]?.text?.value) {
            throw new Error('Invalid message structure received');
        }

        let responseText = lastMessage.content[0].text.value;
        
        // More aggressive cleanup of the response text
        responseText = responseText
            .replace(/```(?:json)?|```/g, '') // Remove code blocks
            .replace(/\\n/g, ' ') // Replace newlines with spaces
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();

        // Try to extract JSON array
        const jsonMatch = responseText.match(/\[(.*)\]/s);
        if (!jsonMatch) {
            throw new Error('No valid JSON array found in response');
        }

        // Parse the JSON array with more forgiving approach
        let analysis;
        try {
            // Try direct parsing first
            analysis = JSON.parse(jsonMatch[0]);
        } catch (e) {
            // If that fails, try to clean up the JSON string
            const cleanedJson = jsonMatch[0]
                .replace(/\\"/g, '"') // Fix escaped quotes
                .replace(/\\/g, '\\\\') // Fix escaped backslashes
                .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3'); // Ensure property names are quoted
            analysis = JSON.parse(cleanedJson);
        }

        // Validate the response structure
        if (!Array.isArray(analysis) || analysis.length === 0) {
            throw new Error('Invalid analysis format received');
        }

        // Return the original format without transformation
        return analysis;

    } catch (error) {
        console.error('Error processing response:', error);
        return [{
            name: "TokenSleuth",
            personality: "Analytical, data-driven, meme-savvy",
            response: "Error processing analysis",
            decision: "Pass: Unable to process data: " + error.message
        }];
    }
}

export async function generateAgentConfigurationsforAutoTrader(userInput) {
    try {
        return await processSingleMessage(userInput);
    } catch (error) {
        console.error("🚨 Error generating agent configurations:", error);
        throw new Error(`Failed to generate agent configurations: ${error.message}`);
    }
}