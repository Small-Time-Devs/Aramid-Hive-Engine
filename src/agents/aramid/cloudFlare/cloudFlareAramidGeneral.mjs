import { config } from '../../../config/config.mjs';
import { storeGeneralConversation } from '../../../db/dynamo.mjs';

// Instructions
import { AramidBaseSystemInstructions } from '../prompts/systemInstructions.mjs';

async function runCloudflareAI(input) {
    const url = `${config.llmSettings.cloudFlare.cloudFlareRestAPIUrl}${config.llmSettings.cloudFlare.llamaFp8Model}`;
    console.log("🔗 Cloudflare AI URL:", url);

    const aiRequest = {
        ...input,
        max_tokens: config.llmSettings.cloudFlare.aramidGeneralMaxTokens,
        temperature: config.llmSettings.cloudFlare.aramidGeneralTemperature
    };

    console.log("📥 Cloudflare AI Input:", aiRequest);

    const response = await fetch(url, {
        headers: { 
            Authorization: `Bearer ${config.llmSettings.cloudFlare.cloudFlareApiKey}`,
            'Content-Type': 'application/json'
        },
        method: "POST",
        body: JSON.stringify(aiRequest)
    });

    const result = await response.json();
    console.log("🔮 Cloudflare AI Response:", result);
    return result;
}

// Message queue and processing state
const messageQueue = [];
const RETRY_DELAY = 2000; // 2 seconds
const MAX_RETRIES = 3;

async function processSingleMessage(messageData) {
    const { userInput, additionalData } = messageData;
    let retries = 0;

    while (retries < MAX_RETRIES) {
        try {
            const systemInstructions = await AramidBaseSystemInstructions();
            const completion = await runCloudflareAI({
                messages: [
                    { role: "system", content: systemInstructions },
                    { role: "user", content: userInput }
                ]
            });

            if (!completion.success || !completion.result?.response) {
                throw new Error('Invalid response from Cloudflare AI');
            }

            let responseText = completion.result.response;
            
            // Clean up response - enhanced cleaning for malformed JSON
            responseText = responseText
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .replace(/\\/g, '')
                .replace(/\n\s+/g, ' ') 
                .replace(/\r/g, '')     
                .replace(/\t/g, ' ')    
                .replace(/\)\s*}/g, '}') // Remove stray closing parentheses before }
                .replace(/\s*\)\s*\]/g, ']') // Remove stray closing parentheses before ]
                .replace(/([^"]),(\s*[}\]])/g, '$1$2') // Fix trailing commas
                .trim();

            // Ensure proper JSON structure
            if (!responseText.startsWith('[')) {
                responseText = '[' + responseText;
            }
            if (!responseText.endsWith(']')) {
                responseText = responseText + ']';
            }

            try {
                // Try parsing the cleaned response
                const parsedResponse = JSON.parse(responseText);
                
                // Additional validation
                if (!Array.isArray(parsedResponse) || !parsedResponse[0]?.response) {
                    throw new Error('Invalid response structure');
                }

                // Clean up the individual response text too
                parsedResponse[0].response = parsedResponse[0].response
                    .replace(/\)\s*$/, '') // Remove trailing parentheses
                    .replace(/([^"]),(\s*$)/g, '$1') // Remove trailing commas
                    .trim();

                // Store conversation in DynamoDB
                await storeGeneralConversation({
                    message_id: Date.now().toString(),
                    timestamp: new Date().toISOString(),
                    user_message: {
                        content: userInput,
                        timestamp: new Date().toISOString()
                    },
                    assistant_response: {
                        content: parsedResponse[0].response,
                        message_id: Date.now().toString(),
                        timestamp: new Date().toISOString()
                    }
                });

                return parsedResponse[0];
            } catch (parseError) {
                console.error("JSON Parse Error:", parseError);
                console.error("Attempted to parse:", responseText);
                
                // Enhanced fallback response handling
                const extractedResponse = responseText.match(/"response"\s*:\s*"([^"]+)"/)?.[1] || responseText;
                const fallbackResponse = {
                    name: "Aramid",
                    response: extractedResponse
                        .replace(/\)\s*$/, '') // Remove trailing parentheses
                        .replace(/([^"]),(\s*$)/g, '$1') // Remove trailing commas
                        .trim(),
                };

                return fallbackResponse;
            }
        } catch (error) {
            retries++;
            if (retries === MAX_RETRIES) {
                throw error;
            }
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * retries));
        }
    }
}

// Process queue
async function processQueue() {
    if (messageQueue.length === 0) return;
    
    const message = messageQueue[0];
    
    try {
        const response = await processSingleMessage({
            userInput: message.userInput,
            additionalData: message.additionalData
        });
        message.resolve(response);
    } catch (error) {
        message.reject(error);
    } finally {
        messageQueue.shift();
        if (messageQueue.length > 0) {
            setTimeout(processQueue, 100);
        }
    }
}

export async function generatecloudFlareAramidGeneralResponse(userInput, additionalData = null) {
    try {
        console.log('\n📝 Processing user input:', userInput);
        
        return new Promise((resolve, reject) => {
            messageQueue.push({
                userInput,
                additionalData,
                resolve,
                reject
            });
            
            processQueue();
        });
    } catch (error) {
        console.error("Error in Aramid General Assistant:", error);
        throw error;
    }
}