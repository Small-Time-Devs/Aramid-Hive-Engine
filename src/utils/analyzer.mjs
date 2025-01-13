import { config } from '../config/config.mjs';
import axios from 'axios';

export async function analyzeCryptoData(cryptoData, generateResponse) {
    const cryptoName = Object.keys(cryptoData)[0];
    const price = cryptoData[cryptoName].usd;
    const analysisPrompt = `Analyze the current price of ${cryptoName} which is ${price} USD. Provide insights and future predictions.`;
    return await generateResponse(analysisPrompt);
}
