
const { GoogleGenAI } = require("@google/genai");

const API_KEY = process.env.API_KEY || "";
// Google keys start with 'AIza', DeepSeek/OpenAI keys usually start with 'sk-'
const IS_GOOGLE = API_KEY.startsWith("AIza");

// Initialize Google SDK only if using a Google Key
const googleAi = IS_GOOGLE ? new GoogleGenAI({ apiKey: API_KEY }) : null;

/**
 * Unified AI Generation Function
 * automatically routes to Google or DeepSeek based on the key.
 */
async function generateResponse({ prompt, systemInstruction, jsonSchema }) {
    if (!API_KEY) return { text: "Error: No API Key configured." };

    // --- STRATEGY A: GOOGLE GEMINI ---
    if (IS_GOOGLE) {
        const config = {
            systemInstruction: systemInstruction,
        };
        
        // Google strict JSON mode
        if (jsonSchema) {
            config.responseMimeType = "application/json";
            config.responseSchema = jsonSchema;
        }

        try {
            const result = await googleAi.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: config
            });
            return { text: result.text };
        } catch (e) {
             console.error("Google AI Error:", e.message);
             throw e;
        }
    } 
    
    // --- STRATEGY B: DEEPSEEK / OPENAI COMPATIBLE ---
    else {
        try {
            // Construct messages array
            const messages = [
                { role: "system", content: systemInstruction || "You are a helpful assistant." },
                { role: "user", content: prompt }
            ];

            // DeepSeek doesn't support strict schema objects in the API call like Google
            // So we append instructions to the system prompt to ensure JSON
            let body = {
                model: "deepseek-chat", // Or 'deepseek-coder'
                messages: messages,
                stream: false
            };

            if (jsonSchema) {
                body.response_format = { type: "json_object" };
                // Reinforce JSON requirement
                messages[0].content += " You must respond with valid JSON only. Do not include markdown formatting like ```json.";
            }

            // Use global fetch (Node 18+)
            const response = await fetch("https://api.deepseek.com/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${API_KEY}`
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`DeepSeek API Error (${response.status}): ${errText}`);
            }

            const data = await response.json();
            return { text: data.choices[0].message.content };

        } catch (e) {
            console.error("DeepSeek Provider Error:", e);
            // Fallback error message
            return { text: "Error connecting to AI Provider." };
        }
    }
}

module.exports = { generateResponse, IS_GOOGLE };
