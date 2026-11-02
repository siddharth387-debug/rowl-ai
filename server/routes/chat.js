const router = require('express').Router();
const chatController = require('../controllers/chatController');

router.post('/send', chatController.sendMessage);
router.get('/history/:sessionId', chatController.getSessionHistory);
router.get('/user-session/:userId', chatController.getLatestUserSession);

module.exports = router;