const express = require("express");
const router = express.Router();
const {
  getAllProducts,      
//   getProductByModel,  
  // searchProducts,
//   exportExcel
} = require("../controllers/gSheetData");

router.get("/all", getAllProducts);                    // GET /api/products/ - सभी products
// router.get("/:modelNo", getProductByModel);         // GET /api/products/(24)M1-SAK-6AP - single product details
// router.get("/search", searchProducts);
// router.get("/export/:modelNo", exportExcel);
    
router.get("/test-sheets", async (req, res) => {
  try {
    const { testSheetsConnection } = require("../controllers/productController");
    const result = await testSheetsConnection();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

