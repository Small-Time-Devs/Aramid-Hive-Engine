import { config } from '../../../config/config.mjs';
import { TwitterProfessionalPrompt } from '../../../prompts/prompts.mjs';
import { TwitterProfessionalSystemInstructions } from '../../../prompts/systemInstructions.mjs';

async function runCloudflareAI(input) {
    const url = `${config.llmSettings.cloudFlare.cloudFlareRestAPIUrl}${config.llmSettings.cloudFlare.llamaFp8Model}`;
    console.log("🔗 Cloudflare AI URL:", url);

    const aiRequest = {
        ...input,
        max_tokens: config.llmSettings.cloudFlare.twitterProfessionalMaxTokens,
        temperature: config.llmSettings.cloudFlare.twitterProfessionalTemperature
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

function extractJSON(text) {
    try {
        // If the text is already valid JSON, return it parsed
        try {
            return JSON.parse(text);
        } catch (e) {
            // Continue with extraction if direct parsing fails
        }

        // Find array boundaries instead of object boundaries
        const start = text.indexOf('[');
        const end = text.lastIndexOf(']') + 1;
        
        if (start === -1 || end === 0) {
            console.error('No JSON array found in response');
            return null;
        }
        
        const jsonStr = text.substring(start, end);
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error('Error extracting JSON:', e);
        console.log('Attempted to parse:', text);
        return null;
    }
}

export async function cloudFlareTwitterProfessionalAgent(userInput) {
    try {
        const prompt = TwitterProfessionalPrompt(userInput);
        const systemInstructions = TwitterProfessionalSystemInstructions();
        const completion = await runCloudflareAI({
            messages: [
                { 
                    role: "system", 
                    content: systemInstructions 
                },

                { 
                    role: "user", 
                    content: prompt 
                }
            ]
        });

        if (!completion.success || !completion.result?.response) {
            throw new Error("Invalid response from Cloudflare AI");
        }

        // Parse the response directly since it should already be an array
        const parsedResponse = extractJSON(completion.result.response);
        if (!parsedResponse || !Array.isArray(parsedResponse)) {
            throw new Error("Invalid response format");
        }

        return parsedResponse;

    } catch (error) {
        console.error("🚨 Error generating agent configurations:", error);
        throw new Error(`Failed to generate agent configurations: ${error.message}`);
    }
}