import { gatherAllTokenData } from '../../utils/dataCollector.mjs';
import { generateAgentConfigurationsforAutoTrader } from './autoTrader.mjs';
import { getCurrentTradeAdvice } from './tradeAdvice.mjs';
import { getPastTradesByTokenAddress } from '../../db/dynamo.mjs';

export async function startAutoTradingChat(chain, contractAddress) {
  try {
    // First gather past trades for this token
    const pastTrades = await getPastTradesByTokenAddress(contractAddress);
    
    // Then gather current token data
    const tokenData = await gatherAllTokenData(chain, contractAddress);
    console.log("Token Data:", tokenData);

    // Combine token data with past trades
    const enrichedData = {
      ...tokenData,
      pastTrades: pastTrades || [] // Ensure we always have an array even if empty
    };

    const agentResponses = await generateAgentConfigurationsforAutoTrader(enrichedData);
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