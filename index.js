const express = require('express');
const app = express();
const cors = require('cors');
const routes = require('./routes/routes');

app.use(cors());
app.use(express.json());
app.use(routes);
app.get('/', (req, res) => {
    res.send('Welcome to the server');
});
app.listen(4500, () => {
    console.log('Server is running on port 3000');
});