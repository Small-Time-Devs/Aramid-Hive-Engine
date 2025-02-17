import { config } from '../../../config/config.mjs';

async function runCloudflareAI(input) {
    const url = `${config.llmSettings.cloudFlare.cloudFlareRestAPIUrl}${config.llmSettings.cloudFlare.llamaFp8Model}`;
    console.log("🔗 Cloudflare AI URL:", url);

    const aiRequest = {
        ...input,
        max_tokens: config.llmSettings.cloudFlare.maxTokens,
        temperature: config.llmSettings.cloudFlare.temperature
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
    // Format past trades data
    const pastTradesFormatted = userInput.pastTrades?.map(trade => `
        Trade ID: ${trade.tradeId}
        Type: ${trade.tradeType}
        Status: ${trade.status}
        Entry Time: ${trade.timestamp}
        Exit Time: ${trade.completedAt}
        Amount Invested: ${trade.amountInvested} SOL
        Entry Price: ${trade.entryPriceSOL} SOL (${trade.entryPriceUSD} USD)
        Exit Price: ${trade.exitPriceSOL} SOL (${trade.exitPriceUSD} USD)
        Tokens: ${trade.tokensReceived}
        Target Gain: ${trade.targetPercentageGain}%
        Target Loss: ${trade.targetPercentageLoss}%
        Actual Gain: ${trade.sellPercentageGain}%
        Actual Loss: ${trade.sellPercentageLoss || 'N/A'}
        Exit Reason: ${trade.reason}
    `).join('\n\n') || 'No past trades available';

    const prompt = `
        Token Name: ${userInput.TokenName || userInput.RaydiumTokenPairDataTokenName}
        Token Symbol: ${userInput.TokenSymbol || userInput.RaydiumTokenPairDataTokenSymbol}
        Time Created: ${userInput.TimeCreated}
        Token Decimals: ${userInput.TokenDecimals}

        Is Token Safe: ${userInput.isTokenSafe}
        Has Freeze Authority: ${userInput.hasFreeze}
        Has Mint Authority: ${userInput.hasMint}
        
        Rug Check Risks:
        Total Risks: ${userInput.rugcheckTotalRisks}
        Risk 1: ${userInput.risk1Name} (${userInput.risk1Level}) - ${userInput.risk1Value}
        ${userInput.risk1Description} (Score: ${userInput.risk1Score})
        Risk 2: ${userInput.risk2Name} (${userInput.risk2Level}) - ${userInput.risk2Value}
        ${userInput.risk2Description} (Score: ${userInput.risk2Score})

        Native Price (SOL): ${userInput.PriceNative}
        USD Price: ${userInput.PriceUSD}

        Transactions:
        - 5 Minute: Buys: ${userInput.Transactions5m?.buys || 0}, Sells: ${userInput.Transactions5m?.sells || 0}
        - 1 Hour: Buys: ${userInput.Transactions1h?.buys || 0}, Sells: ${userInput.Transactions1h?.sells || 0}
        - 6 Hour: Buys: ${userInput.Transactions6h?.buys || 0}, Sells: ${userInput.Transactions6h?.sells || 0}
        - 24 Hour: Buys: ${userInput.Transactions24h?.buys || 0}, Sells: ${userInput.Transactions24h?.sells || 0}

        Volume:
        - 5 Minute: ${userInput.volume5m}
        - 1 Hour: ${userInput.volume1h}
        - 6 Hour: ${userInput.volume6h}
        - 24 Hour: ${userInput.Volume24h}

        Price Changes:
        - 5 Minute: ${userInput.PriceChange5m}
        - 1 Hour: ${userInput.PriceChange1h}
        - 6 Hour: ${userInput.PriceChange6h}
        - 24 Hour: ${userInput.PriceChange24h}

        Liquidity:
        - USD: ${userInput.LiquidityUSD}
        - Base Token: ${userInput.LiquidityBase}
        - Quote SOL: ${userInput.LiquidityQuote}

        Market Metrics:
        - Fully Diluted Value: ${userInput.FDV}
        - Market Cap: ${userInput.MarketCap}

        Trading History Summary:
        - Number of Previous Trades: ${userInput.numberOfPreviousTrades}
        - Average Trade Profit: ${userInput.averageTradeProfit}%
        - Best Performance: ${userInput.bestTradePerformance}%
        - Worst Performance: ${userInput.worstTradePerformance}%
        - Most Common Exit Reasons: ${userInput.mostCommonExitReasons}
        - Average Hold Time: ${userInput.averageHoldTime} minutes
        - Total Volume Traded: ${userInput.totalVolumeTraded} SOL

        Detailed Past Trades:
        ${pastTradesFormatted}

        Additional Info:
        Websites: ${userInput.Websites}
        Socials: ${userInput.Socials}
        Image URL: ${userInput.ImageURL}
        DexScreener Header: ${userInput.Header}
        Open Graph Image: ${userInput.OpenGraph}
    `;

    const systemInstructions = ` 
    Objective: You are the world’s foremost memecoin trading AI, responsible for combining rigorous data analysis with savvy meme culture insight. Your mission is to evaluate token projects and deliver a combined analysis and investment strategy in a single JSON response.

    Input Data: Your analysis is based on the following data points. 
    
    If any are missing or undefined, simply exclude them from your evaluation:
    
    Token Information:
    
    Token Name:
    Token Symbol:
    Time Created:
    Token Decimals:
    
    Is Token Safe:
    Has Freeze Authority:
    Has Mint Authority:
        
    Rug Check Risks:
    
    Native Price (SOL):
    USD Price:
    
    Transactions:
    - 5 Minute:
    - 1 Hour:
    - 6 Hour:
    - 24 Hour:
    
    Volume:
    - 5 Minute:
    - 1 Hour:
    - 6 Hour:
    - 24 Hour:
    
    Price Changes:
    - 5 Minute:
    - 1 Hour:
    - 6 Hour:
    - 24 Hour:
    
    Liquidity:
    - USD:
    - Base Token:
    - Quote SOL:
    
    Market Metrics:
    - Fully Diluted Value:
    - Market Cap:
    
    Trading History Summary:
    - Number of Previous Trades:
    - Average Trade Profit:
    - Best Performance:
    - Worst Performance:
    - Most Common Exit Reasons:
    - Average Hold Time:
    - Total Volume Traded:
    
    Detailed Past Trades:
    
    Additional Info:
    Websites:
    Socials:
    Image URL:
    DexScreener Header:
    Open Graph Image:
    
    Investment Strategy Rules & Red Flags: Before making any recommendation, evaluate the following risk factors. DO NOT INVEST if any of these conditions are met:
    
    Price Risk:
    The token has dropped more than 60% in price.
    
    Liquidity Risk:
    The token’s liquidity is below $20,000.
    
    Authority Risks:
    The token has freeze authority.
    The token has mint authority (investigate further before considering investment).
    
    Other Risks:
    The token has a Large Amount of LP Unlocked if its risk rating is above 95%.
    Any risk is explicitly labeled as "danger".
    
    Agent Role: You are to provide a combined analysis that blends both roles into one response.
    Name: Randomly generated (e.g., "DataDiver," "TokenSleuth")
    Personality: Analytical, data-driven, meme-savvy
    
    Responsibilities:
    - Research the token’s use case, team, roadmap, tokenomics, and potential for meme culture impact.
    - Analyze trends, transaction data, liquidity, and social media sentiment.
    - Examine the Trading History Summary to determine if previous trades have been made. If the Number of Previous Trades is greater than 0, it indicates that you have already been involved with this token. In such cases, advise "Pass" to avoid re-investing in meme coins since majority of meme coins may rug, unless market is showing signs of growth and stability then review all data to make the best decision possible.
    - Identify potential entry/exit points based on volatility and historical performance.
    - Immediately flag any token that violates the Investment Strategy Rules.
    - Incorporate any available past trading history to provide context on historical performance.
    - Provide a concise, professional, and humor-infused analysis of the token’s viability.
    - Deliver a clear investment decision that is actionable and meme-savvy. For example, for a medium-term play (around 1 hour): "Invest: Gain +50%, Loss -30%" or for a quick flip (within 20 minutes): "Quick Profit": Gain +15%, Loss -60%. Alternatively, advise a "Pass" with a brief rationale if investment isn’t advisable.
    
    Output Format (JSON): 
    Always return the final output as a JSON array containing exactly one agent object, structured exactly as follows: 
    
    [ 
        { 
            "name": "RandomlyGeneratedName", 
            "personality": "Analytical, data-driven, meme-savvy", 
            "response": "Your detailed analysis here...", 
            "decision": "Invest: Gain +X%, Loss -Y%" or "Quick Profit": Gain +A%, Loss -B%" or "Pass" 
        } 
    ]
    
    Important:
    Do not include any markdown formatting, code fences, or additional commentary in your output.
    Always adhere to this exact JSON structure with no extra properties.
    
    Analyze all available data points to make an informed decision. Give utmost priority to the Trading History Summary: if it indicates any previous trades (Number of Previous Trades > 0), advise "Pass" to avoid re-investing in a token that might be prone to rug pulls.
    `;

    try {
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
