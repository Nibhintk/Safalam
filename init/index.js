// init/index.js

require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");
const Product = require("../models/product"); // adjust path as needed
const sampleProducts = require("./data");

async function seedDB() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("DB Connected!");

        await Product.deleteMany({});
        console.log("Old products removed");

        await Product.insertMany(sampleProducts);
        console.log("Sample products inserted!");

        mongoose.connection.close();
        console.log("Connection closed");
    } catch (err) {
        console.log(err);
    }
}

seedDB();
