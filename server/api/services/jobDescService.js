// jobDescService.js

const ai = require('../../config/geminiClient');
const pdf = require('pdf-parse'); 
const fetch = require('node-fetch');

const jsonFormat = {
  score: "return a number between 1(very safe) and 10(unsafe)",
  reason: "",
  company_name: "The name of the company offering the job, if found. Return null if not found.",
  red_flags: [],
  recommendations: []
};

const initialSystemPrompt = `
You are an analyst. Your purpose is to analyze the user-provided text and extract the company name.
Output your analysis in **valid JSON** matching this schema:
${JSON.stringify(jsonFormat, null, 2)}
`;

const createRefinementPrompt = (companyCheckResult) => `
You are an Investigative Fraud Analyst. You are performing a secondary, more detailed analysis.
**Crucial new context:** ${companyCheckResult}
Now, re-evaluate the user's provided text with this new context in mind.
Your final analysis MUST be in this valid JSON format:
${JSON.stringify(jsonFormat, null, 2)}
**IMPORTANT: In your "reason" field, briefly mention how the company verification and user's location influenced your analysis.**
At the end, include a field "verdict" with one of the following values: "SCAM", "SUSPICIOUS", or "LEGIT".
`;

class jobDescService {

  async _performTwoStepAnalysis(originalContent, location) {
    // Step 1: Initial analysis to get company name
    const initialResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: 'user', parts: [{ text: originalContent }] }],
        config: { systemInstruction: initialSystemPrompt }
    });
    const initialRaw = initialResponse.text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/```$/, '').trim();
    
    let initialParsed;
    try {
        initialParsed = JSON.parse(initialRaw);
    } catch (e) {
        console.error("Failed to parse initial AI response:", initialRaw);
        return { score: 8, reason: "Could not properly analyze the initial text.", red_flags: ["AI analysis failed."], recommendations: [], verdict: "SUSPICIOUS" };
    }

    const companyName = initialParsed.company_name;

    // Step 2: Verify company existence
    let companyCheckResult;
    if (companyName && typeof companyName === 'string' && companyName.trim() !== "") {
        const companyExists = await this.checkCompanyExists(companyName);
        companyCheckResult = companyExists
            ? `Our external check indicates that the company '${companyName}' has a verifiable online presence. This is a positive indicator.`
            : `Our external check could NOT find a verifiable online presence for the company '${companyName}'. This is a significant red flag.`;
    } else {
        companyCheckResult = "No company name was found in the text to verify.";
    }

    // Step 3: Refined analysis with new context
    const refinementPrompt = createRefinementPrompt(companyCheckResult);
    const finalContents = { prompt: originalContent, location: location };

    const finalResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: 'user', parts: [{ text: JSON.stringify(finalContents) }] }],
        config: { systemInstruction: refinementPrompt }
    });
    
    let finalRaw = finalResponse.text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/```$/, '').trim();
    let finalParsed;
    try {
        finalParsed = JSON.parse(finalRaw);
    } catch (error) {
        console.error("Failed to parse final AI response as JSON:", error);
        finalParsed = { score: 8, reason: finalRaw, red_flags: ["AI response was not valid JSON after refinement."], recommendations: [], verdict: "SUSPICIOUS" };
    }

    return finalParsed;
  }
  
  async postJobDesc(jobDesc) {
    const { prompt, location } = jobDesc; //
    return await this._performTwoStepAnalysis(prompt, location); //
  }

  async checkCompanyExists(companyName) {
    const encodedName = encodeURIComponent(companyName);
    const sanitizedName = companyName.replace(/\s+/g, '-');

    const searchUrls = [
      // International Professional Networks
      `https://www.linkedin.com/company/${sanitizedName}`,
      `https://www.glassdoor.com/Overview/Working-at-${sanitizedName}.htm`,
      // International Job Aggregators
      `https://www.indeed.com/companies/search?q=${encodedName}`,
      // South African Job Boards
      `https://www.pnet.co.za/companies/${encodedName}`,
      `https://www.careers24.com/companies/search?query=${encodedName}`,
      `https://www.google.com/search?q=${encodeURIComponent(`site:sayouth.mobi "${companyName}"`)}`,
      // South African Company Registry (via Google search)
      `https://www.google.com/search?q=${encodeURIComponent(`site:eservices.cipc.co.za "${companyName}"`)}`,
      // General broad search for redundancy
      `https://www.google.com/search?q=${encodeURIComponent(`"${companyName}" official website`)}`,
    ];

    // We send all search requests at the same time for efficiency
    const promises = searchUrls.map(url =>
      fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' } })
        .then(response => {
          // If the site can't be reached, we count it as a failure for this specific URL
          if (!response.ok) return { status: 'failed' };
          
          return response.text().then(body => {
            const bodyLower = body.toLowerCase();
            const hasCompanyName = bodyLower.includes(companyName.toLowerCase());
            // Check for common "no results" messages on these sites
            const hasNoResults = bodyLower.includes("no results") || bodyLower.includes("couldn't find") || bodyLower.includes("page not found") || bodyLower.includes("find any companies");
            
            // A search is successful if it includes the company name AND doesn't have a "no results" message
            return (hasCompanyName && !hasNoResults) ? { status: 'found' } : { status: 'not_found' };
          });
        })
        .catch(() => ({ status: 'failed' }))
    );

    try {
      const results = await Promise.allSettled(promises);
      const wasCompanyFound = results.some(result => result.status === 'fulfilled' && result.value.status === 'found');
      console.log(`Company check for "${companyName}": ${wasCompanyFound ? 'Found' : 'Not Found'}`);
      
      return wasCompanyFound;
    } catch (error) {
      console.error("Error during company existence check:", error.message);
      return false;
    }
  }

  async saveLocation(locationData) {
    const { latitude, longitude } = locationData; //
    if (latitude === undefined || longitude === undefined) { //
        throw new Error('Latitude and longitude are required.'); //
    }
    console.log(`📍 Location received: Lat: ${latitude}, Lon: ${longitude}`); //
    return {
        message: 'Location received successfully.', //
        receivedData: { latitude, longitude } //
    };
  }

  async analyzeFile(file, locationString) {
      const location = locationString ? JSON.parse(locationString) : null;
      let textContent;

      if (file.mimetype === 'application/pdf') { //
          const data = await pdf(file.buffer); //
          textContent = data.text; //
      } else if (file.mimetype.startsWith('image/')) { //
          const contentsForAI = [{
              role: 'user', //
              parts: [ //
                  { text: "Analyze this image for any signs of a job scam. Extract the company name if possible and factor its likely legitimacy into your final analysis." }, //
                  { inlineData: { mimeType: file.mimetype, data: file.buffer.toString('base64') } } //
              ]
          }];
          
          const singleCallPrompt = createRefinementPrompt("Analyze the company name found within the image to check for legitimacy.");
          
          const response = await ai.models.generateContent({ //
              model: "gemini-2.5-flash",
              contents: contentsForAI, //
              config: { systemInstruction: singleCallPrompt }
          });
          
          let raw = response.text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/```$/, '').trim(); //
          let parsedResponse; //
          try {
              parsedResponse = JSON.parse(raw); //
          } catch (error) {
              parsedResponse = { score: "", reason: raw, red_flags: [], recommendations: [], verdict: "SUSPICIOUS" }; //
          }
          return parsedResponse; //

      } else {
          throw new Error('Unsupported file type. Please upload an image or a PDF.'); //
      }

      return await this._performTwoStepAnalysis(textContent, location);
  }
}

module.exports = new jobDescService();