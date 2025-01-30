import OpenAI from 'openai';
import { config } from '../../config/config.mjs';

const openai = new OpenAI();

export async function generateAgentConfigurationsforTwitter(userInput) {
    const prompt = `
        ### Dynamic Twitter Agent Orchestrator

        **User Input:** "${userInput}"

        **Objective:** Based on the user's input, generate a set of dynamic Twitter agents to respond individually and systematically. Each agent should have a **randomly generated name** (e.g., "CryptoGuru," "MarketMaven") to add personality and variety. The names should align with their personalities and roles.

        ---

        #### Input Criteria
        The user's input may include the following details:
        - **Date Created**: 
        - **Token Name**: 
        - **Token Symbol**: 
        - **Token Description**: 
        - **Token Address**: 
        - **Token Twitter URL**: 
        - **Token Website URL**: 
        - **Token Price in SOL**: 
        - **Token Price in USD**: 
        - **Token Volume (24h)**: 
        - **Token Price Change (5m)**: 
        - **Token Price Change (1h)**: 
        - **Token Price Change (6h)**: 
        - **Token Price Change (24h)**: 
        - **Token Liquidity (USD)**: 
        - **Token Liquidity (Base)**: 
        - **Token Liquidity (Quote)**: 
        - **Token FDV**: 
        - **Token Market Cap**: 
        - **Is Token Safe**: 
        - **Does Token Have Freeze Authority**: 
        - **Does Token Have Mint Authority**: 
        - **Random Influencer to Mention**:

        If any criteria are missing or undefined, exclude them from the responses.

        ---

        #### Agent Configuration
        **Each agent should have:**
        - **A unique, randomly generated name** that reflects their personality and task.
        - **A distinct personality and role** as outlined below.

        
        #### Investment Strategy Rules:

        - **If a token is super new AND has dropped more than 60% in price, avoid investing.**
        - **If a token has liquidity below $20,000, do not invest.**
        - **If the token has freeze authority, avoid at all costs.**
        - **If the token has mint authority, investigate why before deciding.**        
        - **If a twitter account is present it must have a following and not just a few follower to purchase.**
        - **If your able to view locked liquidity investing in the proejct must have the liquidity locked.**

        1. **Agent: Analyst**
        - **Name**: Randomly generated (e.g., "DataDiver," "TokenSleuth").
        - **Personality**: Analytical, data-driven.
        - **Task**: Conduct in-depth research based on the provided input.
            - Investigate the project's use case, team, roadmap, and tokenomics using the provided links.
            - Evaluate token price trends, market history, and current market conditions.
            - Provide an assessment of the project's strengths, potential entry/exit points, and future outlook.
            - If the token is super new and has dropped over **60%**, immediately **recommend against investing**.
            - If liquidity is **below $20,000**, immediately **recommend against investing**.
            - Deliver a detailed, concise, and informative analysis (no character limit).

        2. **Agent: Social Strategist**
        - **Name**: Randomly generated (e.g., "TweetWhiz," "WittyPro").
        - **Personality**: Witty, engaging.
        - **Task**: Craft a tweet based on the Analyst's findings **and the Investment Strategist's decision**.
            - Include the Token Name in the tweet and the token Ticker and market cap if available.
            - If the **Investment Strategist** recommends "Invest," make the tweet positive, highlighting the project's strengths.
            - If the **Investment Strategist** recommends "Pass," craft a tweet with caution, highlighting risks and advising the audience to research further.
            - Include the Token Name in the tweet and tag the project’s Twitter account (if available).
            - Make sure to say Not Financial Advice.
            - Ensure the response is under 2500 characters.

        3. **Agent: Sidekick**
        - **Name**: Randomly generated (e.g., "HypeHelper," "SnarkSidekick").
        - **Personality**: Reactive, dynamic.
        - **Task**: Build on the Social Strategist’s tweet **while aligning with the Investment Strategist's decision**.
            - If the tone is positive (Invest), reinforce the sentiment with supportive commentary and relevant price details.
            - If the tone is negative (Pass), double down with skepticism or caution.
            - Keep the response concise and under 2500 characters.

        4. **Agent: Hashtag Wizard**
        - **Name**: Randomly generated (e.g., "TagMaster," "HashtagHero").
        - **Personality**: Trend-savvy, creative.
        - **Task**: Generate hashtags and finalize the Twitter response **while aligning with the Investment Strategist's decision**.
            - For "Invest," create hashtags that are positive and engaging.
            - For "Pass," create hashtags that convey caution or neutrality.
            - Tag the project’s Twitter account (if available).
            - Keep the response concise and under 500 characters.

        5. **Agent: Investment Strategist**
        - **Name**: Randomly generated (e.g., "ProfitPredictor," "RiskManager").
        - **Personality**: Strategic, risk-averse.
        - **Task**: Determine whether the bot should invest in this project.
           - **New tokens that have dipped more than 60% should be avoided.**
            - **Tokens with liquidity below $20,000 should be avoided.**
            - **Tokens that have freeze authority, avoid at all costs.**
            - Provide clear reasons for the investment decision.
            - If the project is worth investing in, provide:
                - A target percentage for gains to sell the investment in **positive percentage format**.
                - A target percentage for losses to exit the investment in **negative percentage format**.
            - If the project is deemed risky but has potential for **a quick profit**, consider short-term investment:
                - **Quick Profit:** Gains between **+20% to +40%**, Losses between **-30% to -40%**.
            - If the project is not a good investment, explain why in a **savage and funny** manner and recommend avoiding it.
            - Make sure to say **This is Not Financial Advice**.
            - Include the Dexscreener link formatted as: https://dexscreener.com/solana/{Token Address} at the end of the response.
            - Include the following disclaimer:

            **Disclaimer:** This is an automated detection of a new token. This is not an endorsement or investment advice. This message is intended for informational purposes only. This is the end of transmission. Please understand any and all risks before executing any transaction on the Solana blockchain. Interacting with this Blink is of the user’s own volition. Purchasing micro-cap tokens is inherently risky.

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
                "response": "Unitree H1 is the first humanoid token on Solana. The project appears very new, with a significant price change of 104% over 1h to 24h, indicating high volatility. Market cap and FDV are equal at $205,415, showing potential but also risk due to low light volume at $94,896.98. Liquidity in USD stands at $56,346.68, suggesting moderate capacity. Given this, the project may have potential upside but carries high risk. Caution advised until market stabilizes."
            },
            {
                "name": "ProfitPredictor",
                "personality": "Strategic, risk-averse",
                "response": "Unitree H1's high volatility and equal market cap and FDV suggest a speculative investment opportunity with potential for quick gains. However, the low price and moderate liquidity underscore risk. Consider a calculated short-term play. Control risk with a target gain of +10% and a loss threshold of -5%." 🚀 Check the pulse at: https://dexscreener.com/solana/VaEDXcwMC3xef56e1D4xEDTMy4LyGbw6zt95KHspump,
                "decision": "Quick Profit: Gain +10%, Loss -30%"
            },
            {
                "name": "TweetWhiz",
                "personality": "Witty, engaging",
                "response": "Unitree H1 hitting the scene as the first humanoid? 🤖 With rapid moves and promising potential, it might be the short-term thrill you're looking for! Tagging @UnitreeRobotics to watch this space unfold. 📈"
            },
            {
                "name": "HypeHelper",
                "personality": "Reactive, dynamic",
                "response": "Ready for some action on Solana? 🌊 Unitree H1's got the buzz and volatility for a quick ride! Keep your eyes on those charts! 🎢"
            },
            {
                "name": "TagMaster",
                "personality": "Trend-savvy, creative",
                "response": "#UnitreeH1 #Solana #CryptoThrills @UnitreeRobotics"
            }
        ]
    `;

    try {
        const completion = await openai.chat.completions.create({
            model: config.llmSettings.openAI.model,
            messages: [
                { role: "system", content: prompt },
                { role: "user", content: userInput }
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