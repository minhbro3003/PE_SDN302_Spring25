const mongoose = require("mongoose");

const instructorSchema = new mongoose.Schema({
    FullName: {
        FirstName: { type: String, required: true },
        LastName: { type: String, required: true },

    },
    bio: { type: String, required: true },
});

module.exports = mongoose.model("instructor", instructorSchema);