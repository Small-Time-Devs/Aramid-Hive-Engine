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

    twitter: {
        keys: {
            appKey: process.env.TWITTER_API_KEY,
            appSecret: process.env.TWITTER_API_SECRET,
            accessToken: process.env.TWITTER_ACCESS_TOKEN,
            accessSecret: process.env.TWITTER_ACCESS_SECRET,
            twitterUserID: process.env.TWITTER_USER_ID,
        },

        settings: {
            xAutoPoster: false, // Set to true to enable auto-posting to Twitter/X
            devMode: false, // Set to true to enable development mode (generate tweets but do not post)
            xAutoResponder: false, // Set to true to enable auto-responding to Twitter posts
            postsPerDay: 100, // Updated to reflect the user limit of 100 posts per day
            postsPerMonth: 3000, // Updated to reflect the new monthly limit
            timeToReadPostsOnPage: 2, // Set the time to read posts on the page
        },

        influencers: {
            twitterHandles: [
                'CryptoAudiKing', 
                'MikeDeanLive', 
                'xenpub',
                'KyeGomezB',
                'REALISWORLDS',
                'DEGENLABS_CO',
            ],
        },

        solanaProjectsToReveiw: {
            percentageToTalkAbout: {
                // Needs to be a 25% chance to talk about the below project
                chance: 25,
            },

            contractAddresses: {
                swarms: '74SBV4zDXxTRgv1pEMoECskKBkZHc2yGPnc7GYVepump',
                mcs: 'ALHFgnXSenUv17GMdf3dL9gtFW2KKQTz9avpM2Wypump',
                tai: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
                onda: 'CJRXkuaDcnXpPB7yEYw5uRp4F9j57DdzmmJyp37upump',
                trump: '6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN',
                vine: '6AJcP7wuLwmRYLBNbi825wgguaPsWzPBEHcHndpRpump',
                m3m3: 'M3M3pSFptfpZYnWNUgAbyWzKKgPo5d1eWmX6tbiSF2K',
                qude: '3MyaQBG7y3SHLQZa282Jh2xtB2TZKHGzNp1CuZ4Cpump',
                pippin: 'Dfh5DzRgSvvCFDoYc2ciTkMrbDfRKybA4SoFbPmApump',
                anon: '9McvH6w97oewLmPxqQEoHUAv3u5iYMyQ9AeZZhguYf1T',
                create: '92crE7qiX5T7VtiXhCeagfo1E81UtyguiXM7qCi7pump',
                prism: '79vpEaaXrHnHHEtU9kYYQtwLTZy1SXpxXHi7LZ9Ppump',
                spores: 'H1koD28XAHg2vuGp7XggehBCR4zP6r6k6EQ3MR6j3kU2',
                arc: '61V8vBaqAGMpgDQi4JcAwo1dmBGHsyhzodcPqnEVpump',
                pengu: '2zMMhcVQEXDtdE6vsFS7S7D5oUodfJHE8vd1gnBouauv',
                bonk: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
            },  
        },

    },
};
