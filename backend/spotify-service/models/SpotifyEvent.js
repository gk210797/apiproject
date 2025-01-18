const mongoose = require('mongoose');

const SpotifyEventSchema = new mongoose.Schema({
    userId: { type: String, required: true }, // Spotify user ID
    eventType: { type: String, required: true }, // Event type (e.g., "playlist_added", "track_added")
    eventDetails: { type: Object, default: {} }, // Details about the event
    createdAt: { type: Date, default: Date.now }, // Timestamp
});

module.exports = mongoose.model('SpotifyEvent', SpotifyEventSchema);
