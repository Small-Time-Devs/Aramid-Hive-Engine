import express from 'express';
import { HfInference } from '@huggingface/inference';
import dotenv from 'dotenv';
import axios from 'axios';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { selectPrompt } from './src/agents/agentSelection.mjs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Derive __dirname from import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Helper function to format the response with the agent's role as a header
function formatAgentResponse(agentRole, responseText) {
    return `### ${agentRole}\n\n${responseText}`;
}

// Route to handle agent-based chat
app.post('/agent-chat', async (req, res) => {
    const { query, sessionId } = req.body;
    if (!query || !sessionId) return res.status(400).json({ error: 'Query and sessionId are required' });

    const { prompt, role } = await selectPrompt(query);
    const payload = { prompt: `${prompt}`, max_tokens: 5000 };

    try {
        const response = await axios.post(process.env.LOCAL_MODEL_API_URL, payload);
        const generatedText = response.data.text || response.data.choices[0].text;

        // Format the response with the agent's role as a header
        const formattedText = formatAgentResponse(role, generatedText);

        // Log user interaction
        console.log(`Session ${sessionId}: ${query} -> ${formattedText}`);

        res.json({ text: formattedText });
    } catch (error) {
        console.error('Error with local model API:', error.message);
        res.status(500).json({ error: 'Error processing the request on the server.' });
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

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
