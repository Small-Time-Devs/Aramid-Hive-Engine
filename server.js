const express = require('express');
const { HfInference } = require('@huggingface/inference'); // Hugging Face Inference API
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const port = 3100;

// Hugging Face API key (you need to sign up for one on Hugging Face and replace 'your-huggingface-api-key' with your actual API key)
const hf = new HfInference(process.env.API_KEY);

// Set the view engine to EJS for templating
app.set('view engine', 'ejs');

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));

// Serve static files from public folder (for CSS, images, etc.)
app.use(express.static('public'));

// Home Route - Displays Web UI
app.get('/', (req, res) => {
  // Render the initial page with empty userQuery and aiReply
  res.render('index', { userQuery: '', aiReply: '' });
});

// Handle Form Submission (AI Interaction)
app.post('/ask', async (req, res) => {
  const userQuery = req.body.query;

  try {
    // Use Hugging Face Inference API to get model response
    const modelResponse = await hf.textGeneration({
      model: 'meta-llama/Llama-3.2-3B-Instruct', // You can use any model available on Hugging Face (e.g., 'gpt2', 'gpt-neo', etc.)
      inputs: userQuery,
    });

    // Extract generated text from the API response
    const aiReply = modelResponse.generated_text;

    // Render the page again with user query and AI response
    res.render('index', { userQuery, aiReply });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error processing your request.');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`AI App listening at http://localhost:${port}`);
});
