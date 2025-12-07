import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";

// In a real app, this key comes from process.env.API_KEY
// The user will need to configure this in their .env file or deployment variables.
const API_KEY = process.env.API_KEY || ""; 

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const generateHint = async (
  challengeTitle: string,
  challengeDesc: string,
  userCode: string,
  userQuestion: string
): Promise<string> => {
  if (!API_KEY) {
    return "⚠️ AI Service Unavailable: API Key missing.";
  }

  try {
    const prompt = `
    Context:
    Challenge: ${challengeTitle}
    Description: ${challengeDesc}
    
    Student Code:
    ${userCode}

    Student Question:
    ${userQuestion}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        maxOutputTokens: 300,
        temperature: 0.7,
      },
    });

    return response.text || "I couldn't generate a hint at this time.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error connecting to AI mentor. Please try again.";
  }
};
