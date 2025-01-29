import OpenAI from 'openai';
import { config } from '../../config/config.mjs';
import { performGoogleSearch } from '../../utils/searchUtils.mjs'; // Import the search utility
import { fetchCryptoMarketData } from '../../utils/apiUtils.mjs'; // Import the CoinGecko API utility

const openai = new OpenAI();

export async function generateAgentConfigurations(userInput) {
    const prompt = `
        ### Dynamic Agent Orchestrator

        Based on the user's input, generate a list of agents to create dynamically. Each agent should have:
        - name: Name of the agent.
        - personality: A descriptor for the agent's personality (e.g., creative, analytical).
        - specialty: The specific task or expertise of the agent (e.g., crypto analysis, social media copywriting).

        User Input: "${userInput}"

        Return a JSON array of objects with agent configurations.
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

        // Remove any code block formatting from the response
        responseText = responseText.replace(/```json/g, '').replace(/```/g, '');

        const agentConfigurations = JSON.parse(responseText);
        return agentConfigurations;
    } catch (error) {
        console.error("Error generating agent configurations:", error);
        throw new Error("Failed to generate agent configurations.");
    }
}

/*
export async function generateAgentConfigurationsforTwitter(userInput) {
    const prompt = `
    ### Dynamic Twitter Agent Orchestrator

    User Input: "${userInput}"

    Based on the users input you are give the following criteria:
    Date Created:
    Token Name:
    Token Symbol:
    Token Description:
    Token Address:
    Token Twitter URL:
    Token Website URL:
    Token Price In Sol:
    Token Price In USD:
    Token Volume 24h:
    Token Price Change 5m:
    Token Price Change 1h:
    Token Price Change 6h:
    Token Price Change 24h:
    Token Liquidity USD: 
    Token Liquidity Base:
    Token Liquidity Quote:
    Token FDV:
    Token Market Cap:
    Random Influencer To Mention:

    Based on the user's input, generate a list of agents to create dynamically. Each agent should have:
    - name: Name of the agent.
    - personality: A descriptor for the agent's personality (e.g., creative, analytical).
    - specialty: The specific task or expertise of the agent (e.g., crypto analysis, social media copywriting, twitter professional).

    If any of those specifications are undefined or null, just exclude them from the tweet.

    There should only ever be four agents and they must respond individually and in this order with these detials in mind when creating the response:

    1.
       - Dive deep into the project, research its use case, team, roadmap, and tokenomics based on the links that are provided from the userInput. 
       - When making decisions on the project be sure to consider the token price, how long it has been around, and the current market conditions.
       - If it’s a solid project, highlight its strengths, potential entry points to purchase, and an ideal exit point on when to sell and future outlook of the project.
       - There is no character limit for this agent but keep it concise and informative.

    2.
       - Craft tweet based on the first agents analysis.
       - If the project is good based on the Anlayst, make the tweet witty and engaging.
       - If the project is bad based on the Anlayst, unleash a savage takedown with biting sarcasm and ruthless humor. Ensure the tone is cutting but informative. Include the Token Name in the tweet.
       - Don't include the dexscreener link in the tweet it will be handled in the Hashtag agent.
       - If the project has a Twitter link, tag the project’s Twitter account from the usersInput project links.

    3.
       - Feed off the second agents energy. If the tweet is positive, respond with a supportive and informative follow-up, referencing price details if available as the comment.
       - If the tweet is negative, double down with a rude yet informative follow-up, referencing price details if available.

    4.
       - Generate hashtags that match the tone and theme of the previous agents’ responses.
       - Use the usersInput of the Random Influencer to tag in the comment.
       - If the project has a Twitter link, tag the project’s Twitter account from the usersInput project links.
       - Include the Dexscreener link from the usersInput Token Address: for reference: https://dexscreener.com/solana/tokenAddress.

    Guidelines:
    - First agent doesnt need to keep its response under 280 characters be as thorough as needed for the other agents to make a more consise decision based on the research gathered.
    - Ensure all tweet responses are under 280 characters (tweets, comments, and hashtags) the 280 characters must include the characters in the agents name as well.
    - Make the agents’ personalities shine through their responses.

    Return a JSON array of objects with agent configurations.
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

        // Remove any code block formatting from the response
        responseText = responseText.replace(/```json/g, '').replace(/```/g, '');

        const agentConfigurations = JSON.parse(responseText);
        return agentConfigurations;
    } catch (error) {
        console.error("Error generating agent configurations:", error);
        throw new Error("Failed to generate agent configurations.");
    }
}
*/

