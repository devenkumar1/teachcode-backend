import express from 'express'
const router = express();
import {mentor,register,login,quiz,matchanswer,learningPath,code} from '../controllers/userController.js'

//user
router.post('/register',register);
router.post('/login', login);

// quiz
router.post('/quiz', quiz);
router.post('/matchanswer', matchanswer);

// Mentor
router.post('/mentor',mentor);

router.post('/learningPath', learningPath);

router.post('/code', code);

export default router;