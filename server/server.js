const express = require('express');
const morgan = require('morgan');
const path = require('path');
const cors = require('cors');
require('dotenv').config(); 

const jobDescRoutes = require("./api/routes/jobDescRoutes.js");



const app = express();

// Middleware setup
app.use(cors()); 
app.use(express.json()); 
app.use(morgan('combined')); 


const clientRootPath = path.join(__dirname, '..', 'client', 'public');
app.use(express.static(clientRootPath));
app.get('/', (req, res) => {
    // Navigate to the HTML file within the public folder
    res.sendFile(path.join(clientRootPath, 'html', 'jobDescription.html'));
});

const PORT = process.env.PORT;

app.use('/api/v1/jobDesc', jobDescRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`);
    console.log(`Open in browser: http://localhost:${PORT}`);
    console.log(`Serving client files from: ${clientRootPath}`);
});
