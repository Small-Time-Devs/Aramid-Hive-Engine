const express = require('express');
const { HfInference } = require('@huggingface/inference'); // Hugging Face Inference API
const dotenv = require('dotenv');
const axios = require('axios');
const path = require('path');

dotenv.config();

const app = express();
const PORT = 5000;

// Hugging Face API key (you need to sign up for one on Hugging Face and replace 'your-huggingface-api-key' with your actual API key)
const hf = new HfInference(process.env.HUGGING_FACE_API_KEY);

// Middleware to parse JSON requests
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

// Update your /generate route to add error logging
app.post('/generate', async (req, res) => {
    const prompt = req.body.prompt || '';

    // Prepare the payload for your AI model
    const payload = {
        prompt: prompt,
        max_tokens: 5000  // Adjust this as needed
    };

    try {
        // Send the request to the AI model's API
        const response = await axios.post('http://localhost:1234/v1/completions', payload);
        res.json(response.data);
    } catch (error) {
        console.error('Error while communicating with AI model:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Status code:', error.response.status);
        }
        res.status(500).json({ error: 'Error processing the request on the server.' });
    }
});

// New endpoint for AI-to-AI conversation
app.post('/huggingface', async (req, res) => {
    const { prompt } = req.body;

    try {
        // Use Hugging Face Inference API to get model response
        const modelResponse = await hf.textGeneration({
            model: 'meta-llama/Llama-3.2-3B-Instruct', // You can use any model available on Hugging Face (e.g., 'gpt2', 'gpt-neo', etc.)
            inputs: prompt,
        });

        // Extract generated text from the API response
        const aiReply = modelResponse.generated_text;

        // Send the AI response back to the client
        res.json({ aiReply });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error processing your request.');
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});