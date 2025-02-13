import User from '../schema/user.js';
import jwt from 'jsonwebtoken';

export const meUser = async (req, res, next) => {
    try {
        const token = req.cookies.token; 
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const decoded =  jwt.verify(token, process.env.JWT_SECRET);
        const id = decoded._id;
        const user = await User.findById(id).select("-password");
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
};