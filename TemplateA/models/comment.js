//mau id
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    title: { type: String, required: [true, "Name is required"] },
    body: { type: String, required: true },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    }
}, { timestamps: true })

module.exports = mongoose.model('comment', commentSchema)