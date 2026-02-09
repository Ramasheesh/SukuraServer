const axios = require('axios');
const csv = require('csv-parser');
const { extractGoogleDriveId } = require('google-drive-id-extractor'); // npm install google-drive-id-extractor [web:4]
const {MODEL_SHEETS} = require('../../config/configs'); // Load GID mappings from config

const SPREADSHEET_ID = '19cNC8a3CLMMnyoOdPN4NGex2I10bxc6BcyFxudv-UP4';
const TOTAL_PRICES_GID = '0'; // Update with actual gid for "total_prices" sheet
const PDF_DATA_GID = '336099973'; // Update with actual gid for "PDF" sheet

// Helper to extract Drive file ID [web:4]
const getDriveId = (url) => {
  if (!url) return null;
  try {
    return extractGoogleDriveId(url);
  } catch {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  }
};

// Helper to fetch costing items for a model
const getCostingItems = async (modelNo) => {
  let costingItems = [];
  const sheetGid = MODEL_SHEETS[modelNo?.trim()];
  if (sheetGid) {
    try {
      const modelData = await fetchSheetData(sheetGid);
      costingItems = modelData
        .map(r => ({
          item: r.ITEMS?.trim() || '',
          qty: parseFloat(r.QTY) || 0,
          rate: parseFloat(r.RATE) || 0,
          amount: parseFloat(r.AMOUNT) || 0
        }))
        .filter(item => item.item);
    } catch (e) {
      console.log(`No costing sheet for ${modelNo}:`, e.message);
    }
  }
  return costingItems;
};

// Fetch CSV from public Google Sheet [web:12][web:16]
const fetchSheetData = async (gid) => {
  const csvUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${gid}`;
  const response = await axios.get(csvUrl, { responseType: 'stream' });
  return new Promise((resolve, reject) => {
    const results = [];
    response.data.pipe(csv())
      .on('data', (row) => results.push(row))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
};

exports.getAllProducts = async (req, res) => {
  try {
    // 1. Fetch PDF data sheet (model_no, image_link, product_name, etc.)
    const pdfData = await fetchSheetData(PDF_DATA_GID);
    
    // 2. Fetch total_prices sheet for model/amount mapping
    const pricesData = await fetchSheetData(TOTAL_PRICES_GID);

    // Create model -> price map
    const priceMap = {};
    pricesData.forEach(row => {
      if (row.model && row.amount) {
        priceMap[row.model.trim()] = parseFloat(row.amount) || 0;
      }
    });

    // 3. Process PDF data into products
    const products = await Promise.all(
      pdfData
        .filter(row => row.model_no && row.product_name)
        .map(async (row) => {
          const modelNo = row.model_no?.trim() || '';
          const imageId = getDriveId(row.image_link || row.image);
          const datasheetId = getDriveId(row.pdf_link || row.datasheet);
          
          // Fetch costing items for this model
          const costingItems = await getCostingItems(modelNo);
          
          return {
            _id: modelNo,
            modelNo,
            title: row.product_name?.trim() || `Model ${modelNo}`,
            imageUrl: imageId ? `https://drive.google.com/uc?id=${imageId}` : '/placeholder.jpg',
            description: row.description || `High-precision casting project: ${modelNo}`,
            totalAmount: priceMap[modelNo] || 0,
            datasheetUrl: datasheetId ? `https://drive.google.com/file/d/${datasheetId}/view` : null,
            costingItems,
            isFeatured: modelNo.includes('SAK'),
            category: 'Casting'
          };
        })
    );

    res.json({ data: products });
  } catch (error) {
    console.error('Sheets fetch error:', error);
    res.status(500).json({ error: 'Failed to load products from sheets' });
  }
};


// For detailed product with costingItems (called when needed)
exports.getProductByModel = async (req, res) => {
  try {
    const { modelNo } = req.params;
    
    if (!modelNo) {
      return res.status(400).json({ message: 'Model number is required' });
    }
    
    const costingItems = await getCostingItems(modelNo);

    // Get base product from all products
    const allProducts = await fetchSheetData(PDF_DATA_GID);
    const productData = allProducts.find(row => row.model_no?.trim() === modelNo);
    
    if (!productData) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const imageId = getDriveId(productData.image_link || productData.image);
    const datasheetId = getDriveId(productData.pdf_link || productData.datasheet);
    const totalAmount = costingItems.reduce((sum, item) => sum + item.amount, 0);

    const product = {
      modelNo,
      title: productData.product_name?.trim() || `Model ${modelNo}`,
      description: productData.description || `High-precision casting project: ${modelNo}`,
      imageUrl: imageId ? `https://drive.google.com/uc?id=${imageId}` : '/placeholder.jpg',
      datasheetUrl: datasheetId ? `https://drive.google.com/file/d/${datasheetId}/view` : null,
      costingItems,
      totalAmount
    };

    res.json(product);
  } catch (error) {
    console.error('Product details fetch failed:', error);
    res.status(500).json({ error: 'Product details fetch failed' });
  }
};

// Keep other exports if needed (search, exportExcel)
 







// const Product = require("../../models/products");
// const XLSX = require("xlsx");

// exports.addProduct = async (req, res) => {
//   try {
//     const { modelNo, title, description, costingItems, datasheetUrl, images } = req.body;

//     const totalAmount = costingItems.reduce(
//       (sum, i) => sum + Number(i.amount),
//       0
//     );

//     const product = await Product.create({
//       modelNo,
//       title,
//       description,
//       costingItems,
//       totalAmount,
//       datasheetUrl,
//       images
//     });

//     res.status(201).json(product);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };
// exports.getAllProducts = async (req, res) => {
//    try {
//     const products = await Product.find().select(
//       "modelNo title totalAmount imageUrl description datasheetUrl materials isFeatured category"
//     ).lean(); // ✅ Faster - plain JS objects
    
//     res.json({ data: products });
//   } catch (error) {
//     res.status(500).json({ error: "Server error" });
//   }
// };

// exports.searchProducts = async (req, res) => {
//   const { q } = req.query;

//   const products = await Product.find({
//     modelNo: { $regex: q, $options: "i" }
//   });

//   res.json(products);
// };
// exports.getProductByModel = async (req, res) => {
//   const product = await Product.findOne({
//     modelNo: req.params.modelNo
//   });

//   if (!product) {
//     return res.status(404).json({ message: "Product not found" });
//   }

//   res.json(product);
// };
// exports.exportExcel = async (req, res) => {
//   const product = await Product.findOne({
//     modelNo: req.params.modelNo
//   });

//   if (!product) {
//     return res.status(404).json({ message: "Not found" });
//   }

//   const rows = product.costingItems.map(i => ({
//     ITEMS: i.item,
//     QTY: i.qty,
//     RATE: i.rate,
//     AMOUNT: i.amount
//   }));

//   rows.push({
//     ITEMS: "TOTAL",
//     QTY: "",
//     RATE: "",
//     AMOUNT: product.totalAmount
//   });

//   const wb = XLSX.utils.book_new();
//   const ws = XLSX.utils.json_to_sheet(rows);

//   XLSX.utils.book_append_sheet(wb, ws, "Costing");

//   const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

//   res.setHeader("Content-Disposition", `attachment; filename=${product.modelNo}.xlsx`);
//   res.send(buffer);
// };
