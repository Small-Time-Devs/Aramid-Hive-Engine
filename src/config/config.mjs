import dotenv from 'dotenv';

dotenv.config();

export const config = {

    llmSettings: {

        openAI: {
            apiKey: process.env.OPENAI_API_KEY, // Set your OpenAI API key here
            model: 'gpt-4o', // Set the OpenAI model to use
            store: true, // Set to true to store conversations in the 'conversations' folder
        },

        localLLM: {
            useLocalLLM: false, // Set to false to use OpenAI API
            modelPath: process.env.LOCAL_MODEL_API_URL, // Set the file path to your local LLM model
            serverUrl: process.env.LOCAL_MODEL_API_URL, // Set the server URL for LM Studio
        },
        
    },

    // Add API sections and their respective APIs
    apis:{
        crypto: {
            coinGecko: 'https://api.coingecko.com/api/v3/simple/price?vs_currencies=usd&ids=', // Update to accept a variable
            dexscreenerTokneProfilesUrl: 'https://api.dexscreener.com/token-profiles/latest/v1',
            dexscreenerTopBoostedUrl: 'https://api.dexscreener.com/token-boosts/top/v1',
            raydiumTokenNameUrl: 'https://api-v3.raydium.io/mint/ids?mints=',
            raydiumTokenPriceUrl: 'https://api-v3.raydium.io/mint/price?mints=',
        },
        weather: {
            openWeatherMap: 'https://api.openweathermap.org/data/2.5/weather?q=London&appid=your_api_key',
        },
    },

    twitter: {
        keys: {
            appKey: process.env.TWITTER_API_KEY,
            appSecret: process.env.TWITTER_API_SECRET,
            accessToken: process.env.TWITTER_ACCESS_TOKEN,
            accessSecret: process.env.TWITTER_ACCESS_SECRET,
            twitterUserID: process.env.TWITTER_USER_ID,
        },

        settings: {
            xAutoPoster: true, // Set to true to enable auto-posting to Twitter/X
            devMode: false, // Set to true to enable development mode (generate tweets but do not post)
            xAutoResponder: false, // Set to true to enable auto-responding to Twitter posts
            postsPerDay: 100, // Updated to reflect the user limit of 100 posts per day
            postsPerMonth: 3000, // Updated to reflect the new monthly limit
            timeToReadPostsOnPage: 2, // Set the time to read posts on the page
        },
    },
};
