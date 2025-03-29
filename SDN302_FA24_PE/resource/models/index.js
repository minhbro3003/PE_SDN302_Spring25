const mongoose = require("mongoose");
const Department = require("./department");
const Employee = require("./employee");
const Job = require("./job");

const db = {}

// Define schema
db.Department = Department
db.Employee = Employee
db.Job = Job



module.exports = db;