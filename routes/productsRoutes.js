import express from "express";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import {
  getAllProducts,
  getOneProduct,
} from "../controllers/productController.js"; // Adjust the path based on your project structure

const router = express.Router();

router.get("/", authenticateToken, getAllProducts);

router.get("/:id", authenticateToken, getOneProduct);

export default router;
