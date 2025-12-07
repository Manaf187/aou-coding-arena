
const express = require('express');
const router = express.Router();
// IMPORTING FROM: backend/services/aiService.js
const { generateResponse } = require('../services/aiService');

const SYSTEM_INSTRUCTION = `
You are an expert Computer Science mentor for the Arab Open University (AOU) Coding Arena.
RULES:
1. NEVER provide the full solution code.
2. Provide hints, logical steps, or debugging tips.
3. Be encouraging and concise.
`;

router.post('/hint', async (req, res) => {
  const { challengeTitle, challengeDesc, userCode, userQuestion } = req.body;

  try {
    const prompt = `
    Context:
    Challenge: ${challengeTitle}
    Description: ${challengeDesc}
    Student Code: ${userCode}
    Question: ${userQuestion}
    `;

    const result = await generateResponse({
        prompt: prompt,
        systemInstruction: SYSTEM_INSTRUCTION
    });

    res.json({ hint: result.text });

  } catch (error) {
    console.error("Route Error:", error);
    res.status(500).json({ error: "AI Service Unavailable" });
  }
});

module.exports = router;
