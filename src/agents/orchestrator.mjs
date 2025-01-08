import * as accountant from "./accounting/accountant.mjs";
import * as xrayTech from "./medical/xrayTech.mjs";
import * as cryptoAnalyst from "./crypto/cryptoAnalyst.mjs";
import * as electricMotorIndustry from "./industry/electricMotorIndustry.mjs";
import { config } from '../config/config.mjs';
import axios from 'axios';
import OpenAI from 'openai';
import { keywords } from './keyWords.mjs';

const openai = new OpenAI();

class Agent {
    constructor(name, prompts) {
        this.name = name;
        this.prompts = prompts;
        this.history = [];
    }

    async generateResponse(input, promptFunction) {
        const personality = await this.prompts[promptFunction]();
        const prompt = `${personality}\nUser: ${input}\n${this.name}:`;
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
                        { "role": "system", "content": personality },
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

const agents = {
    accountant: new Agent("Accountant", accountant),
    xrayTech: new Agent("XrayTech", xrayTech),
    cryptoAnalyst: new Agent("CryptoAnalyst", cryptoAnalyst),
    electricMotorIndustry: new Agent("ElectricMotorIndustry", electricMotorIndustry)
};

export async function startConversation(question) {
    const agentResponses = [];
    let summary = "";

    for (const [role, triggerWords] of Object.entries(keywords)) {
        if (triggerWords.some((word) => question.toLowerCase().includes(word))) {
            const agent = agents[role];
            if (agent) {
                try {
                    const response = await agent.prompts.handleQuestion(question);
                    agentResponses.push({ name: agent.name, response });
                } catch (error) {
                    console.error(`Error handling role ${role}:`, error);
                    throw new Error("Failed to generate a response.");
                }
            }
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