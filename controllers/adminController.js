const bcrypt = require("bcrypt");
const Admin = require("../models/admin");
const Order = require("../models/order");
const Product = require("../models/product");
const User = require("../models/user");
const Review = require("../models/review");
const Address = require("../models/address");
const Settings = require("../models/settings");
const { cloudinary } = require("../config/cloudinary");

const adminController = {

    loginPage: (req, res) => {
        if (req.session.adminId) {
            return res.redirect("/admin/dashboard");
        }
        res.render("pages/admin/login", {
            layout: false,
            error: req.query.error || null
        });
    },

    login: async (req, res) => {
        try {
            const { username, password } = req.body;

            const admin = await Admin.findOne({ username });

            if (!admin) {
                return res.redirect("/admin/login?error=Invalid credentials");
            }

            const isMatch = await bcrypt.compare(password, admin.password);

            if (!isMatch) {
                return res.redirect("/admin/login?error=Invalid credentials");
            }

            req.session.adminId = admin._id;
            res.redirect("/admin/dashboard");

        } catch (err) {
            console.log(err);
            res.redirect("/admin/login?error=Something went wrong");
        }
    },

    logout: (req, res) => {
        req.session.adminId = null;
        res.redirect("/admin/login");
    },

    dashboard: async (req, res) => {
        try {
            const orders = await Order.find();
            const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
            const totalOrders = orders.length;
            const totalCustomers = await User.countDocuments();
            const totalProducts = await Product.countDocuments();

            const recentOrders = await Order.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .populate("user", "name");

            const pendingOrders = await Order.countDocuments({ orderStatus: "Pending" });
            const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

            let unitsSold = 0;
            orders.forEach(o => {
                o.items.forEach(item => {
                    unitsSold += item.quantity;
                });
            });

            const reviewsByProduct = await Review.aggregate([
                {
                    $group: {
                        _id: "$product",
                        avgRating: { $avg: "$rating" },
                        totalReviews: { $sum: 1 }
                    }
                },
                {
                    $lookup: {
                        from: "products",
                        localField: "_id",
                        foreignField: "_id",
                        as: "product"
                    }
                },
                { $unwind: "$product" },
                { $sort: { totalReviews: -1 } }
            ]);

            const totalReviews = await Review.countDocuments();

            res.render("pages/admin/dashboard", {
                layout: false,
                activePage: "dashboard",
                totalRevenue,
                totalOrders,
                totalCustomers,
                totalProducts,
                recentOrders,
                pendingOrders,
                avgOrderValue,
                unitsSold,
                reviewsByProduct,
                totalReviews
            });

        } catch (err) {
            console.log(err);
            res.redirect("/admin/login");
        }
    },

    // ============ PRODUCTS ============

    productsPage: async (req, res) => {
        try {
            const search = req.query.search || "";

            let filter = {};
            if (search) {
                filter.name = { $regex: search, $options: "i" };
            }

            const products = await Product.find(filter).sort({ createdAt: -1 });

            res.render("pages/admin/products", {
                layout: false,
                activePage: "products",
                products,
                search,
                success: req.query.success || null,
                error: req.query.error || null
            });

        } catch (err) {
            console.log(err);
            res.redirect("/admin/dashboard");
        }
    },

    getProduct: async (req, res) => {
        try {
            const product = await Product.findById(req.params.id);
            if (!product) {
                return res.status(404).json({ message: "Product not found" });
            }
            res.json(product);
        } catch (err) {
            console.log(err);
            res.status(500).json({ message: "Something went wrong" });
        }
    },

    addProduct: async (req, res) => {
        try {
            const { name, description, category, price250, price500, price1000 } = req.body;

            if (!req.file) {
                return res.redirect("/admin/products?error=Please upload an image");
            }

            await Product.create({
                name,
                description,
                category,
                prices: {
                    "250": Number(price250) || undefined,
                    "500": Number(price500) || undefined,
                    "1000": Number(price1000) || undefined
                },
                image: req.file.path // Cloudinary URL
            });

            res.redirect("/admin/products?success=Product added successfully");

        } catch (err) {
            console.log(err);
            res.redirect("/admin/products?error=Something went wrong");
        }
    },

    editProduct: async (req, res) => {
        try {
            const { name, description, category, price250, price500, price1000 } = req.body;

            const updateData = {
                name,
                description,
                category,
                prices: {
                    "250": Number(price250) || undefined,
                    "500": Number(price500) || undefined,
                    "1000": Number(price1000) || undefined
                }
            };

            // Only update image if a new one was uploaded
            if (req.file) {
                updateData.image = req.file.path;
            }

            await Product.findByIdAndUpdate(req.params.id, updateData);

            res.redirect("/admin/products?success=Product updated successfully");

        } catch (err) {
            console.log(err);
            res.redirect("/admin/products?error=Something went wrong");
        }
    },

    deleteProduct: async (req, res) => {
    try {
        // Check if any order contains this product
        const orderedProduct = await Order.findOne({
            "items.product": req.params.id
        });

        if (orderedProduct) {
            return res.redirect("/admin/products?error=Cannot delete product — it exists in orders");
        }

        await Product.findByIdAndDelete(req.params.id);
        res.redirect("/admin/products?success=Product deleted");

    } catch (err) {
        console.log(err);
        res.redirect("/admin/products?error=Something went wrong");
    }
},
    
    ordersPage: async (req, res) => {
        try {
            const { status, search } = req.query;
 
            let filter = {};
 
            if (status && status !== "all") {
                filter.orderStatus = status;
            }
 
            let orders = await Order.find(filter)
                .sort({ createdAt: -1 })
                .populate("user", "name email");
 
            // Search by order ID, name, or email (done in-memory since order ID search is on the Mongo _id string)
            if (search) {
                const term = search.toLowerCase();
                orders = orders.filter(order => {
                    const idMatch = order._id.toString().toLowerCase().includes(term);
                    const nameMatch = order.user && order.user.name.toLowerCase().includes(term);
                    const emailMatch = order.user && order.user.email.toLowerCase().includes(term);
                    return idMatch || nameMatch || emailMatch;
                });
            }
 
            const totalOrders = await Order.countDocuments();
 
            res.render("pages/admin/orders", {
                layout: false,
                activePage: "orders",
                orders,
                totalOrders,
                currentStatus: status || "all",
                search: search || ""
            });
 
        } catch (err) {
            console.log(err);
            res.redirect("/admin/dashboard");
        }
    },
 
    orderDetailPage: async (req, res) => {
        try {
            const order = await Order.findById(req.params.id)
                .populate("user", "name email phone")
                .populate("address")
                .populate("items.product");
 
            if (!order) {
                return res.redirect("/admin/orders?error=Order not found");
            }
 
            res.render("pages/admin/order-detail", {
                layout: false,
                activePage: "orders",
                order
            });
 
        } catch (err) {
            console.log(err);
            res.redirect("/admin/orders");
        }
    },
 
    updateOrderStatus: async (req, res) => {
    try {
        const { status } = req.body;

        const validStatuses = ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"];

        if (!validStatuses.includes(status)) {
            return res.redirect(`/admin/orders/${req.params.id}?error=Invalid status`);
        }

        const updateData = { orderStatus: status };

        // Auto-update payment status for COD
        if (status === "Delivered") {
            updateData.paymentStatus = "Paid";
        } else if (status === "Cancelled") {
            updateData.paymentStatus = "Failed";
        }

        await Order.findByIdAndUpdate(req.params.id, updateData);

        res.redirect(`/admin/orders/${req.params.id}?success=Order status updated`);

    } catch (err) {
        console.log(err);
        res.redirect(`/admin/orders/${req.params.id}?error=Something went wrong`);
    }
},
      // ============ CUSTOMERS ============
 
    customersPage: async (req, res) => {
        try {
            const search = req.query.search || "";
 
            let users = await User.find().sort({ createdAt: -1 });
 
            if (search) {
                const term = search.toLowerCase();
                users = users.filter(u =>
                    u.name.toLowerCase().includes(term) ||
                    u.email.toLowerCase().includes(term)
                );
            }
 
            // For each user get order count and total spent
            const customersData = await Promise.all(users.map(async (user) => {
                const orders = await Order.find({ user: user._id });
                const orderCount = orders.length;
                const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);
 
                // Get latest address for location
                const address = await Address.findOne({ user: user._id }).sort({ createdAt: -1 });
 
                return {
                    user,
                    orderCount,
                    totalSpent,
                    district: address ? address.district : null
                };
            }));
 
            res.render("pages/admin/customers", {
                layout: false,
                activePage: "customers",
                customersData,
                totalCustomers: customersData.length,
                search
            });
 
        } catch (err) {
            console.log(err);
            res.redirect("/admin/dashboard");
        }
    },
 
    customerDetailPage: async (req, res) => {
        try {
            const user = await User.findById(req.params.id);
            if (!user) return res.redirect("/admin/customers");
 
            const orders = await Order.find({ user: req.params.id })
                .sort({ createdAt: -1 })
                .populate("items.product");
 
            // Filter null products
            orders.forEach(order => {
                order.items = order.items.filter(item => item.product !== null);
            });
 
            const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);
 
            const addresses = await Address.find({ user: req.params.id });
 
            const reviews = await Review.find({ user: req.params.id })
                .populate("product", "name image")
                .sort({ createdAt: -1 });
 
            res.render("pages/admin/customer-detail", {
                layout: false,
                activePage: "customers",
                user,
                orders,
                totalSpent,
                addresses,
                reviews
            });
 
        } catch (err) {
            console.log(err);
            res.redirect("/admin/customers");
        }
    },
      // ============ REVIEWS ============
 
    reviewsPage: async (req, res) => {
        try {
 
            // Recent reviews — last 10
            const recentReviews = await Review.find()
                .sort({ createdAt: -1 })
                .limit(10)
                .populate("user", "name email")
                .populate("product", "name image");
 
            // Reviews grouped by product with rating distribution
            const reviewsByProduct = await Review.aggregate([
                {
                    $group: {
                        _id: "$product",
                        avgRating: { $avg: "$rating" },
                        totalReviews: { $sum: 1 },
                        ratings: { $push: "$rating" }
                    }
                },
                {
                    $lookup: {
                        from: "products",
                        localField: "_id",
                        foreignField: "_id",
                        as: "product"
                    }
                },
                { $unwind: "$product" },
                { $sort: { totalReviews: -1 } }
            ]);
 
            // Add star distribution to each product
            reviewsByProduct.forEach(p => {
                p.distribution = [5, 4, 3, 2, 1].map(star => ({
                    star,
                    count: p.ratings.filter(r => r === star).length,
                    percent: Math.round((p.ratings.filter(r => r === star).length / p.totalReviews) * 100)
                }));
            });
 
            const totalReviews = await Review.countDocuments();
 
            const allReviews = await Review.find();
            const avgRatingAll = totalReviews > 0
                ? (allReviews.reduce((s, r) => s + r.rating, 0) / totalReviews).toFixed(1)
                : 0;
 
            res.render("pages/admin/reviews", {
                layout: false,
                activePage: "reviews",
                recentReviews,
                reviewsByProduct,
                totalReviews,
                avgRatingAll,
                success: req.query.success || null,
                error: req.query.error || null
            });
 
        } catch (err) {
            console.log(err);
            res.redirect("/admin/dashboard");
        }
    },
 
    deleteReview: async (req, res) => {
        try {
            await Review.findByIdAndDelete(req.params.id);
            res.redirect("/admin/reviews?success=Review deleted");
        } catch (err) {
            console.log(err);
            res.redirect("/admin/reviews?error=Something went wrong");
        }
    },
    // ============ SETTINGS ============
 
    settingsPage: async (req, res) => {
        try {
            // Get or create settings doc (singleton pattern)
            let settings = await Settings.findOne();
            if (!settings) {
                settings = await Settings.create({});
            }
 
            const admin = await Admin.findById(req.session.adminId);
 
            res.render("pages/admin/settings", {
                layout: false,
                activePage: "settings",
                settings,
                admin,
                success: req.query.success || null,
                error: req.query.error || null
            });
 
        } catch (err) {
            console.log(err);
            res.redirect("/admin/dashboard");
        }
    },
 
    updateStoreSettings: async (req, res) => {
        try {
            const { storeName, tagline, contactEmail } = req.body;
 
            await Settings.findOneAndUpdate(
                {},
                { storeName, tagline, contactEmail },
                { upsert: true, new: true }
            );
 
            res.redirect("/admin/settings?success=Store settings updated");
 
        } catch (err) {
            console.log(err);
            res.redirect("/admin/settings?error=Something went wrong");
        }
    },
 
    updateDeliverySettings: async (req, res) => {
        try {
            const { deliveryCharge, freeDeliveryThreshold } = req.body;
 
            await Settings.findOneAndUpdate(
                {},
                {
                    deliveryCharge: Number(deliveryCharge),
                    freeDeliveryThreshold: Number(freeDeliveryThreshold)
                },
                { upsert: true, new: true }
            );
 
            res.redirect("/admin/settings?success=Delivery settings updated");
 
        } catch (err) {
            console.log(err);
            res.redirect("/admin/settings?error=Something went wrong");
        }
    }

};

module.exports = adminController;