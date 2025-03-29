const mongoose = require("mongoose");

const positionSchema = new mongoose.Schema({
    Name: { type: String, required: [true, "The position title is required"] },
    Coefficient: { type: Number, required: true },
});

module.exports = mongoose.model("position", positionSchema);