const express = require("express");
const router = express.Router();
const {
  getAllProducts,      // ✅ Google Sheets से सभी products
  getProductByModel,   // ✅ Model-specific costing data
  // searchProducts,
  exportExcel
} = require("../controllers/productController");

// 🟢 Google Sheets Routes (Main routes frontend use करेगा)
router.get("/", getAllProducts);                    // GET /api/products/ - सभी products
router.get("/all", getAllProducts);                 // GET /api/products/all - backup route
router.get("/:modelNo", getProductByModel);         // GET /api/products/(24)M1-SAK-6AP - single product details
// router.get("/search", searchProducts);
// router.get("/export/:modelNo", exportExcel);
 
// 🧪 Test routes - Google Sheets connection check
router.get("/test-sheets", async (req, res) => {
  try {
    const { testSheetsConnection } = require("../controllers/productController");
    const result = await testSheetsConnection();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
router.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

module.exports = router;


// const express = require("express");
// const router = express.Router();
// const {
//   addProduct,
//   getAllProducts,
//   getProductByModel,
//   searchProducts,
//   exportExcel
// } = require("../controllers/productController");

// // router.post("/add", addProduct);
// router.get("/all", getAllProducts);
// router.get("/search", searchProducts);
// router.get("/:modelNo", getProductByModel);
// router.get("/export/:modelNo", exportExcel);

// module.exports = router;
