const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

const authMiddleware = (req, res, next) => {
    console.log("checkToken", req.headers.token);
    const token = req.headers.token?.split(" ")[1];
    if (!token) {
        return res.status(401).json({
            message: "Access denied. No token provided.",
            status: "Error",
        });
    }
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            // console.log("JWT Verify Error:", err);
            return res.status(404).json({
                message: "Invalid token",
                status: "Error",
            });
        }
        if (decoded?.role) {
            next();
        } else {
            return res.status(404).json({
                message: "Permission denied",
                status: "Error",
            });
        }
        // console.log("decoded", decoded);
    });
};

const authUserMiddleware = (req, res, next) => {
    // console.log("checkToken", req.headers.token);
    const token = req.headers.token?.split(" ")[1];
    const userId = req.params.id;
    if (!token) {
        return res.status(401).json({
            message: "Access denied. No token provided.",
            status: "Error",
        });
    }
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(404).json({
                message: "Invalid token",
                status: "Error",
            });
        }
        // console.log("decoded", decoded);
        if (decoded?.role || decoded?.id === userId) {
            next();
        } else {
            return res.status(404).json({
                message: "Permission denied",
                status: "Error",
            });
        }
        // console.log("decoded", decoded);
    });
};

module.exports = {
    authMiddleware,
    authUserMiddleware,
};