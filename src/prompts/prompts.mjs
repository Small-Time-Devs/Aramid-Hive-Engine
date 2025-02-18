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

    Instructions:
    1. Calculate the percentage change from the Entry Price (SOL) to the current Native Price (PriceNative).
    2. If the calculated price change is greater than or equal to the Target Gain, respond with "Sell Now".
    3. Check all risk indicators:
      - If token safety is false, or if freeze or mint authority is present, respond with "Sell Now".
      - If any provided rug check risk factor is marked with a "danger" level, respond with "Sell Now".
      - If any risk indicator shows "Large Amount of LP Unlocked" with a value above 95%, respond with "Sell Now".
    4. Analyze price movement trends:
      - If the price is falling steadily across all time intervals with no sign of stabilization, respond with "Sell Now".
    5. If market conditions suggest adjusting trade parameters, respond with "Adjust Trade: targetPercentageGain: X, targetPercentageLoss: Y".
    6. If no adjustment is necessary, respond with "Hold".

    Your response must be exactly one of these outputs (no additional text):
    - "Sell Now"
    - "Hold"
    - "Adjust Trade: targetPercentageGain: X, targetPercentageLoss: Y" (Replace X and Y with the suggested percentages.)
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