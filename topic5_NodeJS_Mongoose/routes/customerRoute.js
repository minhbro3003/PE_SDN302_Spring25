const express = require('express');
const { loginAccount, createCustomer, getAllCustomer,
    getCustomerById, updateCustomer,
    refreshToken,
    updateCustomerAddress
} = require('../controllers/userController');
const { authMiddleware, authUserMiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post("/sign-up", createCustomer)
router.post("/sign-in", loginAccount)
router.post("/refresh-token", refreshToken);
router.get("", authMiddleware, getAllCustomer)
router.patch('/:id/address/:addressId', updateCustomerAddress);
router.get("/:id", authUserMiddleware, getCustomerById)
router.put("/:id", authUserMiddleware, updateCustomer)




module.exports = router;