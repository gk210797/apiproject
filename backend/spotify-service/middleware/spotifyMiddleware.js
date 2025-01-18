const jwt = require('jsonwebtoken');
const SpotifyUser = require('../models/SpotifyUser');
const { refreshAccessToken } = require('../controllers/spotifyController');

const checkAndRefreshToken = async (req, res, next) => {
    // Extract the token from headers
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Authorization token is required' });
    }

    try {
        // Decode the token to get spotifyId
        console.log(token,"received token")
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const spotifyId = decoded.spotifyId;
         console.log(token)
        const user = await SpotifyUser.findOne({ spotifyId });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { accessToken, refreshToken, expiresIn, updatedAt } = user;

        // Check if the token has expired
        const tokenExpired = Date.now() > new Date(updatedAt).getTime() + expiresIn * 1000;
        if (tokenExpired) {
            console.log('Access token expired. Refreshing...');
            const { accessToken: newAccessToken, expiresIn: newExpiresIn } = await refreshAccessToken(refreshToken);

            // Update the database with the new token
            user.accessToken = newAccessToken;
            user.expiresIn = newExpiresIn;
            user.updatedAt = Date.now();
            await user.save();

            req.accessToken = newAccessToken; // Pass the new access token to the request
        } else {
            req.accessToken = accessToken; // Token is still valid
        }

        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        console.error('Error checking or refreshing token:', error);
        res.status(500).json({ message: 'Failed to refresh access token' });
    }
};

module.exports = { checkAndRefreshToken };
