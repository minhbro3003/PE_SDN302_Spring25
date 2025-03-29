const mongoose = require("mongoose");

// Define schema
const userSchema = new mongoose.Schema({
    gmail: { type: String, required: [true, "Gmail is required"], unique: true },
    password: { type: String, required: [true, "Password is required"] },
    name: { type: String, required: [true, "Name is required"] },
    phone: {
        type: String,
        match: [/^\d{10}$/, "Phone number must be 10 digits"]
    },
    age: {
        type: Number,
        min: [18, 'it nhat 18 t'],
        max: 50
    },
    address: { type: String },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    createdAt: { type: Date, default: Date.now },

    email: {
        type: String, required: true, unique: true,
        match: [/^\S+@\S+\.\S+$/, "Email không hợp lệ"]
    },

    genres: [{
        type: String, required: true,
        enum: {
            values: ["Comedy", "Action", "Drama", "Cartoon"],
            message: "{VALUE} is not supported"
        }
    }],

    producer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "producer",
        required: true
    },

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);

/////
const mongoose = require("mongoose");

const instructorSchema = new mongoose.Schema({
    name: { type: String, required: [true, "The name is required"] },
    email: { type: String, required: true, unique: true },
    expertise: { type: String, required: true },
    producer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "producer",
        required: true
    },
});

module.exports = mongoose.model("instructor", instructorSchema);