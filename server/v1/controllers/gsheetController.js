const { fetchSheetData } = require("../../utils/sheetUtils");
const {getDriveId,
  buildDriveImageUrl,
  buildDrivePdfUrl
} = require("../../utils/driveUtils");
const { extractCastingTable } = require("../../utils/castingParser");

const PRODUCTS_GID = "0";
const CASTING_GID = "336099973";

// CACHE SYSTEM
let cache = {
  data: [],
  lastUpdated: 0,
  loading: false
};

const CACHE_TIME = 10 * 60 * 1000; // 10 min cache

async function refreshData(force = false) {

  // avoid multiple parallel loads
  if (cache.loading) return;

  // cache valid -> skip reload
  if (!force && Date.now() - cache.lastUpdated < CACHE_TIME) {
    return;
  }

  try {

    cache.loading = true;
    console.log("Refreshing from Google Sheets...");

    const [products, casting] = await Promise.all([
      fetchSheetData(PRODUCTS_GID),
      fetchSheetData(CASTING_GID)
    ]);

    const result = products.map(row => {

      const imageId = buildDriveImageUrl(row.imageUrl);
      const datasheetId = buildDrivePdfUrl(row.datasheet);
      // casting extraction
      const costingItems = extractCastingTable(
        casting,
        row.castingTableSheetName
      );
        console.log('costingItems: ', costingItems);
      const data= {
        id: row.id,
        modelNo: row.modelNo,
        title: row.modelName,
        totalPrice: Number(row.totalPrice || 0),
        castingTableSheetName: row.castingTableSheetName,
        costingItems: costingItems || [],
        imageUrl: imageId,
        datasheetUrl: datasheetId
          
      };
      // console.log('data: ', data);

      return data;
    });

    cache.data = result;
    cache.lastUpdated = Date.now();
  } catch (err) {
    console.log("Refresh Error:", err);
      
  } finally {
    cache.loading = false;
  }
}

// preload server start
refreshData(true);

// ================= API =================

// FAST response API
exports.getAllProducts = async (req, res) => {
  // if empty cache -> wait first load only
  if (!cache.data.length) {
    await refreshData(true);
  }
  // instant response
  res.json(cache.data);
  // background refresh (no waiting)
  refreshData();
};

// GET PRODUCT BY MODEL

exports.getProductByModel = (req,res)=>{

  const model = req.params.modelNo;

  const product = cache.data.find(
    p => p.modelNo === model
  );

  res.json(product || {});
}


// search
exports.searchProducts = (req, res) => {

  const q = req.query.q?.toLowerCase() || "";

  const results = cache.data.filter(p =>
    p.modelNo.toLowerCase().includes(q) ||
    p.title.toLowerCase().includes(q)
  );
  res.json(results);
};

// filter
exports.filterProducts = (req, res) => {
  const { category, sort } = req.query;
  let products = [...cache.data];
  if (category && category !== "All") {
    products = products.filter(p =>
      p.modelNo.startsWith(category)
    );
  }
  if (sort === "price_asc") {
    products.sort((a,b) => a.totalPrice - b.totalPrice);
  }
  if (sort === "price_desc") {
    products.sort((a,b) => b.totalPrice - a.totalPrice);
  }
  res.json(products);
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
