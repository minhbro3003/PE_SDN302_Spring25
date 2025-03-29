const express = require('express');
const { getAllProducts, addNewProduct, getProductById,
    ordersProduct, deleteProduct, updateProduct,
    getOrderByCustomer,
    getProductsInOrder,
    getAllProductsOrder,
    searchProductByName,
    getProductsByCategoryId,
    checkProductStock,
    getTotalRevenue,
    getMostPopularProduct,
    getOrdersByMonth,
    getProductSalesByCategory,
    getCustomerOrdersCount,
    getCategorySales,
    getSumDoanhThu
} = require('../controllers/productController');
const { authMiddleware, authUserMiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.post('/', authMiddleware, addNewProduct);
router.delete("/:id", authMiddleware, deleteProduct);
router.put("/:id", authMiddleware, updateProduct)

router.post('/orders', ordersProduct);
router.get("/orders/customer/:id", authUserMiddleware, getOrderByCustomer);
router.get("/orders/:id/order", authMiddleware, getProductsInOrder);
router.get("/orders/get-all", authMiddleware, getAllProductsOrder)
router.get("/search/product", searchProductByName)

//thống kê sản phẩm theo danh mục
router.get('/product/:categoryId/category', getProductsByCategoryId);
//check hàm tồn kho
router.post('/product/:productId', checkProductStock);
//tính tổng tiền của tất cả đơn hàng.
router.get('/orders/revenue', getTotalRevenue);
//Tìm sản phẩm có số lượng bán cao nhất.
router.get('/products/popular', getMostPopularProduct);
//Thống kê đơn hàng theo tháng
router.get('/orders/:year/:month', getOrdersByMonth);
// Tính tổng số sản phẩm đã bán theo danh mục
router.get('/products/sales/category', getProductSalesByCategory);
////Đếm số lượng đơn hàng của từng khách hàng
router.get('/orders/count/:customerId', getCustomerOrdersCount);
//// Doanh thu theo danh mục sản phẩm
router.get('/products/sales/:categoryId', getCategorySales);
//tính tổng doanh thu từ ngày này đến ngày này.
router.get('/orders/doanhthu', getSumDoanhThu);

module.exports = router;