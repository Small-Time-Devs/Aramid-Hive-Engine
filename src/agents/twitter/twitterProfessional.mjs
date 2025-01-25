import OpenAI from "openai";
import { config } from "../../config/config.mjs";
import axios from "axios";
import dotenv from "dotenv";
import fetch from "node-fetch";
import OAuth from "oauth-1.0a";
import crypto from "crypto";
import got from "got";
import qs from "querystring";
import readline from "readline";
import { TwitterApi } from "twitter-api-v2";
import { fetchLatestTokenProfiles, fetchLatestBoostedTokens } from "../../utils/apiUtils.mjs";

dotenv.config();

/*
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

export async function TWITTER_AGENT() {
  return `
    ### Advanced Twitter Marketing Strategist Prompt

    You are a world-class Twitter strategist specializing in creating **high-energy, detailed, and visually engaging tweets** for businesses and products. 
    Your mission is to craft tweets that:
    - Start with an **irresistible hook** or bold statement to grab attention.
    - Clearly describe the product or service using **dynamic, action-oriented language**.
    - Highlight the **most impressive and unique features**, focusing on benefits that resonate with the audience.
    - Use **visual cues like emojis** to guide the reader and create excitement.
    - Close with a powerful **call-to-action (CTA)** that drives clicks and engagement.
    - Incorporate **trending hashtags** and contextually relevant keywords for discoverability.
    - **Keep the tweet concise and within 230 characters** while maximizing impact.

    Advanced Instructions:
    - Use a mix of **powerful verbs**, bold claims, and creative hooks.
    - Appeal to the target audience's goals and pain points.
    - Frame the product as the **future of the industry** or a **must-have solution**.
    - Keep the tweet concise and within 230 characters while maximizing impact.

    Input: Topic, product, or specifications.
    Output: A tweet that excites, informs, and drives engagement.
  `;
}
*/

export async function INSPIRATIONAL_TWITTER_AGENT() {
  return `
    ### Inspirational Twitter Content Strategist Prompt

    You are an uplifting and inspirational Twitter agent. Your role is to craft tweets that:
    - Begin with a **motivational hook** or a positive affirmation to immediately inspire readers.
    - Share a reflective, insightful, or encouraging thought that resonates universally.
    - Use **emotionally impactful and creative language** to evoke feelings of hope, motivation, or positivity.
    - Incorporate **visual cues like emojis** for warmth and engagement.
    - Keep the tone **authentic, relatable, and uplifting** to spark connection with the audience.
    - Stay concise and ensure the message fits within 230 characters, leaving room for engagement.

    Advanced Instructions:
    - Write about whatever is on your "mind," focusing on themes of positivity, growth, and encouragement.
    - Include rhetorical devices like metaphors, alliteration, or storytelling for depth.
    - Use contextually relevant **trending hashtags** to amplify the reach.
    - Speak to universal human emotions and aspirations, leaving the reader feeling inspired and valued.

    Input: A mood, theme, or random inspiration.
    Output: A tweet that radiates positivity, inspiration, and universal appeal.
  `;
}

export async function SNARKY_TWITTER_AGENT() {
  return `
    ### Snarky Twitter Bot Prompt

    You are a snarky, funny Twitter bot. Your job is to create highly engaging and humorous tweets based on the latest token profiles. 
    Each tweet must:
    - Include a snarky, funny comment about how stupid the token is.
    - Mention the token name and a brief description.
    - Use a humorous tone that captures attention and entertains the audience.
    - Include a disclaimer that clearly states not to buy the token.
    - Optionally include hashtags for discoverability and emojis for personality.

    Token Description: "{tokenDescription}"

    Write a tweet based on the provided token description. Make fun of how stupid the token is. Keep the tone snarky, funny, and engaging. Include a disclaimer that clearly states not to buy the token.
  `;
}

export async function BOOSTED_TWITTER_AGENT() {
  return `
    ### Snarky Twitter Bot Prompt for Boosted Tokens

    You are a snarky, funny Twitter bot. Your job is to create highly engaging and humorous tweets based on the latest boosted token profiles. 
    Each tweet must:
    - Include a snarky, funny comment about how much the project paid to be boosted.
    - Mention the token name and a brief description.
    - Use a humorous tone that captures attention and entertains the audience.
    - Include a disclaimer that clearly states not to buy the token.
    - Optionally include hashtags for discoverability and emojis for personality.

    Token Description: "{tokenDescription}"

    Write a tweet based on the provided token description. Make fun of how much the project paid to be boosted and how stupid the token is. Keep the tone snarky, funny, and engaging. Include a disclaimer that clearly states not to buy the token.
  `;
}

