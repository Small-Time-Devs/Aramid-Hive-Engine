import { config } from '../../../config/config.mjs';
import { AutoTraderAdviceSystemInstructions } from '../../../prompts/systemInstructions.mjs'
import { AutoTraderAdvicePrompt } from '../../../prompts/prompts.mjs'

async function runCloudflareAI(input) {
    const url = `${config.llmSettings.cloudFlare.cloudFlareRestAPIUrl}${config.llmSettings.cloudFlare.llamaFp8Model}`;

    const aiRequest = {
        ...input,
        max_tokens: config.llmSettings.cloudFlare.maxTokens,
        temperature: config.llmSettings.cloudFlare.temperature
    };

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

export async function cloudFlareAutoTraderAdviceAgent(userInput, entryPriceSOL, targetPercentageGain, targetPercentageLoss) {
    try {
        const systemInstructions = await AutoTraderAdviceSystemInstructions();
        const prompt = await AutoTraderAdvicePrompt(userInput, entryPriceSOL, targetPercentageGain, targetPercentageLoss);
        const completion = await runCloudflareAI({
            messages: [
                { role: "system", content: systemInstructions },
                { role: "user", content: prompt }
            ]
        });

        if (!completion.success || !completion.result?.response) {
            console.warn('Invalid response from Cloudflare AI');
            return 'Hold';
        }

        let advice;
        try {
            // Try to parse the response as JSON
            const parsedResponse = JSON.parse(completion.result.response);
            if (Array.isArray(parsedResponse) && parsedResponse[0]?.decision) {
                advice = parsedResponse[0].decision;
            } else {
                advice = completion.result.response.trim();
            }
        } catch (e) {
            // If JSON parsing fails, use the raw response
            advice = completion.result.response.trim();
        }

        console.log('Processed Cloudflare AI response:', advice);

        // Validate response format
        const isValidAdjustTrade = /^Adjust Trade: targetPercentageGain: .+, targetPercentageLoss: .+$/.test(advice);
        const isValidResponse = advice === 'Sell Now' || advice === 'Hold' || isValidAdjustTrade;

        if (!isValidResponse) {
            console.warn('Invalid response format from Cloudflare AI:', advice);
            return 'Hold';
        }

        return advice;
    } catch (error) {
        console.error('Error getting advice from Cloudflare AI:', error);
        return 'Hold';
    }
}
