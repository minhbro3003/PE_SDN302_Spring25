const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema({
    FullName: {
        FirstName: { type: String, required: true },
        LastName: { type: String }
    },
    BasicSalary: { type: Number, required: true },

    Departments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "department",
        required: true
    }],
    Position: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "position",
        required: true
    },

});

module.exports = mongoose.model("employee", employeeSchema);