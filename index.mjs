import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import bodyParser from 'body-parser';
import timeout from 'connect-timeout'; // Import the timeout middleware
import { fileURLToPath } from 'url';

import { startConversation } from './src/agents/orchestrator.mjs';
import { startAutoTradingChat, startAutoTradingAdvice } from './src/agents/trading/tradeOrchestrator.mjs';
import { startTwitterChat } from './src/agents/twitter/twitterOrchestrator.mjs';
import { startAramidOrchestrator } from './src/agents/aramid/aramidOrchestrator.mjs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4700;
app.set('trust proxy', 'loopback, linklocal, uniquelocal');

// Allowed origins
const allowedOrigins = [
    'http://127.0.0.1:',
    'http://localhost:',
    'http://localhost:4700',
  
    'https://smalltimedevs.com', 
    'https://aramid.smalltimedevs.com',
    'smalltimedevs.com',
];

// Blocked IPs
const blockedIPs = [''];

// CORS configuration with custom error message
const corsOptions = {
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl requests)
      if (!origin) {
        callback(null, true);
      }
      // Allow only the specified domains
      else if (allowedOrigins.includes(origin)) {
        callback(null, true); // Allow requests from your domains
      } else {
        callback(new Error('Access denied: Your domain is not allowed by CORS policy'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

// IP blocking middleware
function blockIPs(req, res, next) {
  const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.ip;

  console.log("Detected IP:", clientIP); // Log the detected IP for debugging

  // If the IP is in the blocked list, return a 403 error
  if (blockedIPs.includes(clientIP)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Your IP is blocked',
    });
  }
  next(); // Continue if IP is not blocked
}

// Apply IP blocking middleware globally
app.use(blockIPs);
// Apply CORS globally
app.use(cors(corsOptions));
// Handle OPTIONS requests for preflight
app.options('*', cors(corsOptions));

// Middleware to handle the custom CORS error
app.use((err, req, res, next) => {
  if (err.message.includes('Access denied')) {
    // Send a custom error message and status code
    return res.status(403).json({
      success: false,
      message: err.message,
    });
  }
  next(); // If no error, continue
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// Apply timeout middleware globally with a timeout of 5 minutes (300000 ms)
app.use(timeout('300000'));

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

app.post('/agent-chat', async (req, res) => {
    const { query } = req.body;

    if (!query) {
        return res.status(400).json({ error: "Query is required." });
    }

    try {
        const { agents = [], summary = "No summary available." } = await startConversation(query); // Ensure default values

        res.json({ agents, summary });
    } catch (error) {
        console.error("Agent Chat Error:", error);
        res.status(500).json({ agents: [], summary: "An error occurred while processing your request." });
    }
});

app.post('/twitter-agent-chat', async (req, res) => {
  const { chain, contractAddress } = req.body;

  if (!chain || !contractAddress) {
    return res.status(400).json({ error: "Chain info or contract address missing." });
  }

  try {
    const agentResponses = await startTwitterChat(chain, contractAddress);
    res.json({ agents: agentResponses });
  } catch (error) {
    console.error("Agent Chat Error:", error);
    res.status(500).json({ agents: [], summary: "An error occurred while processing your request." });
  }
});

app.post('/autoTrading-agent-chat', async (req, res) => {
  const { chain, contractAddress } = req.body;

  console.log("Chain:", chain);
  console.log("Contract Address:", contractAddress);

  if (!chain || !contractAddress) {
    return res.status(400).json({ error: "Chain or Contract Address Missing on input!" });
  }

  try {
    const agentResponses = await startAutoTradingChat(chain, contractAddress);
    console.log("Agent Responses:", agentResponses);
    res.json({ agents: agentResponses });
  } catch (error) {
    console.error("Agent Chat Error:", error);
    res.status(500).json({ agents: [], summary: "An error occurred while processing your request." });
  }
});

app.post('/autoTrading-agent-advice', async (req, res) => {
  const { 
    chain, 
    contractAddress,
    entryPriceSOL,
    targetPercentageGain,
    targetPercentageLoss
   } = req.body;

   try {
    const agentResponse = await startAutoTradingAdvice(chain, contractAddress, entryPriceSOL, targetPercentageGain, targetPercentageLoss);
    console.log("Agent Response:", agentResponse);
    res.json({ agents: agentResponse });
  } catch (error) {
    console.error("Agent Chat Error:", error);
    res.status(500).json({ agents: [], summary: "An error occurred while processing your request." });
  }
});

app.post('/aramid-chat', async (req, res) => {
  const { userInput } = req.body;

  console.log("User Message:", userInput);

  if (!userInput) {
    return res.status(400).json({ error: "No user input!" });
  }

  try {
    const agentResponse = await startAramidOrchestrator(userInput);
    res.json({ agents: agentResponse });
  } catch (error) {
    console.error("Agent Chat Error:", error);
    res.status(500).json({ agents: [], summary: "An error occurred while processing your request." });
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