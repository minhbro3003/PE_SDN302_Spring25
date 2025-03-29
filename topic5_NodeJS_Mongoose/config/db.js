const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const connectionDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected successfully");

    } catch (err) {
        console.log("Connection to MongoDB failed: ", err);
        process.exit(1);
    }
}

module.exports = connectionDB;
