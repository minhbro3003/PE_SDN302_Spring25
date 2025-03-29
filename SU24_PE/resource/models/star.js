const mongoose = require("mongoose");

const starSchema = new mongoose.Schema({
    fullname: { type: String, required: true },
    male: { type: Boolean, required: true },
    dob: { type: Date, required: true },
    nationality: { type: String, required: true },

}, { timestamps: true });

module.exports = mongoose.model("star", starSchema);