const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema({
    storeName: {
        type: String,
        default: "Safalam"
    },
    tagline: {
        type: String,
        default: "Premium Quality Cashews"
    },
    contactEmail: {
        type: String,
        default: ""
    },
    deliveryCharge: {
        type: Number,
        default: 49
    },
    freeDeliveryThreshold: {
        type: Number,
        default: 1000
    }
}, { timestamps: true });

module.exports = mongoose.models.Settings || mongoose.model("Settings", settingsSchema);