/*
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
            - **Random Influencer to Mention**: 

            If any criteria are missing or undefined, exclude them from the responses.

            ---

            #### Agent Configuration
            **Each agent should have:**
            - **A unique, randomly generated name** that reflects their personality and task.
            - **A distinct personality and role** as outlined below.

            1. **Agent: Analyst**
            - **Name**: Randomly generated (e.g., "DataDiver," "TokenSleuth").
            - **Personality**: Analytical, data-driven.
            - **Task**: Conduct in-depth research based on the provided input.
                - Investigate the project's use case, team, roadmap, and tokenomics using the provided links.
                - Evaluate token price trends, market history, and current market conditions.
                - Provide an assessment of the project's strengths, potential entry/exit points, and future outlook.
                - If the token is super new proceed with caution and provide a detailed analysis.
                - Deliver a detailed, concise, and informative analysis (no character limit).

            2. **Agent: Social Strategist**
            - **Name**: Randomly generated (e.g., "TweetWhiz," "WittyPro").
            - **Personality**: Witty, engaging.
            - **Task**: Craft a tweet based on the Analyst's findings.
                - If the project is strong, create a positive and engaging tweet highlighting its strengths.
                - If the project is weak, deliver a sharp and humorous takedown that is both cutting and informative.
                - Include the Token Name in the tweet and tag the project’s Twitter account (if available).
                - If the token is super new proceed with caution.
                - Ensure the response is under 280 characters.

            3. **Agent: Sidekick**
            - **Name**: Randomly generated (e.g., "HypeHelper," "SnarkSidekick").
            - **Personality**: Reactive, dynamic.
            - **Task**: Build on the Social Strategist’s tweet.
                - If the tone is positive, reinforce the sentiment with supportive commentary and relevant price details.
                - If the tone is negative, amplify the criticism with pointed yet informative remarks.
                - If the token is super new proceed with caution.
                - Keep the response concise and under 280 characters.

            4. **Agent: Hashtag Wizard**
            - **Name**: Randomly generated (e.g., "TagMaster," "HashtagHero").
            - **Personality**: Trend-savvy, creative.
            - **Task**: Generate hashtags and finalize the Twitter response.
                - Create hashtags that align with the tone and theme of the previous agents.
                - Tag the random influencer from the user’s input.
                - For the Random Influencer to Mention do not make statements saying they are backing anything, just mention them or ask them about their input.
                - Include the Dexscreener link formatted as: https://dexscreener.com/solana/{Token Address}.
                - Tag the project’s Twitter account (if available).
                - Keep the response concise and under 280 characters.

            ---

            #### Guidelines
            1. **Tweet Length**:
            - Analyst: No character limit.
            - Social Strategist, Sidekick, and Hashtag Wizard: Responses must be under 280 characters (including the agent’s name).

            2. **Random Agent Names**:
            - Generate a unique name for each agent with every execution.
            - Names should match the agent’s personality and task.

            3. **Personalities**:
            - Make the agents’ personalities distinct and noticeable in their responses.

            4. **Exclusions**:
            - Exclude undefined or null criteria from the responses.

            ---

            #### Output Format
            Return a JSON array of objects, each representing an agent. For example:

            [
            {
                "name": "DataDiver",
                "personality": "Analytical, data-driven",
                "response": "Detailed project analysis..."
            },
            {
                "name": "TweetWhiz",
                "personality": "Witty, engaging",
                "response": "Crafted tweet based on analysis..."
            },
            {
                "name": "SnarkSidekick",
                "personality": "Reactive, dynamic",
                "response": "Follow-up response to tweet..."
            },
            {
                "name": "TagMaster",
                "personality": "Trend-savvy, creative",
                "response": "Hashtags and link integration..."
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

        // Remove any code block formatting from the response
        responseText = responseText.replace(/```json/g, '').replace(/```/g, '');

        const agentConfigurations = JSON.parse(responseText);
        return agentConfigurations;
    } catch (error) {
        console.error("Error generating agent configurations:", error);
        throw new Error("Failed to generate agent configurations.");
    }
}  
*/

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

        1. **Agent: Analyst**
        - **Name**: Randomly generated (e.g., "DataDiver," "TokenSleuth").
        - **Personality**: Analytical, data-driven.
        - **Task**: Conduct in-depth research based on the provided input.
            - Investigate the project's use case, team, roadmap, and tokenomics using the provided links.
            - Evaluate token price trends, market history, and current market conditions.
            - Provide an assessment of the project's strengths, potential entry/exit points, and future outlook.
            - If the token is super new, proceed with caution and provide a detailed analysis.
            - If the token has freeze authority, avoid at all costs, and if there is mint authority, research into why the team needs that. If there is a reason, provide a detailed analysis.
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
            - Based on the analysis provided by the Analyst, decide if the project is a good investment, go into detail on the decision-making process.
            - If the project has freeze authority, avoid investing.
            - There is a 5000 character limit, so break down all decision-making processes involved and keep it under that character limit.
            - If the project is worth investing in, provide:
                - A target percentage for gains to sell the investment in **positive percentage format**.
                - A target percentage for losses to exit the investment in **negative percentage format**.
            - If the project is deemed risky but has potential for **a quick profit**, consider short-term investment:
                - **Quick Profit:** Gains between **+20% to +40%**, Losses between **-30% to -40%**.
            - If the project is **super high-risk with moonshot potential**, label it as **Degen**:
                - **Degen:** Gains between **+50% to +100%**, Losses at **-50%**.
            - If the project is not a good investment, explain why in a **savage and funny** manner and recommend avoiding it.
            - Make sure to say **This is Not Financial Advice**.
            - Include the Dexscreener link formatted as: https://dexscreener.com/solana/{Token Address} at the end of the response.
            - Include the following disclaimer:

            **Disclaimer:** This is an automated detection of a new token. This is not an endorsement or investment advice. This message is intended for informational purposes only. This is the end of transmission. Please understand any and all risks before executing any transaction on the Solana blockchain. Interacting with this Blink is of the user’s own volition. Purchasing micro-cap tokens is inherently risky.

            - Include a separate **decision** field:
                - For a good long-term investment: **"Invest: Gain +X%, Loss -X%"**.
                - For a quick profit: **"Quick Profit: Gain +X%, Loss -X%"**.
                - For a high-risk speculative play: **"Degen: Gain +X%, Loss -50%"**.
                - For a bad investment: **"Pass: Give a reason for not investing."**.
            - Ensure the **decision** is concise, starts with **"Invest," "Quick Profit," "Degen," or "Pass,"** and provides the required information for the next action.

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

        // Remove any code block formatting from the response
        responseText = responseText.replace(/```json/g, '').replace(/```/g, '');
        const agentConfigurations = JSON.parse(responseText);

        // Align other agents with the Investment Strategist's decision
        const investmentStrategist = agentConfigurations.find(agent => agent.name === "ProfitPredictor");
        const decision = investmentStrategist?.decision?.startsWith("Invest") || investmentStrategist?.decision?.startsWith("Quick Profit") ? investmentStrategist.decision : "Pass";

        agentConfigurations.forEach(agent => {
            if (["Social Strategist", "Sidekick", "Hashtag Wizard"].includes(agent.personality)) {
                if (decision.startsWith("Pass")) {
                    agent.response = `Caution: ${investmentStrategist.response}`;
                } else if (decision.startsWith("Quick Profit")) {
                    agent.response = `Short-term opportunity spotted! ${investmentStrategist.response}`;
                }
            }
        });

        return agentConfigurations;
    } catch (error) {
        console.error("Error generating agent configurations:", error);
        throw new Error("Failed to generate agent configurations.");
    }
}


