require("dotenv").config(); // Load environment variables

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
const Product = require("./models/product.js"); // Example model
const User = require("./models/user");
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

// ---------- Setting View Engine ----------
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Use express-ejs-layouts BEFORE setting the layout
app.use(expressLayouts);
app.set("layout", "layout/boilerplate");

// ---------- Middleware ----------
app.set("trust proxy", 1);
app.use(express.static(path.join(__dirname, "public"))); // Serve static files
app.use(express.urlencoded({ extended: true })); // For form data
app.use(express.json()); // Add this for JSON data
app.use(session({

    secret:process.env.SECRET_KEY ,

    resave:false,

    saveUninitialized:false,

    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URL
    }),

    cookie:{
        maxAge:1000*60*60*24*7
    }

}));
app.use(flash()); 
app.use(async (req,res,next)=>{

    try{

        if(req.session.userId){

            const user =
                await User.findById(
                    req.session.userId
                );

            req.user = user;

            res.locals.user = user;

            const cartItems =
                await Cart.find({

                    user: user._id

                });

            let cartCount = 0;

            cartItems.forEach(item=>{

                cartCount += item.quantity;

            });

            res.locals.cartCount =
                cartCount;

        }
        else{

            res.locals.user = null;

            res.locals.cartCount = 0;

        }

        next();

    }

    catch(err){

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


app.use("/", accountRoutes);

app.use("/admin", adminRoutes);

// 404 — page not found
app.use((req, res) => {
    res.status(404).render("pages/error", {
        layout: false,
        status: 404,
        title: "Page Not Found",
        message: "The page you're looking for doesn't exist or has been moved."
    });
});

// 500 — server error
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render("pages/error", {
        layout: false,
        status: 500,
        title: "Something Went Wrong",
        message: "We're having trouble on our end. Please try again in a moment."
    });
});

// ---------- Server Listen ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});