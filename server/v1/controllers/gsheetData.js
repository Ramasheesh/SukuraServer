const axios = require('axios');
const csv = require('csv-parser');
const { extractGoogleDriveId } = require('google-drive-id-extractor');
// const { MODEL_SHEETS } = require('../../config/configs');

// =============================
// CONFIG
// =============================
const SPREADSHEET_ID = '19cNC8a3CLMMnyoOdPN4NGex2I10bxc6BcyFxudv-UP4';
const TOTAL_PRICES_GID = '0';
const PDF_DATA_GID = '336099973';
const id_gid = '83200064'

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
// COSTING ITEMS HELPER - FIXED
// =============================
// const getCostingItems = async () => {
// //   if (!modelNo) return [];
//    MODEL_SHEETS

//   const trimmedModelNo = modelNo.toString().trim();
//   const gid = MODEL_SHEETS?.[trimmedModelNo];

//   if (!gid) {
//     console.warn("Model not found in MODEL_SHEETS:", trimmedModelNo);
//     return [];
//   }

//   try {
//     const modelData = await fetchSheetData(gid);

//     if (!Array.isArray(modelData) || modelData.length === 0) return [];

//     // Extract costing items with 4 columns: item, qty, rate, amount
//     // Ensure at least 10 rows by including empty rows if needed
//     const costingItems = modelData
//       .map((r, index) => ({
//         item: String(r.ITEMS || r.Items || r.Item || `Item ${index + 1}`).trim(),
//         qty: Number(r.QTY || r.Qty || Math.floor(Math.random() * 10) + 1), // 1-10 qty
//         rate: Number(r.RATE || r.Rate || Math.floor(Math.random() * 1000) + 100), // 100-1100 rate
//         amount: Number(r.AMOUNT || r.Amount || 0)
//       }))
//       .filter(i => i.item)
//       .slice(0, 15); // Limit to 15 rows max

//     // Ensure minimum 10 rows
//     const finalItems = costingItems.length >= 10 
//       ? costingItems 
//       : [
//           ...costingItems,
//           ...Array(10 - costingItems.length).fill(0).map((_, index) => ({
//             item: `Additional Item ${costingItems.length + index + 1}`,
//             qty: Math.floor(Math.random() * 5) + 1,
//             rate: Math.floor(Math.random() * 500) + 50,
//             amount: 0
//           }))
//         ];

//     return finalItems.slice(0, 10); // Return exactly 10 rows
//   } catch (e) {
//     console.warn(`No costing sheet for ${trimmedModelNo}:`, e.message);
//     // Return 10 dummy rows if sheet fails
//     return Array(10).fill(0).map((_, index) => ({
//       item: `Default Item ${index + 1}`,
//       qty: Math.floor(Math.random() * 5) + 1,
//       rate: Math.floor(Math.random() * 200) + 50,
//       amount: 0
//     }));
//   }
// };

// =============================
// GET ALL PRODUCTS - FIXED
// =============================
const MODEL_SHEETS = {
  "1": "83200064",
  "2": "1158780267", 
  "3": "2065449874", 
  "4": "147489568", 
  "5": "919392740" 
};

// const SPREADSHEET_ID = '19cNC8a3CLMMnyoOdPN4NGex2I10bxc6BcyFxudv-UP4';
// const TOTAL_PRICES_GID = '0';
// const PDF_DATA_GID = '336099973';

// =============================
// FETCH ALL 5 SHEETS AT ONCE
// =============================
exports.getAllProducts = async (req, res) => {
  try {
    // console.log('🔄 Fetching all sheets...');
    
    // Fetch all data in parallel
    const [pdfData, pricesData, sheet1Data, sheet2Data, sheet3Data, sheet4Data, sheet5Data] = 
      await Promise.all([
        fetchSheetData(PDF_DATA_GID),
        fetchSheetData(TOTAL_PRICES_GID),
        fetchSheetData(MODEL_SHEETS["1"]),  // Sheet 1
        fetchSheetData(MODEL_SHEETS["2"]),  // Sheet 2
        fetchSheetData(MODEL_SHEETS["3"]),  // Sheet 3
        fetchSheetData(MODEL_SHEETS["4"]),  // Sheet 4
        fetchSheetData(MODEL_SHEETS["5"])   // Sheet 5
      ]);

    // console.log('✅ Sheets loaded:');
    // console.log('- PDF Data:', pdfData.length, 'rows');
    // console.log('- Prices:', pricesData.length, 'rows'); 
    // console.log('- Sheet 1:', sheet1Data.length, 'rows');
    // console.log('- Sheet 2:', sheet2Data.length, 'rows');
    // console.log('- Sheet 3:', sheet3Data.length, 'rows');
    // console.log('- Sheet 4:', sheet4Data.length, 'rows');
    // console.log('- Sheet 5:', sheet5Data.length, 'rows');

    // Create price map
    const priceMap = {};
    pricesData.forEach(row => {
      if (row.model && row.amount) {
        priceMap[row.model.trim()] = parseFloat(row.amount) || 0;
      }
    });

    // Create costing sheets map
    const costingSheets = {
      "1": processCostingData(sheet1Data),
      "2": processCostingData(sheet2Data),
      "3": processCostingData(sheet3Data),
      "4": processCostingData(sheet4Data),
      "5": processCostingData(sheet5Data)
    };

    // Process products
    const products = await Promise.all(
      pdfData
        .filter(row => row.model_no && row.product_name)
        .map(async (row) => {
          const modelNo = row.model_no?.trim() || '';
          
          // Extract sheet ID from modelNo → get correct costing data
          const sheetId = extractSheetId(modelNo);
          const costingItems = costingSheets[sheetId] || [];

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
            costingItems,  // ✅ Full data from correct sheet 1-5
            sheetIdUsed: sheetId,  // Debug info
            isFeatured: modelNo.includes('SAK'),
            category: 'Casting'
          };
        })
    );

    // console.log(`✅ Generated ${products.length} products`);
    res.json({ 
      data: products,
      totalProducts: products.length,
      sheetsLoaded: {
        sheet1: sheet1Data.length,
        sheet2: sheet2Data.length,
        sheet3: sheet3Data.length,
        sheet4: sheet4Data.length,
        sheet5: sheet5Data.length
      }
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
// HELPER FUNCTIONS
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

const extractSheetId = (modelNo) => {
  // Extract first number OR last digit → map to sheet 1-5
  const firstNum = modelNo.match(/^(\d+)/);
  if (firstNum && MODEL_SHEETS[firstNum[1]]) return firstNum[1];
  
  const lastDigit = modelNo.match(/(\d)$/);
  if (lastDigit && MODEL_SHEETS[lastDigit[1]]) return lastDigit[1];
  
  // Fallback to sheet 1
  return "1";
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
