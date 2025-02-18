import { config } from '../../../config/config.mjs';
import OpenAI from 'openai';
import { storeGeneralConversation, getAssistantThread, storeAssistantThread } from '../../../db/dynamo.mjs';

const openai = new OpenAI({
    apiKey: config.llmSettings.openAI.apiKey
});

const ASSISTANT_NAME = 'AramidGeneral';
let mainThread = null;

// Initialize thread from storage or create new one
async function initializeThread() {
    try {
        if (config.llmSettings.openAI.assistants.useAramidGeneralSameThread) {
            const existingThreadId = await getAssistantThread(ASSISTANT_NAME);
            
            if (existingThreadId) {
                console.log('🧵 Recovered existing thread:', existingThreadId);
                return { id: existingThreadId };
            } else {
                const newThread = await openai.beta.threads.create();
                await storeAssistantThread(ASSISTANT_NAME, newThread.id);
                console.log('🧵 Created new persistent thread:', newThread.id);
                return newThread;
            }
        } else {
            // Don't store the thread ID if we're not using persistent threads
            const newThread = await openai.beta.threads.create();
            console.log('🧵 Created new temporary thread:', newThread.id);
            return newThread;
        }
    } catch (error) {
        console.error('Error initializing thread:', error);
        throw error;
    }
}

// Only initialize persistent thread if configured to use same thread
if (config.llmSettings.openAI.assistants.useAramidGeneralSameThread) {
    (async () => {
        try {
            mainThread = await initializeThread();
            console.log(`🔄 AramidGeneral initialized with persistent thread: ${mainThread.id}`);
        } catch (error) {
            console.error('❌ Failed to initialize AramidGeneral thread:', error);
            process.exit(1);
        }
    })();
}

// Message queue and processing state with response tracking
const messageQueue = [];
const responsePromises = new Map();
let isProcessing = false;
const BATCH_SIZE = 5;
const RETRY_DELAY = 2000; // 2 seconds
const MAX_RETRIES = 3;

// Add these near the top after initializing OpenAI
const activeRuns = new Map();

// Add these after the existing constants
const threadLocks = new Map(); // Track thread locks
const LOCK_TIMEOUT = 30000; // 30 seconds timeout for locks
const CHECK_INTERVAL = 1000; // Check run status every second

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

// Update waitForCompletion function
async function waitForCompletion(runId, threadId) {
    const maxAttempts = 30;
    let attempts = 0;

    try {
        while (attempts < maxAttempts) {
            const runStatus = await openai.beta.threads.runs.retrieve(threadId, runId);
            console.log(`Run status: ${runStatus.status}`);
            
            if (runStatus.status === 'completed') {
                const messages = await openai.beta.threads.messages.list(threadId);
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
        activeRuns.delete(threadId);
    }
}

// Update processSingleMessage with improved locking
async function processSingleMessage(messageData) {
    const { userInput, additionalData } = messageData;
    let retries = 0;
    const thread = config.llmSettings.openAI.assistants.useAramidGeneralSameThread 
        ? mainThread 
        : await initializeThread();

    if (!thread) {
        throw new Error('Thread not initialized');
    }

    while (retries < MAX_RETRIES) {
        try {
            await acquireThreadLock(thread.id);
            
            // Check for existing active run
            if (activeRuns.has(thread.id)) {
                const lastRun = activeRuns.get(thread.id);
                try {
                    const runStatus = await openai.beta.threads.runs.retrieve(thread.id, lastRun);
                    if (!['completed', 'failed', 'cancelled', 'expired'].includes(runStatus.status)) {
                        throw new Error('Thread has active run');
                    }
                } catch (error) {
                    if (error.status === 404) {
                        // Run not found, safe to proceed
                        activeRuns.delete(thread.id);
                    } else {
                        throw error;
                    }
                }
            }

            // Create message and start run
            const userMessage = await openai.beta.threads.messages.create(thread.id, {
                role: "user",
                content: userInput
            });

            const run = await openai.beta.threads.runs.create(thread.id, {
                assistant_id: config.llmSettings.openAI.assistants.aramidGeneral
            });

            activeRuns.set(thread.id, run.id);
            
            // Wait for completion
            const response = await waitForCompletion(run.id, thread.id);

            // Store in DynamoDB
            await storeGeneralConversation({
                message_id: userMessage.id,
                thread_id: thread.id,
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

            // Clean up if using temporary thread
            if (!config.llmSettings.openAI.assistants.useAramidGeneralSameThread) {
                try {
                    await openai.beta.threads.del(thread.id);
                    console.log('🧹 Cleaned up temporary thread:', thread.id);
                } catch (cleanupError) {
                    console.warn('Warning: Failed to cleanup temporary thread:', cleanupError);
                }
            }

            return response.content[0].text.value;

        } catch (error) {
            if (error.message.includes('active run') && retries < MAX_RETRIES - 1) {
                retries++;
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * retries));
                continue;
            }
            throw error;
        } finally {
            releaseThreadLock(thread.id);
        }
    }
    throw new Error(`Failed to process message after ${MAX_RETRIES} retries`);
}

// Update generateAramidGeneralResponse to use queue
export async function generateAramidGeneralResponse(userInput, additionalData = null) {
    try {
        console.log('\n📝 Processing user question:', userInput);
        
        return new Promise((resolve, reject) => {
            // Add message to queue
            messageQueue.push({
                userInput,
                additionalData,
                resolve,
                reject
            });
            
            // Process queue if not already processing
            processQueue();
        });
    } catch (error) {
        console.error("Error in Aramid General Assistant:", error);
        throw error;
    }
}

// Add queue processor
async function processQueue() {
    if (messageQueue.length === 0) return;
    
    const message = messageQueue[0];
    
    try {
        const response = await processSingleMessage({
            userInput: message.userInput,
            additionalData: message.additionalData
        });
        message.resolve(response);
    } catch (error) {
        message.reject(error);
    } finally {
        messageQueue.shift();
        if (messageQueue.length > 0) {
            setTimeout(processQueue, 100); // Small delay between messages
        }
    }
}

export function getCurrentThreadId() {
    return config.llmSettings.openAI.assistants.useAramidGeneralSameThread 
        ? mainThread?.id 
        : null;
}