const express = require('express');
const bodyParser = require("body-parser");
const morgan = require("morgan");
// const httpErrors = require("http-errors");
require("dotenv").config();

const connectDB = require("./config/db");
const db = require("./models");
const ApiRouter = require("./routes/GET/api.route");

const app = express();
app.use(bodyParser.json());
app.use(morgan("dev"));

//Recieve request 
app.use("/", ApiRouter);

app.get('/', async (req, res) => {
    try {
        res.send({ message: 'Welcome to Practical Exam!' });
    } catch (error) {
        res.send({ error: error.message });
    }
});

const PORT = process.env.PORT || 9999;
connectDB();
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));