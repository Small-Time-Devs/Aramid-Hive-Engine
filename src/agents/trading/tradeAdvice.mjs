import OpenAI from 'openai';
import { config } from '../../config/config.mjs';

const openai = new OpenAI();

export async function getCurrentTradeAdvice(userInput, entryPriceSOL, targetPercentageGain, targetPercentageLoss) {
  const prompt = `
You are a financial trading advisor. You are provided with the following trade details:

Token Name: ${userInput.TokenName || userInput.RaydiumTokenPairDataTokenName}
Token Symbol: ${userInput.TokenSymbol || userInput.RaydiumTokenPairDataTokenSymbol}
Time Created: ${userInput.TimeCreated}
Token Decimals: ${userInput.TokenDecimals}

Is Token safe: ${userInput.isTokenSafe}
Has Freeze Authority: ${userInput.hasFreeze}
Has Mint Authority: ${userInput.hasMint}

Native Price: ${userInput.PriceNative}
USD Price: ${userInput.PriceUSD}

5 Minute Transactions: ${userInput.Transactions5m}
1 Hour Transactions: ${userInput.Transactions1h}
6 Minute Transactions: ${userInput.Transactions6h}
24 Minute Transactions: ${userInput.Transactions24h}

5 Minute Price Change: ${userInput.PriceChange5m}
1 Hour Price Change: ${userInput.PriceChange1h}
6 Hour Price Change: ${userInput.PriceChange6h}
24 Hour Price Change: ${userInput.PriceChange24h}

Liquidity USD: ${userInput.LiquidityUSD}
Liquidity Base Token: ${userInput.LiquidityBase}
Liquidity Quote SOL: ${userInput.LiquidityQuote}

Fully Dilutated Value: ${userInput.FDV}
Market Cap: ${userInput.MarketCap}
    
Websites: ${userInput.Websites}
Socials: ${userInput.Socials}
Image URL: ${userInput.ImageURL}
DexScreener Header Image: ${userInput.Header}
Open Graph Image: ${userInput.OpenGraph}

My Current Trade Position:
Entry Price (SOL): ${entryPriceSOL}
Target Gain: ${targetPercentageGain}%
Target Loss: ${targetPercentageLoss}%

Based on previous decisions for the current Target Gain and Target Loss, advise if I should sell this trade immediately, adjust the trade's profit and loss targets, or hold the current settings.
Determine the current price change based on the current price and the entry price in SOL.
Take into account on the decision that the api charges a 1% fee on the solana amount and the priority fee max amount is 0.001000000 SOL so it can range from very low to the 0.001000000 SOL.
The priority fee is the fee that the user is willing to pay to get the transaction done faster.

**Important:** Your answer must be **exactly one** of the following (case sensitive, with no additional text or punctuation):
- "Sell Now"
- "Hold"
- "Adjust Trade: targetPercentageGain: X, targetPercentageLoss: Y"  
(Replace X and Y with the new suggested percentages.)
`;

  try {
    const response = await openai.chat.completions.create({
      model: config.llmSettings.openAI.model,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful financial trading advisor. Answer strictly with one of the three allowed outputs and nothing else.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0,  // Use a temperature of 0 for deterministic responses
      max_tokens: 20,
    });

    const advice = response.choices[0].message.content.trim();

    // Validate that the advice matches the allowed outputs
    if (
      advice !== 'Sell Now' &&
      advice !== 'Hold' &&
      !advice.startsWith('Adjust Trade:')
    ) {
      console.warn('Invalid response format from OpenAI:', advice);
      return 'Hold';
    }
    return advice;
  } catch (error) {
    console.error('Error getting advice from OpenAI:', error);
    return 'Hold';
  }
}
