const express = require("express");
const router = express.Router();
const {
  getAllProducts,      
//   getProductByModel,  
  // searchProducts,
//   exportExcel
} = require("../controllers/gsheetData");

router.get("/all", getAllProducts);                    // GET /api/products/ - सभी products
// router.get("/:modelNo", getProductByModel);         // GET /api/products/(24)M1-SAK-6AP - single product details
// router.get("/search", searchProducts);
// router.get("/export/:modelNo", exportExcel);
    

module.exports = router;

