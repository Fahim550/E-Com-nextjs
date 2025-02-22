const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const dotenv = require('dotenv');
dotenv.config();


const uri = process.env.URI;

// Check if MongoDB connection string is defined
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

const port = process.env.PORT || 8080 || 3000;
const jsonParser = bodyParser.json();
async function run() {
  try {
    // Connect the client to the server
    await client.connect();
    console.log("Database connection established 🧑‍💻...");

    const db = client.db('E-com-backend'); // Replace with your database name
    const productCollection = db.collection("product"); // Collection for products
    const cartCollection = db.collection("cart"); // Collection for cart

    // Define a route for the root path
    app.get("/", (req, res) => {
      res.send("Your backend is working 🧑‍💻...");
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

app.get('/products/:id', async (req, res) => {
  try {
    const productId = req.params.id;

    if (!ObjectId.isValid(productId)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    const product = await productCollection.findOne({ _id: new ObjectId(productId) });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ product });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
        // Get all cart products
        app.get("/cart", async (req, res) => {
          try {
            console.log("Fetching products...");
            const carts = await cartCollection.find().toArray();
            console.log("carts Products fetched:", carts);
            res.json({ carts: carts, status: 'ok', code: 200 });
          } catch (error) {
            console.error("Error fetching carts products:", error);
            res.status(500).json({ error: 'Failed to fetch products', status: 'error', code: 500 });
          }
        });
    // Add a product to the cart
    app.post('/cart', async (req, res) => {
      const { productId, quantity } = req.body;
    
      // Validate request body
      if (!productId || !quantity) {
        return res.status(400).json({ error: 'Missing productId or quantity', status: 'error', code: 400 });
      }
    
      try {
        // Convert productId to ObjectId
    const productObjectId = new ObjectId(productId);

        // Find the product in the products collection
        const product = await productCollection.findOne({ _id: productObjectId });
        if (!product) {
          return res.status(404).json({ error: 'Product not found', status: 'error', code: 404 });
        }
    
        // Check if the product is already in the cart
        const existingCartItem = await cartCollection.findOne({ productId: productObjectId });
        if (existingCartItem) {
          // Update the quantity if the product is already in the cart
          await cartCollection.updateOne(
            { productId: productObjectId },
            { $inc: { quantity: quantity } } // Increment the quantity
          );
        } else {
          // Add the product to the cart if it doesn't exist
          await cartCollection.insertOne({
            productId: productObjectId,
            name: product.name,
            price: product.price,
            image:product.image,
            description:product.description,
            stock:product.stock,
            category:product.category,
            quantity: quantity,
          });
        }
    
        res.json({ message: 'Product added to cart', status: 'ok', code: 200 });
      } catch (error) {
        console.error('Error adding product to cart:', error);
        res.status(500).json({ error: 'Failed to add product to cart', status: 'error', code: 500 });
      }
    });

  // app.post("/cart", jsonParser, async (req, res) => {
  //     const cartCollection = await db.collection("cart")
  //     await cartCollection.insertOne(req.body);
  //     res.json({ cart: req.body, status: 'ok', code: 200 });
  //   });

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

    // Start the server
    app.listen(port, () => {
      console.log(`Server is running on port: ${port}`);
    });

  } catch (error) {
    console.error("Error:", error);
  }
}

// Run the server
run().catch(console.dir);

// Close the MongoDB client when the server is shutting down
process.on('SIGINT', async () => {
  await client.close();
  console.log('MongoDB connection closed');
  process.exit(0);
});