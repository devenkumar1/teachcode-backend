import mongoose from "mongoose";
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: String,
    email: String,
    password: String,
    role: {
        type: String,
        default: 'user'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    progress: {
        type: Schema.Types.ObjectId,
        ref: 'Progress'
    },
    courses: [{
        type: Schema.Types.ObjectId,
        ref: 'Course'
    }],
    achievements: [{
        type: Schema.Types.ObjectId,
        ref: 'Achievement'
    }]
});
const  User = mongoose.model('User', userSchema);
export default User;