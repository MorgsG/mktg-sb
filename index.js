require('dotenv').config();

const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors'); // Allows cross-origin requests
const fs = require('fs');
const path = require('path');
const { jsPDF } = require('jspdf'); // PDF generation library

const app = express();

// CORS options
const corsOptions = {
  origin: 'https://www.socialbureau.co', // Ensure the domain is correct
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200 // For legacy browsers like IE11
};

// Apply CORS globally
app.use(cors(corsOptions));

// JSON body parsing middleware
app.use(express.json());

// Handle preflight requests (OPTIONS) globally
app.options('*', cors(corsOptions));

// Ensure API key is set for GPT
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error('API key is missing!');
  process.exit(1); // Exit if no API key is found
}

// GPT Chat Completion Route
app.post('/chat', async (req, res) => {
  const userMessage = req.body.message;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4', // or another GPT model
      messages: [{ role: 'user', content: userMessage }],
      max_tokens: 150,
      temperature: 0.7
    })
  });

  const data = await response.json();
  res.json(data.choices[0].message.content);
});

// In-memory storage for persona details
let personaResponses = {};

// Handle preflight requests for persona generation
app.options('/generate-persona', cors(corsOptions), (req, res) => {
  res.status(204).end();
});

// POST route for persona detail extraction
app.post('/generate-persona', (req, res) => {
  const personaDataPath = path.join(__dirname, 'json_files', 'Persona_Detail_Extraction_Prompt.json');
  
  fs.readFile(personaDataPath, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error reading persona file');
    } 
    
    const personaPrompts = JSON.parse(data); // Parse persona prompts JSON
    personaResponses = req.body; // Save user's persona responses in memory
    res.json({ message: 'Persona details saved successfully!', personaPrompts });
  });
});

// Route to generate PDF of persona details
app.get('/generate-pdf', (req, res) => {
  const doc = new jsPDF();
  doc.text("Customer Personas", 10, 10);

  Object.keys(personaResponses).forEach((key, index) => {
    doc.text(`${key}: ${personaResponses[key]}`, 10, 20 + (index * 10));
  });

  const pdf = doc.output();
  res.setHeader('Content-Type', 'application/pdf');
  res.send(pdf); // Send the PDF back to the client
});

// In-memory storage for content generation responses
let contentResponses = {};

// POST route to handle content generation prompts and save user responses
app.post('/content-generation', (req, res) => {
  const contentDataPath = path.join(__dirname, 'json_files', 'Prompt_File.json');
  
  fs.readFile(contentDataPath, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error reading content file');
    }
    
    const contentPrompts = JSON.parse(data); // Parse content prompts JSON
    contentResponses = req.body; // Save user's content responses in memory
    res.json({ message: 'Content generation details saved successfully!', contentPrompts });
  });
});

// GET route to generate social media posts based on persona and content data
app.get('/generate-social-posts', (req, res) => {
  const socialMediaDataPath = path.join(__dirname, 'json_files', 'Social_Media_Outputs.json');
  
  fs.readFile(socialMediaDataPath, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error reading social media file');
    }
  
    const socialMediaOutputs = JSON.parse(data); // Parse social media outputs JSON
    // Optionally, you can customize the social media posts using `personaResponses` and `contentResponses`

    res.json(socialMediaOutputs); // Send the generated posts back to the frontend
  });
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

