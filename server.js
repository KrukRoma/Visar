require('dotenv').config();
const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

// Налаштування Multer для зберігання файлів у папці images/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'images/';
    // Переконайтеся, що папка images/ існує
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalName));
  }
});
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Тільки JPEG, PNG або GIF файли дозволені'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // Обмеження розміру файлу (5MB)
});

// Обслуговування статичних файлів
app.use(express.static(path.join(__dirname)));
app.use('/images', express.static(path.join(__dirname, 'images'))); // Явне обслуговування папки images/
console.log(`Serving static files from: ${path.join(__dirname)}`);
console.log(`Serving images from: ${path.join(__dirname, 'images')}`);

// Пул підключень до MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 100,
  queueLimit: 0
});

// Маршрут: Завантаження фотографії продукту
app.post("/api/products/upload", upload.single('photo'), async (req, res) => {
  try {
    console.log('Received upload request:', req.body, req.file);
    if (!req.file) {
      return res.status(400).json({ error: "Файл не завантажено" });
    }

    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ error: "productId є обов’язковим" });
    }

    const filePath = `images/${req.file.filename}`; // Шлях до файлу

    // Оновлення шляху до фото в базі даних
    const [result] = await pool.query(
      `UPDATE Products SET Photo = ? WHERE ProductID = ?`,
      [filePath, productId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Продукт із вказаним ID не знайдено" });
    }

    res.json({ message: "Фото успішно завантажено", filePath });
  } catch (error) {
    console.error("Помилка завантаження фото:", error.message);
    res.status(500).json({ error: "Помилка сервера" });
  }
});

// Маршрут: Отримання категорій та підкатегорій
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
          subcategories: [],
        };
        categoriesMap.set(row.categoryId, newCategory);
        categories.push(newCategory);
      }

      if (row.subcategoryId) {
        categoriesMap.get(row.categoryId).subcategories.push({
          id: row.subcategoryId,
          name: row.subcategoryName,
        });
      }
    });

    res.json(categories);
  } catch (error) {
    console.error("Помилка отримання категорій:", error.message);
    res.status(500).json({ message: "Не вдалося отримати категорії" });
  }
});

// Маршрут: Отримання всіх продуктів
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
          photo: row.productPhoto ? `/${row.productPhoto}` : null, // Додаємо "/" до шляху
          description: row.productDescription,
          category: {
            id: row.categoryId,
            name: row.categoryName,
          },
          subcategory: row.subcategoryId ? {
            id: row.subcategoryId,
            name: row.subcategoryName,
          } : null,
          variants: [],
        };
        productsMap.set(row.productId, newProduct);
        products.push(newProduct);
      }

      if (row.variantId) {
        productsMap.get(row.productId).variants.push({
          id: row.variantId,
          size: row.variantSize,
          transparency: row.variantTransparency,
          price: row.variantPrice,
        });
      }
    });

    res.json(products);
  } catch (error) {
    console.error("Помилка отримання продуктів:", error.message);
    res.status(500).json({ message: "Не вдалося отримати продукти" });
  }
});

// Маршрут: Отримання одного продукту по ID
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
      return res.status(404).json({ error: "Продукт не знайдено" });
    }

    const product = {
      id: productRows[0].productId,
      name: productRows[0].productName,
      photo: productRows[0].productPhoto ? `/${productRows[0].productPhoto}` : null, // Додаємо "/" до шляху
      description: productRows[0].productDescription,
      category: {
        id: productRows[0].categoryId,
        name: productRows[0].categoryName,
      },
      subcategory: productRows[0].subcategoryId ? {
        id: productRows[0].subcategoryId,
        name: productRows[0].subcategoryName,
      } : null,
      variants: [],
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
    console.error("Помилка при отриманні продукту:", error.message);
    res.status(500).json({ error: "Серверна помилка" });
  }
});

// Запуск сервера
app.listen(port, () => {
  console.log(`Сервер запущено на http://localhost:${port}`);
});