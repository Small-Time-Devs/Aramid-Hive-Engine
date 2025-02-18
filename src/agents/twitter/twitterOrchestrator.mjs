import { gatherAllTokenData } from '../../utils/dataCollector.mjs';
import { config } from '../../config/config.mjs';
import { generateAgentConfigurationsforTwitter } from './openAI/twitterProfessional.mjs';
import { cloudFlareTwitterProfessionalAgent } from './cloudFlare/cloudFlareTwitterProfessional.mjs';

export async function startTwitterChat(chain, contractAddress) {
  try {
    const tokenData = await gatherAllTokenData(chain, contractAddress);
    //console.log("Token Data:", tokenData);

    let agentResponses;
    if (config.llmSettings.activePlatform.openAI) {
      agentResponses = await generateAgentConfigurationsforTwitter(tokenData);
    } else if (config.llmSettings.activePlatform.cloudFlare) {
      agentResponses = await cloudFlareTwitterProfessionalAgent(tokenData);
    }

    return agentResponses || [];  // Ensure we always return an array
  } catch (error) {
    console.error("Agent Chat Error:", error);
    return [];
  }
}