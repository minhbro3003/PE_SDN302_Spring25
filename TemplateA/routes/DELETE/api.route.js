const express = require("express");
const db = require("../../models");
const bcrypt = require("bcryptjs");

const ApiRouter = express.Router();


//delete employee by id
ApiRouter.delete("/employees/:id", async (req, res) => {
    try {
        const { id } = req.params;

        // Tìm nhân viên cần xóa
        const employee = await db.Employee.findById(id).populate("Departments");

        if (!employee) {
            return res.status(404).json({ error: "Employee not found." });
        }

        // Kiểm tra từng phòng ban mà nhân viên đang thuộc về
        for (const department of employee.Departments) {
            const count = await db.Employee.countDocuments({ Departments: department._id });

            if (count === 1) { // Nếu chỉ còn duy nhất 1 người (chính nhân viên đang xóa)
                return res.status(400).json({
                    error: "Cannot delete the last employee in a department."
                });
            }
        }

        // Nếu không vi phạm điều kiện, tiến hành xóa nhân viên
        await db.Employee.findByIdAndDelete(id);

        res.status(200).json({ message: "Employee deleted successfully." });

    } catch (error) {
        res.status(500).json({
            error: {
                status: 500,
                message: error.message
            }
        });
    }
});



module.exports = ApiRouter;
