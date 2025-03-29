const mongoose = require("mongoose");
const Course = require("./course");
const Instructor = require("./instructor");
const User = require("./user");

const db = {}

// Define schema
db.Course = Course;
db.Instructor = Instructor;
db.User = User;

module.exports = db;