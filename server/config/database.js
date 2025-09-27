require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    ssl: true
});

client.connect((err) => {
    if (err) {
        console.error('Connection error:', err.stack);
    } else {
        console.log('Database connected successfully.');
    }
});

module.exports = client;