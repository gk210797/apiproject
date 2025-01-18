const User = require('../models/User');
const mongoose = require('mongoose');
// Create a new user
const createUser = async (req, res) => {
    try {
        const { name, email, spotifyId } = req.body;

        // Check if the user already exists
        const existingUser = await User.findOne({ spotifyId });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create a new user
        const user = new User({ name, email, spotifyId });
        await user.save();

        res.status(201).json({ message: 'User created successfully', user });
    } catch (error) {
        console.error('Error creating user:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get user details
// const getUser = async (req, res) => {
//     try {
//         const user = await User.findById(new mongoose.Types.ObjectId(req.params.id));

//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         res.status(200).json({ user });
//     } catch (error) {
//         console.error('Error fetching user:', error.message);
//         res.status(500).json({ message: 'Server error' });
//     }
// };
const getUser = async (req, res) => {
    try {
        const { id } = req.params;

        

        const user = await User.findOne({_id:req.params.id});

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({ success: true, user });
    } catch (error) {
        console.error('Error fetching user:', error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = { createUser, getUser };
