const express = require("express");
const router = express.Router();
const accountController = require("../../controllers/accountController");
const isLoggedIn = require("../../midllewares/middleware.js");

// All routes protected
router.use(isLoggedIn);

// Dashboard
router.get("/", accountController.accountPage);

// Profile
router.get("/profile", accountController.profilePage);
router.post("/profile", accountController.updateProfile);
router.post("/profile/change-password", accountController.changePassword);

// Orders
router.get("/orders", accountController.ordersPage);
router.get("/orders/:id", accountController.orderDetailPage);
router.post("/orders/:id/cancel", accountController.cancelOrder);

// Addresses
router.get("/addresses", accountController.addressesPage);
router.get("/addresses/add", accountController.addAddressPage);
router.post("/addresses/add", accountController.addAddress);
router.get("/addresses/edit/:id", accountController.editAddressPage);
router.post("/addresses/edit/:id", accountController.editAddress);
router.post("/addresses/delete/:id", accountController.deleteAddress);
router.post("/addresses/default/:id", accountController.setDefaultAddress);

module.exports = router;
