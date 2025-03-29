const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
    Title: { type: String, required: true },
    Description: { type: String, required: true },
    InstructorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "instructor", required: true
    },
    list_reviews: [{
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user", required: true
        },
        reviewtext: { type: String, required: true },
        rating: { type: Number, required: true },
        reviewDate: { type: Date, required: true },
    }],
}, { timestamps: true });

module.exports = mongoose.model("course", courseSchema);