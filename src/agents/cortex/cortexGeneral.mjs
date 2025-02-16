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

// Add new constants for thread management
const activeRuns = new Map();
const threadLocks = new Map();
const LOCK_TIMEOUT = 30000;
const CHECK_INTERVAL = 1000;

// Add helper function to manage thread locks
async function acquireThreadLock(threadId) {
    while (threadLocks.has(threadId)) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    threadLocks.set(threadId, Date.now());
}

function releaseThreadLock(threadId) {
    threadLocks.delete(threadId);
}

async function processMessageBatch() {
    if (isProcessing || messageQueue.length === 0) return;
    isProcessing = true;

    try {
        const batch = messageQueue.splice(0, BATCH_SIZE);
        
        for (const msg of batch) {
            try {
                const result = await processSingleMessage(msg);
                responsePromises.get(msg.id)?.[0](result);
            } catch (error) {
                responsePromises.get(msg.id)?.[1](error);
            } finally {
                responsePromises.delete(msg.id);
            }
        }

        if (messageQueue.length > 0) {
            setTimeout(processMessageBatch, 100);
        }
    } finally {
        isProcessing = false;
    }
}

async function processSingleMessage(messageData) {
    const { userInput, additionalData } = messageData;
    let retries = 0;

    if (!mainThread) {
        throw new Error('Thread not initialized');
    }

    while (retries < MAX_RETRIES) {
        try {
            await acquireThreadLock(mainThread.id);
            
            // Check for existing active run
            if (activeRuns.has(mainThread.id)) {
                const lastRun = activeRuns.get(mainThread.id);
                try {
                    const runStatus = await openai.beta.threads.runs.retrieve(mainThread.id, lastRun);
                    if (!['completed', 'failed', 'cancelled', 'expired'].includes(runStatus.status)) {
                        throw new Error('Thread has active run');
                    }
                } catch (error) {
                    if (error.status === 404) {
                        activeRuns.delete(mainThread.id);
                    } else {
                        throw error;
                    }
                }
            }

            const userMessage = await openai.beta.threads.messages.create(mainThread.id, {
                role: "user",
                content: userInput
            });

            const run = await openai.beta.threads.runs.create(mainThread.id, {
                assistant_id: config.llmSettings.openAI.assistants.cortexGeneral
            });

            activeRuns.set(mainThread.id, run.id);
            
            const response = await waitForCompletion(run.id);
            
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

        } catch (error) {
            if (error.message.includes('active run') && retries < MAX_RETRIES - 1) {
                retries++;
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * retries));
                continue;
            }
            throw error;
        } finally {
            releaseThreadLock(mainThread.id);
        }
    }
    throw new Error(`Failed to process message after ${MAX_RETRIES} retries`);
}

async function waitForCompletion(runId) {
    const maxAttempts = 30;
    let attempts = 0;

    try {
        while (attempts < maxAttempts) {
            const runStatus = await openai.beta.threads.runs.retrieve(mainThread.id, runId);
            
            if (runStatus.status === 'completed') {
                const messages = await openai.beta.threads.messages.list(mainThread.id);
                return messages.data[0];
            }
            
            if (['failed', 'cancelled', 'expired'].includes(runStatus.status)) {
                throw new Error(`Assistant run ${runStatus.status}`);
            }
            
            await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
            attempts++;
        }
        throw new Error('Assistant timed out');
    } finally {
        activeRuns.delete(mainThread.id);
    }
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
            responsePromises.set(messageId, [resolve, reject]);
            messageQueue.push({ id: messageId, userInput, additionalData });
            
            if (!isProcessing) {
                processMessageBatch().catch(reject);
            }
        });

        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Response timeout')), 30000)
        );

        return await Promise.race([responsePromise, timeoutPromise]);

    } catch (error) {
        console.error("Error in Cortex General Assistant:", error);
        throw error;
    }
}

export function getCurrentThreadId() {
    return mainThread?.id || null;
}