import OpenAI from "openai";
import { config } from "../../config/config.mjs";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export async function TWITTER_AGENT() {
  return `
    ### Master Twitter Marketing Genius Prompt

    You are a master Twitter marketing genius. Your job is to create highly engaging and professional tweets that drive followers, likes, and engagement for a business or product. 
    Each tweet must:
    - Capture attention immediately with a hook.
    - Include valuable information or unique insights about the product or topic.
    - Use a persuasive call-to-action (CTA) that encourages readers to engage or follow.
    - Optionally include hashtags for discoverability and emojis for personality.

    Write a tweet based on the provided specifications or topic. Keep the tone professional, yet approachable and exciting.
  `;
}

export async function TWITTER_AUTO_POSTER_AGENT() {
  return `
    ### Automated Twitter Marketing Prompt

    You are an automated Twitter marketing agent. Your job is to create highly engaging and professional tweets that drive followers, likes, and engagement for a business or product. 
    Each tweet must:
    - Capture attention immediately with a hook.
    - Include valuable information or unique insights about the product or topic.
    - Use a persuasive call-to-action (CTA) that encourages readers to engage or follow.
    - Optionally include hashtags for discoverability and emojis for personality.

    Write a tweet based on the provided specifications or topic. Keep the tone professional, yet approachable and exciting.
    The specifications are predefined and should be used to tailor the tweet to the user's business needs.
  `;
}

async function generateTweet(input, specifications = "") {
  const openai = new OpenAI();
  const prompt = await TWITTER_AGENT();

  try {
    const completion = await openai.chat.completions.create({
      model: config.openAI.model,
      messages: [
        { role: "system", content: prompt },
        {
          role: "user",
          content: `
            ### Input
            ${input}

            ### Specifications
            ${JSON.stringify(specifications)}
          `,
        },
      ],
    });
    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error generating tweet:", error);
    throw new Error("Failed to generate a tweet.");
  }
}

async function generateAutoPostTweet() {
  const openai = new OpenAI();
  const prompt = await TWITTER_AUTO_POSTER_AGENT();

  try {
    const completion = await openai.chat.completions.create({
      model: config.openAI.model,
      messages: [
        { role: "system", content: prompt },
        {
          role: "user",
          content: `
            ### Specifications
            ${JSON.stringify(config.autoPostSpecifications)}
          `,
        },
      ],
    });
    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error generating auto-post tweet:", error);
    throw new Error("Failed to generate an auto-post tweet.");
  }
}

export async function createTwitterPost(input, specifications = "") {
  try {
    const tweet = await generateTweet(input, specifications);
    console.log("Generated Tweet:", tweet);
    return tweet;
  } catch (error) {
    console.error("Error creating Twitter post:", error);
    throw new Error("Failed to create Twitter post.");
  }
}

async function handleTwitterPost(question, specs = {}) {
  try {
    const tweet = await generateTweet(question, specs);
    console.log("Generated Tweet:", tweet);
    return tweet;
  } catch (error) {
    console.error("Error handling Twitter post:", error);
    throw new Error("Failed to handle Twitter post.");
  }
}

async function autoPostToTwitter() {
  if (!config.xAutoPoster) return;

  const maxPostsPerMonth = 1500;
  const postsPerDay = config.postsPerDay;
  const maxPostsPerDay = Math.min(postsPerDay, Math.floor(maxPostsPerMonth / 30));

  for (let i = 0; i < maxPostsPerDay; i++) {
    try {
      const tweet = await generateAutoPostTweet();
      // Logic to post tweet using Twitter API
      console.log("Auto-posted Tweet:", tweet);
    } catch (error) {
      console.error("Error auto-posting to Twitter:", error);
    }
  }
}

// Call autoPostToTwitter function if auto-posting is enabled
if (config.xAutoPoster) {
  autoPostToTwitter();
}

// Example Usage
/*
(async () => {
  const question = "Promote a new crypto trading platform";
  const specifications = {
    platformName: "CryptoHive",
    keyFeature: "Lightning-fast transactions with 0% trading fees for the first 3 months",
    targetAudience: "Crypto traders and enthusiasts",
  };

  try {
    const tweet = await handleTwitterPost(question, specifications);
    console.log("Final Tweet:", tweet);
  } catch (error) {
    console.error("Error:", error);
  }
})();
*/
