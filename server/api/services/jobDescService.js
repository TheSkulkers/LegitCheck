const ai = require('../../config/geminiClient');
const pdf = require('pdf-parse'); 

const jsonFormat = {
  score: "return a number between 1(very safe) and 10(unsafe)",
  reason: "",
  red_flags: [],
  recommendations: []
};

const simpleSystemPrompt = `
You are an Investigative Fraud Analyst specializing in online scams and fraud detection.
Your sole purpose is to analyze the user-provided text (a job offer, investment pitch, or message) and determine its legitimacy.

Always output your analysis in **valid JSON** matching this schema:
${JSON.stringify(jsonFormat, null, 2)}

At the end, include a field "verdict" with one of the following values: "SCAM", "SUSPICIOUS", or "LEGIT".
`;

class jobDescService {
  async postJobDesc(jobDesc) {
    const jobDescJSON = JSON.stringify(jobDesc);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: jobDescJSON,
      config: { systemInstruction: simpleSystemPrompt }
    });
    let raw = response.text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/```$/, '').trim();

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(raw);
    } catch (error) {
      console.error("Failed to parse AI response as JSON:", error);
      parsedResponse = {
        score: "",
        reason: raw,
        red_flags: [],
        recommendations: [],
        verdict: "SUSPICIOUS"
      };
    }

    return parsedResponse;
  }


  async analyzeFile(file) {
        let contentsForAI;
        if (file.mimetype === 'application/pdf') {
            const data = await pdf(file.buffer);
            contentsForAI = [{ role: 'user', parts: [{ text: data.text }] }];
        } 
        else if (file.mimetype.startsWith('image/')) {
            contentsForAI = [{
                role: 'user',
                parts: [
                    { text: "Analyze this image for any signs of a scam. Is it a fraudulent job offer, a fake invoice, or a suspicious message?" },
                    {
                        inlineData: { 
                            mimeType: file.mimetype,
                            data: file.buffer.toString('base64')
                        }
                    }
                ]
            }];

        } else {
            throw new Error('Unsupported file type. Please upload an image or a PDF.');
        }

        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: contentsForAI,
            config: { systemInstruction: simpleSystemPrompt }
        });
        
        let raw = response.text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/```$/, '').trim();
        let parsedResponse;
        try {
            parsedResponse = JSON.parse(raw);
        } catch (error) {
            console.error("Failed to parse AI response as JSON:", error);
            parsedResponse = {
                score: "",
                reason: raw, 
                red_flags: [],
                recommendations: [],
                verdict: "SUSPICIOUS"
            };
        }

        return parsedResponse;
    }
}

module.exports = new jobDescService();
