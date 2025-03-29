const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema({
    Name: { type: String, required: [true, "The department title is required"] },
    Code: { type: String, required: true },

});

module.exports = mongoose.model("department", departmentSchema);