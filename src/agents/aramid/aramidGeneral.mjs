import { config } from '../../config/config.mjs';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: config.llmSettings.openAI.apiKey
});

export async function generateAramidGeneralResponse(userQuestion, additionalData = null) {
    let threadId;
    try {
        console.log('\n📝 Processing user question:', userQuestion);
        
        // Create assistant thread
        const thread = await openai.beta.threads.create({
            metadata: {
                questionType: 'user_query',
                timestamp: new Date().toISOString()
            }
        });
        threadId = thread.id;
        console.log('🧵 Created thread:', threadId);

        // Prepare message content with better formatting
        const messageContent = additionalData 
            ? `${userQuestion}\n\nAdditional Context:\n${JSON.stringify(additionalData, null, 2)}`
            : userQuestion;

        console.log('💬 Sending message to assistant...');
        
        // Add message to thread
        await openai.beta.threads.messages.create(thread.id, {
            role: "user",
            content: messageContent,
            metadata: {
                messageType: additionalData ? 'follow_up_query' : 'initial_query',
                timestamp: new Date().toISOString()
            }
        });

        // Run the assistant
        const run = await openai.beta.threads.runs.create(thread.id, {
            assistant_id: config.llmSettings.openAI.assistants.aramidGeneral
        });

        // Wait for completion
        let runStatus;
        const maxAttempts = 30;
        let attempts = 0;

        while (attempts < maxAttempts) {
            runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
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
        const messages = await openai.beta.threads.messages.list(thread.id);
        if (!messages.data?.[0]?.content?.[0]?.text?.value) {
            throw new Error('Invalid response structure');
        }

        const response = messages.data[0].content[0].text.value;
        console.log('🤖 Assistant response received:', response);
        return response;

    } catch (error) {
        console.error("Error in Aramid General Assistant:", error);
        throw error;
    }
}