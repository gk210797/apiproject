const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    spotifyId: { type: String, required: true, unique: true }, // Links to Spotify
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', UserSchema);
