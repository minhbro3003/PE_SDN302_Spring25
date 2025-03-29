const mongoose = require("mongoose");

const directorSchema = new mongoose.Schema({
    fullname: { type: String, required: true },
    dob: { type: Date, required: true },
    nationality: { type: String, required: true },
    createAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }

});

module.exports = mongoose.model("director", directorSchema);