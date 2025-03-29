const mongoose = require('mongoose');
const bcrypt = require("bcryptjs");

const customerSchema = new mongoose.Schema({
    name: { type: String, required: [true, "Name is required"] },
    email: {
        type: String,
        unique: true,
        validate: {
            validator: function (v) {
                return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v);
            },
            message: props => `${props.value} is not a valid email!`
        },
        required: [true, 'Email is required']
    },
    password: { type: String, required: [true, "Password is required"] },
    phone: {
        type: String,
        required: [true, "Phone number is required"],
        match: [/^\d{10}$/, "Phone number must be 10 digits"]
    },
    // role: { type: String, enum: ["customer", "admin"], default: "customer" },
    role: { type: Boolean, default: false },
    addresses: [
        {
            street: String,
            city: String,
            state: String,
            country: String,
        }
    ],

});

customerSchema.pre("save", async function (next) {
    if (!this.isModified("password"))
        return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
})

module.exports = mongoose.model('Customer', customerSchema);
