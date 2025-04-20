const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

// Middleware для обробки JSON-запитів
app.use(express.json());

// Активуємо CORS
app.use(cors());

// Конфігурація підключення до бази даних MySQL
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "Roma2008.",
  database: "Visar",
};

// Функція для підключення до бази даних
async function connectToDatabase() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log("Успішно підключено до бази даних");
    return connection;
  } catch (error) {
    console.error("Помилка підключення до бази даних:", error.message);
    throw error;
  }
}

// Маршрут для отримання категорій та підкатегорій
app.get("/api/categories", async (req, res) => {
  try {
    const connection = await connectToDatabase();
    const [rows] = await connection.query(`
      SELECT 
        c.CategoryID AS categoryId, 
        c.CategoryName AS categoryName, 
        sc.SubcategoryID AS subcategoryId, 
        sc.SubcategoryName AS subcategoryName
      FROM Categories c
      LEFT JOIN Subcategories sc ON c.CategoryID = sc.CategoryID
    `);

    // Групування результатів за категоріями
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
    res.status(500).json({ message: "Не вдалося отримати категорії", error: error.message });
  }
});

// Маршрут для отримання продуктів з варіантами
app.get("/api/products", async (req, res) => {
  try {
    const connection = await connectToDatabase();
    const [rows] = await connection.query(`
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

    // Групування результатів за продуктами
    const products = [];
    const productsMap = new Map();

    rows.forEach((row) => {
      if (!productsMap.has(row.productId)) {
        const newProduct = {
          id: row.productId,
          name: row.productName,
          photo: row.productPhoto,
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
    res.status(500).json({ message: "Не вдалося отримати продукти", error: error.message });
  }
});

// Маршрут для отримання одного продукту за ID
app.get("/api/products/:id", async (req, res) => {
  const productId = req.params.id;

  try {
    const connection = await connectToDatabase();

    // Отримати продукт
    const [productRows] = await connection.query(`
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
      photo: productRows[0].productPhoto,
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

    // Отримати варіанти продукту
    const [variantRows] = await connection.query(`
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