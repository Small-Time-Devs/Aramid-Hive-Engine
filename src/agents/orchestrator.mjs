import * as accountant from "../prompts/accounting/accountant.mjs";
import * as xrayTech from "../prompts/medical/xrayTech.mjs";
import * as cryptoAnalyst from "../prompts/crypto/cryptoAnalyst.mjs";
import * as electricMotorIndustry from "../prompts/industry/electricMotorIndustry.mjs";
import { config } from '../config/config.mjs';
import axios from 'axios';
import OpenAI from 'openai';

const openai = new OpenAI();

const roles = {
    accountant,
    xrayTech,
    cryptoAnalyst,
    electricMotorIndustry,
};

const keywords = {
    accountant: {
        TAX_AGENT_PROMPT: ["tax", "deduction", "credit", "IRS"],
        ONBOARDING_AGENT_PROMPT: ["onboarding", "swarm technology", "new user"],
        DOC_ANALYZER_AGENT_PROMPT: ["document analysis", "financial data", "reports"],
        SUMMARY_GENERATOR_AGENT_PROMPT: ["financial summary", "summary", "metrics"],
        FRAUD_DETECTION_AGENT_PROMPT: ["fraud", "detection", "anomalies"],
        DECISION_MAKING_PROMPT: ["decision making", "recommendation", "insight"],
    },
    xrayTech: {
        XRAY_ANALYSIS_PROMPT: ["x-ray", "radiology", "diagnosis", "analysis"],
        TREATMENT_PLAN_PROMPT: ["treatment plan", "follow-up", "management strategies"],
    },
    cryptoAnalyst: {
        CRYPTO_ANALYST_PROMPT: ["crypto", "cryptocurrency", "blockchain", "investment"],
        Crypto_Equity_Capital_Analyst: ["equity", "capital", "market cap", "trends"],
        Crypto_Investment_Analyst: ["investment", "ROI", "opportunities", "returns"],
        DeFi_Analyst: ["DeFi", "TVL", "APY", "protocol"],
        Crypto_Digital_Asset_Analyst: ["digital asset", "utility tokens", "NFT"],
        Crypto_Venture_Capital_Analyst: ["venture capital", "early-stage", "projects"],
        DeFi_Analyst_CoinTracker_Focus: ["CoinTracker", "tracking", "portfolio"],
        Junior_Systematic_Review_Analyst: ["review", "systematic", "market trends"],
        Analyst_Associate: ["analysis", "strategies", "risk assessment"],
    },
    electricMotorIndustry: {
        ONBOARDING_AGENT_PROMPT: ["motor", "onboarding", "blower", "fan", "heater"],
        CROSS_REFERENCE_AGENT_PROMPT: ["cross-reference", "replacement", "compatible", "motor"],
        TROUBLESHOOTING_AGENT_PROMPT: ["troubleshoot", "motor issue", "overheating", "repair"],
    },
};

async function getResponse(prompt, role) {
    if (config.useLocalLLM) {
        // Use local LLM via LM Studio
        try {
            const response = await axios.post(config.localLLM.serverUrl, {
                modelPath: config.localLLM.modelPath,
                prompt: prompt
            });
            return response.data;
        } catch (error) {
            console.error('Error connecting to local LLM:', error);
            throw new Error('Failed to connect to local LLM.');
        }
    } else {
        // Use OpenAI API
        try {
            const completion = await openai.chat.completions.create({
                model: config.openAI.model,
                messages: [
                    { "role": "system", "content": `You are a ${role}.` },
                    { "role": "user", "content": prompt }
                ]
            });
            return completion.choices[0].message.content;
        } catch (error) {
            console.error('Error connecting to OpenAI API:', error);
            throw new Error('Failed to connect to OpenAI API.');
        }
    }
}

export async function orchestrate(question) {
    for (const [role, prompts] of Object.entries(keywords)) {
        for (const [promptFunction, triggerWords] of Object.entries(prompts)) {
            if (triggerWords.some((word) => question.toLowerCase().includes(word))) {
                const roleModule = roles[role];
                if (roleModule && typeof roleModule[promptFunction] === "function") {
                    try {
                        // Fetch the prompt
                        const prompt = await roleModule[promptFunction]();

                        // Special handling for CROSS_REFERENCE_AGENT_PROMPT.
                        if (role === "electricMotorIndustry" && promptFunction === "CROSS_REFERENCE_AGENT_PROMPT") {
                            const motor = question.match(/FM[0-9A-Z]+/i); // Extract motor model from question.
                            if (motor) {
                                const motorDatabase = {
                                    "FM55P": { replacement: "FM55PX", specs: "1/4 HP, 115V, 1725 RPM" },
                                    // Add more motors and replacements as needed.
                                };
                                if (motorDatabase[motor[0]]) {
                                    const { replacement, specs } = motorDatabase[motor[0]];
                                    return `The replacement for ${motor[0]} is ${replacement}. Specifications: ${specs}.`;
                                } else {
                                    return `I'm sorry, I couldn't find a direct replacement for ${motor[0]}. Please provide more details, such as horsepower, voltage, RPM, and frame size, to help with a cross-reference.`;
                                }
                            }
                        }

                        // Call getResponse with the prompt and role
                        const response = await getResponse(prompt, role);

                        // Return the generated response
                        return response;
                    } catch (error) {
                        console.error(`Error handling role ${role} and prompt ${promptFunction}:`, error);
                        throw new Error("Failed to generate a response.");
                    }
                }
            }
        }
    }

    throw new Error("No suitable role or prompt found for the question.");
}
