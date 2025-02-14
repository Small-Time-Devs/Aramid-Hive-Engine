import { generateCortexGeneralResponse } from './CortexGeneral.mjs';
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

function ensureValidResponse(response) {
    try {
        // Clean the response first
        const cleaned = cleanResponse(response);
        
        // Try to parse as JSON
        const parsed = JSON.parse(cleaned);
        
        // Validate structure
        if (!Array.isArray(parsed)) {
            return [{
                name: "Cortex",
                response: cleaned
            }];
        }
        
        return parsed;
    } catch (error) {
        // If parsing fails, return formatted response
        return [{
            name: "Cortex",
            response: response
        }];
    }
}

export async function startCortexOrchestrator(userQuestion) {
    try {
        // Get response from assistant
        console.log('\n🤖 Getting response...');
        const initialResponse = await generateCortexGeneralResponse(userQuestion);
        let parsedResponse = ensureValidResponse(initialResponse);

        // Check if data gathering is needed
        if (parsedResponse[0]?.decision) {
            const tokenRequest = parseDecision(parsedResponse[0].decision);
            
            if (tokenRequest) {
                console.log('\n📊 Gathering token data...');
                console.log(`Chain: ${tokenRequest.chain}`);
                console.log(`Contract: ${tokenRequest.contractAddress}`);
                
                const tokenData = await gatherAllTokenData(
                    tokenRequest.chain,
                    tokenRequest.contractAddress
                );

                console.log('\n💽 Token data gathered, getting final analysis...');
                
                // Get final response with gathered data
                const finalResponse = await generateCortexGeneralResponse(userQuestion, tokenData);
                parsedResponse = ensureValidResponse(finalResponse);
            }
        }

        return parsedResponse;

    } catch (error) {
        console.error("🚨 Error in Cortex Orchestrator:", error);
        return [{
            name: "Cortex",
            response: "I apologize, but I encountered an error processing your request. Please try again."
        }];
    }
}