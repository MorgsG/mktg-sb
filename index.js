require('dotenv').config();

const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors'); // Allows cross-origin requests
const fs = require('fs');
const path = require('path');
const { jsPDF } = require('jspdf'); // PDF generation library

const app = express();

const corsOptions = {
  origin: 'https://www.socialbureau.co',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200

app.use(cors(corsOptions));

app.use(express.json());

app.options('*', cors(corsOptions));

const apiKey = process.env.OPENAI_API_KEY; // Store API key in environment variables for security

// Ensure the API key is set correctly
if (!apiKey) {
  console.error('API key is missing!');
  process.exit(1); // Exit if no API key is found
}

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

let personaResponses = {}; // To store user persona responses

app.options('/generate-persona', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://www.socialbureau.co');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(204).end(); // End the preflight request with no content
});

// Route to load persona detail prompts and accept persona details
app.post('/generate-persona', (req, res) => {
  const personaDataPath = path.join(__dirname, 'json_files', 'Persona_Detail_Extraction_Prompt.json');
  
  fs.readFile(personaDataPath, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error reading persona file');
    }

    const personaPrompts = JSON.parse(data); // Parse the persona prompts JSON
    personaResponses = req.body; // Save the user’s responses
    res.json({ message: 'Persona details saved successfully!', personaPrompts });
  });
});

// Route to generate PDF for persona details
app.get('/generate-pdf', (req, res) => {
  const doc = new jsPDF();

  doc.text("Customer Personas", 10, 10);

  Object.keys(personaResponses).forEach((key, index) => {
    doc.text(`${key}: ${personaResponses[key]}`, 10, 20 + (index * 10));
  });

  const pdf = doc.output();
  res.setHeader('Content-Type', 'application/pdf');
  res.send(pdf); // Send the PDF back for download
});

let contentResponses = {}; // Store content generation responses

// Route to load content generation prompts and accept content details
app.post('/content-generation', (req, res) => {
  const contentDataPath = path.join(__dirname, 'json_files', 'Prompt_File.json');
  
  fs.readFile(contentDataPath, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error reading content file');
    }

    const contentPrompts = JSON.parse(data); // Parse the content prompts JSON
    contentResponses = req.body; // Save the user's responses for content generation
    res.json({ message: 'Content generation details saved successfully!', contentPrompts });
  });
});

// Route to generate social media posts based on persona and content data
app.get('/generate-social-posts', (req, res) => {
  const socialMediaDataPath = path.join(__dirname, 'json_files', 'Social_Media_Outputs.json');
  
  fs.readFile(socialMediaDataPath, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error reading social media file');
    }

    const socialMediaOutputs = JSON.parse(data); // Parse social media outputs JSON
    // Optionally, customize social media posts based on personaResponses and contentResponses

    res.json(socialMediaOutputs); // Send the posts back to the frontend
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

