const express = require('express');
const router = express.Router();
const { recordViolation, getAllViolations, getMyViolations, getStats } = require('../controllers/violationController');
const { authenticate, isAdmin } = require('../middleware/auth');

router.post('/violation', authenticate, recordViolation);
router.get('/violations', authenticate, isAdmin, getAllViolations);
router.get('/my-violations', authenticate, getMyViolations);
router.get('/stats', authenticate, isAdmin, getStats);

module.exports = router;
