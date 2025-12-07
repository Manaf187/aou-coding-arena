
const { GoogleGenAI } = require("@google/genai");

// Validate API Key presence
const apiKey = process.env.API_KEY;
if (!apiKey) {
    console.warn("⚠️ WARNING: API_KEY is missing in backend .env file. AI features will be disabled.");
}

// Initialize Google AI
let ai = null;
try {
    if (apiKey) {
        ai = new GoogleGenAI({ apiKey: apiKey });
    }
} catch (e) {
    console.error("❌ Failed to initialize GoogleGenAI client:", e.message);
}

/**
 * Generate AI Response
 * @param {Object} params
 * @param {string} params.prompt - The user prompt
 * @param {string} [params.systemInstruction] - Optional system instructions
 * @param {Object} [params.jsonSchema] - Optional JSON schema for structured output
 */
async function generateResponse({ prompt, systemInstruction, jsonSchema }) {
    // 1. Check if AI is initialized
    if (!ai) {
        return { text: "System Error: AI configuration is missing or invalid on the server." };
    }

    try {
        const requestConfig = {
            systemInstruction: systemInstruction,
            temperature: 0.7,
        };

        // 2. Configure JSON mode if schema is provided
        if (jsonSchema) {
            requestConfig.responseMimeType = "application/json";
            requestConfig.responseSchema = jsonSchema;
        }

        // 3. Call Google Gemini
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: requestConfig
        });

        return { text: response.text };

    } catch (error) {
        console.error("❌ Gemini API Error:", error.message);
        
        // Handle Overloaded / Rate Limit errors gracefully
        if (error.message && error.message.includes("429")) {
            return { text: "⚠️ High Traffic: The AI is currently busy. Please try again in 1 minute." };
        }

        return { text: "I encountered an error while processing your request." };
    }
}

module.exports = { generateResponse };
