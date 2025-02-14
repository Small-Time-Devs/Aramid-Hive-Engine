import { config } from '../../config/config.mjs';
import OpenAI from 'openai';
import { storeGeneralConversation, getAssistantThread, storeAssistantThread } from '../../db/dynamo.mjs';

const openai = new OpenAI({
    apiKey: config.llmSettings.openAI.apiKey
});

const ASSISTANT_NAME = 'AramidGeneral';
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
        console.log(`🔄 AramidGeneral initialized with thread: ${mainThread.id}`);
    } catch (error) {
        console.error('❌ Failed to initialize AramidGeneral thread:', error);
        process.exit(1); // Exit if we can't initialize the thread
    }
})();

// Simplified logging function
function getConversationData(message) {
    return {
        thread_id: mainThread?.id,
        message_id: message.id,
        timestamp: new Date().toISOString(),
        role: message.role,
        content: message.content[0]?.text?.value || message.content
    };
}

export async function generateAramidGeneralResponse(userInput, additionalData = null) {
    try {
        console.log('\n📝 Processing user question:', userInput);
        
        // Ensure thread is initialized
        if (!mainThread) {
            throw new Error('Thread not initialized. Service not ready.');
        }

        const userMessage = await openai.beta.threads.messages.create(mainThread.id, {
            role: "user",
            content: userInput
        });

        // Run the assistant
        const run = await openai.beta.threads.runs.create(mainThread.id, {
            assistant_id: config.llmSettings.openAI.assistants.aramidGeneral
        });

        // Wait for completion
        let runStatus;
        const maxAttempts = 30;
        let attempts = 0;

        while (attempts < maxAttempts) {
            runStatus = await openai.beta.threads.runs.retrieve(mainThread.id, run.id);
            if (runStatus.status === 'completed') break;
            if (runStatus.status === 'failed' || runStatus.status === 'cancelled') {
                throw new Error(`Assistant run ${runStatus.status}`);
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
            attempts++;
        }

        if (attempts >= maxAttempts) {
            throw new Error('Assistant timed out');
        }

        // Get response
        const messages = await openai.beta.threads.messages.list(mainThread.id);
        const response = messages.data[0];

        // Store combined conversation record
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

        console.log('🤖 Assistant response received:', response.content[0].text.value);
        
        return response.content[0].text.value;

    } catch (error) {
        console.error("Error in Aramid General Assistant:", error);
        throw error;
    }
}

export function getCurrentThreadId() {
    return mainThread?.id || null;
}