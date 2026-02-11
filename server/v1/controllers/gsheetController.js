const { fetchSheetData } = require("../../utils/sheetUtils");
const { getDriveId } = require("../../utils/driveUtils");
const { extractCastingTable } = require("../../utils/castingParser");

const PRODUCTS_GID = "0";
const CASTING_GID = "336099973";


// simple cache (avoid sheet load every request)
let CACHE = {
  products: null,
  casting: null,
  lastFetch: 0
};

const CACHE_TIME = 5 * 60 * 1000;


// load sheets
const loadSheets = async () => {

  if (CACHE.products && Date.now() - CACHE.lastFetch < CACHE_TIME) {
    return CACHE;
  }

  const [products, casting] = await Promise.all([
    fetchSheetData(PRODUCTS_GID),
    fetchSheetData(CASTING_GID)
  ]);

  CACHE.products = products;
  CACHE.casting = casting;
  CACHE.lastFetch = Date.now();

  return CACHE;

};

// GET ALL PRODUCTS

exports.getAllProducts = async (req, res) => {

  try {

    const { products } = await loadSheets();

    const result = products.map(row => {

      const imageId = getDriveId(row.imageUrl);
      const datasheetId = getDriveId(row.datasheet);

      return {
        id: row.id,
        modelNo: row.modelNo,
        title: row.modelName,
        totalPrice: Number(row.totalPrice || 0),
        castingTableSheetName: row.castingTableSheetName,
        imageUrl: imageId
          ? `https://drive.google.com/uc?id=${imageId}`
          : null,
        datasheetUrl: datasheetId
          ? `https://drive.google.com/file/d/${datasheetId}/view`
          : null
      };

    });

    res.json(result);

  } catch (err) {

    console.error(err);

    res.status(500).json({ error: "Failed to load products" });

  }

};

// GET PRODUCT BY MODEL

exports.getProductByModel = async (req, res) => {

  try {

    const { id } = req.params;

    const { products, casting } = await loadSheets();

    const product = products.find(p => p.modelNo === id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const costingItems = extractCastingTable(
      casting,
      product.castingTableSheetName
    );

    res.json({
      ...product,
      costingItems
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({ error: "Fetch failed" });

  }

};

// search
exports.searchProducts = async (req, res) => {

  try {

    const { q } = req.query;

    if (!q) {
      return res.json([]);
    }

    const { products } = await loadSheets();

    const regex = new RegExp(q, "i");

    const result = products.filter(p =>
      regex.test(p.modelNo) ||
      regex.test(p.modelName || "")
    );

    res.json(result);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Search failed"
    });

  }

};
// filter
exports.filterProducts = async (req, res) => {

  try {

    const { category } = req.query;

    const { products } = await loadSheets();

    let result = products;

    if (category) {

      result = products.filter(p =>
        (p.category || "").toLowerCase() === category.toLowerCase()
      );

    }

    res.json(result);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Filter failed"
    });

  }

};

// download file
exports.downloadDatasheet = async (req, res) => {

  try {

    const { modelNo } = req.params;

    const { products } = await loadSheets();

    const product = products.find(p => p.modelNo === modelNo);

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    const fileId = getDriveId(product.datasheet);

    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

    res.redirect(downloadUrl);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Download failed"
    });

  }

};

// excel file
const ExcelJS = require("exceljs");

exports.exportExcel = async (req, res) => {

  try {

    const { modelNo } = req.params;

    const { products, casting } = await loadSheets();

    const product = products.find(p => p.modelNo === modelNo);

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    const costingItems = extractCastingTable(
      casting,
      product.castingTableSheetName
    );

    const workbook = new ExcelJS.Workbook();

    const sheet = workbook.addWorksheet("Costing");

    sheet.columns = [
      { header: "ITEM", key: "item" },
      { header: "QTY", key: "qty" },
      { header: "RATE", key: "rate" },
      { header: "AMOUNT", key: "amount" }
    ];

    sheet.addRows(costingItems);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${modelNo}.xlsx`
    );

    await workbook.xlsx.write(res);

    res.end();

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Excel export failed"
    });

  }

};
