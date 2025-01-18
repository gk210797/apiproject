const express = require('express');
const { getSpotifyAuthURL, spotifyCallback,fetchPlaylists,getUserDetails } = require('../controllers/spotifyController');
const { checkAndRefreshToken } = require('../middleware/spotifyMiddleware');
const router = express.Router();
console.log("kjhg1234556")
router.get('/login', getSpotifyAuthURL);
router.get('/callback', spotifyCallback);
router.get('/playlists', checkAndRefreshToken, fetchPlaylists);
router.get('/user-details', getUserDetails);

module.exports = router;


