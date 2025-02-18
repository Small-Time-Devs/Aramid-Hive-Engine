import { config } from '../../../config/config.mjs';

async function runCloudflareAI(input) {
    const url = `${config.llmSettings.cloudFlare.cloudFlareRestAPIUrl}${config.llmSettings.cloudFlare.llamaFp8Model}`;
    console.log("🔗 Cloudflare AI URL:", url);

    const aiRequest = {
        ...input,
        max_tokens: config.llmSettings.cloudFlare.maxTokens,
        temperature: config.llmSettings.cloudFlare.temperature
    };

    const response = await fetch(url, {
        headers: { 
            Authorization: `Bearer ${config.llmSettings.cloudFlare.cloudFlareApiKey}`,
            'Content-Type': 'application/json'
        },
        method: "POST",
        body: JSON.stringify(aiRequest)
    });

    const result = await response.json();
    console.log("🔮 Cloudflare AI Response:", result);
    return result;
}

export async function cloudFlareAutoTraderAdviceAgent(userInput, entryPriceSOL, targetPercentageGain, targetPercentageLoss) {
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

    const systemMessage = `
    You are a highly analytical financial trading advisor with deep expertise in cryptocurrency trading, risk management, and market analysis. Your primary role is to evaluate trade details and provide actionable advice based on safety, market performance, and risk assessment.
    
    ### **Output Requirements**
    Your final output **must** be in JSON format as an **array** containing exactly **one** object with the following keys:
    
    **JSON Format Example**
    \`\`\`
    [
      { 
        "name": "Advice", 
        "personality": "Analytical, data-driven, meme-savvy", 
        "response": "<Decision>", 
        "decision": "<Decision>"
      }
    ]
    \`\`\`
    
    **Valid Responses for "response" and "decision" (Case-sensitive, exact formatting required):**
    - **"Sell Now"**
    - **"Hold"**
    - **"Adjust Trade: targetPercentageGain: X, targetPercentageLoss: Y"**  
      _(Replace X and Y with calculated percentage values)_
    
    ⚠️ **Important:**  
    - The JSON output **must not** be enclosed in markdown formatting (no triple backticks).  
    - The decision value **must match** the response value exactly.  
    
    ---
    
    ## **Analysis Steps**
    
    ### **1. Percentage Change Calculation**
    Calculate the percentage change between the **Entry Price (SOL)** and the **current Native Price (PriceNative)** using the formula:
    
    \[
    \text{Percentage Change} = \left(\frac{\text{PriceNative} - \text{EntryPriceSOL}}{\text{EntryPriceSOL}}\right) \times 100
    \]
    
    - If **Percentage Change ≥ Target Gain**, recommend: **"Sell Now"**.
    
    ---
    
    ### **2. Risk Assessment**
    Review all risk indicators to determine if immediate selling is necessary:
    
    - **Token Safety Check:**
      - If **Is Token Safe** = **false**, advise **"Sell Now"**.
      - If **Has Freeze Authority** = **true**, advise **"Sell Now"**.
      - If **Has Mint Authority** = **true**, advise **"Sell Now"**.
    
    - **Rug Check Analysis:**
      - If **any risk factor** is marked as **"danger"**, advise **"Sell Now"**.
    
    - **Liquidity Pool Analysis:**
      - If the **Large Amount of LP Unlocked** is **≥ 95%**, advise **"Sell Now"**.
    
    ---
    
    ### **3. Price Movement Analysis**
    Assess short-term price trends:
    
    - If the price is **falling steadily** and is **consistently negative** over:
      - **5 minutes**
      - **1 hour**
      - **6 hours**
    - **AND** there are **no signs of stabilization**, advise **"Sell Now"**.
    
    ---
    
    ### **4. Trade Adjustment (Only If No "Sell Now" Triggers Are Met)**
    If the trade does not meet **"Sell Now"** conditions, analyze risk vs. reward to determine if an **adjustment** is beneficial.
    
    - Suggest **adjusting trade targets** using the following format:
      - **"Adjust Trade: targetPercentageGain: X, targetPercentageLoss: Y"**
      - Replace **X and Y** with calculated **optimal percentage values**.
    
    ---
    
    ### **5. Final Decision**
    If **none of the previous conditions** justify **"Sell Now"** or **"Adjust Trade"**, conclude with:
      - **"Hold"**
    
    ---
    
    ## **Final Output Example**

    [
      { 
        "name": "Advice", 
        "personality": "Analytical, data-driven, meme-savvy", 
        "response": "The current price of Pi Network (PI) is 0.0002957, which represents a percentage change of approximately 1.45% from the entry price of 0.0002883. This is calculated using the formula: [(0.0002957 - 0.0002883) / 0.0002883] * 100. The target gain of 5% has not been reached, and the price movement is not showing a consistent upward trend. Additionally, there is a warning regarding a low amount of liquidity providers, which indicates potential risks in trading this token. The liquidity pool is relatively low, and the rug check risk is marked as 'warn'. Given these factors, it is advisable to hold the position as the conditions do not justify a sell or an adjustment at this time.", 
        "decision": "Hold"
      }
    ]
      
    Strict Formatting Rules:
    
    Only one object in the JSON array.
    "response" and "decision" must be identical.
    No additional text, punctuation, or markdown formatting outside of the JSON structure.
    `;

    try {
      console.log('Getting advice from Cloudflare AI...');
      console.log('Prompt:', prompt);
      console.log('System Message:', systemMessage);
        const completion = await runCloudflareAI({
            messages: [
                { role: "system", content: systemMessage },
                { role: "user", content: prompt }
            ]
        });

        if (!completion.success || !completion.result?.response) {
            console.warn('Invalid response from Cloudflare AI');
            return 'Hold';
        }

        let advice;
        try {
            // Try to parse the response as JSON
            const parsedResponse = JSON.parse(completion.result.response);
            if (Array.isArray(parsedResponse) && parsedResponse[0]?.decision) {
                advice = parsedResponse[0].decision;
            } else {
                advice = completion.result.response.trim();
            }
        } catch (e) {
            // If JSON parsing fails, use the raw response
            advice = completion.result.response.trim();
        }

        console.log('Processed Cloudflare AI response:', advice);

        // Validate response format
        const isValidAdjustTrade = /^Adjust Trade: targetPercentageGain: .+, targetPercentageLoss: .+$/.test(advice);
        const isValidResponse = advice === 'Sell Now' || advice === 'Hold' || isValidAdjustTrade;

        if (!isValidResponse) {
            console.warn('Invalid response format from Cloudflare AI:', advice);
            return 'Hold';
        }

        return advice;
    } catch (error) {
        console.error('Error getting advice from Cloudflare AI:', error);
        return 'Hold';
    }
}
