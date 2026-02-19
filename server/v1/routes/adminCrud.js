const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/adminAuth');
const productController = require('../controllers/productController');
const adminAuthController = require('../controllers/adminAuth.controller');
// Apply auth middleware to all admin routes
// router.use(authMiddleware);

// admin pass by key
router.post('/create', adminAuthController.createAdmin);
router.post('/login', adminAuthController.loginAdmin);
router.post('/logout', adminAuthController.logoutAdmin);
router.get('/status', adminAuthController.adminStatus);



// CREATE
// router.post('/products', productController.addProduct);

// // READ
// router.get('/products', productController.getProducts);
// // router.get('/products/:id', productController.getProductById);
// // UPDATE
// router.put('/products/:id', productController.updateProduct);

// // DELETE
// router.delete('/products/:id', productController.deleteProduct);
// // In your routes file (e.g. items.js)

module.exports = router;
 