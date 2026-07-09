const User = require("../models/user");
const Order = require("../models/order");
const Address = require("../models/address");
const bcrypt = require("bcrypt");

const accountController = {

    // GET /account
    accountPage: async (req, res) => {
        try {
            const recentOrders = await Order.find({ user: req.user._id })
                .sort({ createdAt: -1 })
                .limit(3)
                .populate("items.product");

            const addressCount = await Address.countDocuments({ user: req.user._id });
            const orderCount = await Order.countDocuments({ user: req.user._id });

            res.render("pages/client/account/index", {
                user: req.user,
                recentOrders,
                addressCount,
                orderCount,
                activePage: "dashboard"
            });
        } catch (err) {
            console.log(err);
            res.redirect("/");
        }
    },

    // GET /account/profile
    profilePage: async (req, res) => {
        try {
            res.render("pages/client/account/profile", {
                user: req.user,
                activePage: "profile",
                success: req.query.success || null,
                error: req.query.error || null
            });
        } catch (err) {
            console.log(err);
            res.redirect("/account");
        }
    },

    // POST /account/profile
    updateProfile: async (req, res) => {
        try {
            const { name, phone } = req.body;

            await User.findByIdAndUpdate(req.user._id, { name, phone });

            res.redirect("/account/profile?success=Profile updated successfully");
        } catch (err) {
            console.log(err);
            res.redirect("/account/profile?error=Something went wrong");
        }
    },

    // POST /account/profile/change-password
    changePassword: async (req, res) => {
        try {
            const { currentPassword, newPassword, confirmPassword } = req.body;

            if (newPassword !== confirmPassword) {
                return res.redirect("/account/profile?error=Passwords do not match");
            }

            const user = await User.findById(req.user._id);
            const isMatch = await bcrypt.compare(currentPassword, user.password);

            if (!isMatch) {
                return res.redirect("/account/profile?error=Current password is incorrect");
            }

            const hashed = await bcrypt.hash(newPassword, 10);
            await User.findByIdAndUpdate(req.user._id, { password: hashed });

            res.redirect("/account/profile?success=Password changed successfully");
        } catch (err) {
            console.log(err);
            res.redirect("/account/profile?error=Something went wrong");
        }
    },

    // GET /account/orders
    ordersPage: async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .populate("items.product")
            .populate("address");

        // Filter out items where product was deleted
        orders.forEach(order => {
            order.items = order.items.filter(item => item.product !== null);
        });

        res.render("pages/client/account/orders", {
            user: req.user,
            orders,
            activePage: "orders"
        });
    } catch (err) {
        console.log(err);
        res.redirect("/account");
    }
},
    // GET /account/orders/:id
    orderDetailPage: async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.id,
            user: req.user._id
        })
            .populate("items.product")
            .populate("address");

        if (!order) return res.redirect("/account/orders");

        // Filter null products
        order.items = order.items.filter(item => item.product !== null);

        res.render("pages/client/account/order-detail", {
            user: req.user,
            order,
            activePage: "orders"
        });
    } catch (err) {
        console.log(err);
        res.redirect("/account/orders");
    }
},

    // POST /account/orders/:id/cancel
    cancelOrder: async (req, res) => {
        try {
            await Order.findOneAndUpdate(
                { _id: req.params.id, user: req.user._id },
                { orderStatus: "Cancelled" }
            );
            res.redirect(`/account/orders/${req.params.id}`);
        } catch (err) {
            console.log(err);
            res.redirect("/account/orders");
        }
    },

    // GET /account/addresses
    addressesPage: async (req, res) => {
        try {
            const addresses = await Address.find({ user: req.user._id }).sort({ isDefault: -1 });

            res.render("pages/client/account/addresses", {
                user: req.user,
                addresses,
                activePage: "addresses",
                success: req.query.success || null,
                error: req.query.error || null
            });
        } catch (err) {
            console.log(err);
            res.redirect("/account");
        }
    },

    // GET /account/addresses/add
    addAddressPage: async (req, res) => {
        try {
            res.render("pages/client/account/address-form", {
                user: req.user,
                address: null,
                activePage: "addresses",
                formAction: "/account/addresses/add",
                pageTitle: "Add new address"
            });
        } catch (err) {
            console.log(err);
            res.redirect("/account/addresses");
        }
    },

    // POST /account/addresses/add
    addAddress: async (req, res) => {
        try {
            const { fullName, phone, house, city, district, state, pincode, landmark, addressType, isDefault } = req.body;

            if (isDefault) {
                await Address.updateMany({ user: req.user._id }, { isDefault: false });
            }

            await Address.create({
                user: req.user._id,
                fullName, phone, house, city, district, state, pincode,
                landmark: landmark || "",
                addressType: addressType || "Home",
                isDefault: isDefault ? true : false
            });

            res.redirect("/account/addresses?success=Address added successfully");
        } catch (err) {
            console.log(err);
            res.redirect("/account/addresses?error=Something went wrong");
        }
    },

    // GET /account/addresses/edit/:id
    editAddressPage: async (req, res) => {
        try {
            const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
            if (!address) return res.redirect("/account/addresses");

            res.render("pages/client/account/address-form", {
                user: req.user,
                address,
                activePage: "addresses",
                formAction: `/account/addresses/edit/${address._id}`,
                pageTitle: "Edit address"
            });
        } catch (err) {
            console.log(err);
            res.redirect("/account/addresses");
        }
    },

    // POST /account/addresses/edit/:id
    editAddress: async (req, res) => {
        try {
            const { fullName, phone, house, city, district, state, pincode, landmark, addressType, isDefault } = req.body;

            if (isDefault) {
                await Address.updateMany({ user: req.user._id }, { isDefault: false });
            }

            await Address.findOneAndUpdate(
                { _id: req.params.id, user: req.user._id },
                { fullName, phone, house, city, district, state, pincode, landmark, addressType, isDefault: isDefault ? true : false }
            );

            res.redirect("/account/addresses?success=Address updated successfully");
        } catch (err) {
            console.log(err);
            res.redirect("/account/addresses?error=Something went wrong");
        }
    },

    // POST /account/addresses/delete/:id
    deleteAddress: async (req, res) => {
        try {
            await Address.findOneAndDelete({ _id: req.params.id, user: req.user._id });
            res.redirect("/account/addresses?success=Address removed");
        } catch (err) {
            console.log(err);
            res.redirect("/account/addresses?error=Something went wrong");
        }
    },

    // POST /account/addresses/default/:id
    setDefaultAddress: async (req, res) => {
        try {
            await Address.updateMany({ user: req.user._id }, { isDefault: false });
            await Address.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { isDefault: true });
            res.redirect("/account/addresses?success=Default address updated");
        } catch (err) {
            console.log(err);
            res.redirect("/account/addresses");
        }
    }

};

module.exports = accountController;
