import OpenAI from 'openai';
import { config } from '../../config/config.mjs';

const openai = new OpenAI();

export async function generateAgentConfigurationsforTwitter(userInput) {
    try {
        // Create a thread
        const thread = await openai.beta.threads.create();

        // Add a message to the thread
        await openai.beta.threads.messages.create(thread.id, {
            role: "user",
            content: JSON.stringify(userInput, null, 2)
        });

        // Run the assistant
        const run = await openai.beta.threads.runs.create(thread.id, {
            assistant_id: config.llmSettings.openAI.assistants.twitterProfessional
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

        console.log('\n🤖 Assistant Raw Response:');
        console.log(messages.data[0].content[0].text.value);

        const lastMessage = messages.data[0];
        if (!lastMessage.content?.[0]?.text?.value) {
            throw new Error('Invalid message structure received');
        }

        let responseText = lastMessage.content[0].text.value;

        // Clean up the response text
        responseText = responseText
            .replace(/```json|```/g, '')
            .trim()
            .replace(/,(\s*})/g, '$1')
            .replace(/,(\s*])/g, '$1');

        // Try to extract JSON if it's wrapped in something else
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            throw new Error('No valid JSON array found in response');
        }

        // Parse and validate JSON
        const agentConfigurations = JSON.parse(jsonMatch[0]);

        // Validate configurations
        if (!Array.isArray(agentConfigurations) || agentConfigurations.length !== 5) {
            throw new Error('Expected exactly 5 agents in response');
        }

        console.log('\n📊 Final Twitter Configurations:');
        console.log(JSON.stringify(agentConfigurations, null, 2));

        return agentConfigurations;

    } catch (error) {
        console.error("🚨 Error generating Twitter configurations:", error);
        console.error("Error details:", error.stack);
        throw new Error(`Failed to generate Twitter configurations: ${error.message}`);
    }
}