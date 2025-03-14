import { config } from '../../../config/config.mjs';
import { AutoTraderSystemInstructions, DiscordTokenAdviceSystemInstructions } from '../../../prompts/systemInstructions.mjs';
import { AutoTraderPrompt, DiscordTokenAdvicePrompt } from '../../../prompts/prompts.mjs';

async function runCloudflareAI(input) {
    const url = `${config.llmSettings.cloudFlare.cloudFlareRestAPIUrl}${config.llmSettings.cloudFlare.llamaFp8Model}`;
    //console.log("🔗 Cloudflare AI URL:", url);

    const aiRequest = {
        ...input,
        max_tokens: config.llmSettings.cloudFlare.autoTraderMaxTokens,
        temperature: config.llmSettings.cloudFlare.autoTraderTemperature
    };

    //console.log("📥 Cloudflare AI Input:", aiRequest);

    const response = await fetch(url, {
        headers: { 
            Authorization: `Bearer ${config.llmSettings.cloudFlare.cloudFlareApiKey}`,
            'Content-Type': 'application/json'
        },
        method: "POST",
        body: JSON.stringify(aiRequest)
    });

    const result = await response.json();
    return result;
}

export async function cloudFlareAutoTraderAgent(userInput) {
    try {
        const prompt = await AutoTraderPrompt(userInput);
        const systemInstructions = await AutoTraderSystemInstructions();
        const completion = await runCloudflareAI({
            messages: [
                { 
                    role: "system", 
                    content: systemInstructions,
                },
                { 
                    role: "user", 
                    content: prompt,
                }
            ]
        });

        console.log("🔍 Raw AI Response:", completion);

        if (!completion.success || !completion.result?.response) {
            throw new Error("Invalid response from Cloudflare AI");
        }

        // Get the incomplete response
        let responseText = completion.result.response;
        
        // Try to complete the JSON structure if it's cut off
        if (!responseText.endsWith(']')) {
            responseText = responseText.replace(/[^{]*$/, '') + '"] }]';
        }

        // Clean the response
        responseText = responseText
            .replace(/\n/g, '')
            .replace(/\r/g, '')
            .replace(/\t/g, '')
            .replace(/\\n/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        try {
            const agentConfigurations = JSON.parse(responseText);
            
            if (!Array.isArray(agentConfigurations)) {
                throw new Error('Response is not an array');
            }

            // Ensure the response is complete
            const validatedConfig = agentConfigurations.map(config => ({
                name: config.name || 'DataDiver',
                personality: config.personality || 'Analytical, data-driven, meme-savvy',
                response: config.response || 'Analysis incomplete due to token limit',
                decision: config.decision || 'Pass: Analysis incomplete'
            }));

            return validatedConfig;
        } catch (parseError) {
            // If parsing fails, create a fallback response
            return [{
                name: 'DataDiver',
                personality: 'Analytical, data-driven, meme-savvy',
                response: completion.result.response,
                decision: 'Pass: Response parsing error'
            }];
        }
    } catch (error) {
        console.error("🚨 Error generating agent configurations:", error);
        throw new Error(`Failed to generate agent configurations: ${error.message}`);
    }
}

export async function cloudFlareDiscordTokenAdviceAgent(tokenData) {
    try {
        const systemInstructions = await DiscordTokenAdviceSystemInstructions();
        const userPrompt = await DiscordTokenAdvicePrompt(tokenData);
        
        const completion = await runCloudflareAI({
            messages: [
                { 
                    role: "system", 
                    content: systemInstructions,
                },
                { 
                    role: "user", 
                    content: userPrompt,
                }
            ]
        });

        console.log("🔍 Raw Discord Token Advice Response:", completion);

        if (!completion.success || !completion.result?.response) {
            throw new Error("Invalid response from Cloudflare AI");
        }

        return [{
            name: 'TokenAnalyst',
            personality: 'Detail-oriented, analytical, data-focused',
            response: completion.result.response,
            decision: extractAssessment(completion.result.response)
        }];
    } catch (error) {
        console.error("🚨 Error generating token analysis:", error);
        throw new Error(`Failed to generate token analysis: ${error.message}`);
    }
}

// Helper function to extract an assessment from the analysis
function extractAssessment(text) {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('strong') || lowerText.includes('positive') || lowerText.includes('promising')) {
        return 'Positive: Metrics indicate potential strength';
    } else if (lowerText.includes('caution') || lowerText.includes('monitor') || lowerText.includes('mixed signals')) {
        return 'Mixed: Some positive and some concerning indicators';
    } else if (lowerText.includes('concern') || lowerText.includes('risk') || lowerText.includes('suspicious')) {
        return 'Cautious: Multiple risk factors identified';
    }
    return 'Neutral: Further data analysis recommended';
}
