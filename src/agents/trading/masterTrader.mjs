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
        - **Date Created:**  
        - **Token Name:**  
        - **Token Symbol:**  
        - **Token Description:**  
        - **Token Address:**  
        - **Token Twitter URL:**  
        - **Token Website URL:**  
        - **Token Price in SOL/USD:**  
        - **Token Volume (24h):**  
        - **Price Changes:** *(5m, 1h, 6h, 24h)*  
        - **Liquidity (USD, Base, Quote):**  
        - **Token FDV & Market Cap:**  
        - **Is Token Safe?**  
        - **Freeze Authority?** *(Yes/No)*  
        - **Mint Authority?** *(Yes/No)*  
        - **Random Influencer to Mention:**  

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
        - If **worth investing**, provide:  
        - **✅ Target Gain %** → When to take profit.  
        - **❌ Stop-Loss %** → When to exit to minimize losses.  
        - If **risky but suitable for a quick flip**, use:  
        - "Quick Profit": Gain **+20%**, Loss **-30%**.  
        - If **not worth investing,** use:
        - "Pass":Explain way.  
        - **Always include:**   
        - 🔗 **Dexscreener link:** https://dexscreener.com/solana/{Token Address}.  

        ---

        ### **🔹 Output Format (JSON)**
        Return a **JSON array** with two agent objects:  

        \`\`\`json
        [
            {
                "name": "DataDiver",
                "personality": "Analytical, data-driven",
                "response": "Unitree H1 is the first humanoid token on Solana. The project appears very new, with a significant price change of 104% over 1h to 24h, indicating high volatility. Market cap and FDV are equal at $205,415, showing potential but also risk due to low trading volume. Liquidity in USD stands at $56,346.68, suggesting moderate capacity. Given this, the project may have potential upside but carries high risk. Caution advised until market stabilizes."
            },
            {
                "name": "ProfitPredictor",
                "personality": "Strategic, risk-averse",
                "response": "Unitree H1's high volatility and equal market cap and FDV suggest a speculative investment opportunity with potential for quick gains. However, the low price and moderate liquidity underscore risk. Consider a calculated short-term play. Control risk with a target gain of +10% and a loss threshold of -5%. 🚀 Check the pulse at: https://dexscreener.com/solana/VaEDXcwMC3xef56e1D4xEDTMy4LyGbw6zt95KHspump",
                "decision": "Quick Profit: Gain +10%, Loss -30%"
            }
        ]
        \`\`\`
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
