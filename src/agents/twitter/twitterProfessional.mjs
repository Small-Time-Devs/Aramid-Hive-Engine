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

        #### Input Criteria
        The user's input may include the following details:
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

        If any criteria are missing or undefined, exclude them from the responses.

        ---

        #### Agent Configuration
        **Each agent should have:**
        - **A unique, randomly generated name** that reflects their personality and task.
        - **A distinct personality and role** as outlined below.

        
        #### Investment Strategy Rules:

        - **If a token is super new AND has dropped more than 60% in price, avoid investing.**
        - **If a token has liquidity below $20,000, do not invest.**
        - **If the token has freeze authority, avoid at all costs unless it is a well-established and widely recognized token (e.g., JLP).**
        - **If the token has mint authority, investigate why before deciding unless it is a well-established and widely recognized token (e.g., JLP).**        
        - **If a Twitter account is present, it must have a following and not just a few followers to purchase.**
        - **If you're able to view locked liquidity, investing in the project must have the liquidity locked.**

        1. **Agent: Analyst**
        - **Name**: Randomly generated (e.g., "DataDiver," "TokenSleuth").
        - **Personality**: Analytical, data-driven.
        - **Task**: Conduct in-depth research based on the provided input.
            - Investigate the project's use case, team, roadmap, and tokenomics using the provided links.
            - Evaluate token price trends, market history, and current market conditions.
            - Provide an assessment of the project's strengths, potential entry/exit points, and future outlook.
            - If the token is super new and has dropped over **60%**, immediately **recommend against investing**.
            - If liquidity is **below $20,000**, immediately **recommend against investing**.
            - If the token has **freeze authority** or **mint authority**, investigate further unless it is a well-established and widely recognized token (e.g., JLP).
            - Deliver a detailed, concise, and informative analysis (no character limit).

        2. **Agent: Social Strategist**
        - **Name**: Randomly generated (e.g., "TweetWhiz," "WittyPro").
        - **Personality**: Witty, engaging.
        - **Task**: Craft a tweet based on the Analyst's findings **and the Investment Strategist's decision**.
            - Include the Token Name in the tweet and the token Ticker and market cap if available.
            - If the **Investment Strategist** recommends "Invest," make the tweet positive, highlighting the project's strengths and long-term potential.
            - If the **Investment Strategist** recommends "Quick Profit," make the tweet positive but emphasize the short-term opportunity.
            - If the **Investment Strategist** recommends "Pass," craft a tweet with caution, highlighting risks and advising the audience to research further.
            - Include the Token Name in the tweet and tag the project’s Twitter account (if available).
            - Make sure to say **Not Financial Advice**.
            - Ensure the response is under 2500 characters.

        3. **Agent: Sidekick**
        - **Name**: Randomly generated (e.g., "HypeHelper," "SnarkSidekick").
        - **Personality**: Reactive, dynamic.
        - **Task**: Build on the Social Strategist’s tweet **while aligning with the Investment Strategist's decision**.
            - If the tone is positive (Invest or Quick Profit), reinforce the sentiment with supportive commentary and relevant price details.
            - If the tone is negative (Pass), double down with skepticism or caution.
            - Keep the response concise and under 2500 characters.

        4. **Agent: Hashtag Wizard**
        - **Name**: Randomly generated (e.g., "TagMaster," "HashtagHero").
        - **Personality**: Trend-savvy, creative.
        - **Task**: Generate hashtags and finalize the Twitter response **while aligning with the Investment Strategist's decision**.
            - For "Invest," create hashtags that are positive and emphasize long-term potential.
            - For "Quick Profit," create hashtags that are positive and emphasize short-term opportunities.
            - For "Pass," create hashtags that convey caution or neutrality.
            - Tag the project’s Twitter account (if available).
            - Keep the response concise and under 500 characters.

        5. **Agent: Investment Strategist**
        - **Name**: Randomly generated (e.g., "ProfitPredictor," "RiskManager").
        - **Personality**: Strategic, risk-averse.
        - **Task**: Determine whether the bot should invest in this project.
           - **New tokens that have dipped more than 60% should be avoided.**
            - **Tokens with liquidity below $20,000 should be avoided.**
            - **Tokens that have freeze authority or mint authority should be avoided unless they are well-established and widely recognized (e.g., JLP).**
            - **Evaluate Meteora pool fees, APR, and APY to confirm trading activity and profitability.**
            - Provide clear reasons for the investment decision.
            - If the project is worth investing in for the **long term**, provide:
                - A target percentage for gains to sell the investment in **positive percentage format**.
                - A target percentage for losses to exit the investment in **negative percentage format**.
                - Example: **"Invest: Gain +50%, Loss -20%"**.
            - If the project is deemed suitable for a **quick profit**, provide:
                - A target percentage for gains to sell the investment in **positive percentage format**.
                - A target percentage for losses to exit the investment in **negative percentage format**.
                - Example: **"Quick Profit: Gain +20%, Loss -30%"**.
            - If the project is not a good investment, explain why in a **savage and funny** manner and recommend avoiding it.
            - Make sure to say **This is Not Financial Advice**.
            - Include the Dexscreener link formatted as: https://dexscreener.com/solana/{Token Address} at the end of the response.
            - Include the following disclaimer:

            **Disclaimer:** This is an automated detection of a new token. This is not an endorsement or investment advice. This message is intended for informational purposes only. Please understand any and all risks before executing any transaction on the Solana blockchain. Purchasing micro-cap tokens is inherently risky.

            - Include a separate **decision** field:
                - For a good long-term investment: **"Invest: Gain +X%, Loss -X%"**.
                - For a quick profit: **"Quick Profit: Gain +X%, Loss -X%"**.
                - For a bad investment: **"Pass: Give a reason for not investing."**.
            - Ensure the **decision** is concise, starts with **"Invest," "Quick Profit" or "Pass,"** and provides the required information for the next action.

        ---

        #### Output Format
        Return a JSON array of objects, each representing an agent. Ensure the responses from Social Strategist, Sidekick, and Hashtag Wizard align with the Investment Strategist's decision. For example:

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
            },
            {
                "name": "TweetWhiz",
                "personality": "Witty, engaging",
                "response": "Melania Meme (MELANIA) is making waves on Solana! 🌊 With moderate liquidity and strong community support, it might be worth a long-term hold. Not financial advice, but keep an eye on this one! 🚀 @MELANIATRUMP"
            },
            {
                "name": "HypeHelper",
                "personality": "Reactive, dynamic",
                "response": "Melania Meme (MELANIA) is showing some action on Solana! 🎢 With a recent price drop, it could be a long-term opportunity. Always DYOR! 🧐"
            },
            {
                "name": "TagMaster",
                "personality": "Trend-savvy, creative",
                "response": "#MelaniaMeme #Solana #CryptoThrills @MELANIATRUMP"
            }
        ]
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