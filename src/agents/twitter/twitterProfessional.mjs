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
import { fetchLatestTokenProfiles, fetchLatestBoostedTokens, fetchTokenName, fetchTokenPrice } from "../../utils/apiUtils.mjs";

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

export async function MEME_GENERATOR_AGENT() {
  return `
    ### Meme Generator Prompt

    You are a creative and humorous meme generator. Your job is to create highly engaging and funny memes that capture attention and entertain the audience. 
    Each meme must:
    - Include a humorous caption that relates to current trends or popular culture.
    - Use a popular meme format or create a new one.
    - Be visually appealing and easy to understand.
    - Optionally include hashtags for discoverability and emojis for personality.

    Input: Topic or theme.
    Output: A meme caption and description of the meme format. Keep the caption concise and under 280 characters.
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
    - Make fun of the token and the project behind it.

    Token Description: "{tokenDescription}"

    Write a tweet based on the provided token description. Keep the tweet concise and under 280 characters. Make fun of how stupid the token is. Keep the tone snarky, funny, and engaging.
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

    Write a tweet based on the provided token description. Keep the tweet concise and under 280 characters. Make fun of how much the project paid to be boosted and how stupid the token is. Keep the tone snarky, funny, and engaging.
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
    - Keep the tweet concise and under 280 characters.
    - tweet MUST be under 280 characters in length for the twitter api to handle it properly.

    Key Features:
    - Maximize engagement by using urgency, excitement, or curiosity in the opening.
    - Integrate the product’s **unique features** seamlessly into the tweet flow.
    - Ensure URLs and hashtags are strategically placed for visibility.

    Input: Product details and specifications.
    Output: A ready-to-post tweet with energy and impact, formatted to be passed through the Twitter API.
  `;
}

export async function generateSnarkyTweet() {
  const openai = new OpenAI();
  const tokenProfiles = await fetchLatestBoostedTokens();
  const randomToken = tokenProfiles[Math.floor(Math.random() * tokenProfiles.length)];
  const tokenDescription = randomToken.description || "No description available";
  const tokenAddress = randomToken.tokenAddress;
  const tokenName = await fetchTokenName(tokenAddress) || randomToken.name || randomToken.symbol || "Unnamed Token"; // Ensure token name is correctly extracted

  console.log("Token Name:", tokenName); // Debugging log

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
    if (tweet.length > 280) {
      tweet = tweet.substring(0, 277) + '...'; // Ensure tweet is within 280 characters
    }
    const amountSpent = randomToken.amount || randomToken.totalAmount;
    const dollarsSpent = (amountSpent / 10) * 99;
    const comment = await generateComment(amountSpent, dollarsSpent, randomToken.tokenAddress, tokenName, tokenDescription);
    return { tweet, comment, tokenName, tokenDescription, amountSpent, dollarsSpent, tokenAddress: randomToken.tokenAddress };
  } catch (error) {
    console.error("Error generating snarky tweet:", error);
    throw new Error("Failed to generate a snarky tweet.");
  }
}

export async function generateBoostedTweet() {
  const openai = new OpenAI();
  const boostedTokens = await fetchLatestBoostedTokens();
  const randomToken = boostedTokens[Math.floor(Math.random() * boostedTokens.length)];
  const tokenDescription = randomToken.description || "No description available";
  const tokenAddress = randomToken.tokenAddress;
  const tokenName = await fetchTokenName(tokenAddress) || randomToken.name || randomToken.symbol || "Unnamed Token"; // Ensure token name is correctly extracted

  console.log("Token Name:", tokenName); // Debugging log

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
    if (tweet.length > 280) {
      tweet = tweet.substring(0, 277) + '...'; // Ensure tweet is within 280 characters
    }
    const amountSpent = randomToken.amount || randomToken.totalAmount;
    const dollarsSpent = (amountSpent / 10) * 99;
    const twitterUrl = Array.isArray(randomToken.links) ? randomToken.links.find(link => link.type === 'twitter')?.url : '';
    const twitterHandle = twitterUrl ? `@${twitterUrl.split('/').pop()}` : '';
    const comment = await generateComment(amountSpent, dollarsSpent, tokenAddress, tokenName, tokenDescription, twitterHandle);
    return { tweet, comment, tokenName, tokenDescription, amountSpent, dollarsSpent, tokenAddress, twitterHandle };
  } catch (error) {
    console.error("Error generating boosted tweet:", error);
    throw new Error("Failed to generate a boosted tweet.");
  }
}

