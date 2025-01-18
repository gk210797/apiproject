const mongoose = require('mongoose');

const SpotifyUserSchema = new mongoose.Schema({
    spotifyId: { type: String, required: true, unique: true },
    displayName: String,
    email: String,
    accessToken: String,
    refreshToken: String,
    expiresIn: Number,
    updatedAt: Date,
    playlists: [  // New field for storing playlists
        {
            id: String, // Playlist ID
            name: String,
            snapshot_id: String, // Spotify's snapshot identifier
            tracks: { total: Number }, // Number of tracks in the playlist
            href: String, // Spotify API endpoint for the playlist
            uri: String, // Spotify URI for the playlist
            lastUpdated: { type: Date, default: Date.now }, // Timestamp of last update
        },
    ],
});

module.exports = mongoose.model('SpotifyUser', SpotifyUserSchema);
