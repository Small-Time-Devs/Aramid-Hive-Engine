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
            rpcNode: process.env.HELIUS_RPC_NODE,
            network: 'mainnet-beta',
            tokenMintAddress: 'So11111111111111111111111111111111111111112'
        }
    },

    // Add API sections and their respective APIs
    apis:{
        crypto: {
            coinGecko: 'https://api.coingecko.com/api/v3/simple/price?vs_currencies=usd&ids=',
            dexscreenerTokneProfilesUrl: 'https://api.dexscreener.com/token-profiles/latest/v1',
            dexscreenerLatestBoostedUrl: 'https://api.dexscreener.com/token-boosts/latest/v1',
            dexscreenerMostActiveBoostsUrl: 'https://api.dexscreener.com/token-boosts/top/v1',
            jupTokenLookup: 'https://api.jup.ag/tokens/v1/token/',
            raydiumMintIds: 'https://api-v3.raydium.io/mint/ids?mints=',
            raydiumMintPrice: 'https://api-v3.raydium.io/mint/price?mints=',
            meteoraPairs: 'https://dlmm-api.meteora.ag/pair/all_with_pagination',
            meteoraPairsLimit: 15000,
            meteoraPairsOrderBy: 'desc',
            meteoraPairsHideLowTvl: 30000,
        },
        weather: {
            openWeatherMap: 'https://api.openweathermap.org/data/2.5/weather?q=London&appid=your_api_key',
        },
    },
};
