const ai = require('../../config/geminiClient')

class jobDescService {
    async postJobDesc(jobDesc) {
        const contentString = JSON.stringify(jobDesc);
        const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contentString,
    });
        return response.text;
    }
}

module.exports = new jobDescService();