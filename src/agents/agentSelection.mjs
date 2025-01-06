import * as accountantPrompts from '../prompts/accounting/accountant.mjs';
import * as xrayTechPrompts from '../prompts/medical/xrayTech.mjs';
import * as cryptoAnalystPrompts from '../prompts/crypto/cryptoAnalyst.mjs';

async function selectAccountantPrompt(query) {
    if (query.includes('onboarding') || query.includes('introduction') || query.includes('welcome') || query.includes('client setup')) {
        return { prompt: await accountantPrompts.ONBOARDING_AGENT_PROMPT(), role: 'Onboarding Agent' };
    } else if (query.includes('document analysis') || query.includes('financial document') || query.includes('statement review') || query.includes('report analysis')) {
        return { prompt: await accountantPrompts.DOC_ANALYZER_AGENT_PROMPT(), role: 'Financial Document Analysis Agent' };
    } else if (query.includes('summary') || query.includes('financial summary') || query.includes('overview') || query.includes('report summary')) {
        return { prompt: await accountantPrompts.SUMMARY_GENERATOR_AGENT_PROMPT(), role: 'Financial Summary Generation Agent' };
    } else if (query.includes('fraud') || query.includes('fraud detection') || query.includes('irregularity') || query.includes('audit issue') || query.includes('red flags')) {
        return { prompt: await accountantPrompts.FRAUD_DETECTION_AGENT_PROMPT(), role: 'Fraud Detection Agent' };
    } else if (query.includes('decision making') || query.includes('financial decision') || query.includes('investment choice') || query.includes('budget allocation')) {
        return { prompt: await accountantPrompts.DECISION_MAKING_PROMPT(), role: 'Decision-Making Support Agent' };
    } else if (query.includes('tax') || query.includes('taxes') || query.includes('tax return') || query.includes('tax filing') || query.includes('IRS') || query.includes('tax planning')) {
        return { prompt: await accountantPrompts.TAX_AGENT_PROMPT(), role: 'Tax Agent' };
    } else {
        return null;
    }
}

async function selectXrayTechPrompt(query) {
    if (query.includes('xray analysis') || query.includes('radiological analysis') || query.includes('image interpretation') || query.includes('radiograph')) {
        return { prompt: await xrayTechPrompts.XRAY_ANALYSIS_PROMPT(), role: 'Radiological Analysis Agent' };
    } else if (query.includes('treatment plan') || query.includes('medical treatment') || query.includes('care plan') || query.includes('therapy guidance')) {
        return { prompt: await xrayTechPrompts.TREATMENT_PLAN_PROMPT(), role: 'Treatment Plan Agent' };
    } else {
        return null;
    }
}

async function selectCryptoAnalystPrompt(query) {
    if (query.includes('crypto') || query.includes('cryptocurrency') || query.includes('bitcoin') || query.includes('ethereum') || query.includes('blockchain') || query.includes('altcoin') || query.includes('crypto analysis') || query.includes('crypto trends') || query.includes('digital currency') || query.includes('token')) {
        if (query.includes('market analysis')) {
            return { prompt: await cryptoAnalystPrompts.CRYPTO_MARKET_ANALYSIS_PROMPT(), role: 'Crypto Market Analyst' };
        } else if (query.includes('technical analysis')) {
            return { prompt: await cryptoAnalystPrompts.CRYPTO_TECHNICAL_ANALYSIS_PROMPT(), role: 'Crypto Technical Analyst' };
        } else if (query.includes('investment strategies')) {
            return { prompt: await cryptoAnalystPrompts.CRYPTO_INVESTMENT_STRATEGIES_PROMPT(), role: 'Crypto Investment Strategist' };
        } else {
            return { prompt: await cryptoAnalystPrompts.CRYPTO_MARKET_ANALYSIS_PROMPT(), role: 'Crypto Analyst' };
        }
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
