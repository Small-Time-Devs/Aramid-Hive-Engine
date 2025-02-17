import OpenAI from 'openai';
import { config } from '../../../config/config.mjs';

const openai = new OpenAI();

// Add function to create embeddings and upload to vector database
async function storeAnalysisInVectorDB(userInput, agentConfigurations, threadId) {
    try {
        // Create a minimal document structure
        const document = {
            token: {
                name: userInput.TokenName || userInput.RaydiumTokenPairDataTokenName,
                symbol: userInput.TokenSymbol || userInput.RaydiumTokenPairDataTokenSymbol,
                contract: userInput.ContractAddress
            },
            analysis: {
                decision: agentConfigurations[1]?.decision || 'No decision',
                summary: agentConfigurations[0]?.response.slice(0, 300) // Limit summary size
            },
            meta: {
                thread_id: threadId,
                timestamp: new Date().toISOString()
            }
        };

        // Convert to buffer properly
        const fileContent = JSON.stringify(document, null, 0);
        const buffer = Buffer.from(fileContent);

        // Use the correct file upload format
        const response = await openai.files.create({
            file: buffer,
            purpose: 'assistants'
        });

        // Create minimal embedding
        const embedding = await openai.embeddings.create({
            input: `${document.token.name} ${document.token.symbol} ${document.analysis.decision}`,
            model: 'text-embedding-3-small'
        });

        console.log('\n📊 Analysis stored:', response.id);
        
        return { 
            fileId: response.id, 
            embeddingId: embedding.data[0].index 
        };
    } catch (error) {
        console.error('Failed to store analysis:', error);
        if (error.status === 413 || error.status === 400) {
            console.warn('File too large or invalid format, skipping storage');
            return { fileId: null, embeddingId: null };
        }
        throw error;
    }
}

// Helper function to convert metadata values to strings
function stringifyMetadata(metadata) {
    return Object.fromEntries(
        Object.entries(metadata).map(([key, value]) => [
            key,
            typeof value === 'number' ? String(value) : value
        ])
    );
}

export async function generateAgentConfigurationsforAutoTrader(userInput) {
    let threadId;
    try {
        // Create a thread with metadata for search and organization
        const thread = await openai.beta.threads.create({
            metadata: stringifyMetadata({
                tokenName: userInput.TokenName || userInput.RaydiumTokenPairDataTokenName,
                tokenSymbol: userInput.TokenSymbol || userInput.RaydiumTokenPairDataTokenSymbol,
                timestamp: new Date().toISOString(),
                type: 'trade_analysis',
                chain: 'solana',
                contractAddress: userInput.ContractAddress
            })
        });
        threadId = thread.id;

        // Add user input with enriched metadata
        await openai.beta.threads.messages.create(thread.id, {
            role: "user",
            content: JSON.stringify(userInput, null, 2),
            metadata: stringifyMetadata({
                messageType: 'input_data',
                priceUSD: userInput.PriceUSD,
                liquidityUSD: userInput.LiquidityUSD,
                marketCap: userInput.MarketCap,
                timeCreated: userInput.TimeCreated,
                rugCheckRisks: userInput.rugCheckRisks,
                priceChange24h: userInput.PriceChange24h,
                volume24h: userInput.Volume24h
            })
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
            metadata: stringifyMetadata({
                messageType: 'analysis_response',
                decision: agentConfigurations[1]?.decision || 'No decision provided',
                analyst: agentConfigurations[0]?.name || 'Unknown',
                strategist: agentConfigurations[1]?.name || 'Unknown',
                analysisTimestamp: new Date().toISOString(),
                riskLevel: getRiskLevel(userInput),
                tradingVolume: userInput.Volume24h,
                priceMovement: userInput.PriceChange24h
            })
        });

        // Store in vector database with error handling
        try {
            const vectorDBResult = await storeAnalysisInVectorDB(userInput, agentConfigurations, threadId);
            if (vectorDBResult.fileId) {
                await openai.beta.threads.messages.create(thread.id, {
                    role: "assistant",
                    content: "Analysis stored in vector database",
                    metadata: stringifyMetadata({
                        vector_file_id: vectorDBResult.fileId,
                        embedding_id: vectorDBResult.embeddingId,
                        messageType: 'vector_db_reference'
                    })
                });
            }
        } catch (vectorError) {
            console.warn('Vector storage failed but continuing with analysis:', vectorError.message);
        }

        // Add annotations with string metadata
        await openai.beta.threads.runs.create(thread.id, {
            assistant_id: config.llmSettings.openAI.assistants.autoTrader,
            metadata: stringifyMetadata({
                analysis_completed: 'true', // Convert boolean to string
                token_address: userInput.ContractAddress,
                decision_summary: agentConfigurations[1]?.decision || 'No decision',
                analysis_timestamp: new Date().toISOString(),
                price_usd: String(userInput.PriceUSD), // Ensure numeric values are strings
                liquidity_usd: String(userInput.LiquidityUSD),
                market_cap: String(userInput.MarketCap),
                trading_volume_24h: String(userInput.Volume24h)
            })
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

// Add function to search vector database
export async function searchAnalyses(tokenName, contractAddress, limit = 5) {
    try {
        // Create embedding for the search query
        const queryEmbedding = await openai.embeddings.create({
            input: `${tokenName} ${contractAddress}`,
            model: 'text-embedding-3-small'
        });

        // Get all files from assistant
        const files = await openai.files.list();
        
        // Filter files by purpose and content
        const relevantFiles = [];
        
        for (const file of files.data) {
            if (file.purpose === 'assistants') {
                try {
                    // Download and parse file content
                    const fileContent = await openai.files.retrieveContent(file.id);
                    const content = JSON.parse(fileContent);
                    
                    // Check if file matches token name or contract
                    if (content.token_info && 
                        (content.token_info.name.toLowerCase() === tokenName.toLowerCase() ||
                         content.token_info.contract.toLowerCase() === contractAddress.toLowerCase())) {
                        
                        relevantFiles.push({
                            fileId: file.id,
                            tokenName: content.token_info.name,
                            contractAddress: content.token_info.contract,
                            created: new Date(content.metadata.timestamp).toISOString(),
                            analysis: {
                                decision: content.analysis_results.decision,
                                price_usd: content.market_data.price_usd,
                                liquidity_usd: content.market_data.liquidity_usd,
                                volume_24h: content.market_data.volume_24h
                            }
                        });
                    }
                } catch (parseError) {
                    console.error(`Failed to parse file ${file.id}:`, parseError);
                    continue;
                }
            }
        }

        // Sort by creation date (newest first) and limit results
        return relevantFiles
            .sort((a, b) => new Date(b.created) - new Date(a.created))
            .slice(0, limit);

    } catch (error) {
        console.error('Failed to search analyses:', error);
        return [];
    }
}
