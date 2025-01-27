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

export async function generateAgentConfigurationsforTwitter(userInput) {
    const prompt = `
    ### Dynamic Twitter Agent Orchestrator

    User Input: "${userInput}"

    Based on the users input you are give the following criteria:
    Token Name:
    Token Description:
    Token Address:
    Token Price:
    Links:
    Random Influencer:
    Project Links:

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
    - First agent doesnt need to keep its response under 280 characters be as thorough as needed for the other agents to make a more consise.
    - Ensure all responses are under 280 characters (tweets, comments, and hashtags) the 280 characters must include the characters in the agents name as well.
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
