
const Customer = require("../models/customer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { generateAccessToken, generateRefreshToken, refreshTokenJwtService } = require("../middlewares/JwtServer");


exports.getAllCustomer = async (req, res) => {
    try {
        const customers = await Customer.find()
        // .populate('categoryId', 'name description -_id')
        if (!customers) {
            res.status(404).json({
                message: 'Customers not found'
            })
        }
        const formatData = customers.map((c) => {
            return {
                id: c._id,
                name: c.name,
                email: c.email,
                phone: c.phone,
                address: c.addresses.map(addr =>
                    `${addr.street}, ${addr.city}, ${addr.state}, ${addr.country}`
                ).join(" | "),
                role: c.role
            }
        })
        res.status(200).json(formatData)
    } catch (error) {
        console.log("Error Retching all customer failed: ", error);
        res.status(500).json({
            message: error.message
        })
    }
}

exports.getCustomerById = async (req, res) => {
    try {
        const id = req.params.id
        const customer = await Customer.findById(id)
        // .populate('categoryId', 'name description -_id')
        if (!customer) {
            res.status(404).json({
                message: 'Customer not found'
            })
        }
        const formatData = {
            customerId: customer._id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            addresses: customer.addresses.map(addr =>
                `${addr.street}, ${addr.city}, ${addr.state}, ${addr.country}`
            ).join(" | "),
            role: customer.role
        }

        res.status(200).json(formatData)
    } catch (error) {
        console.log("Error Retching all Customers failed: ", error);
        res.status(500).json({
            message: error.message
        })
    }
}

//sign-up
exports.createCustomer = async (req, res) => {
    try {
        const { name, email, password, phone, addresses, role } = req.body;

        const existingAccount = await Customer.findOne({ email })
        if (existingAccount) {
            return res.status(400).json({ message: `${email} already exists` })
        }

        //create
        const newAccount = new Customer({ name, email, password, phone, addresses, role })

        await newAccount.save();

        res.status(201).json({
            customerId: newAccount._id,
            name: newAccount.name,
            email: newAccount.email,
            phone: newAccount.phone,
            role: newAccount.role,
            addresses: newAccount.addresses,
        })
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
}

exports.updateCustomer = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, email, password, phone, addresses, role } = req.body;

        const customer = await Customer.findById(id);

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        // Nếu có password mới thì hash lại
        if (password) {
            const salt = await bcrypt.genSalt(10);
            customer.password = await bcrypt.hash(password, salt);
        }

        customer.name = name;
        customer.email = email;
        customer.phone = phone;
        // customer.password = password;
        customer.addresses = addresses;
        customer.role = role;

        const updateDoc = await customer.save();

        res.status(200).json({
            message: 'Update successfully',
            updateData: updateDoc
        });
    } catch (error) {
        console.log("Failed to update", error);
        res.status(500).json({
            message: error.message
        })
    }
};

exports.deleteProduct = async (req, res, next) => {
    try {
        //const {id} = req.params;
        const id = req.params.id;
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const delDoc = await Product.findByIdAndDelete(id).exec()

        res.status(200).json({
            message: 'Deleted successfully',
            deleteData: delDoc
        })
    } catch (error) {
        // next(error);
        res.status(500).json({
            message: error.message
        })
    }
}

//sign-in
exports.loginAccount = async (req, res) => {
    try {
        const { email, password } = req.body;

        const account = await Customer.findOne({ email })
        if (!account) {
            return res.status(400).json({ message: "Email not found" })
        }

        const isPasswordValid = await bcrypt.compare(password, account.password)
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Password incorrect" })
        }

        // Generate access token
        const access_token = await generateAccessToken({
            id: account._id,
            role: account.role,
        });

        // Generate refresh token
        const refresh_token = await generateRefreshToken({
            id: account._id,
            role: account.role
        });

        // Lưu refresh token vào HTTP-only cookie
        res.cookie("refreshToken", refresh_token, {
            httpOnly: true,   // Bảo vệ chống XSS
            secure: true,     // Chỉ hoạt động trên HTTPS
            sameSite: "Strict", // Chống CSRF
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 ngày
        });

        return res.status(200).json({
            status: "OK",
            message: "Login successful",
            access_token,
            refresh_token,
            user: {
                customerId: account._id,
                name: account.name,
                role: account.role
                // email: account.email,
                // phone: account.phone,
            }
        });

    } catch (error) {
        console.log("Login error: " + error)
        res.status(500).json({
            message: error.message
        })
    }
}

