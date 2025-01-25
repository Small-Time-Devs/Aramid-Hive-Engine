import { TwitterApi } from 'twitter-api-v2';
import { TwitterApiRateLimitPlugin } from '@twitter-api-v2/plugin-rate-limit'
import { config } from '../config/config.mjs';

export async function checkRateLimit(client) {
  try {
    const rateLimitPlugin = new TwitterApiRateLimitPlugin();

    const client = new TwitterApi({
    appKey: `${config.twitter.keys.appKey}`,
    appSecret: `${config.twitter.keys.appSecret}`,
    accessToken: `${config.twitter.keys.accessToken}`,
    accessSecret: `${config.twitter.keys.accessSecret}`,
    }, { plugins: [rateLimitPlugin] });    
    
    await client.v2.me();
    const currentRateLimitForMe = await rateLimitPlugin.v2.getRateLimit('users/me')
    console.log(currentRateLimitForMe) // { limit: 75, remaining: 74, reset: 1640985600000 }
    
  } catch (error) {
    console.error('Error checking rate limit:', error);
    throw new Error('Failed to check rate limit.');
  }
}
