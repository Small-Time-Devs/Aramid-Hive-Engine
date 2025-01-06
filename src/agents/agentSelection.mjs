import * as accountantPrompts from '../prompts/accounting/accountant.mjs';
import * as xrayTechPrompts from '../prompts/accounting/xrayTech.mjs';

async function selectAccountantPrompt(query) {
    if (query.includes('onboarding') || query.includes('introduction')) {
        return { prompt: await accountantPrompts.ONBOARDING_AGENT_PROMPT(), role: 'Onboarding Agent' };
    } else if (query.includes('document analysis') || query.includes('financial document')) {
        return { prompt: await accountantPrompts.DOC_ANALYZER_AGENT_PROMPT(), role: 'Financial Document Analysis Agent' };
    } else if (query.includes('summary') || query.includes('financial summary')) {
        return { prompt: await accountantPrompts.SUMMARY_GENERATOR_AGENT_PROMPT(), role: 'Financial Summary Generation Agent' };
    } else if (query.includes('fraud') || query.includes('fraud detection')) {
        return { prompt: await accountantPrompts.FRAUD_DETECTION_AGENT_PROMPT(), role: 'Fraud Detection Agent' };
    } else if (query.includes('decision making') || query.includes('financial decision')) {
        return { prompt: await accountantPrompts.DECISION_MAKING_PROMPT(), role: 'Decision-Making Support Agent' };
    } else if (query.includes('tax') || query.includes('taxes') || query.includes('tax return')) {
        return { prompt: await accountantPrompts.TAX_AGENT_PROMPT(), role: 'Tax Agent' };
    } else {
        return null;
    }
}

async function selectXrayTechPrompt(query) {
    if (query.includes('xray analysis') || query.includes('radiological analysis')) {
        return { prompt: await xrayTechPrompts.XRAY_ANALYSIS_PROMPT(), role: 'Radiological Analysis Agent' };
    } else if (query.includes('treatment plan') || query.includes('medical treatment')) {
        return { prompt: await xrayTechPrompts.TREATMENT_PLAN_PROMPT(), role: 'Treatment Plan Agent' };
    } else {
        return null;
    }
}

export async function selectPrompt(query) {
    let result = await selectAccountantPrompt(query);
    if (result) return result;

    result = await selectXrayTechPrompt(query);
    if (result) return result;

    return { prompt: 'Sorry, I cannot assist with that. Please refine your search.', role: 'Agent' };
}
