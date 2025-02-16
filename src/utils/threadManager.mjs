import OpenAI from 'openai';
import { config } from '../config/config.mjs';
import { getWhitelistedThreads, getAllThreadIds } from '../db/dynamo.mjs';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const openai = new OpenAI({
    apiKey: config.llmSettings.openAI.apiKey
});

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

export async function deleteAllThreads() {
    try {
        if (config.llmSettings.openAI.openAIThreads.deleteAllThreads) {
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
                    
                    // Delete the thread from OpenAI
                    await openai.threads.del(threadId);
                    console.log(`✅ Deleted thread: ${threadId}`);
                    deletedCount++;
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
        }
        return false;
    } catch (error) {
        console.error('❌ Error during thread cleanup:', error);
        throw error;
    }
}
