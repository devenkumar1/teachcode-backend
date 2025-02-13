import User from '../schema/user.js';
import axios from 'axios';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import Question from '../schema/quiz.js';

export const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !password || !email) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email is already in use' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            username,
            password: hashedPassword,
            email
        });

        await newUser.save();

        res.status(201).json({ message: 'User registered successfully', user: { username, email } });

    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const login = async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
      }
  
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }
  
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }
      const token = jwt.sign({ _id: user._id, email: email }, process.env.JWT_SECRET, { expiresIn: '30d' });
      
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'Lax', 
        maxAge: 30 * 24 * 60 * 60 * 1000, //30days
      });
  
      return res.status(200).json({ message: 'User logged in successfully',user, token });
    } catch (error) {
      console.error('Error logging in user:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
  
  export const Logout=async(req, res) => {
     try{
        res.clearCookie('token', {
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
            path: '/', 
        });
            return res.status(200).json({message: "logout successfull"})

     }catch(error){
        console.log("error occured in user logout",error);
        return res.status(500).json({message: "logout unsuccessfull"})
     }

  }
      


export const quiz = async (req, res) => {
    try {
        console.log(req.body);
        const quizResponse = await main(`Give me the quiz of ${req?.body?.language} and my skill level is give quiz according to the skill ${req?.body?.skillLevel}`, 'quiz');
        console.log(quizResponse);
        const quizData = parseQuiz(quizResponse?.data?.answer);
        const answers = extractAnswers(quizResponse?.data?.answer);

        const uuid = uuidv4();
        const newQuiz = new Question({ id: uuid, question: quizData });
        newQuiz.save();
        res.status(200).json({ success: true, quizId: uuid, data: quizData });
    } catch (error) {
        console.error('Error generating quiz:', error);
        res.status(500).json({ success: false, message: 'Error generating quiz' });
    }
};

async function createChatSession() {
    try {
        const response = await axios.post(
            'https://api.on-demand.io/chat/v1/sessions',
            {
                pluginIds: ['plugin-1726452418', 'plugin-1726569757'],
                externalUserId: 'test'
            },
            {
                headers: {
                    apikey: process.env.ON_DEMAND_API_KEY
                }
            }
        );
        return response.data.data.id;
    } catch (error) {
        console.error('Error creating chat session:', error);
        throw error;
    }
}

async function submitQuery(sessionId, userQuery) {
    try {
        const response = await axios.post(
            `https://api.on-demand.io/chat/v1/sessions/${sessionId}/query`,
            {
                endpointId: 'predefined-openai-gpt4o',
                query: userQuery,
                pluginIds: ['plugin-1726452418', 'plugin-1726569757'],
                responseMode: 'sync'
            },
            {
                headers: {
                    apikey: process.env.ON_DEMAND_API_KEY
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error submitting query:', error);
        throw error;
    }
}

async function main(userQuery, type) {
    try {
        const sessionId = await createChatSession();
        let queryResponse;
        if (type == 'quiz') {
            queryResponse = await submitQuery(sessionId, userQuery);
        } else {
            queryResponse = await submitQueryForMentor(sessionId, userQuery);
        }
        return queryResponse;
    } catch (error) {
        console.error('Error in main function:', error);
        throw error;
    }
}

function parseQuiz(quizText) {
    const lines = quizText.split('\n').filter(line => line.trim() !== '');
    const quiz = [];

    let question = '';
    let options = [];
    let correctAnswer = '';

    lines.forEach((line) => {
        if (line.match(/^\d+\./)) {
            if (question && options.length > 0) {
                quiz.push({ question, options, correctAnswer });
            }
            question = line.replace(/^\d+\.\s*/, '');
            options = [];
            correctAnswer = '';
        } else if (line.match(/^\s*- [a-d]\)/i)) {
            const optionText = line.trim().replace(/^\s*- [a-d]\)\s*/, '');
            options.push(optionText);

            if (line.includes('**')) {
                correctAnswer = optionText;
            }
        }
    });

    if (question && options.length > 0) {
        quiz.push({ question, options, correctAnswer });
    }

    return quiz;
}

function extractAnswers(response) {
    const quizText = response
    const lines = quizText.split('\n').filter(line => line.trim() !== '');

    const answerStartIndex = lines.findIndex(line => line.startsWith('Answers:'));

    if (answerStartIndex === -1) {
        return [];
    }

    const answers = lines.slice(answerStartIndex + 1)
        .filter(line => line.match(/^\d+\.\s+\w/))
        .map(line => {
            const [questionNumber, answer] = line.split('.');
            return { questionNumber: questionNumber.trim(), answer: answer.trim() };
        });

    return answers;
}

export const matchanswer = async (req, res) => {
    try {
        const { quizId, answers } = req.body;
        const quiz = await Question.findOne({
            id: quizId
        });
        if (!quiz) {
            return res.status(404).json({ success: false, message: 'Quiz not found' });
        }
        const quizResponse = await main(`${quiz} these are the question and these are the answer ${answers} give me score of that and based on their skill and also correct them `, 'quiz');
        console.log(quizResponse);
        if (quizResponse?.data?.answer) {
            const score = quizResponse.data.answer;
            res.status(200).json({ success: true, score });
        } else {
            res.status(400).json({ success: false, message: 'Error matching answers' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

export const mentor = async (req, res) => {
    try {
        console.log(req.body);
        if (!req.body.message) {
            return res.status(400).json({ success: false, message: 'Message is required' });
        }
        const mentorResponse = await main(req.body.message, 'mentor');
        if (mentorResponse?.data?.answer) {
            const mentor = mentorResponse.data.answer;
            console.log(mentor);
            res.status(200).json({ success: true, mentor: JSON.stringify(mentor) });
        } else {
            res.status(400).json({ success: false, message: 'Error finding a mentor' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

async function submitQueryForMentor(sessionId, userQuery) {
    try {
        const response = await axios.post(
            `https://api.on-demand.io/chat/v1/sessions/${sessionId}/query`,
            {
                endpointId: 'predefined-openai-gpt4o',
                query: userQuery,
                pluginIds: ['plugin-1726452418', 'plugin-1726569757'],
                responseMode: 'sync'
            },
            {
                headers: {
                    apikey: process.env.ON_DEMAND_API_KEY
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error submitting query:', error);
        throw error;
    }
}

export const learningPath = async (req, res) => {
    try {
        const { skill, skillLevel } = req.body;

        if (!skill || !skillLevel) {
            return res.status(400).json({ success: false, message: 'Skill and skill level are required' });
        }
        const learningPathResponse = await main(`Give me the learning path for ${skill} with this previous knowledge ${skillLevel} make good roadmap  `, 'learningPath');
        if (learningPathResponse?.data?.answer) {
            const learningPath = learningPathResponse.data.answer;
            console.log(learningPath);
            res.status(200).json({ success: true, learningPath });
        } else {
            res.status(400).json({ success: false, message: 'Error generating learning path' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

export const code = async (req, res) => {
    try {
        const { code, language } = req.body;
        if (!code || !language) {
            return res.status(400).json({ success: false, message: 'Language and code are required' });
        }
        const codeResponse = await main(`This is the language ${language} code and this is the code only tell whether this code is wrong or right if wrong so output the error and provide the correct output and give me in formatted ${code} and if code is correct so print the output `, 'code');
        if (codeResponse?.data?.answer) {
            const code = codeResponse.data.answer;
            console.log(code);
            res.status(200).json({ success: true, code });
        } else {
            res.status(400).json({ success: false, message: 'Error generating code' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}


export const getMe=async(req,res)=>{
    try {
        const user = req.user;
        res.status(200).json({user:user});
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};