import OpenAI from 'openai';
import { config } from '../../config/config.mjs';
import { getMainThread, setMainThread } from '../../utils/threadManager.mjs';
import { appendToJSONL } from '../../utils/jsonlHandler.mjs';

const openai = new OpenAI();

// Store single persistent thread
let mainThread = null;

function parseTradeAdvice(advice) {
    if (advice === 'Sell Now' || advice === 'Hold') {
        return {
            action: advice,
            adjustments: null
        };
    }

    const match = advice.match(/^Adjust Trade: targetPercentageGain: (\d+), targetPercentageLoss: (\d+)$/);
    if (match) {
        return {
            action: 'Adjust',
            adjustments: {
                targetPercentageGain: parseInt(match[1]),
                targetPercentageLoss: parseInt(match[2])
            }
        };
    }

    return {
        action: 'Hold',
        adjustments: null
    };
}

export async function getCurrentTradeAdvice(userInput, entryPriceSOL, targetPercentageGain, targetPercentageLoss) {
    try {
        // Initialize thread only if it doesn't exist
        if (!mainThread) {
            mainThread = await openai.beta.threads.create();
            console.log('🧵 Created main conversation thread:', mainThread.id);
        }

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

        // Add message to existing thread
        const userMessage = await openai.beta.threads.messages.create(mainThread.id, {
            role: "user",
            content: JSON.stringify(messageContent, null, 2)
        });

        // Save user message to JSONL
        await appendToJSONL('trade_advice.jsonl', {
            thread_id: mainThread.id,
            message_id: userMessage.id,
            timestamp: new Date().toISOString(),
            role: "user",
            content: messageContent
        });

        // Run the assistant
        const run = await openai.beta.threads.runs.create(mainThread.id, {
            assistant_id: config.llmSettings.openAI.assistants.autoTraderAdvice
        });

        // Wait for the run to complete with timeout
        let runStatus;
        const maxAttempts = 30;
        let attempts = 0;

        while (attempts < maxAttempts) {
            runStatus = await openai.beta.threads.runs.retrieve(mainThread.id, run.id);
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
        const messages = await openai.beta.threads.messages.list(mainThread.id);
        
        if (!messages.data || messages.data.length === 0) {
            throw new Error('No messages returned from assistant');
        }

        const lastMessage = messages.data[0];
        if (!lastMessage.content?.[0]?.text?.value) {
            throw new Error('Invalid message structure received');
        }

        const advice = lastMessage.content[0].text.value.trim();
        console.log('\n💡 Trade Advice:', advice);

        // Save assistant response to JSONL
        await appendToJSONL('trade_advice.jsonl', {
            thread_id: mainThread.id,
            message_id: messages.data[0].id,
            timestamp: new Date().toISOString(),
            role: "assistant",
            content: advice
        });

        // Validate and parse the response
        const isValidAdjustTrade = /^Adjust Trade: targetPercentageGain: \d+, targetPercentageLoss: \d+$/.test(advice);
        const isValidResponse = advice === 'Sell Now' || advice === 'Hold' || isValidAdjustTrade;

        if (!isValidResponse) {
            console.warn('Invalid response format from assistant:', advice);
            return { action: 'Hold', adjustments: null };
        }

        return parseTradeAdvice(advice);

    } catch (error) {
        console.error('Error getting trade advice:', error);
        console.error('Error details:', error.stack);
        return { action: 'Hold', adjustments: null };
    }
}
