import express from 'express';
import { GoogleGenAI } from "@google/genai";
// If you are using a .env file, ensure you have 'import 'dotenv/config''
// at the top of your main file or equivalent setup.

// --- CHECK ADDED HERE ---
if (!process.env.GEMINI_API_KEY) {
    console.error("CRITICAL ERROR: GEMINI_API_KEY environment variable is NOT set.");
    // Exit the process if the key is missing to prevent fallback to scoped credentials.
    process.exit(1); 
}
// ------------------------

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

const app = express();

app.get("/verify", async (req, res) => {
    try {
        const text = req.query.text; // Note: This parameter is currently unused
        
        // Ensure you use the correct model for the genai client
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: "user", parts: [{ text: "Explain how AI works in a few words" }] }],
        });

        // The response structure for @google/genai is much simpler.
        // It provides the text property directly on the response object.
        const aiResponseText = response.text; 
        
        console.log("AI Response:", aiResponseText);
        res.send({ aiResponse: aiResponseText });
        
    } catch (error) {
        console.error("API Call Failed:", error);
        res.status(500).send({ error: "Failed to communicate with AI model. Check server logs." });
    }
});

app.listen(3000, () => {
    console.log("Now list....... on http://localhost:3000");
    console.log("Using API Key:", process.env.GEMINI_API_KEY ? "Loaded successfully." : "Failed to load.");
});
