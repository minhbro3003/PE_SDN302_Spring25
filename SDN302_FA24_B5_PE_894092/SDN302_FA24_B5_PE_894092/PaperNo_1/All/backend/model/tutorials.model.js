const mongoose = require("mongoose");

const tutorialsSchema = new mongoose.Schema({
    title: { type: String, required: true },
    author: { type: String, required: true },
    images: [{
        _id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "images",
        },
        url: { type: String },
        caption: { type: String },
    }],
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "comments"
    }],
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "categories"
    }
});

module.exports = mongoose.model("tutorials", tutorialsSchema);