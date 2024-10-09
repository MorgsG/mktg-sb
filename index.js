require('dotenv').config();

const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors'); // Allows cross-origin requests

const app = express();
app.use(express.json());
app.use(cors()); // Enable CORS

const apiKey = process.env.OPENAI_API_KEY; // Store API key in environment variables for security

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

// New /generate-persona Route
let personaResponses = {}; // Store persona data

app.post('/generate-persona', (req, res) => {
  personaResponses = req.body; // Store the persona information from the frontend
  res.send({ message: 'Persona details saved successfully!' });
});

// New /generate-pdf Route (Optional)
app.get('/generate-pdf', (req, res) => {
  const doc = new jsPDF();
  doc.text("Customer Personas", 10, 10);

  Object.keys(personaResponses).forEach((key, index) => {
    doc.text(`${key}: ${personaResponses[key]}`, 10, 20 + (index * 10));
  });

  const pdf = doc.output();
  res.setHeader('Content-Type', 'application/pdf');
  res.send(pdf); // Send PDF back for download
});

// Route to accept content generation details
let contentResponses = {}; // Store content generation responses

app.post('/content-generation', (req, res) => {
  contentResponses = req.body; // Collect content generation form data
  res.send({ message: 'Content generation details saved successfully' });
});

// Route to generate social media posts
app.get('/generate-social-posts', (req, res) => {
  const socialMediaOutputs = {
    "awareness_pillar": [
      {
        "post_number": 1,
        "content": "Struggling to convert all the likes and comments on your posts into real business outcomes? You’re not alone! Here’s how you can start turning attention into revenue. 💼 #ContentToCash"
      },
      {
        "post_number": 2,
        "content": "Did you know that understanding your audience is the key to organic growth? It’s not about getting more followers; it’s about engaging the right ones. #AudienceMatters"
      }
      // Add more posts here from Social_Media_Outputs file...
    ]
  };

  res.json(socialMediaOutputs); // Send social media posts as JSON response
});


const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

