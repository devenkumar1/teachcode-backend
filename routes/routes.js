import express from 'express'
import cookieParser from 'cookie-parser';
const router = express();
import {mentor,register,login,quiz,matchanswer,learningPath,code,getMe , Logout} from '../controllers/userController.js'
import { meUser } from '../middleware/meUser.js';
//user
router.post('/register',register);
router.post('/login', login);

// quiz
router.post('/quiz', quiz);
router.post('/matchanswer', matchanswer);

router.get('/logout',Logout);

  
// Mentor
router.post('/mentor',mentor);

router.post('/learningPath', learningPath);

router.post('/code', code);

router.get('/me',meUser,getMe);

export default router;