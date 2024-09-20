const mongoose = require('mongoose');

// Define the Question Schema
const questionSchema = new mongoose.Schema({
    id: String,
    question: [],
});

// Create the model from the schema
const Question = mongoose.model('Question', questionSchema);

module.exports = Question;
