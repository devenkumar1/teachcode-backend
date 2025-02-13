import express from 'express'
const app = express();
import cors from 'cors';
import connectDb from './db/db.config.js';
import Userrouters from './routes/routes.js';
const PORT=process.env.PORT
import cookieParser from 'cookie-parser';


app.use(cors({
  origin: process.env.FRONTEND_URL, 
  credentials: true, 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use(express.json());
app.use(cookieParser());
app.use('/api',Userrouters);
app.get('/', (req, res) => {
    res.send('Welcome to the server');
});
app.listen(PORT, () => {
  connectDb();
    console.log('Server is running on port 4500');
});