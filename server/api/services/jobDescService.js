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
Your sole purpose is to analyze the user-provided text and determine its legitimacy, considering the user's approximate location if provided.

Always output your analysis in **valid JSON** matching this schema:
${JSON.stringify(jsonFormat, null, 2)}

**IMPORTANT: In your "reason" field, you MUST briefly mention how the user's provided location (or lack thereof) influenced your analysis.**

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

  async saveLocation(locationData) {
    const { latitude, longitude } = locationData;
    // Basic validation
      if (latitude === undefined || longitude === undefined) {
          throw new Error('Latitude and longitude are required.');
        }
        console.log(`📍 Location received: Lat: ${latitude}, Lon: ${longitude}`);
        return {
            message: 'Location received successfully.',
            receivedData: { latitude, longitude }
        };
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
