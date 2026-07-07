const Product = require("../models/product");
const { all } = require("../routes/client/clientRoutes");
const User = require("../models/user");
const Cart = require("../models/cart");
const Order = require("../models/order");
const Address = require("../models/address");
const Wishlist = require("../models/wishlist");
const Review = require("../models/review");
const Settings = require("../models/settings");
const bcrypt = require("bcrypt");
module.exports = {
    home: async (req, res) => {
        const products = await Product.find().limit(3);
        res.render("pages/client/home", { products });
        console.log(req.session);
    },

allProducts: async (req, res) => {
    try {
        let filter = {};

        if (req.query.category) {
            filter.category = req.query.category;
        }

        if (req.query.price) {
            if (req.query.price === "under200") {
                filter["prices.250"] = { $lt: 200 };
            } else if (req.query.price === "200to300") {
                filter["prices.250"] = { $gte: 200, $lte: 300 };
            } else if (req.query.price === "above300") {
                filter["prices.250"] = { $gt: 300 };
            }
        }

        if (req.query.search) {
            filter.name = { $regex: req.query.search, $options: "i" };
        }

        let productsQuery = Product.find(filter);

        if (req.query.sort) {
            if (req.query.sort === "lowtohigh") {
                productsQuery = productsQuery.sort({ "prices.250": 1 });
            } else if (req.query.sort === "hightolow") {
                productsQuery = productsQuery.sort({ "prices.250": -1 });
            } else if (req.query.sort === "newest") {
                productsQuery = productsQuery.sort({ createdAt: -1 });
            }
        }

        const products = await productsQuery;

        // ADD THIS
        const wishlistIds = req.user
            ? (await Wishlist.find({ user: req.user._id }).select("product"))
                .map(w => w.product.toString())
            : [];

        res.render("pages/client/products", {
            products,
            query: req.query,
            wishlistIds  // ADD THIS
        });

    } catch (err) {
        console.log(err);
        // Instead of res.redirect("/")
        return res.status(404).render("pages/error", {
            layout: false,
            status: 404,
            title: "Order Not Found",
            message: "This order doesn't exist or you don't have permission to view it."
        });
            }
},

productDetails: async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        const reviews = await Review.find({ product: req.params.id })
            .populate("user", "name")
            .sort({ createdAt: -1 });

        // Average rating
        const avgRating = reviews.length
            ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
            : null;

        // Check if logged in user already reviewed
        const userReview = req.user
            ? await Review.findOne({ user: req.user._id, product: req.params.id })
            : null;

        // Check if user purchased this product
        const hasPurchased = req.user
            ? await Order.findOne({
                user: req.user._id,
                "items.product": req.params.id,
                orderStatus: "Delivered"
            })
            : null;

        const wishlistIds = req.user
            ? (await Wishlist.find({ user: req.user._id }).select("product"))
                .map(w => w.product.toString())
            : [];

        const isWishlisted = wishlistIds.includes(product._id.toString());

        res.render("pages/client/productDetails", {
            product,
            isWishlisted,
            reviews,
            avgRating,
            userReview,
            hasPurchased,
            reviewSuccess: req.query.reviewSuccess || null,
            reviewError: req.query.reviewError || null
        });

    } catch (err) {
        console.log(err);
        res.redirect("/products");
    }
},
signupPage: (req,res)=>{
    res.render("pages/client/signup");
},
signup: async (req, res) => {

    try {

        const { name, email, password } = req.body;

        const existingUser =
            await User.findOne({ email });

        if (existingUser) {

            req.flash(
                "error",
                "Email is already registered"
            );

            return res.redirect("/signup");

        }

        const hashedPassword =
            await bcrypt.hash(password, 10);

        const newUser = new User({

            name,
            email,
            password: hashedPassword

        });
        
        await newUser.save();

        req.session.userId = newUser._id;

        req.flash(
            "success",
            "Welcome to Safalam!"
        );

        res.redirect("/");

    }

    catch (err) {

        console.log(err);

        return res.status(500).render(
            "pages/error",
            {
                layout: false,
                status: 500,
                title: "Something Went Wrong",
                message: "We're having trouble on our end. Please try again in a moment."
            }
        );

    }

},
loginPage: (req,res)=>{

    res.render("pages/client/login");

},
login: async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            req.flash("error", "Invalid Email or Password");
            return res.redirect("/login");
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            req.flash("error", "Invalid Email or Password");
            return res.redirect("/login");
        }

        req.session.userId = user._id;
        const redirectUrl = req.session.redirectUrl || "/";
        delete req.session.redirectUrl;
        res.redirect(redirectUrl);

    } catch (err) {
        console.log(err);
        return res.status(500).render("pages/error", {
            layout: false,
            status: 500,
            title: "Something Went Wrong",
            message: "We're having trouble on our end. Please try again in a moment."
        });
    }
},
logout: (req,res)=>{

    req.session.destroy((err)=>{

        if(err){

            console.log(err);

            return res.redirect("/");

        }

        res.clearCookie("connect.sid");

        res.redirect("/");

    });

},
cartPage: async (req, res) => {

    try {

        const cartItems = await Cart.find({
            user: req.user._id
        }).populate("product");

        let subtotal = 0;

        cartItems.forEach(item => {

            subtotal +=
                item.product.prices[item.weight]
                * item.quantity;

        });

        const settings = await Settings.findOne();
       const freeDeliveryThreshold =
    settings?.freeDeliveryThreshold ?? 1000;
        const deliveryCharge =
    subtotal < (settings?.freeDeliveryThreshold ?? 1000)
    && subtotal > 0

    ? (settings?.deliveryCharge ?? 49)

    : 0;

        const total = subtotal + deliveryCharge;

        res.render(
            "pages/client/cart",
            {
                cartItems,
                subtotal,
                deliveryCharge,
                total,
                freeDeliveryThreshold
                
            }
        );

    }

    catch (err) {

        console.log(err);

        // Instead of res.redirect("/")
    return res.status(404).render("pages/error", {
        layout: false,
        status: 404,
        title: "Order Not Found",
        message: "This order doesn't exist or you don't have permission to view it."
    });

    }

},
buyNow: async (req, res) => {
    try {
        const { productId, weight, quantity } = req.body;
        const qty = parseInt(quantity) || 1;

        // Store buy now item in session
        req.session.buyNow = {
            productId,
            weight,
            quantity: qty
        };

        res.redirect("/checkout/address?mode=buynow");

    } catch (err) {
        console.log(err);
        res.redirect("/products");
    }
},
addToCart: async (req, res) => {
    try {
        const { productId, weight, quantity, redirectUrl } = req.body;
        const qty = parseInt(quantity) || 1;

        const existing = await Cart.findOne({
            user: req.user._id,
            product: productId,
            weight
        });

        if (existing) {
            existing.quantity += qty;
            await existing.save();
        } else {
            await Cart.create({
                user: req.user._id,
                product: productId,
                weight,
                quantity: qty
            });
        }

        const safeRedirect = redirectUrl || "/products";
        res.redirect(safeRedirect + "?added=true");

    } catch (err) {
        console.log(err);
        res.redirect("/products");
    }
},
removeFromCart: async(req,res)=>{

    try{

        await Cart.findByIdAndDelete(
            req.params.id
        );

        res.redirect("/cart");

    }

    catch(err){

        console.log(err);

        res.redirect("/cart");

    }

},
increaseQuantity: async(req,res)=>{

    try{

        const cartItem = await Cart.findOne({

            _id: req.params.id,

            user: req.user._id

        });

        if(!cartItem)
            return res.redirect("/cart");

        cartItem.quantity++;

        await cartItem.save();

        res.redirect("/cart");

    }

    catch(err){

        console.log(err);

        res.redirect("/cart");

    }

},
decreaseQuantity: async(req,res)=>{

    try{

        const cartItem = await Cart.findOne({

            _id: req.params.id,

            user: req.user._id

        });

        if(!cartItem)
            return res.redirect("/cart");

        if(cartItem.quantity > 1){

            cartItem.quantity--;

            await cartItem.save();

        }
        else{

           await Cart.findOneAndDelete({

                _id: req.params.id,

                user: req.user._id

            });

        }

        res.redirect("/cart");

    }

    catch(err){

        console.log(err);

        res.redirect("/cart");

    }

},
addressPage: async (req, res) => {

    try {

        const isBuyNow = req.query.mode === "buynow";

        // Only check cart when NOT using Buy Now
        if (!isBuyNow) {

            const cartCount = await Cart.countDocuments({
                user: req.user._id
            });

            if (cartCount === 0) {
                req.flash("error", "Your cart is empty.");
                return res.redirect("/cart");
            }

        }

        const addresses = await Address.find({
            user: req.user._id
        });

        res.render(
            "pages/client/address",
            {
                addresses,
                isBuyNow
            }
        );

    }

    catch (err) {

        console.log(err);

        req.flash("error", "Something went wrong.");

        return res.redirect("/cart");

    }

},
saveAddress: async(req,res)=>{

    try{

        const {
            fullName,
            phone,
            house,
            city,
            district,
            state,
            pincode,
            landmark
        } = req.body;
        if (!fullName || !phone || !house || !city || !district || !state || !pincode) {
            return res.redirect("/checkout/address?error=All fields required");
        }
        const address = await Address.create({

            user:req.user._id,

            fullName,
            phone,
            house,
            city,
            district,
            state,
            pincode,
            landmark

        });

        return res.redirect(
            `/checkout/summary?addressId=${address._id}`
        );

    }
    catch(err){

        console.log(err);

        return res.redirect(
            "/checkout/address"
        );

    }

},
summaryPage: async (req, res) => {
    try {
        const address = await Address.findById(req.query.addressId);
        const isBuyNow = req.query.mode === "buynow";

        let cartItems;

        if (isBuyNow && req.session.buyNow) {
            const { productId, weight, quantity } = req.session.buyNow;
            const product = await Product.findById(productId);
            cartItems = [{ product, weight, quantity, _id: "buynow" }];
        } else {
            cartItems = await Cart.find({ user: req.user._id }).populate("product");
        }

        let subtotal = 0;
        cartItems.forEach(item => {
            subtotal += item.product.prices[item.weight] * item.quantity;
        });

        const settings = await Settings.findOne();
        const freeDeliveryThreshold =
    settings?.freeDeliveryThreshold ?? 1000;
        const deliveryCharge =
    subtotal < (settings?.freeDeliveryThreshold ?? 1000)
    && subtotal > 0

    ? (settings?.deliveryCharge ?? 49)

    : 0;
        const total = subtotal + deliveryCharge;

        res.render("pages/client/summary", {
            address,
            cartItems,
            subtotal,
            deliveryCharge,
            total,
            isBuyNow,
            freeDeliveryThreshold
        });

    } catch (err) {
        console.log(err);
        res.redirect("/checkout/address");
    }
},
paymentPage: async (req, res) => {
    try {
        console.log("query:", req.query);
        const address = await Address.findById(req.query.addressId); // was req.body
        const isBuyNow = req.query.mode === "buynow";  
         console.log("address:", address); 
        

        let cartItems;

        if (isBuyNow && req.session.buyNow) {
            const { productId, weight, quantity } = req.session.buyNow;
            const product = await Product.findById(productId);
            cartItems = [{ product, weight, quantity, _id: "buynow" }];
        } else {
            cartItems = await Cart.find({ user: req.user._id }).populate("product");
        }

        let subtotal = 0;
        cartItems.forEach(item => {
            subtotal += item.product.prices[item.weight] * item.quantity;
        });

        const settings = await Settings.findOne();
        const freeDeliveryThreshold =
    settings?.freeDeliveryThreshold ?? 1000;
        const deliveryCharge =
    subtotal < (settings?.freeDeliveryThreshold ?? 1000)
    && subtotal > 0

    ? (settings?.deliveryCharge ?? 49)

    : 0;
        const total = subtotal + deliveryCharge;

                     // was missing

        res.render("pages/client/payment", {
            address,
            cartItems,
            subtotal,
            deliveryCharge,
            total,
            isBuyNow,
            freeDeliveryThreshold
        });

    } catch (err) {
        console.log(err);
        res.redirect("/checkout/summary");
    }
},
placeOrder: async (req, res) => {
    try {
        
        const { addressId, paymentMethod, mode } = req.body;
        const isBuyNow = mode === "buynow";

        let subtotal = 0;
        const orderItems = [];

        if (isBuyNow && req.session.buyNow) {

            const { productId, weight, quantity } = req.session.buyNow;
            const product = await Product.findById(productId);

            if (!product) {
                return res.redirect("/products");
            }

            const price = product.prices[weight];
            subtotal = price * quantity;

            orderItems.push({
                product: product._id,
                weight,
                quantity,
                price
            });

            // Clear buy now session
            req.session.buyNow = null;

        } else {

            const cartItems = await Cart.find({
                user: req.user._id
            }).populate("product");

            cartItems.forEach(item => {
                const price = item.product.prices[item.weight];
                subtotal += price * item.quantity;
                orderItems.push({
                    product: item.product._id,
                    weight: item.weight,
                    quantity: item.quantity,
                    price
                });
            });

            // Empty cart only for normal checkout
            await Cart.deleteMany({ user: req.user._id });
        }

        const settings = await Settings.findOne();
        const deliveryCharge = subtotal < (settings?.freeDeliveryThreshold ?? 1000) && subtotal > 0
            ? (settings?.deliveryCharge ?? 49)
            : 0;

        const total = subtotal + deliveryCharge;

        const order = await Order.create({
            user: req.user._id,
            items: orderItems,
            address: addressId,
            subtotal,
            deliveryCharge,
            total,
            paymentMethod
        });

        return res.redirect(`/order/success/${order._id}`);

    }  catch (err) {
        console.log(err);
        const { addressId, mode } = req.body;
        const resolvedId = Array.isArray(addressId)
            ? addressId.find(id => id && id.length === 24)
            : addressId;
        // Redirect back with params so payment page doesn't crash
        return res.redirect(
            `/checkout/paymentPage?addressId=${resolvedId}${mode === "buynow" ? "&mode=buynow" : ""}`
        );
    }
},
orderSuccess: async(req,res)=>{

    try{

        const order = await Order.findById(
            req.params.id
        );

        if(!order){

            return res.redirect("/");
        }

        res.render(

            "pages/client/success",

            {

                order

            }

        );

    }

    catch(err){

        console.log(err);

        res.redirect("/");
    }

},
toggleWishlist: async (req, res) => {
    try {
        const { productId } = req.params;

        const existing = await Wishlist.findOne({
            user: req.user._id,
            product: productId
        });

        if (existing) {
            await Wishlist.findByIdAndDelete(existing._id);
            return res.json({ status: "removed", message: "Removed from wishlist" });
        } else {
            await Wishlist.create({
                user: req.user._id,
                product: productId
            });
            return res.json({ status: "added", message: "Added to wishlist!" });
        }

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Something went wrong" });
    }
},

