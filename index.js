const express = require('express');
const { HfInference } = require('@huggingface/inference');
const dotenv = require('dotenv');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const robot = require('robotjs');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Hugging Face Inference API
const hf = new HfInference(process.env.HUGGING_FACE_API_KEY);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Ensure 'conversations' folder exists
const conversationsDir = path.join(__dirname, 'conversations');
if (!fs.existsSync(conversationsDir)) fs.mkdirSync(conversationsDir);

// Define known application paths for different platforms
const appPaths = {
    chrome: {
        win32: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        darwin: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        linux: '/usr/bin/google-chrome'
    },
    notepad: {
        win32: 'notepad.exe'
    }
};

// Route to generate AI responses using the local model
app.post('/generate', async (req, res) => {
    const prompt = req.body.prompt || '';
    const payload = { prompt, max_tokens: 5000 };
    try {
        const response = await axios.post(process.env.LOCAL_MODEL_API_URL, payload);
        const generatedText = response.data.text || response.data.choices[0].text;
        res.json({ text: generatedText });
    } catch (error) {
        console.error('Error with local model API:', error.message);
        res.status(500).json({ error: 'Error processing the request on the server.' });
    }
});

// Hugging Face API for AI-to-AI conversation
app.post('/huggingface', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    try {
        const modelResponse = await hf.textGeneration({
            model: 'meta-llama/Llama-3.2-3B-Instruct',
            inputs: prompt,
        });

        // Ensure we get the correct response field
        const aiReply = modelResponse?.generated_text || modelResponse?.choices?.[0]?.text || 'No response generated.';
        
        // Log for debugging purposes
        console.log('AI Reply from Hugging Face:', aiReply);

        res.json({ text: aiReply });
    } catch (err) {
        console.error('Error with Hugging Face API:', err.message);
        res.status(500).json({ error: 'Error processing request with Hugging Face API.' });
    }
});

// Route for fine-tuning models
app.post('/fine-tune', (req, res) => {
    const { trainFile, testFile } = req.body;
    if (!trainFile || !testFile) {
        return res.status(400).json({ error: 'trainFile and testFile are required' });
    }

    const command = `python fine_tune.py --train_file ${trainFile} --test_file ${testFile}`;
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Fine-tuning error: ${error.message}`);
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
    if (!conversation) return res.status(400).json({ error: 'Conversation data is required' });

    const timestamp = new Date().toISOString();
    const filename = `conversation-${timestamp}.json`;
    const filepath = path.join(conversationsDir, filename);

    fs.writeFile(filepath, JSON.stringify(conversation, null, 2), (err) => {
        if (err) {
            console.error('Error saving conversation:', err.message);
            return res.status(500).json({ error: 'Error saving conversation to disk.' });
        }
        res.json({ message: 'Conversation saved successfully.', filename });
    });
});

// Route to load all saved conversations
app.get('/load-conversations', (req, res) => {
    fs.readdir(conversationsDir, (err, files) => {
        if (err) {
            console.error('Error reading conversations directory:', err.message);
            return res.status(500).json({ error: 'Error loading conversations.' });
        }

        const conversations = files.map(file => {
            const content = fs.readFileSync(path.join(conversationsDir, file), 'utf-8');
            return { filename: file, content: JSON.parse(content) };
        });

        res.json({ conversations });
    });
});

// Helper function to execute and type in Notepad or other applications
async function executeCommandWithRobot(command, textToType) {
    if (command === 'start notepad') {
        exec('notepad.exe', (error) => {
            if (error) {
                console.error(`Failed to open Notepad: ${error.message}`);
                return;
            }
            // Allow time for Notepad to open, then type text
            setTimeout(() => {
                robot.typeString(textToType);
            }, 1000);
        });
    } else {
        console.log("Command not recognized for automated typing.");
    }
}

app.post('/execute-command', async (req, res) => {
    const { command, text } = req.body;

    // Ensure a valid command and, optionally, text input
    if (!command) return res.status(400).json({ error: 'Command is required' });

    if (command.startsWith('start notepad')) {
        await executeCommandWithRobot(command, text || '');
        res.json({ output: `Executed: ${command} with text: "${text}"` });
    } else {
        res.status(400).json({ error: `Command "${command}" not recognized for automated typing.` });
    }
});

// Research and Summarize function
app.post('/research-and-summarize', async (req, res) => {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Query is required' });

    try {
        const searchResults = await internetResearch(query);
        const llmPrompt = `Based on these search results, provide a summary:\n${searchResults.map(result => `- ${result.name}: ${result.snippet}`).join('\n')}`;
        const response = await axios.post(process.env.LOCAL_MODEL_API_URL, { prompt: llmPrompt });
        const summary = response.data.text || response.data.choices[0].text;
        res.json({ summary });
    } catch (error) {
        console.error('Error in research and summarization:', error.message);
        res.status(500).json({ error: 'Error processing research and summarization request.' });
    }
});

// Initial Train AI endpoint that returns the first response only
app.post('/train', async (req, res) => {
    const prompt = req.body.prompt || '';

    try {
        // Step 1: Send the initial prompt to the model
        const initialResponse = await axios.post(process.env.LOCAL_MODEL_API_URL, {
            prompt: prompt,
            max_tokens: 5000,
        });

        const initialText = initialResponse.data.text || initialResponse.data.choices[0].text;

        // Send the initial response back to the client immediately
        res.json({ message: initialText || 'Training initiated with initial response.' });
    } catch (error) {
        console.error('Error in initial training response:', error.message);
        res.status(500).json({ error: 'Error during initial training process.' });
    }
});

// Second Train AI refinement endpoint that performs the follow-up
app.post('/train/follow-up', async (req, res) => {
    const initialText = req.body.initialText || '';

    try {
        // Step 2: Prepare follow-up debug prompt to refine the response
        const debugPrompt = `${initialText}\n\nPlease improve this response by debugging and making it more concise and informative.`;
        
        // Step 3: Send follow-up debug prompt to the model
        const debugResponse = await axios.post(process.env.LOCAL_MODEL_API_URL, {
            prompt: debugPrompt,
            max_tokens: 5000,
        });

        const refinedText = debugResponse.data.text || debugResponse.data.choices[0].text;

        // Send the refined response back to the client
        res.json({ message: refinedText || 'Training completed with improved response.' });
    } catch (error) {
        console.error('Error in follow-up training process:', error.message);
        res.status(500).json({ error: 'Error during follow-up training process.' });
    }
});


// Helper to perform internet research using Google Custom Search API
async function internetResearch(query) {
    try {
        const response = await axios.get(process.env.SEARCH_API_URL, {
            params: { key: process.env.SEARCH_API_KEY, cx: process.env.SEARCH_ENGINE_ID, q: query, num: 3 }
        });
        return response.data.items.map(item => ({ name: item.title, url: item.link, snippet: item.snippet }));
    } catch (error) {
        console.error('Error with internet research:', error.message);
        throw new Error('Failed to retrieve search results.');
    }
}

// Fetch information about any crypto token using Dexscreener API
app.get('/crypto-info', async (req, res) => {
    const tokenQuery = req.query.token;
    if (!tokenQuery) return res.status(400).json({ error: 'Token query is required' });

    try {
        const response = await axios.get(`https://api.dexscreener.com/latest/dex/search/`, { params: { q: tokenQuery } });
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching token information:', error.message);
        res.status(500).json({ error: 'Failed to retrieve token information.' });
    }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
