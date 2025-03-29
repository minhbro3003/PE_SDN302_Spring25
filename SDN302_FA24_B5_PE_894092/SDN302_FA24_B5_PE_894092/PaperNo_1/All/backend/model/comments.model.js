const mongoose = require("mongoose");

const commentsSchema = new mongoose.Schema({
    username: { type: String, required: true },
    text: { type: String, required: true },
    createAt: { type: Date, default: Date.now }
}, { versionKey: false });

module.exports = mongoose.model("comments", commentsSchema);