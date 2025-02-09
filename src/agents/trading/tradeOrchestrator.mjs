import { gatherAllTokenData } from './dataCollector.mjs';
import { generateAgentConfigurationsforAutoTrader } from './autoTrader.mjs';
import { getCurrentTradeAdvice } from './tradeAdvice.mjs';

export async function startAutoTradingChat(chain, contractAddress) {
  try {
    const tokenData = await gatherAllTokenData(chain, contractAddress);
    console.log("Token Data:", tokenData);
    const agentResponses = await generateAgentConfigurationsforAutoTrader(tokenData);
    return agentResponses;
  } catch (error) {
    console.error("Agent Chat Error:", error);
    return [];
  }
}

export async function startAutoTradingAdvice( chain, contractAddress, entryPriceSOL, targetPercentageGain, targetPercentageLoss) {
    try {
      const tokenData = await gatherAllTokenData(chain, contractAddress);
      console.log("Refreshed Token Data:", tokenData);
      const agentResponse = await getCurrentTradeAdvice(tokenData, entryPriceSOL, targetPercentageGain, targetPercentageLoss);
      return agentResponse;
    } catch (error) {
      console.error("Agent Chat Error:", error);
      return [];
    }
  }