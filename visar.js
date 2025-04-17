document.addEventListener("DOMContentLoaded", () => {
  const catalogContainer = document.getElementById("dynamic-catalog");
  const mobileCatalogContainer = document.getElementById("mobile-dynamic-catalog");

  // Функція для завантаження категорій та підкатегорій
  async function loadCatalog() {
    try {
      const response = await fetch("http://localhost:3000/api/categories"); // Запит до API
      if (!response.ok) {
        throw new Error(`HTTP помилка: ${response.status}`);
      }
      const categories = await response.json();

      // Генерація HTML для категорій та підкатегорій
      categories.forEach(category => {
        const categoryItemDesktop = createCategoryItem(category);
        const categoryItemMobile = createMobileCategoryItem(category);

        catalogContainer.appendChild(categoryItemDesktop);
        mobileCatalogContainer.appendChild(categoryItemMobile);
      });
    } catch (error) {
      console.error("Помилка завантаження каталогу:", error);
      catalogContainer.innerHTML = "<p>Не вдалося завантажити каталог. Спробуйте пізніше.</p>";
      mobileCatalogContainer.innerHTML = "<p>Не вдалося завантажити каталог. Спробуйте пізніше.</p>";
    }
  }

  // Створення елемента для десктопного меню
  function createCategoryItem(category) {
    const categoryItem = document.createElement("div");
    categoryItem.classList.add("dropdown-item");

    if (category.subcategories && category.subcategories.length > 0) {
      categoryItem.classList.add("has-submenu");
      const categoryLink = document.createElement("a");
      categoryLink.href = "#";
      categoryLink.classList.add("submenu-toggle");
      categoryLink.textContent = category.name;
      categoryLink.innerHTML += ' <i class="fas fa-chevron-right"></i>';

      const subMenu = document.createElement("div");
      subMenu.classList.add("submenu");

      category.subcategories.forEach(subcategory => {
        const subcategoryLink = document.createElement("a");
        subcategoryLink.href = "#";
        subcategoryLink.textContent = subcategory.name;
        subMenu.appendChild(subcategoryLink);
      });

      categoryItem.appendChild(categoryLink);
      categoryItem.appendChild(subMenu);
    } else {
      const categoryLink = document.createElement("a");
      categoryLink.href = "#";
      categoryLink.textContent = category.name;
      categoryItem.appendChild(categoryLink);
    }

    return categoryItem;
  }

  // Створення елемента для мобільного меню
  function createMobileCategoryItem(category) {
    const categoryItem = document.createElement("li");
    categoryItem.classList.add("mobile-dropdown-item");

    if (category.subcategories && category.subcategories.length > 0) {
      const categoryLink = document.createElement("a");
      categoryLink.href = "#";
      categoryLink.classList.add("mobile-submenu-toggle");
      categoryLink.textContent = category.name;
      categoryLink.innerHTML += ' <i class="fas fa-chevron-down"></i>';

      const subMenu = document.createElement("ul");
      subMenu.classList.add("mobile-submenu");

      category.subcategories.forEach(subcategory => {
        const subcategoryItem = document.createElement("li");
        const subcategoryLink = document.createElement("a");
        subcategoryLink.href = "#";
        subcategoryLink.textContent = subcategory.name;
        subcategoryItem.appendChild(subcategoryLink);
        subMenu.appendChild(subcategoryItem);
      });

      categoryItem.appendChild(categoryLink);
      categoryItem.appendChild(subMenu);
    } else {
      const categoryLink = document.createElement("a");
      categoryLink.href = "#";
      categoryLink.textContent = category.name;
      categoryItem.appendChild(categoryLink);
    }

    return categoryItem;
  }

  // Завантаження каталогу
  loadCatalog();

  // Функціонал для мобільного меню
  const mobileMenuToggle = document.querySelector(".mobile-menu-toggle");
  const mobileMenuClose = document.querySelector(".mobile-menu-close");
  const mobileMenu = document.querySelector(".mobile-menu");

  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener("click", () => {
      mobileMenu.classList.add("active");
      document.body.classList.add("mobile-menu-open");
    });
  }

  if (mobileMenuClose) {
    mobileMenuClose.addEventListener("click", () => {
      mobileMenu.classList.remove("active");
      document.body.classList.remove("mobile-menu-open");
    });
  }

  // Закриття мобільного меню при кліку поза ним
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".mobile-menu") && !e.target.closest(".mobile-menu-toggle")) {
      mobileMenu.classList.remove("active");
      document.body.classList.remove("mobile-menu-open");
    }
  });

  // Анімація для кнопок при наведенні
  const buttons = document.querySelectorAll(
    ".btn-catalog, .btn-contact, .btn-view-cart, .btn-add-to-cart, .btn-full-catalog, .btn-view"
  );

  buttons.forEach((button) => {
    button.addEventListener("mouseenter", function () {
      this.style.transform = "scale(1.05)";
    });

    button.addEventListener("mouseleave", function () {
      this.style.transform = "scale(1)";
    });
  });

  // Гладка прокрутка для якірних посилань
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();

      const targetId = this.getAttribute("href");
      if (targetId === "#") return;

      const targetElement = document.querySelector(targetId);

      if (targetElement) {
        const headerHeight = document.querySelector("header").offsetHeight;
        const targetPosition =
          targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: "smooth",
        });
      }
    });
  });
});