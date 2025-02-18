import OpenAI from 'openai';
import { config } from '../config/config.mjs';
import { getWhitelistedThreads, getAllThreadIds, markThreadAsDeleted } from '../db/dynamo.mjs';

// Initialize OpenAI client with validation
let openai;
try {
    if (!config.llmSettings.openAI.apiKey) {
        throw new Error('OpenAI API key is not configured');
    }
    openai = new OpenAI({
        apiKey: config.llmSettings.openAI.apiKey
    });
} catch (error) {
    console.error('❌ Failed to initialize OpenAI client:', error.message);
    // Initialize with null to prevent undefined errors
    openai = null;
}

let mainThread = null;

export function getMainThread() {
    return mainThread;
}

export function setMainThread(thread) {
    mainThread = thread;
}

export function clearMainThread() {
    mainThread = null;
}

async function retryDelete(threadId, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            if (!openai) {
                throw new Error('OpenAI client not initialized');
            }
            await openai.beta.threads.del(threadId);
            // Mark the thread as deleted in the database
            await markThreadAsDeleted(threadId);
            return true;
        } catch (error) {
            if (error.status === 404) {
                // Thread already deleted, just mark it in the database
                await markThreadAsDeleted(threadId);
                return true;
            }
            if (i === maxRetries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
        }
    }
    return false;
}

export async function deleteAllThreads() {
    try {
        if (!config.llmSettings.openAI.openAIThreads.deleteAllThreads) {
            console.log('Thread deletion is disabled in config');
            return false;
        }

        if (!openai) {
            throw new Error('OpenAI client not initialized');
        }

        console.log('🧹 Starting thread cleanup...');
        
        const whitelistedThreads = await getWhitelistedThreads();
        console.log('📋 Whitelisted threads:', whitelistedThreads);
        
        const allThreadIds = await getAllThreadIds();
        let deletedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        // Process each thread
        for (const threadId of allThreadIds) {
            try {
                if (whitelistedThreads.includes(threadId)) {
                    console.log(`⚪ Skipping whitelisted thread: ${threadId}`);
                    skippedCount++;
                    continue;
                }
                
                const deleted = await retryDelete(threadId);
                if (deleted) {
                    console.log(`✅ Deleted thread: ${threadId}`);
                    deletedCount++;
                } else {
                    throw new Error('Failed to delete after retries');
                }
            } catch (err) {
                console.error(`❌ Failed to delete thread ${threadId}:`, err.message);
                errorCount++;
            }
        }
        
        console.log('🎉 Thread cleanup completed');
        console.log(`📊 Summary:
            - Deleted: ${deletedCount}
            - Skipped: ${skippedCount}
            - Errors: ${errorCount}
        `);
        return true;
    } catch (error) {
        console.error('❌ Error during thread cleanup:', error.message);
        return false;
    }
}
