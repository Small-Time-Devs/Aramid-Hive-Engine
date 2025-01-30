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

    solanaConstants: {
        mainnet: {
            name: 'solana',
            rpcUrl: 'https://api.mainnet-beta.solana.com',
            network: 'mainnet-beta',
            tokenMintAddress: 'So11111111111111111111111111111111111111112'
        }
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
};
