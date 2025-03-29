const mongoose = require("mongoose");

const imagesSchema = new mongoose.Schema({
    path: { type: String, required: true },
    url: { type: String, required: true },
    caption: { type: String, unique: true },
    createAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("images", imagesSchema);