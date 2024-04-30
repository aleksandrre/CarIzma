// adminController.js
import Product from "../models/productModel.js";
import configureMulter from "../services/configureMulter.js";
import { uploadFilesToS3 } from "../services/s3Service.js";

// Controller function to add a product
export const addProduct = async (req, res) => {
  try {
    const uploadImages = configureMulter(4); // Set the maximum number of images per product

    // Call multer middleware to upload images
    await uploadImages(req, res);

    const { name, shortDescription, longDescription, quantity, price } =
      req.body;

    // Check if a product with the same name already exists
    const existingProduct = await Product.findOne({ name });

    if (existingProduct) {
      // If a product with the same name exists, return a 400 response
      return res
        .status(400)
        .json({ error: "Product with this name already exists" });
    }

    // Get uploaded image URLs from req.files (uploaded by multer)
    const imageFiles = req.files;
    const imageUrls = await uploadFilesToS3(imageFiles);

    // Create a new product with uploaded image URLs
    const newProduct = new Product({
      name,
      shortDescription,
      longDescription,
      quantity,
      price,
      images: imageUrls, // Store the S3 URLs of the images
    });

    // Save the product to the database
    const savedProduct = await newProduct.save();

    // Respond with the saved product
    res.status(201).json(savedProduct);
  } catch (error) {
    // Handle errors
    console.error("Error adding product:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteProductById = async (req, res) => {
  try {
    const productId = req.params.id;

    // Find and delete the product by ID
    const deletedProduct = await Product.findByIdAndDelete(productId);

    if (!deletedProduct) {
      // If the product with the specified ID is not found, return a 404 response
      return res.status(404).json({ error: "Product not found" });
    }

    // Respond with the deleted product
    res.json(deletedProduct);
  } catch (error) {
    // Handle errors
    console.error("Error deleting product:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
