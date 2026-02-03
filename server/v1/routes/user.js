const express = require('express');
const userController = require('../controllers/user');

const router = express.Router();

// Onboarding route
router.post('/onboarding', userController.onboarding);

module.exports = router;