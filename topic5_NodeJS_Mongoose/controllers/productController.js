const Product = require("../models/product");
const Order = require("../models/order");
const Customer = require("../models/customer");
const Category = require("../models/category");
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");

exports.getAllProducts = async (req, res) => {
    try {
        let { page, limit } = req.query;

        page = parseInt(page) || 1;
        limit = parseInt(limit) || 10;
        const skip = (page - 1) * limit;

        const totalProducts = await Product.countDocuments();
        const products = await Product.find()
            .populate('categoryId', 'name')
            .skip(skip)
            .limit(limit)

        const formatData = products.map((p) => ({
            productId: p._id,
            name: p.name,
            price: p.price,
            stock: p.stock,
            category: p.categoryId.name
            // category: p.categoryId ? {
            //     id: p.categoryId._id,
            //     name: p.categoryId.name,
            //     description: p.categoryId.description
            // } : null
        }));

        res.status(200).json({
            currentPage: page,
            totalPages: Math.ceil(totalProducts / limit),
            totalProducts,
            products: formatData
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


exports.getProductById = async (req, res) => {
    try {
        const id = req.params.id
        const products = await Product.findById(id)
            .populate('categoryId')
        if (!products) {
            res.status(404).json({
                message: 'Product not found'
            })
        }
        const formatData = {
            id: products._id,
            name: products.name,
            price: products.price,
            stock: products.stock,
            category: products.categoryId ? {
                id: products.categoryId._id,
                name: products.categoryId.name,
                description: products.categoryId.description
            } : null
        }
        res.status(200).json(formatData)
    } catch (error) {
        // console.log("Error Retching all products failed: ", error);
        res.status(500).json({
            message: error.message
        })
    }
}

// exports.addNewProduct = async (req, res) => {
//     try {
//         if (!req.body) {
//             res.status(400).json({ message: "Bad request" })
//         }
//         const newProduct = req.body;
//         const insertProduct = new Product(newProduct);
//         await insertProduct.save()
//             .then(newDoc => res.status(201).json({
//                 productId: newDoc._id,
//                 name: newDoc.name,
//                 price: newDoc.price,
//                 stock: newDoc.stock,
//                 categoryId: newDoc.categoryId
//             }));
//     } catch (error) {
//         console.log("Product insert failed: ", error);
//         res.status(500).json({
//             message: error.message
//         })
//     }
// }
exports.addNewProduct = async (req, res) => {
    try {
        if (!req.body) {
            return res.status(400).json({ message: "Bad request" });
        }

        const newProduct = new Product(req.body);
        const savedProduct = await newProduct.save();

        // Populate categoryId để lấy thông tin chi tiết
        const populatedProduct = await Product.findById(savedProduct._id).populate("categoryId");

        return res.status(201).json({
            productId: populatedProduct._id,
            name: populatedProduct.name,
            price: populatedProduct.price,
            stock: populatedProduct.stock,
            category: populatedProduct.categoryId ? {
                id: populatedProduct.categoryId._id,
                name: populatedProduct.categoryId.name,
                description: populatedProduct.categoryId.description
            } : null
        });

    } catch (error) {
        console.log("Product insert failed: ", error);
        res.status(500).json({
            message: error.message
        });
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

//update product
exports.updateProduct = async (req, res) => {
    try {
        //const {id} = req.params;
        const id = req.params.id;
        const { name, price, stock, categoryId } = req.body
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        //update action 
        product.name = name;
        product.price = price;
        product.stock = stock;
        product.categoryId = categoryId;

        const updateDoc = await product.save();

        res.status(200).json({
            message: 'Update successfully',
            updateData: updateDoc
        })
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
}

exports.ordersProduct = async (req, res) => {
    try {
        const { customerId, products } = req.body;

        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).json({ message: "Customer not found" });
        }

        const productMap = new Map();

        for (const item of products) {
            if (productMap.has(item.productId)) {
                productMap.get(item.productId).quantity += item.quantity;
            } else {
                productMap.set(item.productId, { ...item });
            }
        }

        const uniqueProducts = Array.from(productMap.values());

        let totalPrice = 0;

        for (const item of uniqueProducts) {
            const product = await Product.findById(item.productId);
            if (!product) {
                return res.status(404).json({ message: `Product not found: ${item.productId}` });
            }

            if (product.stock < item.quantity) {
                return res.status(400).json({ message: `Not enough stock for product ${product.name}` });
            }

            totalPrice += product.price * item.quantity;
        }

        for (const item of uniqueProducts) {
            await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } });
        }

        const newOrder = new Order({
            customerId,
            products: uniqueProducts,
            totalPrice
        });

        await newOrder.save();

        res.status(201).json(newOrder);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


//lay danh sach don hang cua khach hang id
exports.getOrderByCustomer = async (req, res, next) => {
    try {
        const { id } = req.params;
        const order = await Order.find({ customerId: id })
            .populate("products.productId")

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const customer = await Customer.findById(id);



        const formatData = order.map(o => {
            let formattedDOB = null;
            if (o.orderDate) {
                const [year, month, day] = o.orderDate.toISOString().split("T")[0].split("-");
                formattedDOB = `${day}-${month}-${year}`;
            }
            return {
                orderId: o._id,
                orderDate: formattedDOB,
                totalPrice: o.totalPrice,
                products: o.products.map(p => ({
                    productId: p._id,
                    name: p.name,
                    price: p.productId.price,
                    quantity: p.quantity
                })),
                customer: {
                    customerId: customer._id,
                    name: customer.name,
                    phone: customer.phone,
                    // address: customer.addresses ,
                    address: customer.addresses.map(addr =>
                        `${addr.street}, ${addr.city}, ${addr.state}, ${addr.country}`
                    ).join(" | "),
                }
            }

        })

        res.status(200).json(formatData);
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }

}

// Lấy danh sách sản phẩm trong đơn hàng
exports.getProductsInOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const order = await Order.findById({ _id: id })
            .populate("products.productId")

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const formatData = order.products.map(p => ({
            productId: p._id,
            name: p.name,
            price: p.productId.price,
            quantity: p.quantity
        }))

        res.status(200).json(formatData);
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
}

// Lấy tat ca san pham order 
exports.getAllProductsOrder = async (req, res) => {
    try {
        const order = await Order.find()
            .populate('customerId')
            .populate("products.productId")
        // .populate('categoryId', 'name description -_id')

        if (!order) {
            res.status(404).json({
                message: 'Order not found'
            })
        }
        const formatDate = (date) => {
            const d = new Date(date);
            const day = String(d.getDate()).padStart(2, '0');  // Thêm số 0 nếu cần
            const month = String(d.getMonth() + 1).padStart(2, '0'); // Tháng tính từ 0 nên +1
            const year = d.getFullYear();
            return `${day}/${month}/${year}`;
        };

        const formatData = order.map((o) => {
            return {
                orderId: o._id,
                totalPrice: o.totalPrice,
                orderDate: formatDate(o.orderDate),// Định dạng dd/mm/yyyy
                customerName: o.customerId.name,
                products: o.products.map(p => ({
                    productId: p._id,
                    name: p.name,
                    price: p.productId.price,
                    quantity: p.quantity
                })),
            }
        })
        res.status(200).json(formatData)
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
}

//search product by name
exports.searchProductByName = async (req, res) => {
    try {
        const { name } = req.query;

        if (!name) {
            return res.status(400).json({ message: "Product name is required" });
        }

        const products = await Product.find({
            name: { $regex: name, $options: "i" }
        });

        if (!products.length) {
            return res.status(404).json({ message: "No products found" });
        }

        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

//thống kê sản phẩm theo danh mục
exports.getProductsByCategoryId = async (req, res, next) => {
    try {
        const { categoryId } = req.params;

        const products = await Product.find({ categoryId })
            .populate({
                path: 'categoryId',
            });

        if (!products) {
            return res.status(404).json({ message: 'No products found in this category' });
        }

        const formatData = products.map(p => ({
            name: p.name,
            price: p.price,
            stock: p.stock
        }));

        res.status(200).send(formatData);
    } catch (error) {
        next(error);
    }
};

//Kiểm tra product tồn kho

// {
//     "productId": "67bc266781fd62dc583929a0",
//     "quantity": 11
// }
exports.checkProductStock = async (req, res, next) => {
    try {
        const { productId, quantity } = req.body;

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (product.stock < quantity) {
            return res.status(400).json({ message: 'Not enough stock' });
        }

        res.status(200).json({ message: 'Stock check successful' });
    } catch (error) {
        next(error);
    }
};

//Thống kê tổng doanh thu
//Tính tổng tiền của tất cả đơn hàng

exports.getTotalRevenue = async (req, res, next) => {
    try {
        const orders = await Order.find({});

        if (!orders) {
            return res.status(404).json({ message: 'No orders found' });
        }

        const totalRevenue = orders.reduce((total, order) => total + order.totalPrice, 0);

        res.status(200).json({ totalRevenue });
    } catch (error) {
        next(error);
    }
};

//Thống kê sản phẩm bán chạy
//Tìm sản phẩm có số lượng bán cao nhất.

exports.getMostPopularProduct = async (req, res, next) => {
    try {

        const orders = await Order.find({});
        console.log("Orders fetched:", orders.length);

        if (!orders || orders.length === 0) {
            console.log("No orders found.");
            return res.status(404).json({ message: "No orders found" });
        }

        let productSales = {};

        orders.forEach(order => {
            order.products.forEach(item => {
                const productId = item.productId.toString();
                productSales[productId] = (productSales[productId] || 0) + item.quantity;
            });
        });

        console.log("Product sales data:", productSales);

        let mostPopularProductId = Object.keys(productSales).reduce((maxProductId, productId) =>
            productSales[productId] > (productSales[maxProductId] || 0) ? productId : maxProductId,
            Object.keys(productSales)[0]);

        console.log("Most popular product ID:", mostPopularProductId);

        if (!mostPopularProductId) {
            console.log("No products sold yet.");
            return res.status(404).json({ message: "No products sold yet" });
        }

        const mongoose = require("mongoose");
        const productObjectId = new mongoose.Types.ObjectId(mostPopularProductId);

        console.log("Converted to ObjectId:", productObjectId);

        const popularProduct = await Product.findById(productObjectId);

        if (!popularProduct) {
            console.log("Product not found in database.");
            return res.status(404).json({ message: "Product not found" });
        }

        console.log("Most popular product details:", popularProduct);

        res.status(200).json({
            popularProduct,
            totalSold: productSales[mostPopularProductId]
        });

    } catch (error) {
        console.error("Error in getMostPopularProduct:", error);
        next(error);
    }
};

//Thống kê đơn hàng theo tháng
exports.getOrdersByMonth = async (req, res, next) => {
    try {
        let { year, month } = req.params;

        year = parseInt(year);
        month = parseInt(month);

        if (!year || !month || isNaN(year) || isNaN(month) || month < 1 || month > 12) {
            return res.status(400).json({ message: "Invalid year or month" });
        }

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        console.log(`Fetching orders from ${startDate} to ${endDate}`);

        const orders = await Order.find({
            orderDate: { $gte: startDate, $lte: endDate }
        });

        res.status(200).json({
            totalOrders: orders.length,
            orders
        });

    } catch (error) {
        next(error);
    }
};


// Tính tổng số sản phẩm đã bán theo từng danh mục
exports.getProductSalesByCategory = async (req, res, next) => {
    try {
        const orders = await Order.find({});
        if (!orders.length) {
            return res.status(404).json({ message: "Không có đơn hàng nào." });
        }

        let salesByCategory = {};

        for (let order of orders) {
            for (let item of order.products) {
                const product = await Product.findById(item.productId);
                if (product) {
                    const categoryId = product.categoryId.toString();

                    if (!salesByCategory[categoryId]) {
                        salesByCategory[categoryId] = 0;
                    }

                    salesByCategory[categoryId] += item.quantity;
                }
            }
        }

        let result = [];
        for (let categoryId in salesByCategory) {
            const category = await Category.findById(categoryId);
            result.push({
                category: category ? category.name : "Unknown",
                totalSold: salesByCategory[categoryId]
            });
        }

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

//Đếm số lượng đơn hàng của từng khách hàng
exports.getCustomerOrdersCount = async (req, res) => {
    try {
        const { customerId } = req.params;

        const orders = await Order.find({ customerId })
            .populate({
                path: 'customerId',
            })
            .populate({
                path: 'products',
            });

        if (!orders) {
            return res.status(404).json({ message: 'No orders found for this customer' });
        }


        res.status(200).send({
            totalOrders: orders.length,
        });
    } catch (error) {
        next(error);
    }
};

// Doanh thu theo danh mục sản phẩm
exports.getCategorySales = async (req, res, next) => {
    try {
        const { categoryId } = req.params;

        const productsInCategory = await Product.find({ categoryId: categoryId }).select('_id price');

        if (productsInCategory.length === 0) {
            return res.status(404).json({ message: 'Không có sản phẩm nào trong danh mục này' });
        }

        const productPriceMap = new Map();
        const productIds = productsInCategory.map(product => {
            productPriceMap.set(product._id.toString(), product.price);
            return product._id;
        });

        console.log("Danh sách sản phẩm:", productIds);

        const orders = await Order.find({ 'products.productId': { $in: productIds } });

        if (orders.length === 0) {
            return res.status(404).json({ message: 'Không có đơn hàng nào chứa sản phẩm thuộc danh mục này' });
        }

        console.log("Danh sách đơn hàng:", orders);

        let totalSales = 0;

        totalSales = orders.reduce((sum, order) => {
            return sum + order.products.reduce((orderSum, item) => {
                const productIdStr = item.productId.toString();
                const price = productPriceMap.get(productIdStr) || 0;
                return orderSum + item.quantity * price;
            }, 0);
        }, 0);


        res.status(200).json({ totalSales });
    } catch (error) {
        console.error("Lỗi:", error);
        next(error);
    }
};

//tính tổng doanh  thu từ ngày này đến ngày này.
exports.getSumDoanhThu = async (req, res, next) => {
    try {
        let { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ message: "Vui lòng cung cấp startDate và endDate hợp lệ" });
        }

        const formatDate = (dateString) => {
            const parts = dateString.split(/[-\/]/);
            if (parts.length !== 3) return null;

            let [day, month, year] = parts.map(Number);
            if (year < 1000) {
                [year, month, day] = parts.map(Number);
            }

            if (month > 12) [day, month] = [month, day];

            return !isNaN(new Date(year, month - 1, day).getTime())
                ? `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`
                : null;
        };

        startDate = formatDate(startDate);
        endDate = formatDate(endDate);

        if (!startDate || !endDate) {
            return res.status(400).json({ message: "Ngày tháng không hợp lệ" });
        }

        const parseDate = (dateStr) => {
            const [day, month, year] = dateStr.split('-').map(Number);
            return new Date(year, month - 1, day);
        };

        const start = parseDate(startDate);
        const end = parseDate(endDate);

        end.setHours(23, 59, 59, 999);

        const orders = await Order.find({
            orderDate: { $gte: start, $lte: end }
        }).populate('products.productId', 'price');

        if (orders.length === 0) {
            return res.status(404).json({ message: "Không có đơn hàng nào trong khoảng thời gian này" });
        }

        let totalCost = orders.reduce((acc, order) => {
            order.products.forEach(item => {
                const product = item.productId;
                if (product) {
                    acc += item.quantity * product.price;
                }
            });
            return acc;
        }, 0);

        res.status(200).json({ totalCost });

    } catch (error) {
        console.error(error);
        next(error);
    }
};
