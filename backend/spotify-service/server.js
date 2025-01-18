const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const spotifyRoutes = require('./routes/spotifyRoutes');
const startPolling = require('./services/poller');


dotenv.config(); // Load environment variables

connectDB(); // Connect to MongoDB

const app = express();
app.use(express.json()); // Parse JSON payloads
app.use('/api/spotify', spotifyRoutes);
startPolling();
// Base route
app.get('/', (req, res) => {
    res.send('Spotify Service is running...');
});

// Start the server
const PORT = process.env.SPOTIFY_SERVICE_PORT || 5001;
app.listen(PORT, () => console.log(`Spotify service running on port ${PORT}`));
