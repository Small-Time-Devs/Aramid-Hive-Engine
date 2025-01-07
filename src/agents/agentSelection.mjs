import * as accountantPrompts from '../prompts/accounting/accountant.mjs';
import * as xrayTechPrompts from '../prompts/medical/xrayTech.mjs';
import * as cryptoAnalystPrompts from '../prompts/crypto/cryptoAnalyst.mjs';
import { config } from '../config/config.mjs';
import axios from 'axios';
import OpenAI from 'openai';

const openai = new OpenAI();

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

async function selectAccountantPrompt(query) {
    if (query.includes('onboarding') || query.includes('introduction') || query.includes('welcome') || query.includes('client setup')) {
        const result = await getResponse(await accountantPrompts.ONBOARDING_AGENT_PROMPT(), 'Onboarding Agent');
        return { prompt: result, role: 'Onboarding Agent' };
    } else if (query.includes('document analysis') || query.includes('financial document') || query.includes('statement review') || query.includes('report analysis')) {
        const result = await getResponse(await accountantPrompts.DOC_ANALYZER_AGENT_PROMPT(), 'Financial Document Analysis Agent');
        return { prompt: result, role: 'Financial Document Analysis Agent' };
    } else if (query.includes('summary') || query.includes('financial summary') || query.includes('overview') || query.includes('report summary')) {
        const result = await getResponse(await accountantPrompts.SUMMARY_GENERATOR_AGENT_PROMPT(), 'Financial Summary Generation Agent');
        return { prompt: result, role: 'Financial Summary Generation Agent' };
    } else if (query.includes('fraud') || query.includes('fraud detection') || query.includes('irregularity') || query.includes('audit issue') || query.includes('red flags')) {
        const result = await getResponse(await accountantPrompts.FRAUD_DETECTION_AGENT_PROMPT(), 'Fraud Detection Agent');
        return { prompt: result, role: 'Fraud Detection Agent' };
    } else if (query.includes('decision making') || query.includes('financial decision') || query.includes('investment choice') || query.includes('budget allocation')) {
        const result = await getResponse(await accountantPrompts.DECISION_MAKING_PROMPT(), 'Decision-Making Support Agent');
        return { prompt: result, role: 'Decision-Making Support Agent' };
    } else if (query.includes('tax') || query.includes('taxes') || query.includes('tax return') || query.includes('tax filing') || query.includes('IRS') || query.includes('tax planning')) {
        const result = await getResponse(await accountantPrompts.TAX_AGENT_PROMPT(), 'Tax Agent');
        return { prompt: result, role: 'Tax Agent' };
    } else {
        return null;
    }
}

async function selectXrayTechPrompt(query) {
    if (query.includes('xray analysis') || query.includes('radiological analysis') || query.includes('image interpretation') || query.includes('radiograph')) {
        const result = await getResponse(await xrayTechPrompts.XRAY_ANALYSIS_PROMPT(), 'Radiological Analysis Agent');
        return { prompt: result, role: 'Radiological Analysis Agent' };
    } else if (query.includes('treatment plan') || query.includes('medical treatment') || query.includes('care plan') || query.includes('therapy guidance')) {
        const result = await getResponse(await xrayTechPrompts.TREATMENT_PLAN_PROMPT(), 'Treatment Plan Agent');
        return { prompt: result, role: 'Treatment Plan Agent' };
    } else {
        return null;
    }
}

async function selectCryptoAnalystPrompt(query) {
    if (query.includes('onboarding') || query.includes('introduction') || query.includes('welcome') || query.includes('client setup')) {
        const result = await getResponse(await accountantPrompts.ONBOARDING_AGENT_PROMPT(), 'Onboarding Agent');
        return { prompt: result, role: 'Onboarding Agent' };
    } else if (query.includes('document analysis') || query.includes('financial document') || query.includes('statement review') || query.includes('report analysis')) {
        const result = await getResponse(await accountantPrompts.DOC_ANALYZER_AGENT_PROMPT(), 'Financial Document Analysis Agent');
        return { prompt: result, role: 'Financial Document Analysis Agent' };
    } else if (query.includes('summary') || query.includes('financial summary') || query.includes('overview') || query.includes('report summary')) {
        const result = await getResponse(await accountantPrompts.SUMMARY_GENERATOR_AGENT_PROMPT(), 'Financial Summary Generation Agent');
        return { prompt: result, role: 'Financial Summary Generation Agent' };
    } else if (query.includes('fraud') || query.includes('fraud detection') || query.includes('irregularity') || query.includes('audit issue') || query.includes('red flags')) {
        const result = await getResponse(await accountantPrompts.FRAUD_DETECTION_AGENT_PROMPT(), 'Fraud Detection Agent');
        return { prompt: result, role: 'Fraud Detection Agent' };
    } else if (query.includes('decision making') || query.includes('financial decision') || query.includes('investment choice') || query.includes('budget allocation')) {
        const result = await getResponse(await accountantPrompts.DECISION_MAKING_PROMPT(), 'Decision-Making Support Agent');
        return { prompt: result, role: 'Decision-Making Support Agent' };
    } else if (query.includes('tax') || query.includes('taxes') || query.includes('tax return') || query.includes('tax filing') || query.includes('IRS') || query.includes('tax planning')) {
        const result = await getResponse(await accountantPrompts.TAX_AGENT_PROMPT(), 'Tax Agent');
        return { prompt: result, role: 'Tax Agent' };
    } else {
        return null;
    }
}

export async function selectPrompt(query) {
    let result = await selectAccountantPrompt(query);
    if (result) return result;

    result = await selectXrayTechPrompt(query);
    if (result) return result;

    result = await selectCryptoAnalystPrompt(query);
    if (result) return result;

    return { prompt: 'Sorry, I cannot assist with that. Please refine your search.', role: 'Agent' };
}
