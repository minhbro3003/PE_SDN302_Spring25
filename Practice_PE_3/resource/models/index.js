const mongoose = require("mongoose");
const Department = require("./department");
const Employee = require("./employee");
const Position = require("./position");

const db = {}

// Define schema
db.Department = Department;

db.Employee = Employee;

db.Position = Position;

module.exports = db;