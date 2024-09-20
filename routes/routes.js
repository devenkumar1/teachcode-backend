const express = require('express');
const router = express();
const userController = require('../controllers/userController.js');
require('../db/db.config.js');


//user
router.post('/register', userController.register);
router.post('/login', userController.login);

// quiz
router.post('/quiz', userController.quiz);
router.post('/matchanswer', userController.matchanswer);

// Mentor
router.post('/mentor', userController.mentor);

router.post('/learningPath', userController.learningPath);

router.post('/code', userController.code);
module.exports = router;