export async function TWITTER_AUTO_POSTER_AGENT() {
  return `
    ### Automated Flashy Twitter Marketing Prompt

    You are a high-energy Twitter automation agent designed to craft **attention-grabbing, detail-rich, and exciting tweets** for automated posting. Your job is to:
    - Open with a **bold, eye-catching hook** or intriguing question.
    - Describe the product in a way that feels **cutting-edge, exciting, and essential**, using emojis to emphasize key features.
    - Highlight the **most valuable features and benefits** in bullet-point or line-break format for easy reading.
    - Close with a **compelling CTA** that drives readers to click or learn more.
    - Include **targeted hashtags** and use dynamic, conversational language.
    - **Keep the tweet concise and within 230 characters** while maximizing impact.

    Key Features:
    - Maximize engagement by using urgency, excitement, or curiosity in the opening.
    - Integrate the product’s **unique features** seamlessly into the tweet flow.
    - Ensure URLs and hashtags are strategically placed for visibility.

    Input: Product details and specifications.
    Output: A ready-to-post tweet with energy and impact, formatted to be passed through the Twitter API.
  `;
}

export async function generateTweet(input, specifications = "") {
  const openai = new OpenAI();
  const prompt = await INSPIRATIONAL_TWITTER_AGENT();

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
    let tweet = completion.choices[0].message.content.trim();
    tweet = tweet.replace(/\*\*/g, ''); // Remove Markdown bold formatting
    tweet = tweet.replace(/\n/g, ' \\n '); // Replace newlines with escaped newlines
    tweet = tweet.replace(/\s+/g, ' ').trim(); // Remove extra spaces
    if (tweet.length > 230) {
      tweet = tweet.substring(0, 227) + '...'; // Ensure tweet is within 230 characters
    }
    return tweet;
  } catch (error) {
    console.error("Error generating tweet:", error);
    throw new Error("Failed to generate a tweet.");
  }
}

export async function generateSnarkyTweet() {
  const openai = new OpenAI();
  const tokenProfiles = await fetchLatestTokenProfiles();
  const randomToken = tokenProfiles[Math.floor(Math.random() * tokenProfiles.length)];
  const tokenDescription = randomToken.description;

  const prompt = await SNARKY_TWITTER_AGENT();

  try {
    const completion = await openai.chat.completions.create({
      model: config.openAI.model,
      messages: [
        { role: "system", content: prompt.replace("{tokenDescription}", tokenDescription) },
        {
          role: "user",
          content: `
            ### Token Description
            ${tokenDescription}
          `,
        },
      ],
    });
    let tweet = completion.choices[0].message.content.trim();
    tweet = tweet.replace(/\*\*/g, ''); // Remove Markdown bold formatting
    tweet = tweet.replace(/\n/g, ' \\n '); // Replace newlines with escaped newlines
    tweet = tweet.replace(/\s+/g, ' ').trim(); // Remove extra spaces
    if (tweet.length > 230) {
      tweet = tweet.substring(0, 227) + '...'; // Ensure tweet is within 230 characters
    }
    return tweet;
  } catch (error) {
    console.error("Error generating snarky tweet:", error);
    throw new Error("Failed to generate a snarky tweet.");
  }
}

export async function generateBoostedTweet() {
  const openai = new OpenAI();
  const boostedTokens = await fetchLatestBoostedTokens();
  const randomToken = boostedTokens[Math.floor(Math.random() * boostedTokens.length)];
  const tokenDescription = randomToken.description;

  const prompt = await BOOSTED_TWITTER_AGENT();

  try {
    const completion = await openai.chat.completions.create({
      model: config.openAI.model,
      messages: [
        { role: "system", content: prompt.replace("{tokenDescription}", tokenDescription) },
        {
          role: "user",
          content: `
            ### Token Description
            ${tokenDescription}
          `,
        },
      ],
    });
    let tweet = completion.choices[0].message.content.trim();
    tweet = tweet.replace(/\*\*/g, ''); // Remove Markdown bold formatting
    tweet = tweet.replace(/\n/g, ' \\n '); // Replace newlines with escaped newlines
    tweet = tweet.replace(/\s+/g, ' ').trim(); // Remove extra spaces
    if (tweet.length > 230) {
      tweet = tweet.substring(0, 227) + '...'; // Ensure tweet is within 230 characters
    }
    return tweet;
  } catch (error) {
    console.error("Error generating boosted tweet:", error);
    throw new Error("Failed to generate a boosted tweet.");
  }
}

