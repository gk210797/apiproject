const express = require('express');
const { createUser, getUser } = require('../controllers/userController');

const router = express.Router();

// Route to create a new user
router.post('/create', createUser);

// Route to fetch a user's details
router.get('/:id', getUser);

module.exports = router;
