import OpenAI from 'openai';
import { config } from '../../config/config.mjs';

const openai = new OpenAI();

export async function getCurrentTradeAdvice(userInput, entryPriceSOL, targetPercentageGain, targetPercentageLoss) {
    try {
        // Create a thread
        const thread = await openai.beta.threads.create();

        // Prepare the input data
        const messageContent = {
            tradeInfo: {
                tokenData: userInput,
                position: {
                    entryPriceSOL,
                    targetPercentageGain,
                    targetPercentageLoss
                }
            }
        };

        // Add the message to the thread
        await openai.beta.threads.messages.create(thread.id, {
            role: "user",
            content: JSON.stringify(messageContent, null, 2)
        });

        // Run the assistant
        const run = await openai.beta.threads.runs.create(thread.id, {
            assistant_id: config.llmSettings.openAI.assistants.autoTraderAdvice
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

        const advice = lastMessage.content[0].text.value.trim();
        console.log('\n💡 Trade Advice:', advice);

        // Validate the response format
        const isValidAdjustTrade = /^Adjust Trade: targetPercentageGain: .+, targetPercentageLoss: .+$/.test(advice);
        const isValidResponse = advice === 'Sell Now' || advice === 'Hold' || isValidAdjustTrade;

        if (!isValidResponse) {
            console.warn('Invalid response format from assistant:', advice);
            return 'Hold';
        }

        return advice;

    } catch (error) {
        console.error('Error getting trade advice:', error);
        console.error('Error details:', error.stack);
        return 'Hold';
    }
}
