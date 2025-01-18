const axios = require('axios');
const Token = require('../models/Token');
const jwt = require('jsonwebtoken');
const SpotifyUser = require('../models/SpotifyUser');
const userServiceClient = require('../config/userServiceClient');
const getUserDetails = async (req, res) => {
    try {
        const { spotifyId } = req.query;
        if (!spotifyId) {
            return res.status(400).json({ message: 'Spotify ID is required' });
        }

        // Request user details from User Service
        const response = await userServiceClient.get(`/api/users/${spotifyId}`);
        res.status(200).json(response.data);
    } catch (error) {
        console.error('Error fetching user details:', error.message);
        res.status(500).json({ message: 'Failed to fetch user details' });
    }
};
const getSpotifyAuthURL = (req, res) => {
    const scope = 'user-read-private user-read-email';
    const authURL = `https://accounts.spotify.com/authorize?response_type=code&client_id=${process.env.SPOTIFY_CLIENT_ID}&scope=${encodeURIComponent(scope)}&redirect_uri=${process.env.SPOTIFY_REDIRECT_URI}&show_dialog=true`;
    console.log('Generated Spotify Auth URL:', authURL); // Debugging
    res.redirect(authURL); // Redirect to Spotify login
};
const spotifyCallback = async (req, res) => {
    const code = req.query.code;

    if (!code) {
        return res.status(400).json({ message: 'Authorization code is missing' });
    }

    try {
        // Exchange authorization code for tokens
        const params = new URLSearchParams();
        params.append('grant_type', 'authorization_code');
        params.append('code', code);
        params.append('redirect_uri', process.env.SPOTIFY_REDIRECT_URI);
        params.append('client_id', process.env.SPOTIFY_CLIENT_ID);
        params.append('client_secret', process.env.SPOTIFY_CLIENT_SECRET);

        const response = await axios.post('https://accounts.spotify.com/api/token', params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });

        const { access_token, refresh_token, expires_in } = response.data;

        // Fetch user details from Spotify
        const userResponse = await axios.get('https://api.spotify.com/v1/me', {
            headers: { Authorization: `Bearer ${access_token}` },
        });

        const { id: spotifyId, display_name, email } = userResponse.data;

        // Fetch user playlists from Spotify
        const playlistResponse = await axios.get('https://api.spotify.com/v1/me/playlists', {
            headers: { Authorization: `Bearer ${access_token}` },
        });

        const playlists = playlistResponse.data.items.map((playlist) => ({
            id: playlist.id,
            name: playlist.name,
            tracks: playlist.tracks.total,
            images: playlist.images,
        }));

        // Save or update user with playlists in the database
        const user = await SpotifyUser.findOneAndUpdate(
            { spotifyId },
            {
                spotifyId,
                displayName: display_name,
                email,
                accessToken: access_token,
                refreshToken: refresh_token,
                expiresIn: expires_in,
                updatedAt: Date.now(),
                playlists, // Add playlists to the user document
            },
            { upsert: true, new: true }
        );
        await Token.findOneAndUpdate(
                                    { spotifyId },
                                    {
                                        spotifyId,
                                        accessToken: access_token,
                                        refreshToken: refresh_token,
                                        expiresIn: expires_in,
                                    },
                                    { upsert: true }
                                );

        // Generate JWT token
        const token = jwt.sign(
            { spotifyId: user.spotifyId }, // Payload
            process.env.JWT_SECRET, // Secret key
            { expiresIn: '7d' } // Token expiration (e.g., 7 days)
        );

        // Send the token and user data to the client
        res.status(200).json({ token, message: 'Login successful!', user });
    } catch (error) {
        console.error('Error during Spotify callback:', error.response?.data || error.message);
        res.status(400).json({ message: error.response?.data || error.message });
    }
};
const refreshAccessToken = async (refreshToken) => {
    try {
        const params = new URLSearchParams();
        params.append('grant_type', 'refresh_token');
        params.append('refresh_token', refreshToken);
        params.append('client_id', process.env.SPOTIFY_CLIENT_ID);
        params.append('client_secret', process.env.SPOTIFY_CLIENT_SECRET);

        const response = await axios.post('https://accounts.spotify.com/api/token', params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        const { access_token, expires_in } = response.data;
        return { accessToken: access_token, expiresIn: expires_in };
    } catch (error) {
        console.error('Error refreshing access token:', error.response?.data || error.message);
        throw new Error('Failed to refresh access token');
    }
};
const fetchPlaylists = async (req, res) => {
    const accessToken = req.accessToken; // Get the token from the middleware

    try {
        const response = await axios.get('https://api.spotify.com/v1/me/playlists', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        res.status(200).json({ playlists: response.data });
    } catch (error) {
        console.error('Error fetching playlists:', error.response?.data || error.message);
        res.status(400).json({ message: error.response?.data || error.message });
    }
};
module.exports = { getSpotifyAuthURL, spotifyCallback ,refreshAccessToken,fetchPlaylists,getUserDetails};
