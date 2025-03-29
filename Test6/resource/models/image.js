// models/Image.model.js
const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema({
    path: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    caption: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("image", imageSchema);