const express = require('express');
const morgan = require('morgan');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv')

require('dotenv').config();

const jobDescRoutes = require("./api/routes/jobDescRoutes.js");


//Instantiate a new express app
const app = express();

//Middleware setup
app.use(express.json());
app.use(morgan('combined'));

//Configure port and database connection
const PORT = process.env.PORT;

app.use('/api/v1/jobDesc', jobDescRoutes);

//Open up the server to listen for requests
app.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`);
});





