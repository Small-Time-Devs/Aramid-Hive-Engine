import { config } from '../../config/config.mjs';
import { getPastTradesByTokenAddress } from '../../db/dynamo.mjs';
import { gatherAllTokenData } from '../../utils/dataCollector.mjs';

// Cloud Flare imports
import { cloudFlareAutoTraderAgent } from './cloudFlare/cloudFlareAutoTrader.mjs';
import { cloudFlareAutoTraderAdviceAgent } from './cloudFlare/cloudFlareTradeAdvice.mjs';
import { cloudFlareDiscordTokenAdviceAgent } from './cloudFlare/cloudFlareDiscordTokenAdvice.mjs';

// OpenAI imports
import { generateAgentConfigurationsforAutoTrader } from './openAI/autoTrader.mjs';
import { getCurrentTradeAdvice } from './openAI/tradeAdvice.mjs';

export async function startAutoTradingChat(chain, contractAddress) {
  try {
    // First gather past trades for this token
    const pastTrades = await getPastTradesByTokenAddress(contractAddress);
    
    // Gather current token data
    const tokenData = await gatherAllTokenData(chain, contractAddress);

    // Add past trade summary data even if no trades exist
    const pastTradesSummary = {
      numberOfPreviousTrades: pastTrades?.length || 0,
      averageTradeProfit: calculateAverageProfit(pastTrades),
      bestTradePerformance: getBestPerformance(pastTrades),
      worstTradePerformance: getWorstPerformance(pastTrades),
      mostCommonExitReasons: getMostCommonExitReasons(pastTrades),
      averageHoldTime: calculateAverageHoldTime(pastTrades),
      totalVolumeTraded: calculateTotalVolume(pastTrades),
      pastTrades: pastTrades || []
    };

    // Combine token data with past trades summary
    const enrichedData = {
      ...tokenData,
      ...pastTradesSummary
    };

    let agentResponses;
    if (config.llmSettings.activePlatform.openAI) {
      agentResponses = await generateAgentConfigurationsforAutoTrader(enrichedData);
    } else if (config.llmSettings.activePlatform.cloudFlare) {
      agentResponses = await cloudFlareAutoTraderAgent(enrichedData);
    }

    return agentResponses || [];  // Ensure we always return an array

  } catch (error) {
    console.error("Agent Chat Error:", error);
    return [];
  }
}

export async function startDiscordTokenAdviceChat(chain, contractAddress) {
  try {
    // Gather current token data
    const tokenData = await gatherAllTokenData(chain, contractAddress);

    let agentResponses;
    if (config.llmSettings.activePlatform.openAI) {
      agentResponses = await getCurrentTradeAdvice(tokenData);
    } else if (config.llmSettings.activePlatform.cloudFlare) {
      agentResponses = await cloudFlareDiscordTokenAdviceAgent(tokenData);
    }

    return agentResponses || [];  // Ensure we always return an array

  } catch (error) {
    console.error("Discord Token Advice Error:", error);
    return [];
  }
}

export async function startAutoTradingAdvice( chain, contractAddress, entryPriceSOL, targetPercentageGain, targetPercentageLoss) {
  try {
    const tokenData = await gatherAllTokenData(chain, contractAddress);

  let agentResponse;
  if (config.llmSettings.activePlatform.openAI) {
    agentResponse = await getCurrentTradeAdvice(tokenData, entryPriceSOL, targetPercentageGain, targetPercentageLoss);
  } else if (config.llmSettings.activePlatform.cloudFlare) {
    agentResponse = await cloudFlareAutoTraderAdviceAgent(tokenData, entryPriceSOL, targetPercentageGain, targetPercentageLoss);
  }

  return agentResponse || [];  // Ensure we always return an array

  } catch (error) {
    console.error("Agent Chat Error:", error);
    return [];
  }
}

// Helper functions for past trade analysis
function calculateAverageProfit(trades) {
  if (!trades?.length) return 0;
  const profits = trades.map(t => t.sellPercentageGain || 0);
  return profits.reduce((a, b) => a + b, 0) / trades.length;
}

function getBestPerformance(trades) {
  if (!trades?.length) return 0;
  return Math.max(...trades.map(t => t.sellPercentageGain || 0));
}

function getWorstPerformance(trades) {
  if (!trades?.length) return 0;
  return Math.min(...trades.map(t => t.sellPercentageLoss || 0));
}

function getMostCommonExitReasons(trades) {
  if (!trades?.length) return "No previous trades";
  const reasons = trades.map(t => t.reason);
  return Object.entries(
    reasons.reduce((acc, reason) => {
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {})
  )
  .sort((a, b) => b[1] - a[1])
  .map(([reason]) => reason)
  .join(", ");
}

function calculateAverageHoldTime(trades) {
  if (!trades?.length) return 0;
  const holdTimes = trades
    .filter(t => t.completedAt && t.timestamp)
    .map(t => (new Date(t.completedAt) - new Date(t.timestamp)) / (1000 * 60)); // Convert to minutes
  return holdTimes.length ? holdTimes.reduce((a, b) => a + b, 0) / holdTimes.length : 0;
}

function calculateTotalVolume(trades) {
  if (!trades?.length) return 0;
  return trades.reduce((sum, trade) => sum + (trade.amountInvested || 0), 0);
}