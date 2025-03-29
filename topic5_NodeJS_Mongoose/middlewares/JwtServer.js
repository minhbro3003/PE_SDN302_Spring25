const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

const generateAccessToken = async (payload) => {
    // console.log("payload", payload);
    const access_token = jwt.sign(
        {
            ...payload,
        },
        process.env.ACCESS_TOKEN,
        { expiresIn: "30m" }
    );
    return access_token;
};

const generateRefreshToken = async (payload) => {
    const refresh_token = jwt.sign(
        {
            ...payload,
        },
        process.env.REFRESH_TOKEN,
        { expiresIn: "365d" }
    );
    return refresh_token;
};

const refreshTokenJwtService = async (token) => {
    if (!token) {
        return {
            status: "ERR",
            message: "No refresh token provided",
        };
    }

    try {
        const decoded = jwt.verify(token, process.env.REFRESH_TOKEN);

        // Kiểm tra token hợp lệ
        if (!decoded?.id) {
            return {
                status: "ERR",
                message: "Invalid token payload",
            };
        }

        // Tạo access token mới
        const access_token = await generateAccessToken({
            id: decoded.id,
            role: decoded.role,
        });

        return {
            status: "OK",
            message: "Token refreshed successfully",
            access_token,
        };
    } catch (err) {
        console.error("Token verification error:", err);
        return {
            status: "ERR",
            message: "Invalid or expired refresh token",
        };
    }
};


//export const genneral
module.exports = {
    generateAccessToken,
    generateRefreshToken,
    refreshTokenJwtService,
};