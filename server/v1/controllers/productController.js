const Product = require("../../models/products");
const XLSX = require("xlsx");

exports.addProduct = async (req, res) => {
  try {
    const { modelNo, title, description, costingItems, datasheetUrl, images } = req.body;

    const totalAmount = costingItems.reduce(
      (sum, i) => sum + Number(i.amount),
      0
    );

    const product = await Product.create({
      modelNo,
      title,
      description,
      costingItems,
      totalAmount,
      datasheetUrl,
      images
    });

    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.getAllProducts = async (req, res) => {
   try {
    const products = await Product.find().select(
      "modelNo title totalAmount imageUrl description datasheetUrl materials isFeatured category"
    ).lean(); // ✅ Faster - plain JS objects
    
    res.json({ data: products });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.searchProducts = async (req, res) => {
  const { q } = req.query;

  const products = await Product.find({
    modelNo: { $regex: q, $options: "i" }
  });

  res.json(products);
};
exports.getProductByModel = async (req, res) => {
  const product = await Product.findOne({
    modelNo: req.params.modelNo
  });

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  res.json(product);
};
exports.exportExcel = async (req, res) => {
  const product = await Product.findOne({
    modelNo: req.params.modelNo
  });

  if (!product) {
    return res.status(404).json({ message: "Not found" });
  }

  const rows = product.costingItems.map(i => ({
    ITEMS: i.item,
    QTY: i.qty,
    RATE: i.rate,
    AMOUNT: i.amount
  }));

  rows.push({
    ITEMS: "TOTAL",
    QTY: "",
    RATE: "",
    AMOUNT: product.totalAmount
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  XLSX.utils.book_append_sheet(wb, ws, "Costing");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  res.setHeader("Content-Disposition", `attachment; filename=${product.modelNo}.xlsx`);
  res.send(buffer);
};
