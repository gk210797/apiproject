const axios = require('axios');

const userServiceBaseURL = process.env.USER_SERVICE_URL || 'http://localhost:5000'; // Replace with User Service URL

const userServiceClient = axios.create({
    baseURL: userServiceBaseURL,
});

module.exports = userServiceClient;
