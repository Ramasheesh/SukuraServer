// controllers/adminAuth.controller.js
const Admin = require('../../models/admin');
const Product = require("../../models/products");
const bcrypt = require('bcryptjs');
const generateToken = require('../../utils/generateToken');
const XLSX = require("xlsx");

const createAdmin = async (req, res) => {
    try {
        const { username, secretKey } = req.body;
        console.log('username, secretKey: ', username, secretKey);
        const adminCreate = await Admin.create({
     username: username ,
    secretKey: secretKey 
     });
    await adminCreate.save();
    res.status(201).json({ message: 'Admin created', adminCreate });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
const loginAdmin = async (req, res) => {
  const  key = req.body.key;
  const admin = await Admin.findOne({
    username: process.env.ADMIN_USERNAME
  });
  if (!admin) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  const isValid = await bcrypt.compare(key, admin.secretKey);
  if (!isValid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  const token = generateToken(admin);
  res.cookie("adminToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" ,
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  });

  res.json({ success: true });
};



// admin status (reads cookie)
const adminStatus = async (req, res) => {
    const adminToken = req.cookies.adminToken; // or your cookie name
//   res.json({ isAdmin: !!adminToken });
//   const adminToken = req.cookies.adminToken;
    if (!adminToken) {
        return res.status(401).json({ isAdmin: false });
    }
    try {
        const decoded = await jwt.verify(adminToken, process.env.JWT_SECRET);
        res.json({ isAdmin: true });
    } catch(error) {
        console.log('error: ', error);
        res.status(401).json({ isAdmin: false });
    }
};

//  Logout clears cookie
const logoutAdmin = (req, res) => {
  res.clearCookie('adminToken');
  res.json({ success: true });
};

// CRUD Operations for Admins can be added here (e.g., createAdmin, getAdmins, updateAdmin, deleteAdmin)
// Product Controllers

const addProduct = async (req, res) => {
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

const getProducts = async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// const createProduct = async (req, res) => {
//     try {
//         const product = new Product(req.body);
//         await product.save();
//         res.status(201).json(product);
//     } catch (error) {
//         res.status(400).json({ error: error.message });
//     }
// };

const updateProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(product);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const deleteProduct = async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: 'Product deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Price Controllers
const getPrices = async (req, res) => {
    try {
        const prices = await Price.find();
        res.json(prices);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createPrice = async (req, res) => {
    try {
        const price = new Price(req.body);
        await price.save();
        res.status(201).json(price);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const updatePrice = async (req, res) => {
    try {
        const price = await Price.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(price);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const deletePrice = async (req, res) => {
    try {
        await Price.findByIdAndDelete(req.params.id);
        res.json({ message: 'Price deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Material Controllers
const getMaterials = async (req, res) => {
    try {
        const materials = await CastingMaterial.find();
        res.json(materials);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createMaterial = async (req, res) => {
    try {
        const material = new CastingMaterial(req.body);
        await material.save();
        res.status(201).json(material);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const updateMaterial = async (req, res) => {
    try {
        const material = await CastingMaterial.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(material);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const deleteMaterial = async (req, res) => {
    try {
        await CastingMaterial.findByIdAndDelete(req.params.id);
        res.json({ message: 'Material deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    loginAdmin, logoutAdmin, addProduct,
    getProducts, 
    // createProduct,
    createAdmin,
    adminStatus,
    logoutAdmin,
    updateProduct, deleteProduct,
    getPrices, createPrice, updatePrice, deletePrice,
    getMaterials, createMaterial, updateMaterial, deleteMaterial
};
