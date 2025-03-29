const mongoose = require("mongoose");

const classSchema = new mongoose.Schema({
    Code: { type: String, required: true },
    Name: { type: String, required: true },

});

module.exports = mongoose.model("class", classSchema);