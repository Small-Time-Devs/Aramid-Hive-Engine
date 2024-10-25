const express = require('express');
const { HfInference } = require('@huggingface/inference');
const dotenv = require('dotenv');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Hugging Face Inference API
const hf = new HfInference(process.env.HUGGING_FACE_API_KEY);

// Middleware to parse JSON requests
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Ensure the 'conversations' folder exists
const conversationsDir = path.join(__dirname, 'conversations');
if (!fs.existsSync(conversationsDir)) {
    fs.mkdirSync(conversationsDir);
}

// Route to generate AI responses using the local model
app.post('/generate', async (req, res) => {
    console.log('Received request at /generate');
    const prompt = req.body.prompt || '';

    const payload = {
        prompt: prompt,
        max_tokens: 5000, // Adjust token limit as necessary
    };

    try {
        // Send the prompt to the LLM via your model's API
        const response = await axios.post(process.env.LOCAL_MODEL_API_URL, payload); 

        // Assuming the LLM response contains a 'text' field
        const generatedText = response.data.text || response.data.choices[0].text; // Adjust based on LLM response format

        // Send the extracted text back to the frontend
        res.json({ text: generatedText });
    } catch (error) {
        console.error('Error while communicating with AI model:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Status code:', error.response.status);
        }
        res.status(500).json({ error: 'Error processing the request on the server.' });
    }
});


// Hugging Face API for AI-to-AI conversation
app.post('/huggingface', async (req, res) => {
    const { prompt } = req.body;

    try {
        const modelResponse = await hf.textGeneration({
            model: 'meta-llama/Llama-3.2-3B-Instruct', // Adjust model as necessary
            inputs: prompt,
        });

        const aiReply = modelResponse.generated_text;
        res.json({ text: aiReply });  // Ensure consistent response format with "text"
    } catch (err) {
        console.error('Error with Hugging Face Inference API:', err.message);
        res.status(500).json({ error: 'Error processing your request with Hugging Face API.' });
    }
});

// Route for fine-tuning models
app.post('/fine-tune', (req, res) => {
    const { trainFile, testFile } = req.body;
    const command = `python fine_tune.py --train_file ${trainFile} --test_file ${testFile}`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error during fine-tuning: ${error.message}`);
            return res.status(500).json({ error: 'Error during fine-tuning process.' });
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
        }
        console.log(`stdout: ${stdout}`);
        res.json({ message: 'Fine-tuning started successfully.', output: stdout });
    });
});

// Route to save conversation logs
app.post('/save-conversation', (req, res) => {
    const { conversation } = req.body;
    const timestamp = new Date().toISOString();
    const filename = `conversation-${timestamp}.json`;
    const filepath = path.join(__dirname, 'conversations', filename);

    fs.writeFile(filepath, JSON.stringify(conversation, null, 2), (err) => {
        if (err) {
            console.error('Error saving conversation:', err.message);
            return res.status(500).json({ error: 'Error saving conversation to disk.' });
        }
        res.json({ message: 'Conversation saved successfully.', filename });
    });
});

// New route to load all saved conversations
app.get('/load-conversations', (req, res) => {
    fs.readdir(conversationsDir, (err, files) => {
        if (err) {
            console.error('Error reading conversations directory:', err.message);
            return res.status(500).json({ error: 'Error loading conversations.' });
        }

        // Map file names to their content
        const conversations = files.map(file => {
            const content = fs.readFileSync(path.join(conversationsDir, file), 'utf-8');
            return { filename: file, content: JSON.parse(content) };
        });

        res.json({ conversations });
    });
});

// Route to execute system commands
app.post('/execute-command', (req, res) => {
    const { command } = req.body;

    // Example of command whitelisting for security
    /*
    const allowedCommands = ['ls', 'pwd', 'uptime']; // Define allowed commands
    if (!allowedCommands.includes(command.split(' ')[0])) {
        return res.status(403).send('Command not allowed.');
    }
    */
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing command: ${error.message}`);
            return res.status(500).json({ error: `Error executing command: ${error.message}` });
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
        }
        console.log(`stdout: ${stdout}`);
        res.json({ message: 'Command executed successfully.', output: stdout });
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
