import OpenAI from 'openai';
import { config } from '../../../config/config.mjs';
import { storeTwitterConversation, getAssistantThread, storeAssistantThread } from '../../../db/dynamo.mjs';

const openai = new OpenAI();
const ASSISTANT_NAME = 'TwitterProfessional';
let mainThread = null;

// Initialize thread from storage or create new one
async function initializeThread() {
    try {
        if (config.llmSettings.openAI.assistants.useTwitterProfessionalSameThread) {
            const existingThreadId = await getAssistantThread(ASSISTANT_NAME);
            
            if (existingThreadId) {
                console.log('🧵 Recovered existing Twitter Professional thread:', existingThreadId);
                return { id: existingThreadId };
            } else {
                const newThread = await openai.beta.threads.create();
                await storeAssistantThread(ASSISTANT_NAME, newThread.id);
                console.log('🧵 Created new Twitter Professional thread:', newThread.id);
                return newThread;
            }
        } else {
            // Don't store the thread ID if we're not using persistent threads
            const newThread = await openai.beta.threads.create();
            console.log('🧵 Created new temporary thread:', newThread.id);
            return newThread;
        }
    } catch (error) {
        console.error('Error initializing Twitter Professional thread:', error);
        throw error;
    }
}

// Only initialize persistent thread if configured to use same thread
if (config.llmSettings.openAI.assistants.useTwitterProfessionalSameThread) {
    (async () => {
        try {
            mainThread = await initializeThread();
            console.log(`🔄 Twitter Professional initialized with persistent thread: ${mainThread.id}`);
        } catch (error) {
            console.error('❌ Failed to initialize Twitter Professional thread:', error);
            process.exit(1);
        }
    })();
}

export async function generateAgentConfigurationsforTwitter(userInput) {
    try {
        // Create new thread for each message if not using persistent thread
        const thread = config.llmSettings.openAI.assistants.useTwitterProfessionalSameThread 
            ? mainThread 
            : await initializeThread();

        if (!thread) {
            throw new Error('Thread not initialized. Service not ready.');
        }

        // Add message to thread
        const userMessage = await openai.beta.threads.messages.create(thread.id, {
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

        // Store combined conversation record in DynamoDB
        await storeTwitterConversation({
            message_id: userMessage.id,
            thread_id: thread.id,
            timestamp: new Date().toISOString(),
            user_message: {
                content: JSON.stringify(userInput, null, 2),
                timestamp: new Date().toISOString()
            },
            assistant_response: {
                content: lastMessage.content[0].text.value,
                message_id: lastMessage.id,
                timestamp: new Date().toISOString(),
                configurations: agentConfigurations
            }
        });

        // Clean up temporary thread if not using persistent threads
        if (!config.llmSettings.openAI.assistants.useTwitterProfessionalSameThread) {
            try {
                await openai.beta.threads.del(thread.id);
                console.log('🧹 Cleaned up temporary thread:', thread.id);
            } catch (cleanupError) {
                console.warn('Warning: Failed to cleanup temporary thread:', cleanupError);
            }
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