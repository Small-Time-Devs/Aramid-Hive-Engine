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
    }
};