wishlistPage: async (req, res) => {
    try {
        const wishlistItems = await Wishlist.find({
            user: req.user._id
        }).populate("product");

        res.render("pages/client/account/wishlist", {
            user: req.user,
            wishlistItems,
            activePage: "wishlist"
        });
    } catch (err) {
        console.log(err);
        res.redirect("/account");
    }
},
submitReview: async (req, res) => {
    try {

        
        const { rating, comment } = req.body;
        const productId = req.params.id;
        
        // Check if user purchased this product
        const hasPurchased = await Order.findOne({
            user: req.user._id,
            "items.product": productId,
            orderStatus: "Delivered"
        });

        if (!hasPurchased) {
            return res.redirect(`/products/${productId}?reviewError=You can only review products you have purchased`);
        }

        // Upsert — update if exists, create if not
        await Review.findOneAndUpdate(
            { user: req.user._id, product: productId },
            { rating: parseInt(rating), comment },
            { upsert: true, new: true }
        );

        res.redirect(`/products/${productId}?reviewSuccess=Review submitted successfully`);

    } catch (err) {
        console.log(err);
        res.redirect(`/products/${req.params.id}`);
    }
},

deleteReview: async (req, res) => {
    try {
        console.log(req.user._id);
        console.log(req.params.id);
        await Review.findOneAndDelete({
            user: req.user._id,
            product: req.params.id
        });
        res.redirect(`/products/${req.params.id}?reviewSuccess=Review deleted`);
    } catch (err) {
        console.log(err);
        res.redirect(`/products/${req.params.id}`);
    }
},
}