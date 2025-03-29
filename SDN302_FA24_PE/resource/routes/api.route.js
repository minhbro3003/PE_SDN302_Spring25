const express = require("express");
const db = require("../models");
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");

const ApiRouter = express.Router();

// JWT Authentication Middleware
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ message: "Access token is required" });
        }

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is not defined in environment variables");
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(403).json({ message: "Invalid token" });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: "Token has expired" });
        }
        next(error);
    }
};

// 
ApiRouter.get('/employee/list', async (req, res, next) => {
    try {
        const employee = await db.Employee.find()
            .populate("jobs", "")
            .populate("department",)
        res.json(employee.map(emp => ({
            employeeId: emp._id,
            fullName: `${emp.name.firstName} ${emp.name.middleName} ${emp.name.lastName}`,
            email: emp.account.email,
            department: emp.department.name,
            jobs: emp.jobs.map(job => ({
                name: job.name,
                issues: job.issues.map(issue => ({
                    title: issue.title,
                    isCompleted: issue.isCompleted
                }))
            }))
        })));
    } catch (error) {
        next(error);
    }
})

ApiRouter.get('/department/:departmentId', async (req, res, next) => {
    try {
        const { departmentId } = req.params;
        const department = await db.Department.findById(departmentId)

        if (!department) {
            return res.status(404).json({ message: 'department not found' });
        }

        const employees = await db.Employee.find({ department: departmentId })
            .populate("department")

        const formatData = {
            department: department.name,
            manager: null,
            employees: employees.map(emp => ({
                employeeId: emp._id,
                fullName: `${emp.name.firstName} ${emp.name.middleName} ${emp.name.lastName}`,

            }))
        }
        const manager = employees.find(emp => emp._id.toString() === employees[0].manager?.toString());

        if (manager) {
            formatData.manager =
                `${manager.name.firstName} ${manager.name.middleName} ${manager.name.lastName}`

        }
        res.json(formatData)
    } catch (error) {
        next(error);
    }
})

ApiRouter.post("/employee/:employeeId/add-job", async (req, res, next) => {
    try {
        const { employeeId } = req.params;
        const { name, issues, startDate, endDate } = req.body;

        //check employee ton tai 
        const employee = await db.Employee.findById(employeeId)
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        //create new job 
        const newJob = await db.Job.create({ name, issues, startDate, endDate });
        await newJob.validate();

        //save job
        await newJob.save();

        //update job list in employee 
        employee.jobs.push(newJob._id);
        await employee.save();

        //format data 
        const formatDat = {
            employeeId: employee._id,
            fullName: `${employee.name.firstName} ${employee.name.middleName} ${employee.name.lastName}`,
            jobsList: employee.jobs
        }
        res.status(201).json({
            message: 'Add a new job successfully',
            result: formatDat
        })
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(500).json({
                error: {
                    status: 500,
                    message: `job validation failed: ${error.path}: Cast to ${error.kind} failed for value '${error.value}' (type ${typeof error.value}) at path '${error.path}'`
                }
            });
        }

        // Xử lý lỗi khác
        res.status(500).json({
            error: {
                status: 500,
                message: error.message
            }
        });
    }
});

ApiRouter.post('/departments/create', async (req, res, next) => {
    try {
        const { name, description, employees } = req.body;

        // Create new department
        const newDepartment = await db.Department.create({
            name,
            description
        });

        // Process employees
        const createdEmployees = await Promise.all(employees.map(async (employeeData) => {
            // Hash password
            const hashedPassword = await bcrypt.hash(employeeData.account.password, 10);

            // Create employee with hashed password
            const employee = await db.Employee.create({
                ...employeeData,
                account: {
                    ...employeeData.account,
                    password: hashedPassword
                },
                department: newDepartment._id,
                manager: null, // Set manager as null initially
                dependents: [], // Initialize empty dependents array
                jobs: [] // Initialize empty jobs array
            });

            return employee;
        }));

        // Format response
        const response = {
            message: "Create a new department and add employees successfully",
            result: {
                departmentId: newDepartment._id,
                departmentName: newDepartment.name,
                employeesList: createdEmployees.map(emp => ({
                    name: `${emp.name.firstName} ${emp.name.middleName} ${emp.name.lastName}`
                }))
            }
        };

        res.status(201).json(response);
    } catch (error) {
        res.status(500).json({
            error: {
                status: 500,
                message: error.message
            }
        })
    }
});

ApiRouter.post("/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by account.email
        const user = await db.Employee.findOne({ "account.email": email });
        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        const isPasswordValid = await bcrypt.compare(password, user.account.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid password" });
        }

        // Ensure JWT key exists
        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is not defined in environment variables");
        }

        // Create Access Token with correct user data
        const accessToken = jwt.sign(
            {
                userId: user._id,
                email: user.account.email,
                fullName: `${user.name.firstName} ${user.name.middleName} ${user.name.lastName}`,
                department: user.department
            },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.status(200).json({
            message: "Login successful",
            token: accessToken,
            // user: {
            //     id: user._id,
            //     fullName: `${user.name.firstName} ${user.name.middleName} ${user.name.lastName}`,
            //     email: user.account.email,
            //     department: user.department
            // }
        });

    } catch (error) {
        res.status(500).json({
            error: {
                status: 500,
                message: error.message
            }
        })
    }
})

ApiRouter.get("/dashboard", authenticateToken, async (req, res) => {
    try {
        const user = await db.Employee.findById(req.user.userId)
            .populate("department", "name");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({
            message: "Welcome to the Dashboard!",
            user: {
                id: user._id,
                email: user.account.email,
                department: user.department.name
            }
        });
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
