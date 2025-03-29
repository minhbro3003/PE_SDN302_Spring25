const express = require("express");
const db = require("../models");


const ApiRouter = express.Router();

// Create user
ApiRouter.post("/create", async (req, res, next) => {
    try {
        const { gmail, password, name, phone, address, role } = req.body;
        const newUser = await db.User.create({ gmail, password, name, phone, address, role });
        //Insert one
        await newUser.save().then(newDoc => {
            res.status(201).json({
                message: "User created successfully",
                result: {
                    userCode: newDoc._id,
                    gmail: newDoc.gmail,
                    password: newDoc.password,
                    name: newDoc.name,
                    phone: newDoc.phone,
                    address: newDoc.address,
                    role: newDoc.role
                }
            });
        });
    } catch (error) {
        res.status(500).json({
            error: {
                status: 500,
                message: error.message
            }
        })
    }
});

module.exports = ApiRouter;

const formatData = filteredEmployee.map(e => ({
    _id: e._id,
    FullName: `${e.FullName.FirstName} ${e.FullName.LastName || ""}`.trim(),// nối chuỗi 
    BasicSalary: e.BasicSalary,
    TotalSalary: e.BasicSalary * e.Position.Coefficient, //Object => populate("")

    Departments: e.Departments.map(d => d.Name),//lấy 1 trường 

    Departments: e.Departments.map(d => ({
        Name: d.Name,
        Code: d.Code
    })), //lấy nhiều trường 
    Departments: e.Departments.map(d => {
        console.log("Processing department:", d.Name);
        return {
            Name: d.Name,
            Code: d.Code
        };
    }),

    Position: {
        Name: e.Position.Name,
        Coefficient: e.Position.Coefficient
    },
    Position: e.Position.Name //Object => populate("")
}))

// {
//     "_id": "6489c29fae513b6ee8c6a007",
//         "FullName": {
//         "FirstName": "Nguyen",
//             "LastName": "Anh"
//     },
//     "BasicSalary": 1000,
//         "TotalSalary": 1500,
//             "Departments": [
//                 {
//                     "Name": "Human Resources",
//                     "Code": "HR001"
//                 },
//                 {
//                     "Name": "IT Department",
//                     "Code": "IT002"
//                 }
//             ],
//                 "Position": {
//         "Name": "Manager",
//             "Coefficient": 1.5
//     }
// },