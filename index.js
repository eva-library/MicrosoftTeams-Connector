const express = require('express');
const cors = require('cors');
const functions = require('@google-cloud/functions-framework');

// Load environment variables
require('dotenv').config();

// Initialize Express and the router
const app = express();
const router = express.Router();

// Use CORS middleware to handle Cross-Origin requests
app.use(cors({ origin: true }));

// Use middlewares to parse JSON and urlencoded request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true}));

// Define a root route to quickly check if the service is up and running
app.get('/', (req, res) => {
    res.json({message: 'Teams connector running'});
});

// Load the routes from the 'routes' module, and register them with the application
require('./app/routes')(app, router);

// Define the port the server should run on and start listening
const PORT = 8085;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});

// Export the app - useful if this is being deployed to platforms like Google Cloud Functions
exports.teams_azurebot_eva = app;