exports.refreshToken = async (req, res) => {
    // console.log("req.cookies.refresh_token: ", req.cookies.refresh_token);
    try {
        // const token = req.cookies.refresh_token;
        const token = req.headers.token.split(" ")[1];
        console.log("token: ", token)
        if (!token) {
            return res.status(200).json({
                status: "ERR",
                message: "The token is required",
            });
        }
        const user = await refreshTokenJwtService(token);

        return res.status(200).json(user);
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
};

exports.updateCustomerAddress = async (req, res) => {
    try {
        const { id, addressId } = req.params; // Lấy từ params thay vì body
        if (!id) {
            return res.status(400).json({ message: "Customer ID is required" });
        }

        const { name, email, phoneNumber, password, addresses } = req.body;
        if (!name && !email && !phoneNumber && !password && !addresses) {
            return res.status(400).json({ message: "Please provide at least one field to update" });
        }

        const updateData = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (phoneNumber) updateData.phoneNumber = phoneNumber;
        if (password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(password, salt);
        }

        let customer;
        if (addressId) {
            // Cập nhật một địa chỉ cụ thể
            if (!addresses) {
                return res.status(400).json({ message: "Address details are required for update" });
            }

            const { street, city, state, country } = addresses;
            const addressUpdate = {};
            if (street) addressUpdate["address.$.street"] = street;
            if (city) addressUpdate["address.$.city"] = city;
            if (state) addressUpdate["address.$.state"] = state;
            if (country) addressUpdate["address.$.country"] = country;

            customer = await Customer.findOneAndUpdate(
                { _id: id, "addresses._id": addressId },
                { $set: addressUpdate },
                { new: true }
            );

            if (!customer) {
                return res.status(404).json({ message: "Customer or address not found" });
            }
        } else if (addresses) {
            // Thay thế toàn bộ danh sách địa chỉ
            updateData.addresses = addresses;
            customer = await Customer.findByIdAndUpdate(id, updateData, { new: true });

            if (!customer) {
                return res.status(404).json({ message: "Customer not found" });
            }
        } else {
            // Cập nhật thông tin chung của customer
            customer = await Customer.findByIdAndUpdate(id, updateData, { new: true });

            if (!customer) {
                return res.status(404).json({ message: "Customer not found" });
            }
        }

        return res.status(200).json({
            message: "Update customer successfully",
            data: {
                customerName: customer.name,
                email: customer.email,
                phoneNumber: customer.phoneNumber,
                addresses: customer.addresses.map((addr) => ({
                    addressId: addr._id,
                    Address: `${addr.street}, ${addr.city}, ${addr.state}, ${addr.country}`,
                })),
            },
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.loginCustomer = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await Customer.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid password" });
        }

        // Tạo Access Token
        const accessToken = jwt.sign(
            { userId: user._id, email: user.email, name: user.name },
            process.env.JWT_KEY,
            { expiresIn: "1h" }
        );

        res.status(200).json({
            status: "OK",
            message: "Login successful",
            accessToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
            }
        });
    } catch (error) {
        console.error("Login error: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
};



// exports.addNewCustomer = async (req, res) => {
//     try {
//         if (!req.body) {
//             res.status(400).json({ message: "Bad request" })
//         }
//         const newCustomer = req.body;
//         const insertCustomer = new Customer(newCustomer);
//         await insertCustomer.save()
//             .then(newDoc => res.status(201).json({
//                 customerId: newDoc._id,
//                 name: newDoc.name,
//                 email: newDoc.email,
//                 password: newDoc.password,
//                 phone: newDoc.phone,
//                 address: newDoc.addresses
//             }));
//     } catch (error) {
//         console.log("Customer insert failed: ", error);
//         res.status(500).json({
//             message: error.message
//         })
//     }
// }