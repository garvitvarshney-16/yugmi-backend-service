const express = require('express');
const authController = require('../controllers/authController');
const { validateUserRegistration, validateLogin } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/register', validateUserRegistration, authController.register);
router.post('/login', validateLogin, authController.login);
router.get('/profile', authenticateToken, authController.getProfile);

module.exports = router;