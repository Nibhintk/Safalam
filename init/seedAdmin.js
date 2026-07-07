const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Admin = require("../models/Admin");
require("dotenv").config({ path: "../.env" });

async function seed() {
    await mongoose.connect(process.env.MONGO_URL);

    const username = process.env.ADMIN_SEED_USERNAME;
    const password = process.env.ADMIN_SEED_PASSWORD;

    if (!username || !password) {
        console.log("Set ADMIN_SEED_USERNAME and ADMIN_SEED_PASSWORD in .env first");
        process.exit(1);
    }

    const existing = await Admin.findOne({ username });
    if (existing) {
        console.log("Admin already exists");
        process.exit();
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await Admin.create({ username, password: hashedPassword });

    console.log("Admin created successfully"); // no password printed
    process.exit();
}

seed();