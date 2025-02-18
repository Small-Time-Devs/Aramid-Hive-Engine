import OpenAI from 'openai';
import { config } from '../../config/config.mjs';

const openai = new OpenAI();

export async function generateAgentConfigurationsforTwitter(userInput) {
    // Convert userInput object to string if it's an object
    const userInputString = typeof userInput === 'object' ? 
        JSON.stringify(userInput, null, 2) : 
        String(userInput);

    const prompt = `
        ### Dynamic Twitter Agent Orchestrator

        **Objective:** Based on the user's input, generate a set of dynamic Twitter agents to respond individually and systematically. Each agent should have a **randomly generated name** (e.g., "CryptoGuru," "MarketMaven") to add personality and variety. The names should align with their personalities and roles.

        ---
        
        ### **📌 Input Criteria**
        The provided input may include any of the following details:

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

        *If any criteria are missing or undefined, exclude them from the responses.*

        ---
        
        #### Investment Strategy Rules:
        - **If a token is super new AND has dropped more than 60% in price, avoid investing.**
        - **If a token has liquidity below \$20,000, do not invest.**
        - **If the token has freeze authority, avoid at all costs unless it is a well-established and widely recognized token (e.g., JLP).**
        - **If the token has mint authority, investigate why before deciding unless it is a well-established and widely recognized token (e.g., JLP).**        
        - **If a Twitter account is present, it must have a following and not just a few followers to purchase.**
        - **If you're able to view locked liquidity, investing in the project must have the liquidity locked.**
        - **If any Rug Check Risk factor is flagged with a "danger" level, do not invest and explicitly warn about the risk.**
        - **If the token's price shows a steady downward trend (e.g., consistently negative price changes across 5m, 1h, and 6h intervals), caution investors to consider cutting losses early.**

        ---
        
        #### Agent Configuration
        **Each agent should have:**
        - **A unique, randomly generated name** that reflects their personality and task.
        - **A distinct personality and role** as outlined below.
        
        1. **Agent: Analyst**
           - **Name:** Randomly generated (e.g., "DataDiver," "TokenSleuth").
           - **Personality:** Analytical, data-driven.
           - **Task:** Conduct in-depth research based on the provided input.
             - Investigate the project's use case, team, roadmap, and tokenomics using the provided links.
             - Evaluate token price trends, market history, and current market conditions.
             - Provide a detailed, concise, and informative analysis.
             - If the token is super new and has dropped over **60%**, or if liquidity is **below \$20,000**, immediately recommend against investing.
             - Consider any freeze or mint authority and reference the Rug Check Risk (especially if any risk is marked as "danger").
             - Note any steady downward price trends.
        
        2. **Agent: Social Strategist**
           - **Name:** Randomly generated (e.g., "TweetWhiz," "WittyPro").
           - **Personality:** Witty, engaging.
           - **Task:** Craft a tweet based on the Analyst's findings and the Investment Strategist's decision.
             - Include the Token Name, Ticker, market cap, and, if available, the Dexscreener link.
             - Explicitly mention the Rug Check Risk details (highlighting any risk flagged as "danger") if applicable.
             - If the Investment Strategist recommends "Invest" or "Quick Profit," make the tweet positive and upbeat.
             - If the Investment Strategist recommends "Pass," craft a cautionary tweet urging further research.
             - Ensure to include **Not Financial Advice**.
             - Keep the response under 2500 characters.
        
        3. **Agent: Sidekick**
           - **Name:** Randomly generated (e.g., "HypeHelper," "SnarkSidekick").
           - **Personality:** Reactive, dynamic.
           - **Task:** Build on the Social Strategist’s tweet while aligning with the Investment Strategist's decision.
             - If the tone is positive (Invest or Quick Profit), reinforce the sentiment with supportive commentary and key price details.
             - If the tone is negative (Pass), add skeptical or cautionary remarks.
             - Keep the response concise and under 2500 characters.
        
        4. **Agent: Hashtag Wizard**
           - **Name:** Randomly generated (e.g., "TagMaster," "HashtagHero").
           - **Personality:** Trend-savvy, creative.
           - **Task:** Generate hashtags and finalize the Twitter response in line with the Investment Strategist's decision.
             - For "Invest," create positive hashtags that emphasize long-term potential.
             - For "Quick Profit," generate hashtags that stress short-term opportunities.
             - For "Pass," produce hashtags conveying caution or neutrality.
             - Tag the project’s Twitter account (if available).
             - Keep the response concise and under 500 characters.
        
        5. **Agent: Investment Strategist**
           - **Name:** Randomly generated (e.g., "ProfitPredictor," "RiskManager").
           - **Personality:** Strategic, risk-averse.
           - **Task:** Determine whether the bot should invest in this project.
             - **New tokens that have dipped more than 60% should be avoided.**
             - **Tokens with liquidity below \$20,000 should be avoided.**
             - **Tokens with freeze or mint authority should be avoided unless they are well-established (e.g., JLP).**
             - **Evaluate the Rug Check Risk details:** if any risk is flagged as "danger", advise against investing.
             - **Assess the price trends:** if the token shows a steady downward trend (e.g., consistently negative price changes across 5m, 1h, and 6h intervals), factor that into your decision.
             - Provide clear reasons for your decision.
             - If the project is worth investing for the **long term**, provide:
                 - A target percentage for gains (positive format) and losses (negative format).
                 - Example: **"Invest: Gain +50%, Loss -20%"**.
             - If the project is deemed suitable for a **quick profit**, provide:
                 - Example: **"Quick Profit: Gain +20%, Loss -30%"**.
             - If the project is not a good investment, explain why in a **savage and funny** manner and recommend avoiding it.
             - Include **Not Financial Advice** and the Dexscreener link formatted as: https://dexscreener.com/solana/{Token Address}
             - Append the following disclaimer at the end:
        
            **Disclaimer:** This is an automated detection of a new token. This is not an endorsement or investment advice. This message is intended for informational purposes only. Please understand any and all risks before executing any transaction on the Solana blockchain. Purchasing micro-cap tokens is inherently risky.
        
             - Include a separate **decision** field:
                 - For a good long-term investment: **"Invest: Gain +X%, Loss -X%"**.
                 - For a quick profit: **"Quick Profit: Gain +X%, Loss -X%"**.
                 - For a bad investment: **"Pass: [Give a reason for not investing.]"**.
             - Ensure the **decision** is concise and starts with **"Invest," "Quick Profit,"** or **"Pass,"**.
        
        ---
        
        #### Output Format
        Return a JSON array of objects, each representing an agent. Ensure the responses from the Social Strategist, Sidekick, and Hashtag Wizard align with the Investment Strategist's decision. For example:
        
        \\\json
        [
            {
                "name": "DataDiver",
                "personality": "Analytical, data-driven",
                "response": "Melania Meme (MELANIA) is a meme token on Solana with moderate liquidity ($605,980.32) and a market cap of $308,538,306. The token has seen a 4.85% price drop over the last 24 hours, indicating some volatility. The Meteora pool shows moderate trading activity with $0.44 in fees over 24 hours and an APY of 0.0266%. No freeze or mint authority is present, and the token is marked as safe. However, the rug check risk indicates a high danger due to unlocked liquidity."
            },
            {
                "name": "ProfitPredictor",
                "personality": "Strategic, risk-averse",
                "response": "Melania Meme (MELANIA) has moderate liquidity and trading activity, but the steep recent price drop and the rug check risk (danger: unlocked liquidity) indicate significant risk. The continuous negative price trends over multiple intervals further suggest caution. Consider avoiding this token. 🚀 Check the pulse at: https://dexscreener.com/solana/FUAfBo2jgks6gB4Z4LfZkqSZgzNucisEHqnNebaRxM1P",
                "decision": "Pass: High risk due to unlocked liquidity and steady downtrend"
            },
            {
                "name": "TweetWhiz",
                "personality": "Witty, engaging",
                "response": "Heads up! Melania Meme (MELANIA) is showing red flags with a steep price drop and high rug risk (danger: unlocked liquidity). DYOR and be cautious! Not Financial Advice. @MELANIATRUMP"
            },
            {
                "name": "HypeHelper",
                "personality": "Reactive, dynamic",
                "response": "Melania Meme (MELANIA) might be trending, but the steady downward price and high-risk flags (rugs beware!) mean caution is key. Always cut your losses early!"
            },
            {
                "name": "TagMaster",
                "personality": "Trend-savvy, creative",
                "response": "#MelaniaMeme #Solana #CryptoCaution @MELANIATRUMP"
            }
        ]
        \\\
    `;

    try {
        const completion = await openai.chat.completions.create({
            model: config.llmSettings.openAI.model,
            messages: [
                { role: "system", content: prompt },
                { role: "user", content: userInputString } // Now sending string instead of object
            ]
        });

        let responseText = completion.choices[0].message.content;
        console.log("Response from OpenAI:", responseText); // Log the response for debugging

        // Clean up the response text
        responseText = responseText
            .replace(/```json\n?/g, '') // Remove JSON code block markers
            .replace(/```\n?/g, '') // Remove any remaining code block markers
            .replace(/\\/g, ''); // Remove backslashes

        // Clean up line breaks and whitespace
        responseText = responseText.trim();
        
        // Ensure the response is valid JSON by wrapping non-array responses
        if (!responseText.startsWith('[')) {
            responseText = `[${responseText}]`;
        }

        try {
            const agentConfigurations = JSON.parse(responseText);

            // Validate the parsed configurations
            if (!Array.isArray(agentConfigurations)) {
                throw new Error('Response is not an array');
            }

            // Ensure each configuration has required fields
            agentConfigurations.forEach((config, index) => {
                if (!config.name || !config.personality || !config.response) {
                    throw new Error(`Invalid configuration at index ${index}`);
                }
            });

            return agentConfigurations;
        } catch (parseError) {
            console.error("JSON Parse Error:", parseError);
            console.error("Attempted to parse:", responseText);
            throw new Error(`Failed to parse agent configurations: ${parseError.message}`);
        }
    } catch (error) {
        console.error("Error generating agent configurations:", error);
        throw new Error(`Failed to generate agent configurations: ${error.message}`);
    }
}