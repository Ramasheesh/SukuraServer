const axios = require('axios');
const csv = require('csv-parser');
const { extractGoogleDriveId } = require('google-drive-id-extractor');

// =============================
// CONFIG
// =============================
const SPREADSHEET_ID = '19cNC8a3CLMMnyoOdPN4NGex2I10bxc6BcyFxudv-UP4';
const TOTAL_PRICES_GID = '0';
const PDF_DATA_GID = '336099973';

const MODEL_SHEETS = {
  "1": "83200064",
  "2": "1158780267",
  "3": "2065449874",
  "4": "147489568",
  "5": "919392740"
};

// =============================
// GOOGLE DRIVE HELPER
// =============================
const getDriveId = (url) => {
  if (!url) return null;
  try {
    return extractGoogleDriveId(url);
  } catch {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  }
};

// =============================
// FETCH SHEET DATA (CSV)
// =============================
const fetchSheetData = async (gid) => {
  try {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${gid}`;

    const response = await axios.get(csvUrl, {
      responseType: 'stream'
    });

    return new Promise((resolve, reject) => {
      const results = [];
      response.data
        .pipe(csv())
        .on('data', (row) => results.push(row))
        .on('end', () => resolve(results))
        .on('error', reject);
    });

  } catch (err) {
    console.error("fetchSheetData error:", err.message);
    return [];
  }
};

// =============================
// PROCESS COSTING DATA
// =============================
const processCostingData = (sheetData) => {

  if (!Array.isArray(sheetData) || sheetData.length === 0) return [];

  return sheetData
    .map((r, index) => {

      const itemName = String(
        r.ITEMS || r.Items || r.Item || r.item || `Item ${index + 1}`
      ).trim();

      if (!itemName) return null;

      return {
        item: itemName,
        qty: Number(r.QTY || r.Qty || r.qty || 0),
        rate: Number(r.RATE || r.Rate || r.rate || 0),
        amount: Number(r.AMOUNT || r.Amount || r.amount || 0)
      };

    })
    .filter(Boolean);
};

// =============================
// EXTRACT SHEET ID FROM MODEL
// =============================
const extractSheetId = (modelNo) => {

  const firstNum = modelNo.match(/^(\d+)/);
  if (firstNum && MODEL_SHEETS[firstNum[1]]) return firstNum[1];

  const lastDigit = modelNo.match(/(\d)$/);
  if (lastDigit && MODEL_SHEETS[lastDigit[1]]) return lastDigit[1];

  return "1";
};

// =============================
// GET ALL PRODUCTS (FINAL FIXED)
// =============================
exports.getAllProducts = async (req, res) => {

  try {

    // Fetch main sheets
    const [pdfData, pricesData] = await Promise.all([
      fetchSheetData(PDF_DATA_GID),
      fetchSheetData(TOTAL_PRICES_GID)
    ]);

    // AUTO fetch all costing sheets
    const costingSheets = {};

    await Promise.all(
      Object.entries(MODEL_SHEETS).map(async ([sheetId, gid]) => {
        const sheetData = await fetchSheetData(gid);
        costingSheets[sheetId] = processCostingData(sheetData);
      })
    );

    // Create price map
    const priceMap = {};

    pricesData.forEach(row => {
      if (row.model && row.amount) {
        priceMap[row.model.trim()] = parseFloat(row.amount) || 0;
      }
    });

    // Process products
    const products = pdfData
      .filter(row => row.model_no && row.product_name)
      .map((row) => {

        const modelNo = row.model_no?.trim() || '';

        const sheetId = extractSheetId(modelNo);

        const imageId = getDriveId(row.image_link || row.image);
        const datasheetId = getDriveId(row.pdf_link || row.datasheet);

        return {
          _id: modelNo,
          modelNo,
          title: row.product_name?.trim() || `Model ${modelNo}`,
          imageUrl: imageId
            ? `https://drive.google.com/uc?id=${imageId}`
            : '/placeholder.jpg',
          description: row.description || `High-precision casting project: ${modelNo}`,
          totalAmount: priceMap[modelNo] || 0,
          datasheetUrl: datasheetId
            ? `https://drive.google.com/file/d/${datasheetId}/view`
            : null,
          costingItems: costingSheets[sheetId] || [],
          sheetIdUsed: sheetId,
          isFeatured: modelNo.includes('SAK'),
          category: 'Casting'
        };
      });

    res.json({
      data: products,
      totalProducts: products.length,
      sheetsLoaded: Object.fromEntries(
        Object.entries(costingSheets).map(([k,v]) => [k, v.length])
      )
    });

  } catch (error) {

    console.error('❌ Sheets fetch error:', error);

    res.status(500).json({
      error: 'Failed to load products from sheets',
      details: error.message
    });

  }
};

// =============================
// GET PRODUCT DETAILS - FIXED
// =============================
// exports.getProductByModel = async (req, res) => {
//   try {
//     const { modelNo } = req.params;

//     if (!modelNo) {
//       return res.status(400).json({
//         message: 'Model number is required'
//       });
//     }

//     const costingItems = await getCostingItems(modelNo);
//     const allProducts = await fetchSheetData(PDF_DATA_GID);
//     const productData = allProducts.find(row => row.model_no?.trim() === modelNo);

//     if (!productData) {
//       return res.status(404).json({
//         message: 'Product not found'
//       });
//     }

//     const imageId = getDriveId(productData.image_link || productData.image);
//     const datasheetId = getDriveId(productData.pdf_link || productData.datasheet);
//     const totalAmount = costingItems.reduce((sum, item) => sum + (item.amount || 0), 0);

//     const product = {
//       modelNo,
//       title: productData.product_name?.trim() || `Model ${modelNo}`,
//       description: productData.description || `High-precision casting project: ${modelNo}`,
//       imageUrl: imageId
//         ? `https://drive.google.com/uc?id=${imageId}`
//         : '/placeholder.jpg',
//       datasheetUrl: datasheetId
//         ? `https://drive.google.com/file/d/${datasheetId}/view`
//         : null,
//       costingItems, // Now contains exactly 10 rows with 4 columns
//       totalAmount
//     };

//     res.json(product);
//   } catch (error) {
//     console.error('Product details fetch failed:', error);
//     res.status(500).json({
//       error: 'Product details fetch failed'
//     });
//   }
// };
