const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema({
    Code: { type: String, required: true },
    Name: { type: String, required: true },
    Credit: { type: Number, required: true },

});

module.exports = mongoose.model("subject", subjectSchema);