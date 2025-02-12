import express from 'express'
import cookieParser from 'cookie-parser';
const router = express();
import {mentor,register,login,quiz,matchanswer,learningPath,code} from '../controllers/userController.js'

//user
router.post('/register',register);
router.post('/login', login);

// quiz
router.post('/quiz', quiz);
router.post('/matchanswer', matchanswer);

router.get('/logout', async(req, res) => {
   await res.cookie("token", "", { httpOnly: true, sameSite: "Lax", secure: process.env.NODE_ENV === 'production', path: '/' });
    return res.status(200).json({ message: "logout successful" });
    
  });
  
// Mentor
router.post('/mentor',mentor);

router.post('/learningPath', learningPath);

router.post('/code', code);

export default router;