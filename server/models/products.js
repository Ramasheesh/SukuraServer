const mongoose = require("mongoose");

const costingItemSchema = new mongoose.Schema({
  item: String,
  qty: Number,
  rate: Number,
  amount: Number
});

const productSchema = new mongoose.Schema({
  modelNo: {
    type: String,
    required: true,
    index: true
  },
  title: String,
  description: String,

  costingItems: [costingItemSchema],
  totalAmount: Number,

  datasheetUrl: String,
  images: [String],

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Product", productSchema);
