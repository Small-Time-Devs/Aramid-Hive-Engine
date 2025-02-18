import { config } from '../../../config/config.mjs';
import { AutoTraderSystemInstructions } from '../../../prompts/systemInstructions.mjs';
import { AutoTraderPrompt } from '../../../prompts/prompts.mjs';

async function runCloudflareAI(input) {
    const url = `${config.llmSettings.cloudFlare.cloudFlareRestAPIUrl}${config.llmSettings.cloudFlare.llamaFp8Model}`;
    console.log("🔗 Cloudflare AI URL:", url);

    const aiRequest = {
        ...input,
        max_tokens: config.llmSettings.cloudFlare.autoTraderMaxTokens,
        temperature: config.llmSettings.cloudFlare.autoTraderTemperature
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
