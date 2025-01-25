import { TwitterApi } from 'twitter-api-v2';
import { config } from '../config/config.mjs';

let rateLimitRemaining = null;
let rateLimitResetTime = null;
let userLimitResetTime = null;

export async function checkRateLimit(client) {
  try {
    const currentTime = Math.floor(Date.now() / 1000); // Current time in Unix timestamp

    if (rateLimitRemaining !== null && rateLimitResetTime !== null && userLimitResetTime !== null) {
      if (rateLimitRemaining > 0 && currentTime >= rateLimitResetTime && currentTime >= userLimitResetTime) {
        return true;
      } else {
        const waitTime = Math.max(rateLimitResetTime, userLimitResetTime) - currentTime;
        console.log(`Rate limit reached. Waiting for ${waitTime} seconds.`);
        await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
        return false;
      }
    }

    const rateLimitStatus = await client.v2.get('application/rate_limit_status', { resources: 'statuses' });
    const rateLimit = rateLimitStatus.resources.statuses['/statuses/update'];
    rateLimitRemaining = rateLimit?.remaining ?? 1; // Default to 1 if undefined
    rateLimitResetTime = rateLimit?.reset ? rateLimit.reset : currentTime + 15 * 60; // Default to 15 minutes from now

    return rateLimitRemaining > 0;
  } catch (error) {
    if (error.code === 404) {
      console.warn('Rate limit data not found, assuming rate limit is not reached.');
      return true;
    } else {
      console.error('Error checking rate limit:', error);
      throw new Error('Failed to check rate limit.');
    }
  }
}

export function updateRateLimitInfo(headers) {
  if (headers['x-rate-limit-remaining'] !== undefined) {
    rateLimitRemaining = parseInt(headers['x-rate-limit-remaining'], 10);
  }
  if (headers['x-rate-limit-reset'] !== undefined) {
    rateLimitResetTime = parseInt(headers['x-rate-limit-reset'], 10);
  }
  if (headers['x-user-limit-24hour-reset'] !== undefined) {
    userLimitResetTime = parseInt(headers['x-user-limit-24hour-reset'], 10);
  }
}
