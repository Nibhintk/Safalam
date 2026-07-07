const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({

    user: {

        type: mongoose.Schema.Types.ObjectId,

        ref: "User",

        required: true

    },

    items: [

        {

            product: {

                type: mongoose.Schema.Types.ObjectId,

                ref: "Product",

                required: true

            },

            weight: {

                type: String,

                required: true

            },

            quantity: {

                type: Number,

                required: true

            },

            price: {

                type: Number,

                required: true

            }

        }

    ],

    address: {

        type: mongoose.Schema.Types.ObjectId,

        ref: "Address",

        required: true

    },

    subtotal: {

        type: Number,

        required: true

    },

    deliveryCharge: {

        type: Number,

        required: true

    },

    total: {

        type: Number,

        required: true

    },

    paymentMethod: {

        type: String,

        enum: ["COD", "Razorpay", "UPI"],

        default: "COD"

    },

    paymentStatus: {

        type: String,

        enum: ["Pending", "Paid", "Failed"],

        default: "Pending"

    },

    orderStatus: {

        type: String,

        enum: [

            "Placed",

            "Confirmed",

            "Shipped",

            "Delivered",

            "Cancelled"

        ],

        default: "Placed"

    }

}, {

    timestamps: true

});

module.exports = mongoose.models.Order || mongoose.model("Order", orderSchema);