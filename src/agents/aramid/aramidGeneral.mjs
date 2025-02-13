import { config } from '../../config/config.mjs';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: config.llmSettings.openAI.apiKey
});

// Store single persistent conversation thread
let mainThread = null;

export async function generateAramidGeneralResponse(userInput, additionalData = null) {
    try {
        console.log('\n📝 Processing user question:', userInput);
        
        // Initialize thread only if it doesn't exist
        if (!mainThread) {
            mainThread = await openai.beta.threads.create();
            console.log('🧵 Created main conversation thread:', mainThread.id);
        }

        // Add message to existing thread
        const content = additionalData 
            ? `${userInput}\n\nContext:\n${JSON.stringify(additionalData, null, 2)}`
            : userInput;

        await openai.beta.threads.messages.create(mainThread.id, {
            role: "user",
            content: content
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
        const response = messages.data[0].content[0].text.value;
        console.log('🤖 Assistant response received:', response);
        
        return response;

    } catch (error) {
        console.error("Error in Aramid General Assistant:", error);
        throw error;
    }
}

export function getCurrentThreadId() {
    return mainThread?.id || null;
}