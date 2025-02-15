import OpenAI from 'openai';
import { config } from '../../config/config.mjs';
import { storeTradeAdviceConversation, getAssistantThread, storeAssistantThread } from '../../db/dynamo.mjs';

const openai = new OpenAI();
const ASSISTANT_NAME = 'TradeAdvice';
let mainThread = null;

// Initialize thread from storage or create new one
async function initializeThread() {
    try {
        if (config.llmSettings.openAI.assistants.useTraderAdviceSameThread) {
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
        } else {
            // Don't store the thread ID if we're not using persistent threads
            const newThread = await openai.beta.threads.create();
            console.log('🧵 Created new temporary thread:', newThread.id);
            return newThread;
        }
    } catch (error) {
        console.error('Error initializing TradeAdvice thread:', error);
        throw error;
    }
}

// Only initialize persistent thread if configured to use same thread
if (config.llmSettings.openAI.assistants.useTraderAdviceSameThread) {
    (async () => {
        try {
            mainThread = await initializeThread();
            console.log(`🔄 TradeAdvice initialized with persistent thread: ${mainThread.id}`);
        } catch (error) {
            console.error('❌ Failed to initialize TradeAdvice thread:', error);
            process.exit(1);
        }
    })();
}

export async function getCurrentTradeAdvice(userInput, entryPriceSOL, targetPercentageGain, targetPercentageLoss) {
    try {
        // Create new thread for each message if not using persistent thread
        const thread = config.llmSettings.openAI.assistants.useTraderAdviceSameThread 
            ? mainThread 
            : await initializeThread();

        if (!thread) {
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
        const userMessage = await openai.beta.threads.messages.create(thread.id, {
            role: "user",
            content: JSON.stringify(messageContent, null, 2)
        });

        // Run the assistant
        const run = await openai.beta.threads.runs.create(thread.id, {
            assistant_id: config.llmSettings.openAI.assistants.autoTraderAdvice
        });

        // Wait for the run to complete with timeout
        let runStatus;
        const maxAttempts = 30;
        let attempts = 0;

        while (attempts < maxAttempts) {
            runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
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
        const messages = await openai.beta.threads.messages.list(thread.id);
        
        if (!messages.data || messages.data.length === 0) {
            throw new Error('No messages returned from assistant');
        }

        const lastMessage = messages.data[0];
        if (!lastMessage.content?.[0]?.text?.value) {
            throw new Error('Invalid message structure received');
        }

        const advice = lastMessage.content[0].text.value.trim();
        console.log('\n💡 Trade Advice:', advice);

        // Store in DynamoDB without parsing
        await storeTradeAdviceConversation({
            message_id: userMessage.id,
            thread_id: thread.id,
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
                raw_advice: advice  // Store the raw advice
            }
        });

        // Clean up temporary thread if not using persistent threads
        if (!config.llmSettings.openAI.assistants.useTraderAdviceSameThread) {
            try {
                await openai.beta.threads.del(thread.id);
                console.log('🧹 Cleaned up temporary thread:', thread.id);
            } catch (cleanupError) {
                console.warn('Warning: Failed to cleanup temporary thread:', cleanupError);
            }
        }

        // Return the complete response
        return advice;

    } catch (error) {
        console.error('Error getting trade advice:', error);
        console.error('Error details:', error.stack);
        return 'Error occurred while getting trade advice';
    }
}
