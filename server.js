require('dotenv').config();
const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const helmet = require("helmet");
const morgan = require("morgan");

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' })); // CORS
app.use(helmet()); // Security Headers
app.use(morgan('combined')); // HTTP Logger
app.use(express.static(path.join(__dirname))); // Static files
app.use('/images', express.static(path.join(__dirname, 'images'))); // Serve images folder

// Multer Configuration for File Upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'images/';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, or GIF files are allowed.'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 50,
  queueLimit: 0
});

// ROUTES

// Health Check
app.get("/api/health", async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ok', message: 'Database connection is healthy' });
  } catch (error) {
    console.error("Database connection error:", error.message);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Upload Product Photo
app.post("/api/products/upload", upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "File not uploaded" });

    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: "productId is required" });

    const filePath = `images/${req.file.filename}`;
    const [result] = await pool.query(
      `UPDATE Products SET Photo = ? WHERE ProductID = ?`,
      [filePath, productId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Product with the specified ID not found" });
    }

    res.json({ message: "Photo uploaded successfully", filePath });
  } catch (error) {
    console.error("Photo upload error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Get Categories
app.get("/api/categories", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        c.CategoryID AS categoryId, 
        c.CategoryName AS categoryName, 
        sc.SubcategoryID AS subcategoryId, 
        sc.SubcategoryName AS subcategoryName
      FROM Categories c
      LEFT JOIN Subcategories sc ON c.CategoryID = sc.CategoryID
    `);

    const categories = [];
    const categoriesMap = new Map();

    rows.forEach((row) => {
      if (!categoriesMap.has(row.categoryId)) {
        const newCategory = {
          id: row.categoryId,
          name: row.categoryName,
          subcategories: []
        };
        categoriesMap.set(row.categoryId, newCategory);
        categories.push(newCategory);
      }

      if (row.subcategoryId) {
        categoriesMap.get(row.categoryId).subcategories.push({
          id: row.subcategoryId,
          name: row.subcategoryName
        });
      }
    });

    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error.message);
    res.status(500).json({ message: "Failed to fetch categories" });
  }
});

// Get All Products
app.get("/api/products", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        p.ProductID AS productId,
        p.Name AS productName,
        p.Photo AS productPhoto,
        p.Description AS productDescription,
        c.CategoryID AS categoryId,
        c.CategoryName AS categoryName,
        sc.SubcategoryID AS subcategoryId,
        sc.SubcategoryName AS subcategoryName,
        pv.VariantID AS variantId,
        pv.Size AS variantSize,
        pv.Transparency AS variantTransparency,
        pv.Price AS variantPrice
      FROM Products p
      LEFT JOIN Categories c ON p.CategoryID = c.CategoryID
      LEFT JOIN Subcategories sc ON p.SubcategoryID = sc.SubcategoryID
      LEFT JOIN ProductVariants pv ON p.ProductID = pv.ProductID
    `);

    const products = [];
    const productsMap = new Map();

    rows.forEach((row) => {
      if (!productsMap.has(row.productId)) {
        const newProduct = {
          id: row.productId,
          name: row.productName,
          photo: row.productPhoto ? `/${row.productPhoto}` : null,
          description: row.productDescription,
          category: {
            id: row.categoryId,
            name: row.categoryName
          },
          subcategory: row.subcategoryId ? {
            id: row.subcategoryId,
            name: row.subcategoryName
          } : null,
          variants: []
        };
        productsMap.set(row.productId, newProduct);
        products.push(newProduct);
      }

      if (row.variantId) {
        productsMap.get(row.productId).variants.push({
          id: row.variantId,
          size: row.variantSize,
          transparency: row.variantTransparency,
          price: row.variantPrice
        });
      }
    });

    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error.message);
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

// Get Product By ID
app.get("/api/products/:id", async (req, res) => {
  const productId = req.params.id;
  try {
    const [productRows] = await pool.query(`
      SELECT 
        p.ProductID AS productId,
        p.Name AS productName,
        p.Photo AS productPhoto,
        p.Description AS productDescription,
        c.CategoryID AS categoryId,
        c.CategoryName AS categoryName,
        sc.SubcategoryID AS subcategoryId,
        sc.SubcategoryName AS subcategoryName
      FROM Products p
      LEFT JOIN Categories c ON p.CategoryID = c.CategoryID
      LEFT JOIN Subcategories sc ON p.SubcategoryID = sc.SubcategoryID
      WHERE p.ProductID = ?
    `, [productId]);

    if (productRows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    const product = {
      id: productRows[0].productId,
      name: productRows[0].productName,
      photo: productRows[0].productPhoto ? `/${productRows[0].productPhoto}` : null,
      description: productRows[0].productDescription,
      category: {
        id: productRows[0].categoryId,
        name: productRows[0].categoryName
      },
      subcategory: productRows[0].subcategoryId ? {
        id: productRows[0].subcategoryId,
        name: productRows[0].subcategoryName
      } : null,
      variants: []
    };

    const [variantRows] = await pool.query(`
      SELECT 
        VariantID AS id,
        Size AS size,
        Transparency AS transparency,
        Price AS price
      FROM ProductVariants
      WHERE ProductID = ?
    `, [productId]);

    product.variants = variantRows;
    res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Serve Main Page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'visar.html'));
});

// 404 Handler
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '404.html'));
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  const host = process.env.NODE_ENV === 'production'
    ? process.env.API_URL || 'https://visar.com.ua'
    : `http://localhost:${PORT}`;
  console.log(`Server running at ${host}`);
});