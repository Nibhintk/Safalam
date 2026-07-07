const express = require("express");
const router = express.Router();
const clientController = require("../../controllers/clientController");
const isLoggedIn = require("../../midllewares/middleware.js");
router.get("/", clientController.home);

router.get("/products",clientController.allProducts);

router.get("/products/:id", clientController.productDetails);
router.get(
    "/signup",
    clientController.signupPage
);

router.post(
    "/signup",
    clientController.signup
);
router.get("/login", clientController.loginPage);

router.post("/login", clientController.login);
router.get(
    "/logout",
    clientController.logout
);
router.post
    ("/checkout/buynow", 
    isLoggedIn,
    clientController.buyNow
);
router.get(
    "/cart",
    isLoggedIn,
    clientController.cartPage
);

router.post(
    "/cart/add",
    isLoggedIn,
    clientController.addToCart
);
router.post(
    "/cart/remove/:id",
    isLoggedIn,
    clientController.removeFromCart
);
router.post(
    "/cart/increase/:id",
    isLoggedIn,
    clientController.increaseQuantity
);

router.post(
    "/cart/decrease/:id",
    isLoggedIn,
    clientController.decreaseQuantity
);
router.get(
    "/checkout/address",
    isLoggedIn,
    clientController.addressPage
);
router.post(
    "/checkout/address",
    isLoggedIn,
    clientController.saveAddress
);
router.get(
    "/checkout/summary",
    isLoggedIn,
    clientController.summaryPage
);
router.get(
    "/checkout/paymentPage",
    isLoggedIn,
    clientController.paymentPage
);
router.post(
    "/place-order",
    isLoggedIn,
    clientController.placeOrder
);
router.get(
    "/order/success/:id",
    isLoggedIn,
    clientController.orderSuccess
);
router.post(
    "/wishlist/toggle/:productId",
     isLoggedIn,
      clientController.toggleWishlist);
router.get("/account/wishlist", 
    isLoggedIn, 
    clientController.wishlistPage);
router.post("/products/:id/review", 
    isLoggedIn, 
    clientController.submitReview);
router.post("/products/:id/review/delete", 
    isLoggedIn, 
    clientController.deleteReview);
router.get("/about", (req, res) => {
    res.render("pages/client/about");
});

router.get("/contact", (req, res) => {
    res.render("pages/client/contact");
});
module.exports = router;
