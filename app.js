require("dotenv").config();

const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;

const expressLayouts = require('express-ejs-layouts');
const clientRoutes = require("./routes/client/clientRoutes");
const adminRoutes = require("./routes/admin/adminRoutes");
const accountRoutes = require("./routes/client/accountRoutes");
const flash = require("connect-flash");
const Product = require("./models/product.js");
const User = require("./models/user");
const Admin = require("./models/admin"); // adjust to your actual admin model
const Cart = require("./models/cart");
const helmet = require("helmet");

// ---------- MongoDB Connection ----------
async function main() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("Connected to MongoDB");
    } catch (err) {
        console.log("Error connecting to MongoDB:", err);
    }
}
main();
app.use(helmet({ contentSecurityPolicy: false }));

// ---------- View Engine ----------
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "layout/boilerplate");

// ---------- Base Middleware ----------
app.set("trust proxy", 1);
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ---------- SEPARATE SESSIONS FOR USER AND ADMIN ----------
const mongoStore = MongoStore.create({ mongoUrl: process.env.MONGO_URL });

const userSession = session({
    name: "user.sid",              // distinct cookie name
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    store: mongoStore,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7,
        path: "/"                  // sent on every request, but that's fine since name differs
    }
});

const adminSession = session({
    name: "admin.sid",             // distinct cookie name
    secret: process.env.ADMIN_SECRET_KEY || process.env.SECRET_KEY, // ideally a different secret
    resave: false,
    saveUninitialized: false,
    store: mongoStore,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7,
        path: "/admin"              // only sent for /admin routes
    }
});

// Route each request to the correct session middleware based on path
app.use((req, res, next) => {
    if (req.path.startsWith("/admin")) {
        return adminSession(req, res, next);
    }
    return userSession(req, res, next);
});

app.use(flash());

// ---------- Load current USER (non-admin routes) ----------
app.use(async (req, res, next) => {
    if (req.path.startsWith("/admin")) return next(); // handled below

    try {
        if (req.session.userId) {
            const user = await User.findById(req.session.userId);
            req.user = user;
            res.locals.user = user;

            const cartItems = await Cart.find({ user: user._id });
            let cartCount = 0;
            cartItems.forEach(item => { cartCount += item.quantity; });
            res.locals.cartCount = cartCount;
        } else {
            res.locals.user = null;
            res.locals.cartCount = 0;
        }
        next();
    } catch (err) {
        console.log(err);
        next();
    }
});

// ---------- Load current ADMIN (admin routes) ----------
app.use(async (req, res, next) => {
    if (!req.path.startsWith("/admin")) return next();

    try {
        if (req.session.adminId) {
            const admin = await Admin.findById(req.session.adminId);
            req.admin = admin;
            res.locals.admin = admin;
        } else {
            res.locals.admin = null;
        }
        next();
    } catch (err) {
        console.log(err);
        next();
    }
});

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
});

// ---------- Routes ----------
app.use("/", clientRoutes);
app.use("/account", accountRoutes);
app.use("/admin", adminRoutes);

// 404
app.use((req, res) => {
    res.status(404).render("pages/error", {
        layout: false,
        status: 404,
        title: "Page Not Found",
        message: "The page you're looking for doesn't exist or has been moved."
    });
});

// 500
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render("pages/error", {
        layout: false,
        status: 500,
        title: "Something Went Wrong",
        message: "We're having trouble on our end. Please try again in a moment."
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});