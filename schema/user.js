import mongoose from "mongoose";
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: String,
    email: {
        type:String,
      required: true
    },
    password: String,
    role: {
        type: String,
        enum: ['user', 'admin'],
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
        ref: 'progress'
    },
    courses: [{
        type: Schema.Types.ObjectId,
        ref: 'course'
    }],
    achievements: [{
        type: Schema.Types.ObjectId,
        ref: 'achievement'
    }]
});
const  User = mongoose.model('User', userSchema);
export default User;