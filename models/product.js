const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ["whole", "flavored"],
        required: true
    },
    prices: {
        "250": Number,
        "500": Number,
        "1000": Number
    },
    description: {
        type: String,
        required: true
    },
    image: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});


module.exports = mongoose.models.Product || mongoose.model("Product", productSchema);