export async function generateProjectTweet() {
  const openai = new OpenAI();
  const projectDescriptions = config.projectDescriptions;
  const randomDescription = projectDescriptions[Math.floor(Math.random() * projectDescriptions.length)];

  const prompt = await TWITTER_AUTO_POSTER_AGENT();

  try {
    const completion = await openai.chat.completions.create({
      model: config.openAI.model,
      messages: [
        { role: "system", content: prompt },
        {
          role: "user",
          content: `
            ### Project Description
            ${randomDescription}
          `,
        },
      ],
    });
    let tweet = completion.choices[0].message.content.trim();
    tweet = tweet.replace(/\*\*/g, ''); // Remove Markdown bold formatting
    tweet = tweet.replace(/\n/g, ' \\n '); // Replace newlines with escaped newlines
    tweet = tweet.replace(/\s+/g, ' ').trim(); // Remove extra spaces
    if (tweet.length > 230) {
      tweet = tweet.substring(0, 227) + '...'; // Ensure tweet is within 230 characters
    }
    return tweet;
  } catch (error) {
    console.error("Error generating project tweet:", error);
    throw new Error("Failed to generate a project tweet.");
  }
}

export async function generateAutoPostTweet() {
  try {
    const randomChoice = Math.floor(Math.random() * 4);
    let tweet;

    if (randomChoice === 0) {
      tweet = await generateSnarkyTweet();
    } else if (randomChoice === 1) {
      tweet = await generateProjectTweet();
    } else if (randomChoice === 2) {
      tweet = await generateBoostedTweet();
    } else {
      tweet = await generateTweet("What's on your mind?");
    }

    console.log("Generated Tweet:", tweet);
    return tweet;
  } catch (error) {
    console.error("Error generating auto-post tweet:", error);
    throw new Error("Failed to generate an auto-post tweet.");
  }
}

export async function postToTwitter(tweet) {
  try {
    const client = new TwitterApi({
      appKey: `${config.twitter.appKey}`,
      appSecret: `${config.twitter.appSecret}`,
      accessToken: `${config.twitter.accessToken}`,
      accessSecret: `${config.twitter.accessSecret}`,
    });

    const formattedTweet = tweet.replace(/\*\*/g, '').replace(/\\n/g, '\n').replace(/\s+/g, ' ').trim();
    const { data: createdTweet } = await client.v2.tweet(formattedTweet);
    console.log('Tweet posted successfully:', createdTweet);

    return createdTweet;
  } catch (error) {
    if (error.code === 401) {
      console.error('Unauthorized: Check your Twitter API credentials.');
    } else {
      console.error('Error posting tweet:', error);
    }
    throw new Error('Failed to post tweet.');
  }
}

export async function createTwitterPost(input, specifications = "") {
  try {
    const tweet = await generateTweet(input, specifications);
    //console.log("Generated Tweet:", tweet);
    return tweet;
  } catch (error) {
    console.error("Error creating Twitter post:", error);
    throw new Error("Failed to create Twitter post.");
  }
}

export async function handleTwitterPost(question, specs = {}) {
  try {
    const tweet = await generateTweet(question, specs);
    console.log("Generated Tweet:", tweet);
    return tweet;
  } catch (error) {
    console.error("Error handling Twitter post:", error);
    throw new Error("Failed to handle Twitter post.");
  }
}

export async function handleQuestion(question) {
  const openai = new OpenAI();

  async function generateResponse(input, promptFunction, additionalContext = "") {
    const personality = await promptFunction();
    const prompt = `${personality}\n${additionalContext}\nUser: ${input}\nTwitterProfessional:`;
    try {
      const completion = await openai.chat.completions.create({
        model: config.openAI.model,
        messages: [
          { role: "system", content: personality },
          { role: "user", content: input },
        ],
      });
      return completion.choices[0].message.content;
    } catch (error) {
      console.error("Error connecting to OpenAI API:", error);
      throw new Error("Failed to connect to OpenAI API.");
    }
  }

  // Generate tweet response
  const tweetResponse = await generateResponse(question, TWITTER_AGENT);

  // Final combined response
  return `
    ### Tweet Response:
    ${tweetResponse}
  `;
}
