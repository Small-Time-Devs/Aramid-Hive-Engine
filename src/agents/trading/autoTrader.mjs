import OpenAI from 'openai';
import { config } from '../../config/config.mjs';

const openai = new OpenAI();

export async function generateAgentConfigurationsforAutoTrader(userInput) {
    const prompt = `
        ### 🔹 Dynamic Master Crypto Coin Trader Agent Orchestrator 🔹

        #### **📝 User Input:**  
        > **"${userInput}"**

        #### **🎯 Objective:**  
        Each agent must evaluate the project based on the user's input and generate a **professional yet concise** decision. To add personality, every agent will have a **randomly generated name** (e.g., "CryptoGuru," "MarketMaven"), ensuring diversity and engagement.

        ---

        ### **📌 Input Criteria**
        The provided input may include any of the following details:
        
        Token Data: {
        BaseInfo: { TokenName: 'SOLIZARD', TokenSymbol: 'LIZARD', TokenDecimals: 6 },
        AuthorityData: { isTokenSafe: true, hasFreeze: false, hasMint: false },
        PairData: {
            RaydiumTokenPairDataTokenName: 'SOLIZARD',
            RaydiumTokenPairDataTokenSymbol: 'LIZARD',
            TimeCreated: 1738422590000,
            PriceNative: '0.0000001593',
            PriceUSD: '0.00003608',
            Transactions5m: { buys: 101, sells: 75 },
            Transactions1h: { buys: 1063, sells: 570 },
            Transactions6h: { buys: 1063, sells: 570 },
            Transactions24h: { buys: 1063, sells: 570 },
            volume5m: 13221.9,
            volume1h: 128143.06,
            volume6h: 128143.06,
            Volume24h: 128143.06,
            PriceChange5m: 1.24,
            PriceChange1h: 1126,
            PriceChange6h: 1126,
            PriceChange24h: 1126,
            LiquidityUSD: 10196.12,
            LiquidityBase: 141151831,
            LiquidityQuote: 22.5393,
            FDV: 36083,
            MarketCap: 36083,
            Websites: [ [Object] ],
            Socials: [ [Object], [Object] ],
            ImageURL: 'https://dd.dexscreener.com/ds-data/tokens/solana/EwvwumdXnJrsvwXwa7SeDMGr7dsdwPWY2raWZ14Lpump.png?key=b71fe9',
            Header: 'https://dd.dexscreener.com/ds-data/tokens/solana/EwvwumdXnJrsvwXwa7SeDMGr7dsdwPWY2raWZ14Lpump/header.png?key=b71fe9',
            OpenGraph: 'https://cdn.dexscreener.com/token-images/og/solana/EwvwumdXnJrsvwXwa7SeDMGr7dsdwPWY2raWZ14Lpump?timestamp=1738424700000'
        }
        }

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
        - Evaluate **Metrics** such as 5m 1h 6h 7h metrics from the inputData to assess trading activity and profitability.  
        - Identify **potential entry/exit points** based on volatility and historical performance if there is historical performance, if no historical performance look at projected short term performace.  
        - Immediately **flag** tokens that violate **Investment Strategy Rules** above.  
        - Provide a **concise and professional** assessment of project viability.  

        ---

        ## **📈 Agent 2: Investment Strategist**  
        **🔹 Name:** _(Randomly generated, e.g., "ProfitPredictor," "RiskManager")_  
        **🔹 Personality:** Strategic, risk-averse.  

        #### **📌 Responsibilities:**  
        - **Review the Analyst’s findings** and determine if investing is a good decision.  
        - **Check for red flags** (liquidity, price drops, authority settings, txns, volume from time frames provided).
        - If **worth investing for medium amount of time like 3 hours to meet the target gains or stop-loss**, provide:  
            - **✅ Target Gain %** → When to take profit.  
            - **❌ Stop-Loss %** → When to exit to minimize losses.  
            - Example: **"Invest: Gain +50%, Loss -30%"**.  
        - If **risky but suitable for a quick flip within 60 minutes to meet the target gains or stop-loss**, provide:  
            - **"Quick Profit": Gain **+20%**, Loss **-30%**.  
        - If **not worth investing,** use:
            - **"Pass": Explain why.**  
        - Provide a **clear and actionable decision** based on the project’s potential
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
                "response": "Melania Meme (MELANIA) has moderate liquidity and trading activity, but the recent price drop and low pool APR indicate limited short-term upside. However, the project's fundamentals and community support suggest potential for long-term growth. Consider a long-term investment with a target gain of +50% and a stop-loss of -20%. 🚀 Check the pulse at: https://dexscreener.com/solana/FUAfBo2jgks6gB4Z4LfZkqSZgzNucisEHqnNebaRxM1P",
                "decision": "Invest: Gain +50%, Loss -20%"
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