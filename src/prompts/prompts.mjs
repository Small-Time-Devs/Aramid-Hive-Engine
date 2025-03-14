export async function AutoTraderPrompt(userInput) {
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

    return prompt;
}

export async function AutoTraderAdvicePrompt(userInput, entryPriceSOL, targetPercentageGain, targetPercentageLoss) {
    const prompt = `
    You are a highly analytical financial trading advisor with expertise in crypto and token risk management. You are provided with the following trade details:

    Token Name: ${userInput.TokenName || userInput.RaydiumTokenPairDataTokenName}
    Token Symbol: ${userInput.TokenSymbol || userInput.RaydiumTokenPairDataTokenSymbol}
    Time Created: ${userInput.TimeCreated}
    Token Decimals: ${userInput.TokenDecimals}

    Is Token Safe: ${userInput.isTokenSafe}
    Has Freeze Authority: ${userInput.hasFreeze}
    Has Mint Authority: ${userInput.hasMint}
    Rug Check Risk: ${userInput.rugCheckRisk}

    Native Price (SOL): ${userInput.PriceNative}
    USD Price: ${userInput.PriceUSD}

    Transactions:
    - 5 Minute: ${userInput.Transactions5m}
    - 1 Hour: ${userInput.Transactions1h}
    - 6 Hour: ${userInput.Transactions6h}
    - 24 Hour: ${userInput.Transactions24h}

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

    My Current Trade Position:
    - Entry Price (SOL): ${entryPriceSOL}
    - Target Gain: ${targetPercentageGain}%
    - Target Loss: ${targetPercentageLoss}%
  `;
    return prompt;
}

export async function TwitterProfessionalPrompt(userInput){
    const prompt = `
    **Token Description:**
    - Token Name: ${userInput.TokenName || userInput.RaydiumTokenPairDataTokenName}
    - Token Symbol: ${userInput.TokenSymbol || userInput.RaydiumTokenPairDataTokenSymbol}
    - Time Created: ${userInput.TimeCreated}
    - Token Decimals: ${userInput.TokenDecimals}

    **Security:**
    - Is Token Safe: ${userInput.isTokenSafe}
    - Has Freeze Authority: ${userInput.hasFreeze}
    - Has Mint Authority: ${userInput.hasMint}
    - Rug Check Risk: ${userInput.rugCheckRisk} 
      *(Include risk level details, e.g., "danger" or "warn")*

    **Prices:**
    - Native Price (SOL): ${userInput.PriceNative}
    - USD Price: ${userInput.PriceUSD}

    **Transactions:**
    - 5 Minute: ${userInput.Transactions5m}
    - 1 Hour: ${userInput.Transactions1h}
    - 6 Hour: ${userInput.Transactions6h}
    - 24 Hour: ${userInput.Transactions24h}

    **Price Changes:**
    - 5 Minute: ${userInput.PriceChange5m}
    - 1 Hour: ${userInput.PriceChange1h}
    - 6 Hour: ${userInput.PriceChange6h}
    - 24 Hour: ${userInput.PriceChange24h}

    **Liquidity:**
    - USD: ${userInput.LiquidityUSD}
    - Base Token: ${userInput.LiquidityBase}
    - Quote SOL: ${userInput.LiquidityQuote}

    **Market Metrics:**
    - Fully Diluted Value: ${userInput.FDV}
    - Market Cap: ${userInput.MarketCap}

    **Additional Info:**
    - Websites: ${userInput.Websites}
    - Socials: ${userInput.Socials}
    - Image URL: ${userInput.ImageURL}
    - DexScreener Header: ${userInput.Header}
    - Open Graph Image: ${userInput.OpenGraph}
  `;

  return prompt;
}

export async function DiscordTokenAdvicePrompt(userInput) {
  const prompt = `
    Token Data Analysis Request

    Token Information:
    - Name: ${userInput.TokenName || userInput.RaydiumTokenPairDataTokenName}
    - Symbol: ${userInput.TokenSymbol || userInput.RaydiumTokenPairDataTokenSymbol}
    - Creation Date: ${userInput.TimeCreated}
    - Decimals: ${userInput.TokenDecimals}

    Technical Parameters:
    - Token Parameters: ${userInput.isTokenSafe ? "Standard parameters" : "Non-standard parameters"}
    - Freeze Authority: ${userInput.hasFreeze ? "Present" : "Not present"}
    - Mint Authority: ${userInput.hasMint ? "Present" : "Not present"}
    
    On-Chain Metrics:
    - Current Price (SOL): ${userInput.PriceNative || 'N/A'}
    - Current Price (USD): ${userInput.PriceUSD || 'N/A'}
    - Market Cap: ${userInput.MarketCap || 'N/A'}
    - Fully Diluted Value: ${userInput.FDV || 'N/A'}

    Liquidity Data:
    - USD Liquidity: ${userInput.LiquidityUSD || 'N/A'}
    - Base Token Liquidity: ${userInput.LiquidityBase || 'N/A'}
    - Quote SOL Liquidity: ${userInput.LiquidityQuote || 'N/A'}

    Trading Activity:
    - 24h Transactions: ${userInput.Transactions24h?.buys || 0} buys, ${userInput.Transactions24h?.sells || 0} sells
    - 6h Transactions: ${userInput.Transactions6h?.buys || 0} buys, ${userInput.Transactions6h?.sells || 0} sells
    - 1h Transactions: ${userInput.Transactions1h?.buys || 0} buys, ${userInput.Transactions1h?.sells || 0} sells
    - 5m Transactions: ${userInput.Transactions5m?.buys || 0} buys, ${userInput.Transactions5m?.sells || 0} sells

    Price Movements:
    - 24h Change: ${userInput.PriceChange24h || 'N/A'}
    - 6h Change: ${userInput.PriceChange6h || 'N/A'}
    - 1h Change: ${userInput.PriceChange1h || 'N/A'}
    - 5m Change: ${userInput.PriceChange5m || 'N/A'}

    Volume Information:
    - 24h Volume: ${userInput.Volume24h || 'N/A'}
    - 6h Volume: ${userInput.volume6h || 'N/A'}
    - 1h Volume: ${userInput.volume1h || 'N/A'}
    - 5m Volume: ${userInput.volume5m || 'N/A'}

    Additional Project Information:
    - Websites: ${userInput.Websites || 'N/A'}
    - Social Media: ${userInput.Socials || 'N/A'}
    
    Using only the data above, please provide:
    1. An objective analysis of the on-chain metrics and trading patterns
    2. Technical assessment based solely on the provided data
    3. Risk factors evident in the metrics (Low/Medium/High activity, liquidity ratios, buying/selling patterns)
    4. Overall data-driven conclusion about what these metrics typically indicate
    `;

  return prompt;
}