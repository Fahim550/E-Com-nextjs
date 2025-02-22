const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const dotenv = require('dotenv');
dotenv.config();

const uri = process.env.URI;
 // Setup your mongodb uri
 if (!uri) {
  console.error("MongoDB connection string is not defined. Please set MONGO_URI in your environment variables.");
  process.exit(1); // Exit the application if the connection string is not defined
}
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const app = express();
app.use(cors());
app.use(bodyParser.json());
const port = 8080 || 8088 || 3000 || 3030;
// create application/json parser
const jsonParser = bodyParser.json();

async function run() {
  try {
    // Connect the client to the server
    await client.connect();
    console.log("Database connection established 🧑‍💻...");

    const db =client.db('ecom'); // Replace with your database name
    const productCollection =db.collection("products"); // Collection for products
    const cartCollection = db.collection("cart"); // Collection for cart

    // user CRUD operations 
    app.get("/", (req, res) => {
      res.send("Your backend  start working 🧑‍💻...");
    });
    // Get all products
    app.get("/products", async (req, res) => {
      try {
        console.log("Fetching products...");
        const products = await productCollection.find().toArray();
        console.log("Products fetched:", products);
        res.json({ products: products, status: 'ok', code: 200 });
      } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ error: 'Failed to fetch products', status: 'error', code: 500 });
      }
    });

    // Add a product to the cart
    app.post("/cart", async (req, res) => {
      const { productId, quantity } = req.body;

      try {
        // Find the product in the products collection
        const product = await productCollection.findOne({ _id: new ObjectId(productId) });
        if (!product) {
          return res.status(404).json({ error: 'Product not found', status: 'error', code: 404 });
        }

        // Check if the product is already in the cart
        const existingCartItem = await cartCollection.findOne({ productId: new ObjectId(productId) });
        if (existingCartItem) {
          // Update the quantity if the product is already in the cart
          await cartCollection.updateOne(
            { productId: new ObjectId(productId) },
            { $inc: { quantity: quantity } }
          );
        } else {
          // Add the product to the cart
          await cartCollection.insertOne({
            productId: new ObjectId(productId),
            name: product.name,
            price: product.price,
            quantity: quantity,
          });
        }

        res.json({ message: 'Product added to cart', status: 'ok', code: 200 });
      } catch (error) {
        res.status(500).json({ error: 'Failed to add product to cart', status: 'error', code: 500 });
      }
    });

    // Delete a product from the cart
    app.delete("/cart/:id", async (req, res) => {
      const id = req.params.id;

      try {
        const result = await cartCollection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) {
          return res.status(404).json({ error: 'Product not found in cart', status: 'error', code: 404 });
        }

        res.json({ message: 'Product removed from cart', status: 'ok', code: 200 });
      } catch (error) {
        res.status(500).json({ error: 'Failed to remove product from cart', status: 'error', code: 500 });
      }
    });

    // Buy products in the cart (simulate purchase)
    app.post("/cart/buy", async (req, res) => {
      try {
        // Fetch all items in the cart
        const cartItems = await cartCollection.find().toArray();
        if (cartItems.length === 0) {
          return res.status(400).json({ error: 'Cart is empty', status: 'error', code: 400 });
        }

        // Simulate purchase (e.g., process payment, update inventory, etc.)
        // For now, just clear the cart
        await cartCollection.deleteMany({});

        res.json({ message: 'Purchase successful', status: 'ok', code: 200 });
      } catch (error) {
        res.status(500).json({ error: 'Failed to process purchase', status: 'error', code: 500 });
      }
    });

  }  finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log('Ports are running on :', port);
});