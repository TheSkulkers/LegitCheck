const ai = require('../../config/geminiClient')

const simpleSystemPrompt = "You are an Investigative Fraud Analyst specializing in online scams and fraud detection. Your sole purpose is to analyze the user-provided text (a job offer, investment pitch, or message) and determine its legitimacy. Always output your analysis in JSON format, listing potential red flags and concluding with a final verdict (SCAM, SUSPICIOUS, or LEGIT).";
class jobDescService {
    async postJobDesc(jobDesc) {
        const jobDescJSON = JSON.stringify(jobDesc);
        const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: jobDescJSON,
        config:{
            systemInstruction : simpleSystemPrompt
        }
    });
        console.log(response.text);
        return response.text;
    }
}

module.exports = new jobDescService();