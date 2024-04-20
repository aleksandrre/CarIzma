import mongoose from "mongoose";

// Define the product schema
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  shortDescription: {
    type: String,
    required: true,
  },
  longDescription: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  imageUrl_1: {
    type: String,
    required: true,
  },
  imageUrl_2: {
    type: String,
  },
  imageUrl_3: {
    type: String,
  },
  imageUrl_4: {
    type: String,
  },
  // Add other fields as needed
});

// Create a Product model based on the schema
const Product = mongoose.model("products", productSchema);

// Export the Product model
export default Product;
