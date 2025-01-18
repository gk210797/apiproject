const cron = require('node-cron');
const axios = require('axios');
const SpotifyUser = require('../models/SpotifyUser');
const SpotifyEvent = require('../models/SpotifyEvent');

// Poll Spotify for changes
const pollSpotifyForUser = async (user) => {
    try {
        const { spotifyId, accessToken, refreshToken, expiresIn, updatedAt, playlists: storedPlaylists } = user;

        console.log(`\n[INFO] Polling Spotify for user: ${spotifyId}`);

        // Step 1: Refresh access token if expired
        let validAccessToken = accessToken;
        const tokenExpired = Date.now() > new Date(updatedAt).getTime() + expiresIn * 1000;
        if (tokenExpired) {
            console.log(`[INFO] Access token expired for user: ${spotifyId}. Refreshing token...`);
            const refreshResponse = await axios.post(
                'https://accounts.spotify.com/api/token',
                new URLSearchParams({
                    grant_type: 'refresh_token',
                    refresh_token: refreshToken,
                    client_id: process.env.SPOTIFY_CLIENT_ID,
                    client_secret: process.env.SPOTIFY_CLIENT_SECRET,
                }).toString(),
                {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                }
            );

            validAccessToken = refreshResponse.data.access_token;
            user.accessToken = validAccessToken;
            user.expiresIn = refreshResponse.data.expires_in;
            user.updatedAt = Date.now();
            await user.save();
            console.log(`[INFO] Access token refreshed successfully for user: ${spotifyId}`);
        } else {
            console.log(`[INFO] Access token still valid for user: ${spotifyId}`);
        }

        // Step 2: Fetch current playlists from Spotify
        console.log(`[INFO] Fetching playlists for user: ${spotifyId}`);
        const response = await axios.get('https://api.spotify.com/v1/me/playlists', {
            headers: { Authorization: `Bearer ${validAccessToken}` },
        });
        const currentPlaylists = response.data.items;

        console.log(`[INFO] Playlists fetched successfully for user: ${spotifyId}`);
        console.log(`[DEBUG] Current playlists for user ${spotifyId}:`, currentPlaylists.map((p) => p.name));

        // Step 3: Compare with stored playlists
        console.log(`[INFO] Comparing current playlists with stored playlists for user: ${spotifyId}`);
        const newEvents = [];
        const updatedPlaylists = [];

        // Detect new or updated playlists
        currentPlaylists.forEach((playlist) => {
            const previous = storedPlaylists.find((p) => p.id === playlist.id);

            if (!previous) {
                console.log(`[EVENT] New playlist detected: ${playlist.name}`);
                newEvents.push({
                    userId: spotifyId,
                    eventType: 'playlist_added',
                    eventDetails: playlist,
                });
            } else if (playlist.snapshot_id !== previous.snapshot_id) {
                console.log(`[EVENT] Updated playlist detected: ${playlist.name}`);
                newEvents.push({
                    userId: spotifyId,
                    eventType: 'playlist_updated',
                    eventDetails: playlist,
                });
            }

            // Add the playlist to the updated playlists array
            updatedPlaylists.push({
                id: playlist.id,
                name: playlist.name,
                snapshot_id: playlist.snapshot_id,
                tracks: playlist.tracks,
                href: playlist.href,
                uri: playlist.uri,
                lastUpdated: new Date(),
            });
        });

        // Detect deleted playlists
        storedPlaylists.forEach((previous) => {
            const exists = currentPlaylists.find((p) => p.id === previous.id);
            if (!exists) {
                console.log(`[EVENT] Deleted playlist detected: ${previous.name}`);
                newEvents.push({
                    userId: spotifyId,
                    eventType: 'playlist_deleted',
                    eventDetails: previous,
                });
            }
        });

        // Step 4: Save new events to the database
        if (newEvents.length > 0) {
            console.log(`[INFO] Logging new events for user: ${spotifyId}`);
            await SpotifyEvent.insertMany(newEvents);
            console.log(`[INFO] New events logged successfully for user: ${spotifyId}`);
        } else {
            console.log(`[INFO] No new events detected for user: ${spotifyId}`);
        }

        // Step 5: Update user playlists in the database
        console.log(`[INFO] Updating stored playlists for user: ${spotifyId}`);
        user.playlists = updatedPlaylists;
        await user.save();
        console.log(`[INFO] Playlists updated successfully for user: ${spotifyId}`);
    } catch (error) {
        console.error(`[ERROR] Error polling Spotify for user ${user.spotifyId}:`, error.message);
    }
};

// Start polling periodically
const startPolling = () => {
    console.log('[INFO] Starting Spotify polling...');
    cron.schedule('*/1 * * * *', async () => {
        console.log('\n[INFO] Polling Spotify for all users...');
        const users = await SpotifyUser.find({});
        console.log(`[INFO] Found ${users.length} users to poll`);
        for (const user of users) {
            await pollSpotifyForUser(user);
        }
    });
};

module.exports = startPolling;
