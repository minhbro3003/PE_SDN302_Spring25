const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
    Code: { type: String, required: true },
    FullName: { type: String, required: true },
    Dob: { type: Date, required: true },
    class: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "class",
        required: true
    },

    subjects: [{
        subject: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "subject", required: true
        },
        Grade: { type: Number }
    }],


});

module.exports = mongoose.model("student", studentSchema);