import { gatherAllTokenData } from '../../utils/dataCollector.mjs';
import { generateAgentConfigurationsforTwitter } from './twitterProfessional.mjs';

export async function startTwitterChat(chain, contractAddress) {
  try {
    const tokenData = await gatherAllTokenData(chain, contractAddress);
    console.log("Token Data:", tokenData);
    const agentResponses = await generateAgentConfigurationsforTwitter(tokenData);
    return agentResponses;
  } catch (error) {
    console.error("Agent Chat Error:", error);
    return [];
  }
}