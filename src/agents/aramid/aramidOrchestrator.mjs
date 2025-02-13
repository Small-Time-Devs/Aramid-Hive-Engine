import { generateAramidGeneralResponse } from './aramidGeneral.mjs';
import { gatherAllTokenData } from '../../utils/dataCollector.mjs';

function parseDecision(decision) {
    if (!decision?.startsWith('FetchTokenData:')) return null;
    
    const parts = decision.replace('FetchTokenData:', '').trim().split(',');
    if (parts.length < 2) return null;

    return {
        chain: parts[0].trim(),
        contractAddress: parts[1].trim()
    };
}

function cleanResponse(response) {
    // Remove markdown code blocks and clean up the response
    return response
        .replace(/```json|```/g, '')  // Remove JSON code block markers
        .trim()                        // Remove leading/trailing whitespace
        .replace(/\n\s*\n/g, '\n')    // Remove multiple newlines
        .replace(/,(\s*[}\]])/g, '$1'); // Remove trailing commas
}

export async function startAramidOrchestrator(userQuestion) {
    try {
        // Get initial response from assistant
        console.log('\n🤖 Getting initial response...');
        const initialResponse = await generateAramidGeneralResponse(userQuestion);
        let parsedResponse = JSON.parse(cleanResponse(initialResponse));

        // Check if data gathering is needed
        if (parsedResponse[0]?.decision) {
            const tokenRequest = parseDecision(parsedResponse[0].decision);
            
            if (tokenRequest) {
                console.log('\n📊 Gathering token data...');
                console.log(`Chain: ${tokenRequest.chain}`);
                console.log(`Contract: ${tokenRequest.contractAddress}`);
                
                // Gather the requested data
                const tokenData = await gatherAllTokenData(
                    tokenRequest.chain,
                    tokenRequest.contractAddress
                );

                console.log('\n💽 Token data gathered, getting final analysis...');
                
                // Get final response with gathered data
                const finalResponse = await generateAramidGeneralResponse(userQuestion, tokenData);
                const cleanedResponse = cleanResponse(finalResponse);
                console.log('\n🔍 Cleaned response:', cleanedResponse);
                return JSON.parse(cleanedResponse);
            }
        }

        return parsedResponse;

    } catch (error) {
        console.error("🚨 Error in Aramid Orchestrator:", error);
        console.error("Error details:", error.message);
        return [{
            name: "Aramid",
            response: "I apologize, but I encountered an error processing your request. Please try again."
        }];
    }
}