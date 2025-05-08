require('dotenv').config();
const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const helmet = require("helmet");

const app = express();
const PORT = process.env.PORT || 8080;

// app.use((req, res, next) => {
//   if (req.protocol === 'http' && process.env.NODE_ENV === 'production') {
//     return res.redirect(301, `https://${req.headers.host}${req.url}`);
//   }
//   next();
// });

app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      frameSrc: ["'self'", "https://www.youtube.com", "https://youtube.com"],
      scriptSrc: [
        "'self'",
        "https://www.youtube.com",
        "https://s.ytimg.com",
        "https://cdnjs.cloudflare.com",
        "'unsafe-inline'"
      ],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https://www.visar.com.ua"],
      connectSrc: ["'self'", "https://www.visar.com.ua", "https://www.youtube.com", "https://s.ytimg.com"],
      mediaSrc: ["'self'", "https://www.youtube.com", "https://s.ytimg.com"]
    }
  })
);
app.use(express.static(path.join(__dirname)));
app.use('/images', express.static(path.join(__dirname, 'images')));

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
  limits: { fileSize: 5 * 1024 * 1024 }
});

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 50,
  queueLimit: 0,
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error('Failed to initialize database connection:', err);
  } else {
    console.log('Database connection initialized successfully');
    connection.release();
  }
});

app.get("/api/health", async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1');
    console.log('Health check successful:', rows);
    res.status(200).json({ status: 'ok', message: 'Database connection is healthy' });
  } catch (err) {
    console.error('Health check failed:', err);
    res.status(500).json({ status: 'error', message: 'Database connection error', error: err.message });
  }
});

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
  } catch (err) {
    console.error('Error uploading photo:', err); 
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/categories", async (req, res) => {
  console.log('Received request for /api/categories');
  try {
      const [rows] = await pool.query(`
          SELECT 
              c.CategoryID AS CategoryID, 
              c.CategoryName AS CategoryName, 
              sc.SubcategoryID AS SubcategoryID, 
              sc.SubcategoryName AS SubcategoryName
          FROM Categories c
          LEFT JOIN Subcategories sc ON c.CategoryID = sc.CategoryID
      `);
      console.log('Categories rows:', rows);

      // Групуємо категорії та підкатегорії
      const categoryMap = new Map();
      rows.forEach(row => {
          if (!categoryMap.has(row.CategoryID)) {
              categoryMap.set(row.CategoryID, {
                  CategoryID: row.CategoryID,
                  CategoryName: row.CategoryName,
                  Subcategories: []
              });
          }
          if (row.SubcategoryID && row.SubcategoryName) {
              categoryMap.get(row.CategoryID).Subcategories.push({
                  SubcategoryID: row.SubcategoryID,
                  SubcategoryName: row.SubcategoryName
              });
          }
      });

      const categories = Array.from(categoryMap.values());
      console.log('Processed categories:', categories);
      res.json(categories);
  } catch (err) {
      console.error('Error fetching categories:', err);
      res.status(500).json({ message: "Failed to fetch categories", error: err.message });
  }
});

app.get("/api/products", async (req, res) => {
  try {
      const { categoryId, subcategoryId } = req.query;
      let query = `
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
      `;
      
      const queryParams = [];
      const conditions = [];

      if (categoryId) {
          conditions.push(`p.CategoryID = ?`);
          queryParams.push(categoryId);
      }
      if (subcategoryId) {
          conditions.push(`p.SubcategoryID = ?`);
          queryParams.push(subcategoryId);
      }
      if (conditions.length > 0) {
          query += ` WHERE ${conditions.join(' AND ')}`;
      }

      const [rows] = await pool.query(query, queryParams);
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

      console.log('Query parameters:', { categoryId, subcategoryId });
      console.log('Products rows:', rows);
      console.log('Processed products:', products);
      res.json(products);
  } catch (err) {
      console.error('Error fetching products:', err);
      res.status(500).json({ message: "Failed to fetch products", error: err.message });
  }
});

app.get("/api/products/:id", async (req, res) => {
  const productId = req.params.id;
  console.log(`Fetching product with ID: ${productId}`);
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
          console.log(`Product with ID ${productId} not found`);
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
      console.log('Product details:', product);
      res.json(product); // Додаємо повернення відповіді
  } catch (err) {
      console.error('Error fetching product by ID:', err);
      res.status(500).json({ error: "Server error" });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'visar.html'));
});

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '404.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  const host = process.env.NODE_ENV === 'production'
    ? process.env.API_URL || 'https://visar.com.ua'
    : `http://localhost:${PORT}`;
  console.log(`Server running at ${host}`);
});