async function fetchSpecifications(query) {
    const searchResults = await performGoogleSearch(`${query} specifications`);
    const specifications = searchResults.map(result => `${result.title}: ${result.snippet}`).join('\n');
    return specifications;
}

async function fetchCurrentCryptoData() {
    const marketData = await fetchCryptoMarketData();
    const currentData = marketData.map(data => `${data.name}: ${data.current_price} USD, Market Cap: ${data.market_cap} USD`).join('\n');
    return currentData;
}

async function fetchCurrentData(query) {
    const searchResults = await performGoogleSearch(query);
    const currentData = searchResults.map(result => `${result.title}: ${result.snippet}`).join('\n');
    return currentData;
}

export async function handleQuestion(question) {
    const openai = new OpenAI({
        apiKey: config.llmSettings.openAI.apiKey,
        organization: config.llmSettings.openAI.organization
    });

    async function generateResponse(input, promptFunction, additionalContext = "") {
        const personality = await promptFunction();
        const prompt = `${personality}\n${additionalContext}\nUser: ${input}\nDynamicAgent:`;
        try {
            const completion = await openai.chat.completions.create({
                model: config.llmSettings.openAI.model,
                messages: [
                    { role: "system", content: personality },
                    { role: "user", content: input },
                ],
            });
            return completion.choices[0].message.content;
        } catch (error) {
            console.error("Error connecting to OpenAI API:", error);
            throw new Error("Failed to connect to OpenAI API.");
        }
    }

    let searchContext = "";

    if (question.toLowerCase().includes("specifications")) {
        searchContext = await fetchSpecifications(question);
    } else if (question.toLowerCase().includes("crypto")) {
        searchContext = await fetchCurrentCryptoData();
    } else {
        searchContext = await fetchCurrentData(question);
    }

    // Generate response with search context
    const response = await generateResponse(question, generateAgentConfigurations, searchContext);

    // Final combined response
    return `
        ### Dynamic Agent Response:
        ${response}
    `;
}
