const express = require("express");
const router = express.Router();
const adminController = require("../../controllers/adminController");
const isAdminLoggedIn = require("../../midllewares/adminMiddleware");
const { upload } = require("../../config/cloudinary");

// Disable global layout for ALL admin routes
router.use( (req, res, next) => {
    res.locals.layout = false;
    next();
});

// Public routes
router.get("/login", adminController.loginPage);
router.post("/login", adminController.login);
router.post("/logout", adminController.logout);

// Protected routes
router.use( isAdminLoggedIn); 

router.get("/dashboard", adminController.dashboard);

// PRODUCTS
router.get("/products", adminController.productsPage);
router.post("/products/add", upload.single("image"), adminController.addProduct);
router.get("/products/:id", adminController.getProduct);
router.post("/products/:id/edit", upload.single("image"), adminController.editProduct);
router.post("/products/:id/delete", adminController.deleteProduct);

// ORDERS
router.get("/orders", adminController.ordersPage);
router.get("/orders/:id", adminController.orderDetailPage);
router.post("/orders/:id/status", adminController.updateOrderStatus);
// CUSTOMERS
router.get("/customers", adminController.customersPage);
router.get("/customers/:id", adminController.customerDetailPage);
// REVIEWS
router.get("/reviews", adminController.reviewsPage);
router.post("/reviews/:id/delete", adminController.deleteReview);
// SETTINGS
router.get("/settings", adminController.settingsPage);
router.post("/settings/store", adminController.updateStoreSettings);
router.post("/settings/delivery", adminController.updateDeliverySettings);
module.exports = router;