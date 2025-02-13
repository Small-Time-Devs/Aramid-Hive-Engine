import OpenAI from 'openai';
import { config } from '../../config/config.mjs';

const openai = new OpenAI();

export async function generateAgentConfigurationsforAutoTrader(userInput) {
    let threadId;
    try {
        // Create a thread with metadata for search and organization
        const thread = await openai.beta.threads.create({
            metadata: {
                tokenName: userInput.TokenName || userInput.RaydiumTokenPairDataTokenName,
                tokenSymbol: userInput.TokenSymbol || userInput.RaydiumTokenPairDataTokenSymbol,
                timestamp: new Date().toISOString(),
                type: 'trade_analysis',
                chain: 'solana',
                contractAddress: userInput.ContractAddress
            }
        });
        threadId = thread.id;

        // Add user input with enriched metadata
        await openai.beta.threads.messages.create(thread.id, {
            role: "user",
            content: JSON.stringify(userInput, null, 2),
            metadata: {
                messageType: 'input_data',
                priceUSD: userInput.PriceUSD,
                liquidityUSD: userInput.LiquidityUSD,
                marketCap: userInput.MarketCap,
                timeCreated: userInput.TimeCreated,
                rugCheckRisks: userInput.rugCheckRisks,
                priceChange24h: userInput.PriceChange24h,
                volume24h: userInput.Volume24h
            }
        });

        // Run the assistant
        const run = await openai.beta.threads.runs.create(thread.id, {
            assistant_id: config.llmSettings.openAI.assistants.autoTrader
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

        let responseText = lastMessage.content[0].text.value;
        console.log('\n🤖 Assistant Raw Response:');
        console.log(responseText);

        // Clean up the response text and ensure proper JSON formatting
        responseText = responseText
            .replace(/```json|```/g, '')
            .trim()
            .replace(/,(\s*})/g, '$1') // Remove trailing commas
            .replace(/,(\s*])/g, '$1'); // Remove trailing commas before array end

        // Try to extract JSON if it's wrapped in something else
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            throw new Error('No valid JSON array found in response');
        }

        // Parse and validate JSON
        let agentConfigurations = JSON.parse(jsonMatch[0]);

        // Ensure each agent has the required fields and structure
        agentConfigurations = agentConfigurations.map(agent => {
            if (!agent.name || !agent.personality || !agent.response) {
                throw new Error('Missing required fields in agent configuration');
            }

            // Add decision field if missing
            if (!agent.decision && agent.response.toLowerCase().includes('pass:')) {
                const passIndex = agent.response.toLowerCase().indexOf('pass:');
                agent.decision = agent.response.slice(passIndex).split('\n')[0].trim();
            } else if (!agent.decision && 
                     (agent.response.toLowerCase().includes('gain') && 
                      agent.response.toLowerCase().includes('loss'))) {
                // Extract decision from response if it contains gain/loss values
                const matches = agent.response.match(/(?:gain|Gain).?\+(\d+)%.+(?:loss|Loss).?-(\d+)%/i);
                if (matches) {
                    agent.decision = `Quick Profit: Gain +${matches[1]}%, Loss -${matches[2]}%`;
                }
            }

            return agent;
        });

        if (agentConfigurations.length !== 2) {
            throw new Error('Expected exactly 2 agents in response');
        }

        console.log('\n📊 Final Agent Configurations:');
        console.log(JSON.stringify(agentConfigurations, null, 2));

        // Store the analysis results with detailed metadata
        await openai.beta.threads.messages.create(thread.id, {
            role: "assistant",
            content: JSON.stringify(agentConfigurations, null, 2),
            metadata: {
                messageType: 'analysis_response',
                decision: agentConfigurations[1]?.decision || 'No decision provided',
                analyst: agentConfigurations[0]?.name || 'Unknown',
                strategist: agentConfigurations[1]?.name || 'Unknown',
                analysisTimestamp: new Date().toISOString(),
                riskLevel: getRiskLevel(userInput),
                tradingVolume: userInput.Volume24h,
                priceMovement: userInput.PriceChange24h
            }
        });

        // Add annotations for better searchability
        await openai.beta.threads.runs.create(thread.id, {
            assistant_id: config.llmSettings.openAI.assistants.autoTrader,
            metadata: {
                analysis_completed: true,
                token_address: userInput.ContractAddress,
                decision_summary: agentConfigurations[1]?.decision || 'No decision',
                analysis_timestamp: new Date().toISOString(),
                price_usd: userInput.PriceUSD,
                liquidity_usd: userInput.LiquidityUSD,
                market_cap: userInput.MarketCap,
                trading_volume_24h: userInput.Volume24h
            }
        });

        console.log('\n💾 Analysis stored in thread:', thread.id);
        
        return agentConfigurations;

    } catch (error) {
        console.error("🚨 Error generating agent configurations:", error);
        console.error("Error details:", error.stack);
        
        // Store error information if we have a thread
        if (threadId) {
            try {
                await openai.beta.threads.messages.create(threadId, {
                    role: "assistant",
                    content: `Error occurred: ${error.message}`,
                    metadata: {
                        messageType: 'error_log',
                        errorType: error.name,
                        timestamp: new Date().toISOString()
                    }
                });
            } catch (storeError) {
                console.error("Failed to store error information:", storeError);
            }
        }
        
        throw new Error(`Failed to generate agent configurations: ${error.message}`);
    }
}

// Helper function to determine risk level
function getRiskLevel(userInput) {
    const risks = JSON.parse(userInput.rugCheckRisks || '[]');
    const hasDangerRisks = risks.some(risk => risk.level === 'danger');
    const hasWarnRisks = risks.some(risk => risk.level === 'warn');
    
    if (hasDangerRisks) return 'high';
    if (hasWarnRisks) return 'medium';
    return 'low';
}

// Enhanced historical analysis retrieval with filtering
export async function getHistoricalAnalyses(options = {}) {
    try {
        const {
            tokenSymbol,
            limit = 10,
            minLiquidity,
            riskLevel,
            dateFrom,
            dateTo
        } = options;

        const threads = await openai.beta.threads.list({
            order: "desc",
            limit: limit,
            metadata: {
                ...(tokenSymbol && { tokenSymbol }),
                ...(riskLevel && { riskLevel }),
                type: 'trade_analysis'
            }
        });

        const analyses = threads.data
            .map(thread => ({
                threadId: thread.id,
                metadata: thread.metadata,
                created: new Date(thread.created_at * 1000).toISOString()
            }))
            .filter(analysis => {
                if (minLiquidity && analysis.metadata.liquidity_usd < minLiquidity) return false;
                if (dateFrom && new Date(analysis.created) < new Date(dateFrom)) return false;
                if (dateTo && new Date(analysis.created) > new Date(dateTo)) return false;
                return true;
            });

        return analyses;
    } catch (error) {
        console.error("Failed to retrieve historical analyses:", error);
        return [];
    }
}
