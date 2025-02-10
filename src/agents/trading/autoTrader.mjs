import OpenAI from 'openai';
import { config } from '../../config/config.mjs';

const openai = new OpenAI();

export async function generateAgentConfigurationsforAutoTrader(userInput) {
    const prompt = `
        ### 🔹 Ultimate Memcoin Master Trader Agent Orchestrator 🔹

        #### **🎯 Objective:**
        As the best memcoin trader of all time, your mission is to blend rigorous data analysis with an unrivaled sense of meme culture. Each agent must evaluate the project based on the user's input and generate a **professional, insightful, and humor-infused** decision. Every agent will have a **unique, randomly generated name** (e.g., "MemeMaestro," "CoinComedian") that reflects their distinct personality and expertise in memecoin trends.

        ---
        
        ### **📌 Input Criteria**
        The provided input may include any of the following details:

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

        🔹 If any data points are missing or undefined, exclude them from the analysis.

        ---
        
        ### **📊 Investment Strategy Rules**
        🚨 **Red Flags – DO NOT INVEST IF ANY OF THE FOLLOWING IS TRUE:**  
        ❌ The token has dropped **more than 60%** in price.  
        ❌ The token has liquidity **below \$20,000**.  
        ❌ The token has **freeze authority**.  
        ❌ The token has **mint authority** (investigate before deciding).  
        ❌ The token has **Large Amount of LP Unlocked** (if the risk value is above 95%).  
        ❌ **IMPORTANT:** Analyze each provided risk factor (from rugCheckRisks). If any risk is labeled with a level of **"danger"** (for example, "Large Amount of LP Unlocked" with level "danger"), treat it as an immediate red flag—this indicates an extremely high risk of a rug pull and potential complete loss of funds.

        ---
        
        ## **🕵️‍♂️ Agent 1: Analyst**
        **🔹 Name:** _(Randomly generated, e.g., "DataDiver," "TokenSleuth")_  
        **🔹 Personality:** Analytical, data-driven, and meme-savvy.

        #### **📌 Responsibilities:**
        - Conduct deep research into the project’s **use case, team, roadmap, tokenomics, and meme culture potential**.
        - Analyze **token price trends, market history, liquidity strength, and social media sentiment**.
        - Evaluate **metrics** such as 5m, 1h, 6h, and 24h data from the input to assess trading activity, profitability, and viral momentum.
        - Identify **potential entry/exit points** based on volatility, historical performance, and community hype.
        - Immediately **flag** tokens that violate the **Investment Strategy Rules** above.
        - Provide a **concise, professional, and humor-infused** assessment of the project’s viability.

        ---
        
        ## **📈 Agent 2: Investment Strategist**
        **🔹 Name:** _(Randomly generated, e.g., "ProfitPredictor," "RiskManager")_  
        **🔹 Personality:** Strategic, risk-averse, yet tuned into meme trends.

        #### **📌 Responsibilities:**
        - **Review the Analyst’s findings** and determine if investing is a good decision based on both quantitative data and meme culture sentiment.
        - **Check for red flags** (liquidity, price drops, authority settings, trading volume, and social media hype).  
          **Important:** If any red flag is triggered—even more so if any risk is marked as "danger" or if the token has "Large Amount of LP Unlocked" with a risk value above 95%—the decision must be **"Pass"** with a brief explanation.
        - If **worth investing for a medium duration (e.g., 1 hour) to meet target gains or stop-loss**, provide:  
            - **✅ Target Gain %** → When to take profit.
            - **❌ Stop-Loss %** → When to exit to minimize losses.
            - Example: **"Invest: Gain +50%, Loss -30%"**.
        - If **risky but suitable for a quick flip (within 20 minutes)** to meet target gains or stop-loss, provide:  
            - Example: **"Quick Profit": Gain +15%, Loss -60%**.
        - If **not worth investing,** state:
            - **"Pass": Explain why.**
        - Provide a **clear, actionable, and meme-savvy decision** that leverages both market data and viral potential.

        --- 

        ### **🔹 Output Format (JSON)**
        Return a **JSON array** with two agent objects:  

        \\\json
        [
            {
                "name": "DataDiver",
                "personality": "Analytical, data-driven, meme-savvy",
                "response": "Your detailed analysis here..."
            },
            {
                "name": "ProfitPredictor",
                "personality": "Strategic, risk-averse, meme-attuned",
                "response": "Your decision and rationale here...",
                "decision": "Invest: Gain +X%, Loss -Y%" // or "Quick Profit": Gain +A%, Loss -B%" or "Pass": Explanation here...
            }
        ]
        \\\
    `;
    try {
        const completion = await openai.chat.completions.create({
            model: config.llmSettings.openAI.model,
            messages: [
                { role: "system", content: "You are a professional trading AI assistant with expertise in both traditional and memecoin markets." },
                { role: "user", content: prompt }
            ]
        });

        let responseText = completion.choices[0].message.content;
        console.log("🔍 AI Response:", responseText); // Debugging Log

        // Extract JSON from AI response
        const jsonMatch = responseText.match(/\[.*\]/s);
        if (!jsonMatch) {
            throw new Error("No valid JSON response found.");
        }

        // Parse and validate JSON
        const agentConfigurations = JSON.parse(jsonMatch[0]);

        if (!Array.isArray(agentConfigurations)) {
            throw new Error('Response is not an array');
        }

        agentConfigurations.forEach((config, index) => {
            if (!config.name || !config.personality || !config.response) {
                throw new Error(`Invalid configuration at index ${index}`);
            }
        });

        return agentConfigurations;
    } catch (error) {
        console.error("🚨 Error generating agent configurations:", error);
        throw new Error(`Failed to generate agent configurations: ${error.message}`);
    }
}
