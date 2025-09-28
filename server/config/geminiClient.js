const { GoogleGenAI } = require("@google/genai");
require('dotenv').config(); 

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);

module.exports = ai;
