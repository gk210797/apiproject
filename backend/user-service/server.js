require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');


const app = express();

// Middleware
app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/users', require('./routes/userRoutes'));

// Start the server
const PORT = process.env.USER_SERVICE_PORT || 5000;
app.listen(PORT, () => {
    console.log(`User Service running on port ${PORT}`);
});
