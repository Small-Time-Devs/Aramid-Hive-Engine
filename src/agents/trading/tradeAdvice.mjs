import OpenAI from 'openai';
import { config } from '../../config/config.mjs';
import { storeTradeAdviceConversation, getAssistantThread, storeAssistantThread } from '../../db/dynamo.mjs';

const openai = new OpenAI();
const ASSISTANT_NAME = 'TradeAdvice';
let mainThread = null;

// Initialize thread from storage or create new one
async function initializeThread() {
    try {
        const existingThreadId = await getAssistantThread(ASSISTANT_NAME);
        
        if (existingThreadId) {
            console.log('🧵 Recovered existing TradeAdvice thread:', existingThreadId);
            return { id: existingThreadId };
        } else {
            const newThread = await openai.beta.threads.create();
            await storeAssistantThread(ASSISTANT_NAME, newThread.id);
            console.log('🧵 Created new TradeAdvice thread:', newThread.id);
            return newThread;
        }
    } catch (error) {
        console.error('Error initializing TradeAdvice thread:', error);
        throw error;
    }
}

// Initialize thread immediately when module loads
(async () => {
    try {
        mainThread = await initializeThread();
        console.log(`🔄 TradeAdvice initialized with thread: ${mainThread.id}`);
    } catch (error) {
        console.error('❌ Failed to initialize TradeAdvice thread:', error);
        process.exit(1); // Exit if we can't initialize the thread
    }
})();

function parseTradeAdvice(advice) {
    if (advice === 'Sell Now' || advice === 'Hold') {
        return {
            action: advice,
            adjustments: null
        };
    }

    const match = advice.match(/^Adjust Trade: targetPercentageGain: (\d+), targetPercentageLoss: (\d+)$/);
    if (match) {
        return {
            action: 'Adjust',
            adjustments: {
                targetPercentageGain: parseInt(match[1]),
                targetPercentageLoss: parseInt(match[2])
            }
        };
    }

    return {
        action: 'Hold',
        adjustments: null
    };
}

export async function getCurrentTradeAdvice(userInput, entryPriceSOL, targetPercentageGain, targetPercentageLoss) {
    try {
        // Ensure thread is initialized
        if (!mainThread) {
            throw new Error('Thread not initialized. Service not ready.');
        }

        // Prepare the input data
        const messageContent = {
            tradeInfo: {
                tokenData: userInput,
                position: {
                    entryPriceSOL,
                    targetPercentageGain,
                    targetPercentageLoss
                }
            }
        };

        // Add message to existing thread
        const userMessage = await openai.beta.threads.messages.create(mainThread.id, {
            role: "user",
            content: JSON.stringify(messageContent, null, 2)
        });

        // Run the assistant
        const run = await openai.beta.threads.runs.create(mainThread.id, {
            assistant_id: config.llmSettings.openAI.assistants.autoTraderAdvice
        });

        // Wait for the run to complete with timeout
        let runStatus;
        const maxAttempts = 30;
        let attempts = 0;

        while (attempts < maxAttempts) {
            runStatus = await openai.beta.threads.runs.retrieve(mainThread.id, run.id);
            console.log(`Run status: ${runStatus.status}`);

            if (runStatus.status === 'completed') {
                break;
            }
            if (runStatus.status === 'failed' || runStatus.status === 'cancelled') {
                throw new Error(`Assistant run ${runStatus.status}: ${runStatus.last_error?.message || 'Unknown error'}`);
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            attempts++;
        }

        if (attempts >= maxAttempts) {
            throw new Error('Assistant timed out');
        }

        // Get the messages
        const messages = await openai.beta.threads.messages.list(mainThread.id);
        
        if (!messages.data || messages.data.length === 0) {
            throw new Error('No messages returned from assistant');
        }

        const lastMessage = messages.data[0];
        if (!lastMessage.content?.[0]?.text?.value) {
            throw new Error('Invalid message structure received');
        }

        const advice = lastMessage.content[0].text.value.trim();
        console.log('\n💡 Trade Advice:', advice);

        // Store combined conversation record in DynamoDB
        await storeTradeAdviceConversation({
            message_id: userMessage.id,
            thread_id: mainThread.id,
            timestamp: new Date().toISOString(),
            user_message: {
                content: JSON.stringify(messageContent, null, 2),
                timestamp: new Date().toISOString(),
                metadata: {
                    entryPriceSOL,
                    targetPercentageGain,
                    targetPercentageLoss
                }
            },
            assistant_response: {
                content: advice,
                message_id: lastMessage.id,
                timestamp: new Date().toISOString(),
                parsed_advice: parseTradeAdvice(advice)
            }
        });

        // Validate and parse the response
        const isValidAdjustTrade = /^Adjust Trade: targetPercentageGain: \d+, targetPercentageLoss: \d+$/.test(advice);
        const isValidResponse = advice === 'Sell Now' || advice === 'Hold' || isValidAdjustTrade;

        if (!isValidResponse) {
            console.warn('Invalid response format from assistant:', advice);
            return { action: 'Hold', adjustments: null };
        }

        return parseTradeAdvice(advice);

    } catch (error) {
        console.error('Error getting trade advice:', error);
        console.error('Error details:', error.stack);
        return { action: 'Hold', adjustments: null };
    }
}
