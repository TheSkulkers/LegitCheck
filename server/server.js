const express = require('express');
const morgan = require('morgan');
const path = require('path');
const cors = require('cors');
const CloudmersiveValidateApiClient = require('cloudmersive-validate-api-client');
const { text } = require('body-parser');
require('dotenv').config(); 
const ai = require('../server/config/geminiClient.js');

const jobDescRoutes = require("./api/routes/jobDescRoutes.js");

const app = express();

// Middleware setup
app.use(cors()); 
app.use(express.json()); 
app.use(morgan('combined')); 

const clientRootPath = path.join(__dirname, '..', 'client', 'public');
app.use(express.static(clientRootPath));
app.get('/', (req, res) => {
    res.sendFile(path.join(clientRootPath, 'html', 'landingPage.html'));
});

const PORT = process.env.PORT || 5501;

app.use('/api/v1/jobDesc', jobDescRoutes);

app.post('/api/validate-domain', (req, res) => {
    const domain = req.body.domain;
    if (!domain) {
        return res.status(400).json({ 
            success: false, 
            message: 'Domain not provided in request body.' 
        });
    }
    const defaultClient = CloudmersiveValidateApiClient.ApiClient.instance;
    const Apikey = defaultClient.authentications['Apikey'];
    Apikey.apiKey = process.env.API_KEY; 
    const api = new CloudmersiveValidateApiClient.DomainApi();

    api.domainCheck(domain, function (error, data, response) {
        if (error) {
            console.error("Cloudmersive API Error:", error);
            res.status(500).json({ success: false, message: 'External API Error' });
        } else {
            res.json({
                success: true,
                validationResult: data
            });
        }
    });
});

app.post('/api/submit-data', async (req, res) => {
    const formData = req.body;
    if (!formData) {
        return res.status(400).json({ 
            success: false, 
            message: 'data not provided in request body.' 
        });
    }
    console.log('Received data');
    try {
        const response = await fetch('https://eventregistry.org/api/v1/article/getArticles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const apiResponse = await response.json();
        const resultsArray = apiResponse.results || (apiResponse.articles && apiResponse.articles.results);
        res.json({
            success: true,
            apiResult: resultsArray
        });
    }  catch (error) {
        console.error('Data submission failed:', error);
        res.status(500).json({ success: false, message: 'Data submission failed', error: error.message });
    }
});

app.post('/api/generate-content', async (req, res) => {
    const { data } = req.body;
    const textInput = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    const prompt = `You are an AI risk analyst. Analyze the following scraped articles about a company.

                    Tasks:
                    1. Detect scam indicators (fraud reports, fake reviews, unrealistic offers, missing company info).
                    2. Detect ghost company patterns (no real-world presence, newly created website, lack of verifiable history).
                    3. Analyze overall sentiment (positive, neutral, negative).
                    4. Assess business legitimacy.
                    
                    Return the result ONLY in valid JSON with this structure:
                    {
                    "scamIndicators": ["list of detected scam signs"],
                    "ghostCompanyPatterns": ["list of ghost company signs"],
                    "sentiment": "positive | neutral | negative",
                    "legitimacyScore": 0-100,
                    "summary": "2-3 sentence summary of findings"
                    }

                    Scraped content:` 
                     + textInput;
    if (!prompt) {
        return res.status(400).json({ 
            success: false,
            message: 'Prompt not provided in request body.'
        });
    }
    try {
    // Use the consistent AI client, the same way jobDescService does
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash", // Using a consistent model name
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    // This line was added to remove the ```json markdown wrapper from the AI's response
    const text = response.text.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    res.json({ success: true, generatedText: text });
} catch (error) {
        console.error('Content generation failed:', error);
        res.status(500).json({ success: false, message: 'Content generation failed', error: error.message });
    }   
});

app.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`);
    console.log(`Open in browser: http://localhost:${PORT}`);
    console.log(`Serving client files from: ${clientRootPath}`);
});
