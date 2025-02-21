const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const productRoutes = require('./routers/ProductRouters');

const app = express();
const PORT = process.env.PORT || 5000;
const dotenv = require('dotenv');
dotenv.config();

const uri = process.env.URI;
 // Setup your mongodb uri
 if (!uri) {
  console.error("MongoDB connection string is not defined. Please set MONGO_URI in your environment variables.");
  process.exit(1); // Exit the application if the connection string is not defined
}
// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Failed to connect to MongoDB', err));

// Routes
app.use('/api/products', productRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});