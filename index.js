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

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

