import OpenAI from 'openai';
import { config } from '../../config/config.mjs';

const openai = new OpenAI();

export async function generateInvestmentDecision(userInput) {
  // Build a prompt that only uses the passed userInput
  // and instructs the LLM to produce a single JSON object with
  // keys: analystName, analystResponse, and investmentDecision.
  // The investmentDecision must always follow the exact format:
  // either "Invest: Gain +X%, Loss -Y%" or "Pass: <reason>".
  const prompt = `
You are a professional trading AI assistant specializing in memecoin analysis.
Using the following token information, provide a professional, data-driven, and humor-infused analysis.
Based solely on the data provided, decide whether to invest in the token or pass. 
When investing, the decision must always be returned in exactly the following format: 
  "Invest: Gain +<target gain percentage>%, Loss -<stop-loss percentage>%"
If the token is not worth investing in, return: 
  "Pass: <brief explanation>"
  
Return a JSON object with exactly these keys:
{
  "analystName": <string>,         // a unique, randomly generated name for the analyst
  "analystResponse": <string>,       // the full analysis with a blend of humor and insight
  "investmentDecision": <string>     // the decision in the exact format described above
}

Only include the keys above in the JSON response.

Token Information:
- Token Name: ${userInput.TokenName || userInput.RaydiumTokenPairDataTokenName || ""}
- Token Symbol: ${userInput.TokenSymbol || userInput.RaydiumTokenPairDataTokenSymbol || ""}
- Time Created: ${userInput.TimeCreated || ""}
- Token Decimals: ${userInput.TokenDecimals || ""}
- Is Token Safe: ${userInput.isTokenSafe || ""}
- Has Freeze Authority: ${userInput.hasFreeze || ""}
- Has Mint Authority: ${userInput.hasMint || ""}
- Native Price: ${userInput.PriceNative || ""}
- USD Price: ${userInput.PriceUSD || ""}
- 5 Minute Transactions: ${userInput.Transactions5m || ""}
- 1 Hour Transactions: ${userInput.Transactions1h || ""}
- 6 Hour Transactions: ${userInput.Transactions6h || ""}
- 24 Hour Transactions: ${userInput.Transactions24h || ""}
- 5 Minute Price Change: ${userInput.PriceChange5m || ""}
- 1 Hour Price Change: ${userInput.PriceChange1h || ""}
- 6 Hour Price Change: ${userInput.PriceChange6h || ""}
- 24 Hour Price Change: ${userInput.PriceChange24h || ""}
- Liquidity USD: ${userInput.LiquidityUSD || ""}
- Liquidity Base Token: ${userInput.LiquidityBase || ""}
- Liquidity Quote SOL: ${userInput.LiquidityQuote || ""}
- Fully Diluted Value: ${userInput.FDV || ""}
- Market Cap: ${userInput.MarketCap || ""}
- Websites: ${userInput.Websites || ""}
- Socials: ${userInput.Socials || ""}
- Image URL: ${userInput.ImageURL || ""}
- DexScreener Header Image: ${userInput.Header || ""}
- Open Graph Image: ${userInput.OpenGraph || ""}
`;

  try {
    // Call OpenAI Chat API with our prompt
    const completion = await openai.chat.completions.create({
      model: config.llmSettings.openAI.model,
      messages: [
        { role: "system", content: "You are a professional trading AI assistant." },
        { role: "user", content: prompt }
      ]
    });

    const responseText = completion.choices[0].message.content;
    console.log("🔍 AI Response:", responseText); // Debug log

    // Extract the JSON from the assistant's response.
    // This regex looks for the first occurrence of a JSON object.
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON response found.");
    }

    // Parse the JSON response
    const analysis = JSON.parse(jsonMatch[0]);

    // Validate that all required keys are present.
    const requiredKeys = ["analystName", "analystResponse", "investmentDecision"];
    for (const key of requiredKeys) {
      if (!analysis[key]) {
        throw new Error(`Missing required key in response: ${key}`);
      }
    }

    return analysis;
  } catch (error) {
    console.error("🚨 Error generating investment decision:", error);
    throw new Error(`Failed to generate investment decision: ${error.message}`);
  }
}
