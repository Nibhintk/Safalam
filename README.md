# Safalam 🌿
### Premium Cashew E-Commerce Platform

A full-stack e-commerce web application built with Node.js, Express, EJS, and MongoDB.

## Features

**Customer Side**
- Product browsing with category, price, and search filters
- Cart management with quantity controls
- Buy Now flow with session-based single item checkout
- COD checkout with address selection
- Order history and tracking
- Wishlist with AJAX toggle
- Purchase-verified product reviews
- Account management with saved addresses

**Admin Panel**
- Dashboard with revenue, order, and customer analytics
- Product CRUD with Cloudinary image uploads
- Order management with status updates
- Customer profiles with order history
- Review moderation
- Dynamic store and delivery settings

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express.js |
| Frontend | EJS, Bootstrap 5, CSS |
| Database | MongoDB, Mongoose |
| Auth | express-session, bcrypt |
| File Upload | Multer, Cloudinary |
| Security | Helmet |

## Setup

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/Safalam.git
cd Safalam

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Fill in your values

# Run
npm start
```

## Environment Variables
MONGO_URL=your_mongodb_url
SESSION_SECRET=your_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

## Live Link
https://safalam.onrender.com