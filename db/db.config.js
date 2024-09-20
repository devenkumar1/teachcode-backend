const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
mongoose.connect(process.env.MONGOSTRING).then(() => {
    console.log("Mongo is Conneted");
})
    .catch((err) => {
        console.log(err);
    })