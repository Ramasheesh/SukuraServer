const express = require("express");
const router = express.Router();
const {
  addProduct,
  getAllProducts,
  getProductByModel,
  searchProducts,
  exportExcel
} = require("../controllers/productController");

// router.post("/add", addProduct);
router.get("/all", getAllProducts);
router.get("/search", searchProducts);
router.get("/:modelNo", getProductByModel);
router.get("/export/:modelNo", exportExcel);

module.exports = router;
