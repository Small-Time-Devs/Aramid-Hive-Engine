import dotenv from 'dotenv';

dotenv.config();

export const config = {
    useLocalLLM: false, // Set to false to use OpenAI API
    openAI: {
        apiKey: process.env.OPENAI_API_KEY, // Set your OpenAI API key here
        model: 'gpt-4o', // Set the OpenAI model to use
        store: true, // Set to true to store conversations in the 'conversations' folder
    },
    localLLM: {
        modelPath: process.env.LOCAL_MODEL_API_URL, // Set the file path to your local LLM model
        serverUrl: process.env.LOCAL_MODEL_API_URL, // Set the server URL for LM Studio
    },

    siteUrl: process.env.SITE_URL || 'http://localhost:5051', // Add site URL configuration
    runFrontend: 'false', // This will run the frontend by default if set to true and only run the backend if set to false
    xAutoPoster: false, // Set to true to enable auto-posting to Twitter/X
    postsPerDay: 50, // Set the number of posts per day (max 50 to stay within 1500 posts/month limit)
    postsPerMonth: 1500, // Set the maximum number of posts per month
    // Note: To stay within the free limit of 1500 posts per month, set postsPerDay <= 50
    
    /*
    autoPostSpecifications: {
        platformName: "Aramid AI",
        keyFeature: "AI Bots Trading, Telegram Bot for Solana And XRPL, Custom Raydium API, Solana Volume Bot Custom XRP Trading API",
        urls: ["https://aramid.smalltimedevs/Chat", "https://aramid.app"],
        targetAudience: "Crypto traders and enthusiasts",
    },
    */

    autoPostSpecifications: {
        platformName: "Aramid Hive Engine",
        keyFeatures: [
            "AI-powered trading bots for Solana and XRPL",
            "Telegram bot integration for real-time updates",
            "Custom Raydium API for enhanced trading capabilities",
            "Solana volume tracking and analytics",
            "Custom XRP trading API for optimized performance",
            "Advanced sentiment analysis for market predictions",
            "Automated portfolio management with customizable strategies",
            "Integration with decentralized exchanges for seamless trading",
            "Real-time notifications on market trends and project updates",
            "Support for developing and deploying custom AI models within the Aramid Hive Engine framework"
        ],
        urls: [
            "https://aramid.smalltimedevs/Chat",
            "https://aramid.app/"
        ],
        targetAudience: "Cryptocurrency traders, blockchain developers, and AI enthusiasts"
    },

    // Add API sections and their respective APIs
    apis:
        {
            crypto: {
                coinGecko: 'https://api.coingecko.com/api/v3/simple/price?vs_currencies=usd&ids=', // Update to accept a variable
                // Add more crypto-related APIs as needed
            },
            weather: {
                openWeatherMap: 'https://api.openweathermap.org/data/2.5/weather?q=London&appid=your_api_key',
                // Add more weather-related APIs as needed
            },
            // Add more API sections as needed
        },
    twitter: {
        callbackUrl: process.env.TWITTER_CALLBACK_URL || 'http://localhost:4700/twitter/callback', // Add callback URL configuration
        clientId: process.env.TWITTER_CLIENT_ID, // Add client ID
        clientSecret: process.env.TWITTER_CLIENT_SECRET, // Add client secret
    },
};
