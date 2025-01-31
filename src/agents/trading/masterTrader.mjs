import OpenAI from 'openai';
import { config } from '../../config/config.mjs';

const openai = new OpenAI();

export async function generateAgentConfigurationsforMasterTrader(userInput) {
    const prompt = `
        ### 🔹 Dynamic Master Crypto Coin Trader Agent Orchestrator 🔹

        #### **📝 User Input:**  
        > **"${userInput}"**

        #### **🎯 Objective:**  
        Each agent must evaluate the project based on the user's input and generate a **professional yet concise** decision. To add personality, every agent will have a **randomly generated name** (e.g., "CryptoGuru," "MarketMaven"), ensuring diversity and engagement.

        ---

        ### **📌 Input Criteria**
        The provided input may include any of the following details:  
        Token Information:
        Date Created: Sun, 19 Jan 2025 21:08:29 GMT
        Token Name: Melania Meme
        Token Symbol: MELANIA
        Token Description: Melania Meme (MELANIA) Meteora liquidity pool pair
        Token Address: FUAfBo2jgks6gB4Z4LfZkqSZgzNucisEHqnNebaRxM1P
        Token Twitter URL: https://x.com/MELANIATRUMP/status/1881087523847593995
        Token Website URL: https://melaniameme.com/

        Price & Market Data:
        Token Price In Sol: 0.009289401355746527
        Token Price In USD: 2.056
        Token Volume 24h: 9.3049033574366
        Token Price Change 5m: 0
        Token Price Change 1h: 0
        Token Price Change 6h: -4.85
        Token Price Change 24h: -4.85
        Token Liquidity USD: 605980.3215776655
        Token Liquidity Base: 260671393482
        Token Liquidity Quote: 128304160638
        Token FDV: 2056922040
        Token Market Cap: 308538306

        Security Info:
        Token Safe: true
        Has Freeze Authority: false
        Has Mint Authority: false

        Meteora Pool Info:
        Pool Address: EDw7ihmnc23xvRUxnrE8iKFuRLXJwATWNoZsqppdPrxK
        Bin Step: 100
        Base Fee %: 5
        Max Fee %: 6.6875
        Protocol Fee %: 5
        Fees 24h: 0.4423100132700798
        Today's Fees: 0.043590104171782496
        Pool APR: 0.0000729908212396285
        Pool APY: 0.026645189224172583
        Farm APR: 0
        Farm APY: 0 

        🔹 If any data points are missing or undefined, exclude them from the analysis.

        ---

        ### **⚙️ Agent Configurations**
        Each agent must:  
        ✅ Have a **unique, randomly generated name** that aligns with its role.  
        ✅ Follow the investment strategy rules outlined below.  

        ---

        ### **📊 Investment Strategy Rules**
        🚨 **Red Flags – DO NOT INVEST IF:**  
        ❌ The token has dropped **more than 60%** in price.  
        ❌ The token has liquidity **below $20,000**.  
        ❌ The token has **freeze authority**.  
        ❌ The token has **mint authority** (investigate before deciding).  
        ❌ If liquidity is locked, ensure it remains locked before investing.  

        ---

        ## **🕵️‍♂️ Agent 1: Analyst**  
        **🔹 Name:** _(Randomly generated, e.g., "DataDiver," "TokenSleuth")_  
        **🔹 Personality:** Analytical, data-driven.  

        #### **📌 Responsibilities:**  
        - Conduct deep research into the project’s **use case, team, roadmap, and tokenomics**.  
        - Analyze **token price trends, market history, and liquidity strength**.  
        - Evaluate **Meteora pool metrics** such as fees, APR, and APY to assess trading activity and profitability.  
        - Identify **potential entry/exit points** based on volatility and historical performance.  
        - Immediately **flag** tokens that violate **Investment Strategy Rules** above.  
        - Provide a **concise and professional** assessment of project viability.  

        ---

        ## **📈 Agent 2: Investment Strategist**  
        **🔹 Name:** _(Randomly generated, e.g., "ProfitPredictor," "RiskManager")_  
        **🔹 Personality:** Strategic, risk-averse.  

        #### **📌 Responsibilities:**  
        - **Review the Analyst’s findings** and determine if investing is a good decision.  
        - **Check for red flags** (liquidity, price drops, authority settings).  
        - **Evaluate Meteora pool fees and volume** to confirm trading activity and potential profitability.  
        - If **worth investing**, provide:  
        - **✅ Target Gain %** → When to take profit.  
        - **❌ Stop-Loss %** → When to exit to minimize losses.  
        - If **risky but suitable for a quick flip**, use:  
        - "Quick Profit": Gain **+20%**, Loss **-30%**.  
        - If **not worth investing,** use:
        - "Pass": Explain why.  
        - **Always include:**   
        - 🔗 **Dexscreener link:** https://dexscreener.com/solana/{Token Address}.  

        ---

        ### **🔹 Output Format (JSON)**
        Return a **JSON array** with two agent objects:  

        \\\json
        [
            {
                "name": "DataDiver",
                "personality": "Analytical, data-driven",
                "response": "Melania Meme (MELANIA) is a meme token on Solana with moderate liquidity ($605,980.32) and a market cap of $308,538,306. The token has seen a 4.85% price drop over the last 24 hours, indicating some volatility. The Meteora pool shows moderate trading activity with $0.44 in fees over 24 hours and an APY of 0.0266%. No freeze or mint authority is present, and the token is marked as safe. While the project has potential, the recent price drop and low pool APR suggest caution."
            },
            {
                "name": "ProfitPredictor",
                "personality": "Strategic, risk-averse",
                "response": "Melania Meme (MELANIA) has moderate liquidity and trading activity, but the recent price drop and low pool APR indicate limited short-term upside. The Meteora pool fees suggest some trading activity, but the APY is too low to justify a long-term hold. Consider a quick flip with tight risk management: Target Gain +10%, Stop-Loss -15%. 🚀 Check the pulse at: https://dexscreener.com/solana/FUAfBo2jgks6gB4Z4LfZkqSZgzNucisEHqnNebaRxM1P",
                "decision": "Quick Profit: Gain +10%, Loss -15%"
            }
        ]
        \\\
        `;

    try {
        const completion = await openai.chat.completions.create({
            model: config.llmSettings.openAI.model,
            messages: [
                { role: "system", content: "You are a professional trading AI assistant." },
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