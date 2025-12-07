
const { GoogleGenAI } = require("@google/genai");

// Initialize Google AI
// Ensure API_KEY is set in backend/.env
const ai = process.env.API_KEY 
    ? new GoogleGenAI({ apiKey: process.env.API_KEY }) 
    : null;

/**
 * Clean & Simple Google Gemini Wrapper
 */
async function generateResponse({ prompt, systemInstruction, jsonSchema }) {
    if (!ai) {
        console.error("❌ AI Error: API_KEY is missing in backend/.env");
        return { text: "System Error: AI configuration is missing." };
    }

    try {
        const requestConfig = {
            systemInstruction: systemInstruction,
            temperature: 0.7,
        };

        // If JSON Schema is provided, force JSON mode
        if (jsonSchema) {
            requestConfig.responseMimeType = "application/json";
            requestConfig.responseSchema = jsonSchema;
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: requestConfig
        });

        return { text: response.text };

    } catch (error) {
        console.error("❌ Gemini API Error:", error.message);
        
        if (error.message && error.message.includes("429")) {
            return { text: "⚠️ High Traffic: The AI is busy. Please try again in 1 minute." };
        }

        // Return a safe error message so the frontend doesn't crash
        return { text: "I encountered an error while processing your request." };
    }
}

module.exports = { generateResponse };
