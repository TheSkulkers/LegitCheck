const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');

require('dotenv').config();

//const teamRouter = require('./api/routes/team.routes');

//Instantiate a new express app
const app = express();

//Middleware setup
app.use(express.json());
app.use(morgan('combined'));

//Configure port and database connection
const PORT = process.env.PORT;

//app.use('/api/v1/teams', teamRouter);

//Open up the server to listen for requests
app.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`);
});





