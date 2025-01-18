const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
    spotifyId: { type: String, required: true, unique: true },
    accessToken: { type: String, required: true }, // Spotify access token
    refreshToken: { type: String, required: true }, // Spotify refresh token
    expiresIn: { type: Number, required: true }, // Token expiry in seconds
}, { timestamps: true });

module.exports = mongoose.model('Token', tokenSchema);
