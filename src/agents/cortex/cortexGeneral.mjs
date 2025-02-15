import { config } from '../../config/config.mjs';
import OpenAI from 'openai';
import { storeGeneralConversation, getAssistantThread, storeAssistantThread } from '../../db/dynamo.mjs';

const openai = new OpenAI({
    apiKey: config.llmSettings.openAI.apiKey
});

const ASSISTANT_NAME = 'CortexGeneral';
let mainThread = null;

// Initialize thread from storage or create new one
async function initializeThread() {
    try {
        const existingThreadId = await getAssistantThread(ASSISTANT_NAME);
        
        if (existingThreadId) {
            console.log('🧵 Recovered existing thread:', existingThreadId);
            return { id: existingThreadId };
        } else {
            const newThread = await openai.beta.threads.create();
            await storeAssistantThread(ASSISTANT_NAME, newThread.id);
            console.log('🧵 Created new thread:', newThread.id);
            return newThread;
        }
    } catch (error) {
        console.error('Error initializing thread:', error);
        throw error;
    }
}

// Initialize thread immediately when module loads
(async () => {
    try {
        mainThread = await initializeThread();
        console.log(`🔄 CortexGeneral initialized with thread: ${mainThread.id}`);
    } catch (error) {
        console.error('❌ Failed to initialize CortexGeneral thread:', error);
        process.exit(1); // Exit if we can't initialize the thread
    }
})();

// Message queue and processing state with response tracking
const messageQueue = [];
const responsePromises = new Map();
let isProcessing = false;
const BATCH_SIZE = 5;
const RETRY_DELAY = 2000; // 2 seconds
const MAX_RETRIES = 3;

async function processMessageBatch() {
    if (isProcessing || messageQueue.length === 0) return;
    isProcessing = true;

    try {
        const batch = messageQueue.splice(0, BATCH_SIZE);
        const batchPromises = [];

        for (const msg of batch) {
            let retries = 0;
            while (retries < MAX_RETRIES) {
                try {
                    const resultPromise = processSingleMessage(msg);
                    batchPromises.push(resultPromise);
                    
                    // Store promise in map with message ID
                    responsePromises.set(msg.id, resultPromise);
                    break;
                } catch (error) {
                    if (error.message.includes('active run') && retries < MAX_RETRIES - 1) {
                        retries++;
                        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * retries));
                        continue;
                    }
                    // Store error in response map
                    responsePromises.set(msg.id, Promise.reject(error));
                    break;
                }
            }
        }

        // Wait for all batch messages to complete
        await Promise.allSettled(batchPromises);

        // Process next batch if queue is not empty
        if (messageQueue.length > 0) {
            setTimeout(processMessageBatch, 100);
        }
    } finally {
        isProcessing = false;
    }
}

async function processSingleMessage(messageData) {
    const { userInput, additionalData } = messageData;
    
    // Ensure thread is initialized
    if (!mainThread) {
        throw new Error('Thread not initialized. Service not ready.');
    }

    const userMessage = await openai.beta.threads.messages.create(mainThread.id, {
        role: "user",
        content: userInput
    });

    const run = await openai.beta.threads.runs.create(mainThread.id, {
        assistant_id: config.llmSettings.openAI.assistants.cortexGeneral
    });

    // Wait for completion with improved timeout handling
    const response = await waitForCompletion(run.id);
    
    // Store in DynamoDB
    await storeGeneralConversation({
        message_id: userMessage.id,
        thread_id: mainThread.id,
        timestamp: new Date().toISOString(),
        user_message: {
            content: userInput,
            timestamp: new Date().toISOString()
        },
        assistant_response: {
            content: response.content[0].text.value,
            message_id: response.id,
            timestamp: new Date().toISOString()
        }
    });

    return response.content[0].text.value;
}

async function waitForCompletion(runId) {
    const maxAttempts = 30;
    let attempts = 0;

    while (attempts < maxAttempts) {
        const runStatus = await openai.beta.threads.runs.retrieve(mainThread.id, runId);
        
        if (runStatus.status === 'completed') {
            const messages = await openai.beta.threads.messages.list(mainThread.id);
            return messages.data[0];
        }
        
        if (runStatus.status === 'failed' || runStatus.status === 'cancelled') {
            throw new Error(`Assistant run ${runStatus.status}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
    }

    throw new Error('Assistant timed out');
}

// Modified generate response function to use response tracking
export async function generateCortexGeneralResponse(userInput, additionalData = null) {
    try {
        console.log('\n📝 Processing user question:', userInput);
        
        // Create unique message ID
        const messageId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        
        // Add message to queue with ID
        messageQueue.push({ id: messageId, userInput, additionalData });
        
        // Create promise for this message's response
        const responsePromise = new Promise((resolve, reject) => {
            // Start batch processing if not already running
            if (!isProcessing) {
                processMessageBatch().catch(reject);
            }
            
            // Check response map periodically
            const checkResponse = setInterval(() => {
                if (responsePromises.has(messageId)) {
                    clearInterval(checkResponse);
                    responsePromises.get(messageId)
                        .then(resolve)
                        .catch(reject)
                        .finally(() => responsePromises.delete(messageId));
                }
            }, 100);

            // Timeout after 30 seconds
            setTimeout(() => {
                clearInterval(checkResponse);
                reject(new Error('Response timeout'));
            }, 30000);
        });

        return await responsePromise;

    } catch (error) {
        console.error("Error in Cortex General Assistant:", error);
        throw error;
    }
}

export function getCurrentThreadId() {
    return mainThread?.id || null;
}