const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    name: {
        firstName: { type: String, required: true, },
        lastName: { type: String, required: true, },
        middleName: { type: String, required: true }
    },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ['male', 'female', 'other'], required: true },
    manager: { type: String },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "department" },
    account: {
        email: { type: String, required: true },
        password: { type: String, required: true }
    },
    dependents: [{
        _id: { type: mongoose.Schema.Types.ObjectId },
        fullname: { type: String, required: true },
        relation: { type: String, required: true }
    }],
    jobs: [{ type: mongoose.Schema.Types.ObjectId, ref: "job", }]
});
module.exports = mongoose.model('employee', employeeSchema);