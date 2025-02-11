import mongoose from "mongoose";
// Define the Question Schema
const questionSchema = new mongoose.Schema({
    id: String,
    question: [],
});

// Create the model from the schema
const Question = mongoose.model('Question', questionSchema);

export default Question;