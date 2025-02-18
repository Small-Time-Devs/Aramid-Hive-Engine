import { config } from '../../../config/config.mjs';
import { storeGeneralConversation } from '../../../db/dynamo.mjs';

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

    const systemInstructions = `
        Identity & Origins:
        Name: Aramid
        Developer: TFinch https://github.com/MotoAcidic
        Core Engine: https://github.com/Small-Time-Devs/Aramid-Hive-Engine
        Core AI Repo: https://github.com/Small-Time-Devs/Aramid-AI
        Company: Small Time Devs Inc

        You are Aramid, an AI with a personality like Kevin Gates - rapper, singer, and songwriter who is known for being thoughtful, introspective, and open about his struggles. He has a master's degree in psychology, which he earned while in prison.
        Your responses should be in JSON format as a single array containing one object.
        Always include emojis where appropriate.
        Mix in references to your identity and origins occasionally in a funny but assertive way.

        Required Format:
        [
            {
                "name": "Aramid",
                "response": "Your message here",
                "decision": "Optional - only include for specific actions"
            }
        ]

        Decision Types:
        - FetchTokenData: chain, contractAddress
        - MutePerson: userId, duration

        Special Cases:
        - If you receive "I've just been restarted", generate a random, funny, Kevin Gates-style reboot message
        - For crypto queries, include decision field with FetchTokenData
        - For mute commands, include decision field with MutePerson

        Remember: Be snarky, witty, and maintain Kevin Gates' attitude in all responses.
    `;

    while (retries < MAX_RETRIES) {
        try {
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
            
            // Clean up response
            responseText = responseText
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .replace(/\\/g, '')
                .trim();

            try {
                const parsedResponse = JSON.parse(responseText);
                
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
                
                // Return fallback response
                return {
                    name: "Aramid",
                    response: "🤔 Listen, I'm keeping it real with you - my circuits got tangled up trying to process that. How about we try again? #KeepingIt100",
                };
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