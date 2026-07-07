const express = require("express");
const router = express.Router();
const accountController = require("../../controllers/accountController");
const isLoggedIn = require("../../midllewares/middleware.js");

// All routes protected
router.use(isLoggedIn);

// Dashboard
router.get("/account", accountController.accountPage);

// Profile
router.get("/account/profile", accountController.profilePage);
router.post("/account/profile", accountController.updateProfile);
router.post("/account/profile/change-password", accountController.changePassword);

// Orders
router.get("/account/orders", accountController.ordersPage);
router.get("/account/orders/:id", accountController.orderDetailPage);
router.post("/account/orders/:id/cancel", accountController.cancelOrder);

// Addresses
router.get("/account/addresses", accountController.addressesPage);
router.get("/account/addresses/add", accountController.addAddressPage);
router.post("/account/addresses/add", accountController.addAddress);
router.get("/account/addresses/edit/:id", accountController.editAddressPage);
router.post("/account/addresses/edit/:id", accountController.editAddress);
router.post("/account/addresses/delete/:id", accountController.deleteAddress);
router.post("/account/addresses/default/:id", accountController.setDefaultAddress);

module.exports = router;
