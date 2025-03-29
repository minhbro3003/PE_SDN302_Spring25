const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    name: { type: String, required: true },
    issues: [
        {
            title: { type: String, required: true },
            date: { type: Date },
            isCompleted: { type: Boolean }
        }
    ]
});
const Job = mongoose.model('job', jobSchema);
module.exports = Job;