import OpenAI from 'openai';
import { config } from '../../config/config.mjs';

const openai = new OpenAI();

export async function generateAgentConfigurationsforAutoTrader(userInput) {
    try {
        // Create a thread
        const thread = await openai.beta.threads.create();

        // Add a message to the thread
        await openai.beta.threads.messages.create(thread.id, {
            role: "user",
            content: JSON.stringify(userInput, null, 2) // Pretty print JSON for better assistant parsing
        });

        // Run the assistant
        const run = await openai.beta.threads.runs.create(thread.id, {
            assistant_id: config.llmSettings.openAI.assistants.autoTrader
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

        const lastMessage = messages.data[0];
        if (!lastMessage.content?.[0]?.text?.value) {
            throw new Error('Invalid message structure received');
        }

        let responseText = lastMessage.content[0].text.value;
        console.log('\n🤖 Assistant Raw Response:');
        console.log(responseText);

        // Clean up the response text and ensure proper JSON formatting
        responseText = responseText
            .replace(/```json|```/g, '')
            .trim()
            .replace(/,(\s*})/g, '$1') // Remove trailing commas
            .replace(/,(\s*])/g, '$1'); // Remove trailing commas before array end

        // Try to extract JSON if it's wrapped in something else
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            throw new Error('No valid JSON array found in response');
        }

        // Parse and validate JSON
        let agentConfigurations = JSON.parse(jsonMatch[0]);

        // Ensure each agent has the required fields and structure
        agentConfigurations = agentConfigurations.map(agent => {
            if (!agent.name || !agent.personality || !agent.response) {
                throw new Error('Missing required fields in agent configuration');
            }

            // Add decision field if missing
            if (!agent.decision && agent.response.toLowerCase().includes('pass:')) {
                const passIndex = agent.response.toLowerCase().indexOf('pass:');
                agent.decision = agent.response.slice(passIndex).split('\n')[0].trim();
            } else if (!agent.decision && 
                     (agent.response.toLowerCase().includes('gain') && 
                      agent.response.toLowerCase().includes('loss'))) {
                // Extract decision from response if it contains gain/loss values
                const matches = agent.response.match(/(?:gain|Gain).?\+(\d+)%.+(?:loss|Loss).?-(\d+)%/i);
                if (matches) {
                    agent.decision = `Quick Profit: Gain +${matches[1]}%, Loss -${matches[2]}%`;
                }
            }

            return agent;
        });

        if (agentConfigurations.length !== 2) {
            throw new Error('Expected exactly 2 agents in response');
        }

        console.log('\n📊 Final Agent Configurations:');
        console.log(JSON.stringify(agentConfigurations, null, 2));

        return agentConfigurations;

    } catch (error) {
        console.error("🚨 Error generating agent configurations:", error);
        console.error("Error details:", error.stack);
        throw new Error(`Failed to generate agent configurations: ${error.message}`);
    }
}
