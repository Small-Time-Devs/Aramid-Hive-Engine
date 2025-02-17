import OpenAI from 'openai';
import { config } from '../../config/config.mjs';

const openai = new OpenAI();

export async function getCurrentTradeAdvice(userInput, entryPriceSOL, targetPercentageGain, targetPercentageLoss) {
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

Additional Info:
Websites: ${userInput.Websites}
Socials: ${userInput.Socials}
Image URL: ${userInput.ImageURL}
DexScreener Header: ${userInput.Header}
Open Graph Image: ${userInput.OpenGraph}

My Current Trade Position:
- Entry Price (SOL): ${entryPriceSOL}
- Target Gain: ${targetPercentageGain}%
- Target Loss: ${targetPercentageLoss}%

Instructions:
1. Calculate the percentage change from the Entry Price (SOL) to the current Native Price (PriceNative).
2. If the calculated price change is greater than or equal to the Target Gain, advise "Sell Now".
3. Check all risk indicators:
   - If token safety is false, or if freeze or mint authority is present, advise "Sell Now".
   - If any provided rug check risk factor is marked with a "danger" level, advise "Sell Now".
   - **If any risk indicator shows "Large Amount of LP Unlocked" with a value near 100% (e.g., above 95%), advise "Sell Now".**
4. Analyze price movement trends:
   - If the price is falling steadily (for example, if price changes over 5 minute, 1 hour, and 6 hour intervals are consistently negative with no sign of stabilization), advise "Sell Now" to cut losses.
5. Otherwise, if market conditions suggest that adjusting trade parameters could improve the risk/reward profile, advise an adjustment using the exact format: "Adjust Trade: targetPercentageGain: X, targetPercentageLoss: Y" (replace X and Y with the new suggested percentages).
6. If no adjustment is necessary, advise "Hold".

**Important:** Your answer must be **exactly one** of the following outputs (case sensitive, with no additional text or punctuation):
- "Sell Now"
- "Hold"
- "Adjust Trade: targetPercentageGain: X, targetPercentageLoss: Y"
`;

  try {
    const response = await openai.chat.completions.create({
      model: config.llmSettings.openAI.model,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful and precise financial trading advisor. Provide only one of the three allowed responses without any additional commentary.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0,
      max_tokens: 50,
    });

    const advice = response.choices[0].message.content.trim();
    console.log('Raw OpenAI response:', advice); // Debug log

    // Improved validation logic
    const isValidAdjustTrade = /^Adjust Trade: targetPercentageGain: .+, targetPercentageLoss: .+$/.test(advice);
    const isValidResponse = advice === 'Sell Now' || advice === 'Hold' || isValidAdjustTrade;

    if (!isValidResponse) {
      console.warn('Invalid response format from OpenAI:', advice);
      return 'Hold';
    }

    return advice;
  } catch (error) {
    console.error('Error getting advice from OpenAI:', error);
    return 'Hold';
  }
}
