import OpenAI from 'openai';
import { config } from '../../config/config.mjs';
import { storeAutoTraderConversation, getAssistantThread, storeAssistantThread } from '../../db/dynamo.mjs';

const openai = new OpenAI();
const ASSISTANT_NAME = 'AutoTrader';
let mainThread = null;
let currentlyProcessing = false;

// Initialize thread from storage or create new one
async function initializeThread() {
    try {
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
    } catch (error) {
        console.error('Error initializing AutoTrader thread:', error);
        throw error;
    }
}

// Initialize thread immediately when module loads
(async () => {
    try {
        mainThread = await initializeThread();
        console.log(`🔄 AutoTrader initialized with thread: ${mainThread.id}`);
    } catch (error) {
        console.error('❌ Failed to initialize AutoTrader thread:', error);
        process.exit(1); // Exit if we can't initialize the thread
    }
})();

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
        if (!mainThread) {
            throw new Error('Thread not initialized. Service not ready.');
        }

        // Wait if there's already a message being processed
        if (currentlyProcessing) {
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

        const userMessage = await openai.beta.threads.messages.create(mainThread.id, {
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

        const run = await openai.beta.threads.runs.create(mainThread.id, {
            assistant_id: config.llmSettings.openAI.assistants.autoTrader
        });

        const response = await waitForCompletion(run.id);
        
        await storeAutoTraderConversation({
            message_id: userMessage.id,
            thread_id: mainThread.id,
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

        return response.agentConfigurations;

    } catch (error) {
        throw error;
    } finally {
        currentlyProcessing = false;
    }
}

async function waitForCompletion(runId) {
    const maxAttempts = 60; // Increased timeout
    let attempts = 0;

    while (attempts < maxAttempts) {
        const runStatus = await openai.beta.threads.runs.retrieve(mainThread.id, runId);
        console.log(`Run status: ${runStatus.status}`);

        if (runStatus.status === 'completed') {
            const messages = await openai.beta.threads.messages.list(mainThread.id);
            const lastMessage = messages.data[0];
            const agentConfigurations = await processResponse(lastMessage);
            return { agentConfigurations, lastMessage };
        }

        if (runStatus.status === 'failed' || runStatus.status === 'cancelled') {
            throw new Error(`Assistant run ${runStatus.status}`);
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
    }

    throw new Error('Assistant timed out');
}

async function processResponse(lastMessage) {
    try {
        if (!lastMessage?.content?.[0]?.text?.value) {
            throw new Error('Invalid message structure received');
        }

        let responseText = lastMessage.content[0].text.value;
        
        // Clean up the response text
        responseText = responseText
            .replace(/```json|```/g, '')  // Remove JSON code block markers
            .trim()
            .replace(/,(\s*[}\]])/g, '$1'); // Remove trailing commas

        // Try to extract JSON if it's wrapped in something else
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            throw new Error('No valid JSON array found in response');
        }

        // Parse the JSON array
        const agentConfigurations = JSON.parse(jsonMatch[0]);

        // Validate the response structure
        if (!Array.isArray(agentConfigurations)) {
            throw new Error('Response is not an array');
        }

        return agentConfigurations;
    } catch (error) {
        console.error('Error processing response:', error);
        // Return a default empty array of configurations
        return [{
            name: "Analyst",
            response: "Error processing analysis"
        }, {
            name: "Investment Strategist",
            decision: "Pass",
            response: "Unable to process data"
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

// Helper function to determine risk level
function getRiskLevel(userInput) {
    const risks = JSON.parse(userInput.rugCheckRisks || '[]');
    const hasDangerRisks = risks.some(risk => risk.level === 'danger');
    const hasWarnRisks = risks.some(risk => risk.level === 'warn');
    
    if (hasDangerRisks) return 'high';
    if (hasWarnRisks) return 'medium';
    return 'low';
}

// Enhanced historical analysis retrieval with filtering
export async function getHistoricalAnalyses(options = {}) {
    try {
        const {
            tokenSymbol,
            limit = 10,
            minLiquidity,
            riskLevel,
            dateFrom,
            dateTo
        } = options;

        const threads = await openai.beta.threads.list({
            order: "desc",
            limit: limit,
            metadata: {
                ...(tokenSymbol && { tokenSymbol }),
                ...(riskLevel && { riskLevel }),
                type: 'trade_analysis'
            }
        });

        const analyses = threads.data
            .map(thread => ({
                threadId: thread.id,
                metadata: thread.metadata,
                created: new Date(thread.created_at * 1000).toISOString()
            }))
            .filter(analysis => {
                if (minLiquidity && analysis.metadata.liquidity_usd < minLiquidity) return false;
                if (dateFrom && new Date(analysis.created) < new Date(dateFrom)) return false;
                if (dateTo && new Date(analysis.created) > new Date(dateTo)) return false;
                return true;
            });

        return analyses;
    } catch (error) {
        console.error("Failed to retrieve historical analyses:", error);
        return [];
    }
}
