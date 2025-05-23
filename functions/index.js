const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();

const app = express(); // ✅ CREATE APP BEFORE USING IT
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.post('/generate-mcq', async (req, res) => {
  const { passage, totalQuestions, difficulties } = req.body;

  const countPerLevel = Math.floor(totalQuestions / difficulties.length);
  const remainder = totalQuestions % difficulties.length;

  const difficultyInstructions = difficulties.map((level, i) => {
    const extra = i < remainder ? 1 : 0;
    return `- ${countPerLevel + extra} ${level.charAt(0).toUpperCase() + level.slice(1)} question(s)`;
  }).join('\n');

  const prompt = `
Generate ${totalQuestions} MCQs from the passage below, categorized by difficulty level:
${difficultyInstructions}

Passage:
${passage}
`;

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        messages: [
          {
            role: 'system',
            content: 'You are a tutor who generates MCQs from reading passages.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json(response.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to generate MCQs' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});
