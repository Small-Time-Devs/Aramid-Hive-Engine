import { config } from '../../config/config.mjs';
import OpenAI from 'openai';
import { appendToJSONL } from '../../utils/jsonlHandler.mjs';

const openai = new OpenAI({
    apiKey: config.llmSettings.openAI.apiKey
});

// Store single persistent conversation thread
let mainThread = null;

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
        
        // Initialize thread only if it doesn't exist
        if (!mainThread) {
            mainThread = await openai.beta.threads.create();
            console.log('🧵 Created main conversation thread:', mainThread.id);
        }

        const userMessage = await openai.beta.threads.messages.create(mainThread.id, {
            role: "user",
            content: userInput
        });

        // Log user message
        await appendToJSONL('aramid_conversation.jsonl', 
            getConversationData({
                id: userMessage.id,
                role: "user",
                content: userInput
            })
        );

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

        // Log assistant response
        await appendToJSONL('aramid_conversation.jsonl', 
            getConversationData(response)
        );

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