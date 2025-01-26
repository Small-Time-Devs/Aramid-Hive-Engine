# Small Time Devs - AI

This project is a web-based AI interaction platform that allows users to interact with an AI model. The platform supports generating text responses, training the AI model, and conducting AI-to-AI conversations.

## Features

- **Text Generation**: Generate text responses based on user prompts.
- **Agent Chat**: Spawn AI Agents that are specialized to procure the proper answer to your question or tasks. Each agent's personality is dynamically generated for every response, eliminating the need for hardcoding.

## Prerequisites

- **Node.js** and **npm** (Node Package Manager)
- **Python** (for fine-tuning the AI model)
- **LM Studio**: A local model management software for running AI models. [Download and install LM Studio here.](https://lmstudio.ai/)

## Installation

1. **Clone the Repository**:
    ```sh
    git clone https://github.com/MotoAcidic/Aramid-Hive-Engine.git
    cd AI-Chat
    ```

2. **Install Dependencies**:
    ```sh
    npm install
    ```

3. **Set Up Environment Variables**:
    Create a `.env` file in the root directory. Populate it with the following values:
    ```env    
    LOCAL_MODEL_API_URL='http://localhost:1234/v1/completions'
    SEARCH_API_KEY='your-search-api-key'
    SEARCH_ENGINE_ID='your-search-engine-id'
    SEARCH_API_URL='https://www.googleapis.com/customsearch/v1'
    OPENAI_API_KEY='your-openai-api-key'
    SITE_URL='https://your-site-url'
    ```

    - **LOCAL_MODEL_API_URL**: The local model endpoint URL from LM Studio for generating responses.

4. **Install and Configure LM Studio**:
    - Download and install LM Studio from [lmstudio.ai](https://lmstudio.ai/).
    - Import or set up your local model in LM Studio.
    - Start LM Studio and note the model’s API endpoint (e.g., `http://localhost:8000/generate`), which you will set as the `LOCAL_MODEL_API_URL` in `.env`.

## Usage

1. **Start the Server**:
    ```sh
    npm start
    ```

2. **Open the Application**:
    Open your web browser and navigate to `http://localhost:5000`.

3. **Interact with the AI**:
    - **Generate Text**: Enter a prompt in the text area and click "Generate" to get a response from the AI.
    - **Train the AI**: Click "Train" to train the AI model with the provided prompt and predefined follow-up questions.
    - **Agent Chat**: Spawn AI Agents that are specialized to procure the proper answer to your question or tasks. Each agent's personality is dynamically generated for every response, ensuring unique interactions every time.

## Customization

### Config File

The `config.mjs` file located in `src/config/` allows you to customize various settings:

```javascript
// filepath: /home/tfinch/Aramid-Hive-Engine/src/config/config.mjs
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

    apis: {
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
                chance: 25, // Needs to be a 25% chance to talk about the below project
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
```

### Configuration Settings

#### LLM Settings

- **openAI**:
  - `apiKey`: Your OpenAI API key.
  - `model`: The OpenAI model to use (e.g., `gpt-4o`).
  - `store`: Set to `true` to store conversations in the 'conversations' folder.

- **localLLM**:
  - `useLocalLLM`: Set to `false` to use OpenAI API.
  - `modelPath`: The file path to your local LLM model.
  - `serverUrl`: The server URL for LM Studio.

#### Solana Constants

- **mainnet**:
  - `name`: The name of the Solana network.
  - `rpcUrl`: The RPC URL for the Solana mainnet.
  - `network`: The network name (e.g., `mainnet-beta`).
  - `tokenMintAddress`: The token mint address for Solana.

#### APIs

- **crypto**:
  - `coinGecko`: The CoinGecko API URL for fetching crypto prices.
  - `dexscreenerTokneProfilesUrl`: The Dexscreener API URL for fetching the latest token profiles.
  - `dexscreenerTopBoostedUrl`: The Dexscreener API URL for fetching the top boosted tokens.
  - `raydiumTokenNameUrl`: The Raydium API URL for fetching token names.
  - `raydiumTokenPriceUrl`: The Raydium API URL for fetching token prices.

- **weather**:
  - `openWeatherMap`: The OpenWeatherMap API URL for fetching weather data.

#### Twitter

- **keys**:
  - `appKey`: Your Twitter API key.
  - `appSecret`: Your Twitter API secret.
  - `accessToken`: Your Twitter access token.
  - `accessSecret`: Your Twitter access secret.
  - `twitterUserID`: Your Twitter user ID.

- **settings**:
  - `xAutoPoster`: Set to `true` to enable auto-posting to Twitter/X.
  - `devMode`: Set to `true` to enable development mode (generate tweets but do not post).
  - `xAutoResponder`: Set to `true` to enable auto-responding to Twitter posts.
  - `postsPerDay`: The limit of posts per day (default is 100).
  - `postsPerMonth`: The limit of posts per month (default is 3000).
  - `timeToReadPostsOnPage`: The time to read posts on the page.

- **influencers**:
  - `twitterHandles`: A list of Twitter handles of influencers to tag in posts.

- **solanaProjectsToReveiw**:
  - `percentageToTalkAbout`: The percentage chance to talk about the specified projects.
  - `contractAddresses`: A list of contract addresses for Solana projects to review.

## File Structure

- `index.js`: The Node.js server file.
- `.env`: The environment variables file.
- `src/`: Contains the source code for the application.
  - `agents/`: Contains the AI agents responsible for different tasks.
    - `twitter/`: Contains the Twitter-related agents.
      - `twitterProfessional.mjs`: Handles generating and posting tweets.
    - `dynamic/`: Contains dynamic agent configurations.
      - `dynamic.mjs`: Generates dynamic agent configurations.
  - `config/`: Contains configuration files.
    - `config.mjs`: Main configuration file for the application.
  - `utils/`: Contains utility functions.
    - `apiUtils.mjs`: Utility functions for interacting with external APIs.
    - `helpers.mjs`: Helper functions for rate limiting and other tasks.

### Debugging Helpers

- **Grid Helper**: A grid to visualize the scene.
- **Axes Helper**: Axes to visualize the orientation of the scene.
  
### Links

- **LM Studio**: [https://lmstudio.ai](https://lmstudio.ai).
- **Small Time Devs Website**: [https://smalltimedevs.com](https://smalltimedevs.com).
- **Web Front End**: [https://github.com/MotoAcidic/Aramid-Hive-UI](https://github.com/MotoAcidic/Aramid-Hive-UI).
- **Twitter Page**: [https://x.com/AramidAI](https://x.com/AramidAI)

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
