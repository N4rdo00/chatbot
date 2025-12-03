require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dialogflow = require('@google-cloud/dialogflow');
const { Pool } = require('pg');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// --- PostgreSQL Connection ---
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// --- Dialogflow Configuration ---
// This assumes you've placed your JSON credentials file in the 'server' folder
const credentialsPath = path.join(__dirname, 'google-credentials.json');
const sessionClient = new dialogflow.SessionsClient({
    keyFilename: credentialsPath,
});
const projectId = process.env.GCLOUD_PROJECT_ID;


// --- API Endpoint ---
app.post('/api/chat', async (req, res) => {
    const { message, sessionId } = req.body;
    if (!message || !sessionId) {
        return res.status(400).send('Message and sessionId are required.');
    }

    try {
        // 1. Send user message to Dialogflow
        const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);
        const request = {
            session: sessionPath,
            queryInput: {
                text: {
                    text: message,
                    languageCode: 'en-US',
                },
            },
        };
        const responses = await sessionClient.detectIntent(request);
        const botResponse = responses[0].queryResult.fulfillmentText;

        // 2. Save conversation to PostgreSQL
        const userQuery = 'INSERT INTO conversations(sender, message) VALUES($1, $2)';
        await pool.query(userQuery, ['user', message]);
        const botQuery = 'INSERT INTO conversations(sender, message) VALUES($1, $2)';
        await pool.query(botQuery, ['bot', botResponse]);

        // 3. Send bot response back to client
        res.json({ reply: botResponse });

    } catch (error) {
        console.error('ERROR:', error);
        res.status(500).send('Something went wrong with the chatbot service.');
    }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
});