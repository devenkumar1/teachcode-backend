const mongoose = require('mongoose');
const User = require('../schema/user');
const axios = require('axios');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const Question = require('../schema/quiz');
module.exports.register = async (req, res) => {
    // Create a new use
    try {
        const { username, email,password } = req.body;

        // Validate input fields
        if (!username || !password || !email) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if the email is already in use
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email is already in use' });
        }

        // Hash the password before saving
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create a new user
        const newUser = new User({
            username,
            password: hashedPassword,
            email
        });

        // Save the user to the database
        await newUser.save();

        // Send a success response
        res.status(201).json({ message: 'User registered successfully', user: { username, email } });

    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
module.exports.login = async (req, res) => {
    // Login a user
    try {
        console.log(req.body);
        const { email, password } = req.body;
        // Validate input fields
        if (!email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if the user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Check if the password is correct
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ message: 'Invalid email or password' }); 
            
        }

        // Create a JWT token
        const token = jwt.sign({ _id: user._id, email: email }, process.env.JWT_SECRET, { expiresIn: '30d' });

        // Send the token in the response
        res.status(200).json({ message: 'User logged in successfully', token });

    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


module.exports.quiz = async (req, res) => {
    try {
        // Call the main function to handle the quiz creation and response
        console.log(req.body);
        const quizResponse = await main(`Give me the quiz of ${req?.body?.language} and my skill level is give quiz according to the skill ${req?.body?.skillLevel}`, 'quiz'); // Adjust query as needed
        // Extract and filter questions and options
        console.log(quizResponse);
        const quizData = parseQuiz(quizResponse?.data?.answer);
        const answers = extractAnswers(quizResponse?.data?.answer);
        // Generate a unique quiz ID
        const uuid = uuidv4();
        // Save the quiz data to the database
        const newQuiz = new Question({ id: uuid, question: quizData });
        newQuiz.save();
        res.status(200).json({ success: true, quizId: uuid, data: quizData });
    } catch (error) {
        console.error('Error generating quiz:', error);
        res.status(500).json({ success: false, message: 'Error generating quiz' });
    }
};

// Function to create a chat session
async function createChatSession() {
    try {
        const response = await axios.post(
            'https://api.on-demand.io/chat/v1/sessions',
            {
                pluginIds: ['plugin-1726452418','plugin-1726569757'],
                externalUserId: 'test'
            },
            {
                headers: {
                    apikey: process.env.ON_DEMAND_API_KEY
                }
            }
        );
        return response.data.data.id; // Extract session ID
    } catch (error) {
        console.error('Error creating chat session:', error);
        throw error;
    }
}

// Function to submit a query to the session for quiz generation
async function submitQuery(sessionId, userQuery) {
    try {
        const response = await axios.post(
            `https://api.on-demand.io/chat/v1/sessions/${sessionId}/query`,
            {
                endpointId: 'predefined-openai-gpt4o',
                query: userQuery,
                pluginIds: ['plugin-1726452418','plugin-1726569757'],
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

// Main function to execute the API calls and return the generated quiz
async function main(userQuery, type) {
    try {
        const sessionId = await createChatSession();
        var queryResponse;
        if (type == 'quiz') {
            queryResponse = await submitQuery(sessionId, userQuery);
        }
        else {
            queryResponse = await submitQueryForMentor(sessionId, userQuery);
        }
        return queryResponse; // Return the query response to the client
    } catch (error) {
        console.error('Error in main function:', error);
        throw error;
    }
}

// Helper function to parse quiz data
function parseQuiz(quizText) {
    const lines = quizText.split('\n').filter(line => line.trim() !== '');
    const quiz = [];

    let question = '';
    let options = [];
    let correctAnswer = '';

    lines.forEach((line) => {
        if (line.match(/^\d+\./)) {
            // New question detected (e.g., "1. What is C++?")
            if (question && options.length > 0) {
                quiz.push({ question, options, correctAnswer });
            }
            question = line.replace(/^\d+\.\s*/, ''); // Remove number prefix
            options = [];
            correctAnswer = '';
        } else if (line.match(/^\s*- [a-d]\)/i)) {
            // Option detected (e.g., "- a) A programming language")
            const optionText = line.trim().replace(/^\s*- [a-d]\)\s*/, ''); // Remove option prefix
            options.push(optionText);

            // You can define logic to determine the correct answer here
            // In this example, we assume the correct answer is based on a specific keyword (like '**')
            if (line.includes('**')) {
                correctAnswer = optionText;
            }
        }
    });

    // Push the last question and its options
    if (question && options.length > 0) {
        quiz.push({ question, options, correctAnswer });
    }

    return quiz;
}

// Helper function to extract the answers from the quiz text
function extractAnswers(response) {
    const quizText = response
    const lines = quizText.split('\n').filter(line => line.trim() !== '');

    // Find the "Answers:" line and extract the answers after it
    const answerStartIndex = lines.findIndex(line => line.startsWith('Answers:'));

    if (answerStartIndex === -1) {
        return []; // Return an empty array if no "Answers:" section is found
    }

    const answers = lines.slice(answerStartIndex + 1) // Skip the "Answers:" line
        .filter(line => line.match(/^\d+\.\s+\w/)) // Match answer lines like "1. a", "2. b"
        .map(line => {
            const [questionNumber, answer] = line.split('.');
            return { questionNumber: questionNumber.trim(), answer: answer.trim() };
        });

    return answers;
}

module.exports.matchanswer = async (req, res) => {
    try {
        const { quizId, answers } = req.body;
        const quiz = await Question.findOne({
            id: quizId
        });
        if (!quiz) {
            return res.status(404).json({ success: false, message: 'Quiz not found' });
        }
        const quizResponse = await main(`${quiz} these are the question and these are the answer ${answers} givem e score of that and based on there skill and also correct them `, 'quiz');
        console.log(quizResponse);
        if (quizResponse?.data?.answer) {
            const score = quizResponse.data.answer;
            res.status(200).json({ success: true, score });
        } else {
            res.status(400).json({ success: false, message: 'Error matching answers' });
        }
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }

}

module.exports.mentor = async (req, res) => {
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
module.exports.learningPath = async (req, res) => {
    try {
        const { skill, skillLevel } = req.body;

        if (!skill || !skillLevel) {
            return res.status(400).json({ success: false, message: 'Skill and skill level are required' });
        }
        const learningPathResponse = await main(`Give me the learning path for ${skill} with the this previous knowledge ${skillLevel} make good roadmap  `, 'learningPath');
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
module.exports.code = async (req, res) => {
    try {
        const { code, language } = req.body;
        if (!code || !language) {
            return res.status(400).json({ success: false, message: 'Language and code are required' });
        }
        const codeResponse = await main(`This is the language ${language}code  and this is the code only tell weather this code is wrong or right if wrong so output the error and provide the correct  output and give me in forrmated  ${code}  and if code is correct so print the output `, 'code');
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