export async function generateComment(amountSpent, dollarsSpent, tokenAddress, tokenName, tokenDescription, twitterHandle = '') {
  console.log("Generating comment for token:", tokenName); // Debugging log

  const openai = new OpenAI();
  const tokenPrice = await fetchTokenPrice(tokenAddress);
  const prompt = `
    ### Comment Generator Prompt

    You are a snarky, funny Twitter bot. Your job is to create a highly engaging and humorous comment based on the amount spent on boosts. 
    Each comment must:
    - Include a snarky, funny comment about how much the project paid to be boosted.
    - Mention the token name, address, and current price.
    - Use a humorous tone that captures attention and entertains the audience.
    - Include a disclaimer that clearly states not to buy the token.
    - Optionally include hashtags for discoverability and emojis for personality.
    - Optionally tag the Twitter profile if provided.

    Amount Spent: ${amountSpent}
    Dollars Spent: $${dollarsSpent.toFixed(2)}
    Token Name: ${tokenName}
    Token Address: ${tokenAddress}
    Token Description: ${tokenDescription}
    Token Price: $${tokenPrice}
    Twitter Handle: ${twitterHandle}

    Write a comment based on the provided information. Keep the comment concise and under 280 characters.
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: config.openAI.model,
      messages: [
        { role: "system", content: prompt },
        {
          role: "user",
          content: `
            ### Amount Spent
            ${amountSpent}

            ### Dollars Spent
            $${dollarsSpent.toFixed(2)}

            ### Token Name
            ${tokenName}

            ### Token Address
            ${tokenAddress}

            ### Token Description
            ${tokenDescription}

            ### Token Price
            $${tokenPrice}

            ### Twitter Handle
            ${twitterHandle}
          `,
        },
      ],
    });
    let comment = completion.choices[0].message.content.trim();
    comment = comment.replace(/\*\*/g, ''); // Remove Markdown bold formatting
    comment = comment.replace(/\n/g, ' \\n '); // Replace newlines with escaped newlines
    comment = comment.replace(/\s+/g, ' ').trim(); // Remove extra spaces
    if (comment.length > 280) {
      comment = comment.substring(0, 277) + '...'; // Ensure comment is within 280 characters
    }
    return comment;
  } catch (error) {
    console.error("Error generating comment:", error);
    throw new Error("Failed to generate a comment.");
  }
}

export async function generateAutoPostTweet() {
  try {
    const randomChoice = Math.floor(Math.random() * 2);
    let tweetData;

    if (randomChoice === 0) {
      tweetData = await generateSnarkyTweet();
    } else {
      tweetData = await generateBoostedTweet();
    }

    console.log("Generated Tweet:", tweetData.tweet);
    return tweetData;
  } catch (error) {
    console.error("Error generating auto-post tweet:", error);
    throw new Error("Failed to generate an auto-post tweet.");
  }
}

export async function postToTwitter(tweetData) {
  try {
    const client = new TwitterApi({
      appKey: `${config.twitter.appKey}`,
      appSecret: `${config.twitter.appSecret}`,
      accessToken: `${config.twitter.accessToken}`,
      accessSecret: `${config.twitter.accessSecret}`,
    });

    const formattedTweet = tweetData.tweet.replace(/\*\*/g, '').replace(/\\n/g, '\n').replace(/\s+/g, ' ').trim();
    const { data: createdTweet } = await client.v2.tweet(formattedTweet);
    console.log('Tweet posted successfully:', createdTweet);

    if (tweetData.comment) {
      const formattedComment = tweetData.comment.replace(/\*\*/g, '').replace(/\\n/g, '\n').replace(/\s+/g, ' ').trim();
      await client.v2.reply(formattedComment, createdTweet.id);
      console.log('Comment posted successfully:', formattedComment);
    }

    return createdTweet;
  } catch (error) {
    if (error.code === 401) {
      console.error('Unauthorized: Check your Twitter API credentials.');
    } else if (error.code === 403) {
      console.error('Forbidden: You do not have permission to perform this action. Check your Twitter API permissions.');
    } else {
      console.error('Error posting tweet:', error);
    }
    throw new Error('Failed to post tweet.');
  }
}

export async function handleTwitterPost(question, specs = {}) {
  try {
    const tweet = await generateSnarkyTweet(question, specs);
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

export async function scanAndRespondToPosts() {
  const client = new TwitterApi({
    appKey: `${config.twitter.appKey}`,
    appSecret: `${config.twitter.appSecret}`,
    accessToken: `${config.twitter.accessToken}`,
    accessSecret: `${config.twitter.accessSecret}`,
  });

  try {
    const { data } = await client.v2.userTimeline(config.twitter.twitterUserID, { max_results: 5 }); // Set max_results to a valid value
    const tweets = data.data;
    for (const tweet of tweets) {
      if (tweet.in_reply_to_user_id === null) {
        const response = await generateResponseToTweet(tweet.text);
        await client.v2.reply(response, tweet.id);
        console.log('Replied to tweet:', tweet.id);
      }
    }
  } catch (error) {
    console.error('Error scanning and responding to posts:', error);
  }
}

async function generateResponseToTweet(tweetText) {
  const openai = new OpenAI();
  const prompt = `
    ### Twitter Response Generator

    You are a highly engaging and professional Twitter bot. Your job is to create a thoughtful and engaging response to the following tweet:
    
    Tweet: "${tweetText}"

    Response:
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: config.openAI.model,
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: tweetText }
      ],
    });
    let response = completion.choices[0].message.content.trim();
    response = response.replace(/\*\*/g, ''); // Remove Markdown bold formatting
    response = response.replace(/\n/g, ' \\n '); // Replace newlines with escaped newlines
    response = response.replace(/\s+/g, ' ').trim(); // Remove extra spaces
    if (response.length > 280) {
      response = response.substring(0, 277) + '...'; // Ensure response is within 280 characters
    }
    return response;
  } catch (error) {
    console.error("Error generating response to tweet:", error);
    throw new Error("Failed to generate a response to the tweet.");
  }
}
