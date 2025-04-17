const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors"); // Додаємо CORS

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

// Запуск сервера
app.listen(port, () => {
  console.log(`Сервер запущено на http://localhost:${port}`);
});