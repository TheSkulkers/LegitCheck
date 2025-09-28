import express from 'express';
import { GoogleGenAI } from "@google/genai";
import 'dotenv/config'; // or: import dotenv from 'dotenv'; dotenv.config();

const ai = new GoogleGenAI({
  //apiKey:"AIzaSyDhxwgBlcPxldelboiNXvguMOti8TFVCfA"
  apiKey:process.env.GEMINI_API_KEY
});

const app= express();

app.get("/verify",async(req,res)=>{
  const title=req.query.title;
  const company=req.query.title;
  const text = req.query.text;
  const query= "Keep this short and simple start with probability and then a short(five sentences max) reason (Nothing long) Given the text below, use machine learning to determine whether it is a scam, also check if it is professional ,check if it appears to be AI-generated, and verify whether the email address is valid. Provide the probability that the content represents an employment fraud.: "+"Company Name: "+company+" Job title: "+ title+ " About: "+text;
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: query
  });
 // console.log(result.response.text());
const aiResponseText = response.text; 
        
        console.log("AI Response:", aiResponseText);
        res.send({ aiResponse: aiResponseText });
  //res.send({aiResponse: response.output[0].content[0].text});
});
const PORT = process.env.PORT || 3000
app.listen(PORT,()=>{console.log("Now list.......");
      console.log("Using API Key:", process.env.GEMINI_API_KEY ? "Loaded successfully." : "Failed to load.");

});
