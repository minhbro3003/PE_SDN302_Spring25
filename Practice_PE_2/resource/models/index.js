const mongoose = require("mongoose");
const Class = require("./class");
const Student = require("./student");
const Subject = require("./subject");

const db = {}

// Define schema
db.Class = Class;

db.Student = Student;

db.Subject = Subject;

module.exports = db;