const express = require("express");
const router = express.Router();

const {
  getAllProducts,
  getProductByModel,searchProducts,filterProducts,exportExcel,downloadDatasheet
} = require("../controllers/gsheetController");

router.get("/products", getAllProducts);

// IMPORTANT → param name match controller
router.get("/products/:id", getProductByModel);
router.get("/products/search", searchProducts);

router.get("/products/filter", filterProducts);

router.get("/products/export/:modelNo", exportExcel);

router.get("/products/datasheet/:modelNo", downloadDatasheet);
module.exports = router;

