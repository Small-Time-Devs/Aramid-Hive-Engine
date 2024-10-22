const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 5000;

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

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
