const express = require('express');
const router = express.Router();
const { register, login, getUsers } = require('../controllers/authController');
const { authenticate, isAdmin } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/users', authenticate, isAdmin, getUsers);

module.exports = router;
