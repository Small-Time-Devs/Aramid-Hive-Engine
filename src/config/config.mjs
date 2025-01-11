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
    xAutoPoster: true, // Set to true to enable auto-posting to Twitter/X
    postsPerDay: 50, // Set the number of posts per day (max 50 to stay within 1500 posts/month limit)
    // Note: To stay within the free limit of 1500 posts per month, set postsPerDay <= 50
    
    autoPostSpecifications: {
        platformName: "Small Time Devs",
        keyFeature: "AI Bots Trading, Telegram Bot for Solana And XRPL, Custom Raydium API, Solana Volume Bot Custom XRP Trading API",
        targetAudience: "Crypto traders and enthusiasts",
        // Add more specifications as needed
    }
};
