import * as twitterProfessional from "./twitter/twitterProfessional.mjs";
import { config } from '../config/config.mjs';
import OpenAI from 'openai';
import { keywords } from './keyWords.mjs'; // Import the keyword mapping
import { generateAgentConfigurations } from './dynamic/dynamic.mjs'; // Import the dynamic agent generator
import { fetchCryptoData, fetchWeatherData } from '../utils/apiUtils.mjs'; // Import the API fetching functions
import { analyzeCryptoData } from '../utils/analyzer.mjs'; // Import the analyzing functions
import { formatCryptoData } from '../utils/formater.mjs'; // Import the formatting functions

const openai = new OpenAI();

class Agent {
    constructor(name, personality, specialty, apis) {
        this.name = name;
        this.personality = personality;
        this.specialty = specialty;
        this.apis = apis;
        this.history = [];
    }

    async generateResponse(input) {
        const prompt = `${this.personality}\nUser: ${input}\n${this.name}:`;
        if (config.useLocalLLM) {
            try {
                const response = await axios.post(config.localLLM.serverUrl, {
                    modelPath: config.localLLM.modelPath,
                    prompt: prompt
                });
                const generatedResponse = response.data;
                this.history.push(generatedResponse);
                return generatedResponse;
            } catch (error) {
                console.error('Error connecting to local LLM:', error);
                throw new Error('Failed to connect to local LLM.');
            }
        } else {
            try {
                const completion = await openai.chat.completions.create({
                    model: config.openAI.model,
                    messages: [
                        { "role": "system", "content": this.personality },
                        { "role": "user", "content": input }
                    ]
                });
                const generatedResponse = completion.choices[0].message.content;
                this.history.push(generatedResponse);
                return generatedResponse;
            } catch (error) {
                console.error('Error connecting to OpenAI API:', error);
                throw new Error('Failed to connect to OpenAI API.');
            }
        }
    }
}

export async function startConversation(question) {
    const agentResponses = [];
    let summary = "";

    // Determine the API section based on the keywords in the question
    let apiSection = null;
    for (const [section, words] of Object.entries(keywords)) {
        if (words.some(word => question.toLowerCase().includes(word))) {
            apiSection = section;
            break;
        }
    }

    // Extract the cryptocurrency name from the question
    const cryptoNameMatch = question.match(/(?:price of|price for|price)\s+(\w+)/i);
    const cryptoName = cryptoNameMatch ? cryptoNameMatch[1].toLowerCase() : null;

    // Generate agent configurations dynamically
    const agentConfigs = await generateAgentConfigurations(question);

    // Create and execute tasks for each generated agent
    for (const config of agentConfigs) {
        const agentApis = config.apis ? config.apis[apiSection] : {};
        const agent = new Agent(config.name, config.personality, config.specialty, agentApis);
        try {
            let response;
            if (apiSection === "crypto" && cryptoName) {
                const cryptoData = await fetchCryptoData(cryptoName);
                const formattedCryptoData = formatCryptoData(cryptoData);
                const analysis = await analyzeCryptoData(cryptoData, agent.generateResponse.bind(agent));
                response = `${formattedCryptoData}\n\n### Analysis\n${analysis}`;
            } else if (apiSection === "weather") {
                const weatherData = await fetchWeatherData();
                response = `### Weather Data\n${JSON.stringify(weatherData, null, 2)}`;
            } else {
                response = await agent.generateResponse(question);
            }
            console.log(`${agent.name}\n${response}`); // Log the response in the console
            agentResponses.push({ name: agent.name, response });
        } catch (error) {
            console.error(`Error handling role ${agent.name}:`, error);
            agentResponses.push({ name: agent.name, response: `Error: ${error.message}` });
        }
    }

    // Generate summary from agent responses
    if (agentResponses.length > 0) {
        summary = `Based on the analysis of the following agents: ${agentResponses
            .map((agent) => agent.name)
            .join(", ")}, we conclude that...`; // Customize as needed
    }

    return { agents: agentResponses, summary };
}

export async function autoPostToTwitter() {
  if (!config.xAutoPoster) return;

  const maxPostsPerMonth = config.postsPerMonth;
  const postsPerDay = config.postsPerDay;
  const maxPostsPerDay = Math.min(postsPerDay, Math.floor(maxPostsPerMonth / 30));
  const interval = 24 * 60 * 60 * 1000 / maxPostsPerDay; // Interval in milliseconds

  for (let i = 0; i < maxPostsPerDay; i++) {
    setTimeout(async () => {
      try {
        const tweet = await twitterProfessional.generateAutoPostTweet();
        console.log("Auto-posted Tweet:", tweet);
        await twitterProfessional.postToTwitter(tweet);
      } catch (error) {
        console.error("Error auto-posting to Twitter:", error);
      }
    }, i * interval);
  }
}