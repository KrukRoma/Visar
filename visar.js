document.addEventListener("DOMContentLoaded", () => {
  const catalogContainer = document.getElementById("dynamic-catalog");
  const mobileCatalogContainer = document.getElementById("mobile-dynamic-catalog");
  const productSlider = document.querySelector(".slider-track");
  
  // Logo click to scroll to top
  const topLogo = document.getElementById("top-logo");
  const mobileLogo = document.getElementById("mobile-top-logo");
  
  if (topLogo) {
    topLogo.addEventListener("click", (e) => {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    });
  }
  
  if (mobileLogo) {
    mobileLogo.addEventListener("click", (e) => {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
      // Close mobile menu when clicking logo
      const mobileMenu = document.querySelector(".mobile-menu");
      if (mobileMenu) {
        mobileMenu.classList.remove("active");
        document.body.classList.remove("mobile-menu-open");
      }
    });
  }

  // Функція для завантаження категорій та підкатегорій
  async function loadCatalog() {
    try {
      // Перевіряємо, чи існують контейнери для категорій
      if (!catalogContainer && !mobileCatalogContainer) {
        console.log("Контейнери для категорій не знайдено, пропускаємо завантаження каталогу");
        return;
      }

      const response = await fetch("http://localhost:3000/api/categories");
      console.log("Статус відповіді каталогу:", response.status, response.statusText);
      if (!response.ok) {
        throw new Error(`HTTP помилка: ${response.status}`);
      }
      const categories = await response.json();
      console.log("Отримані категорії:", categories);

      categories.forEach(category => {
        if (catalogContainer) {
          const categoryItemDesktop = createCategoryItem(category);
          catalogContainer.appendChild(categoryItemDesktop);
        }
        
        if (mobileCatalogContainer) {
          const categoryItemMobile = createMobileCategoryItem(category);
          mobileCatalogContainer.appendChild(categoryItemMobile);
        }
      });
    } catch (error) {
      console.error("Помилка завантаження каталогу:", error);
      if (catalogContainer) {
        catalogContainer.innerHTML = "<p>Не вдалося завантажити каталог. Спробуйте пізніше.</p>";
      }
      if (mobileCatalogContainer) {
        mobileCatalogContainer.innerHTML = "<p>Не вдалося завантажити каталог. Спробуйте пізніше.</p>";
      }
    }
  }

  // Створення елемента для десктопного меню
  function createCategoryItem(category) {
    const categoryItem = document.createElement("div");
    categoryItem.classList.add("dropdown-item");

    if (category.subcategories && category.subcategories.length > 0) {
      categoryItem.classList.add("has-submenu");
      const categoryLink = document.createElement("a");
      categoryLink.href = `category-products.html?categoryId=${category.id}`;
      categoryLink.classList.add("submenu-toggle");
      categoryLink.textContent = category.name;
      categoryLink.innerHTML += ' <i class="fas fa-chevron-right"></i>';

      const subMenu = document.createElement("div");
      subMenu.classList.add("submenu");

      category.subcategories.forEach(subcategory => {
        const subcategoryLink = document.createElement("a");
        subcategoryLink.href = `category-products.html?subcategoryId=${subcategory.id}`;
        subcategoryLink.textContent = subcategory.name;
        subMenu.appendChild(subcategoryLink);
      });

      categoryItem.appendChild(categoryLink);
      categoryItem.appendChild(subMenu);
    } else {
      const categoryLink = document.createElement("a");
      categoryLink.href = `category-products.html?categoryId=${category.id}`;
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
      categoryLink.href = `category-products.html?categoryId=${category.id}`;
      categoryLink.classList.add("mobile-submenu-toggle");
      categoryLink.textContent = category.name;
      categoryLink.innerHTML += ' <i class="fas fa-chevron-down"></i>';

      const subMenu = document.createElement("ul");
      subMenu.classList.add("mobile-submenu");

      category.subcategories.forEach(subcategory => {
        const subcategoryItem = document.createElement("li");
        const subcategoryLink = document.createElement("a");
        subcategoryLink.href = `category-products.html?subcategoryId=${subcategory.id}`;
        subcategoryLink.textContent = subcategory.name;
        subcategoryItem.appendChild(subcategoryLink);
        subMenu.appendChild(subcategoryItem);
      });

      categoryItem.appendChild(categoryLink);
      categoryItem.appendChild(subMenu);
    } else {
      const categoryLink = document.createElement("a");
      categoryLink.href = `category-products.html?categoryId=${category.id}`;
      categoryLink.textContent = category.name;
      categoryItem.appendChild(categoryLink);
    }

    return categoryItem;
  }

  // Функція для завантаження продуктів
  async function loadProducts() {
    try {
      // Перевіряємо, чи існує елемент slider-track
      if (!productSlider) {
        console.log("Елемент slider-track не знайдено, пропускаємо завантаження продуктів");
        return;
      }

      const response = await fetch("http://localhost:3000/api/products");
      console.log("Статус відповіді продуктів:", response.status, response.statusText);
      if (!response.ok) {
        throw new Error(`HTTP помилка: ${response.status}`);
      }
      const products = await response.json();
      console.log("Отримані продукти:", products);

      productSlider.innerHTML = "";

      products.forEach((product, index) => {
        const slide = document.createElement("div");
        slide.classList.add("slide");
        if (index >= 3) {
          slide.classList.add("hidden-product");
        } else {
          slide.classList.add("default-product");
        }

        const productCard = document.createElement("div");
        productCard.classList.add("product-card");
        productCard.dataset.productId = product.id;

        const img = document.createElement("img");
        img.src = product.photo;
        img.alt = product.name;
        img.classList.add("product-image");

        const productInfo = document.createElement("div");
        productInfo.classList.add("product-info");

        const h3 = document.createElement("h3");
        h3.textContent = product.name;

        const price = document.createElement("div");
        price.classList.add("product-price");
        price.textContent = product.variants.length > 0 && product.variants[0].price != null
          ? `${Number(product.variants[0].price).toFixed(2)} ₴`
          : "Ціна недоступна";

        const viewButton = document.createElement("a");
        viewButton.href = `product-details.html?id=${product.id}`;
        viewButton.classList.add("btn-view-cart");
        viewButton.textContent = "Переглянути";

        productInfo.appendChild(h3);
        productInfo.appendChild(price);
        productInfo.appendChild(viewButton);
        productCard.appendChild(img);
        productCard.appendChild(productInfo);
        slide.appendChild(productCard);
        productSlider.appendChild(slide);
      });

      // Додаємо обробник подій для кліку на продукт
      document.querySelectorAll(".product-card").forEach(card => {
        card.addEventListener("click", (e) => {
          if (!e.target.closest(".btn-view-cart")) {
            const productId = card.dataset.productId;
            window.location.href = `product-details.html?id=${productId}`;
          }
        });
      });
    } catch (error) {
      console.error("Помилка завантаження продуктів:", error);
      if (productSlider) {
        productSlider.innerHTML = "<p>Не вдалося завантажити продукти. Спробуйте пізніше.</p>";
      }
    }
  }

  // Завантаження каталогу та продуктів
  loadCatalog();
  loadProducts();

  // Функціонал для мобільного меню
  const mobileMenuToggle = document.querySelector(".mobile-menu-toggle");
  const mobileMenuClose = document.querySelector(".mobile-menu-close");
  const mobileMenu = document.querySelector(".mobile-menu");
  const mobileMenuItems = document.querySelectorAll(".mobile-menu-items a");

  if (mobileMenuToggle && mobileMenu) {
    mobileMenuToggle.addEventListener("click", () => {
      mobileMenu.classList.add("active");
      document.body.classList.add("mobile-menu-open");
    });
  }

  if (mobileMenuClose && mobileMenu) {
    mobileMenuClose.addEventListener("click", () => {
      mobileMenu.classList.remove("active");
      document.body.classList.remove("mobile-menu-open");
    });
  }

  // Close mobile menu when clicking on menu items
  if (mobileMenu) {
    mobileMenuItems.forEach(item => {
      item.addEventListener("click", () => {
        mobileMenu.classList.remove("active");
        document.body.classList.remove("mobile-menu-open");
      });
    });
  }

  // Закриття мобільного меню при кліку поза ним
  if (mobileMenu) {
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".mobile-menu") && !e.target.closest(".mobile-menu-toggle")) {
        mobileMenu.classList.remove("active");
        document.body.classList.remove("mobile-menu-open");
      }
    });
  }

  // Додаємо обробники подій для мобільних підменю
  document.querySelectorAll(".mobile-submenu-toggle").forEach(toggle => {
    toggle.addEventListener("click", function(e) {
      e.preventDefault();
      const parent = this.closest(".mobile-dropdown-item");
      parent.classList.toggle("active");
    });
  });

  // Анімація для кнопок при наведенні
  const buttons = document.querySelectorAll(
    ".btn-catalog, .btn-contact, .btn-view-cart, .btn-add-to-cart, .btn-view"
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
      const targetId = this.getAttribute("href");
      if (targetId === "#") return;
      
      e.preventDefault();
      const targetElement = document.querySelector(targetId);

      if (targetElement) {
        const headerHeight = document.querySelector("header").offsetHeight;
        const targetPosition =
          targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: "smooth",
        });
        
        // Close mobile menu after clicking a link
        if (mobileMenu && mobileMenu.classList.contains("active")) {
          mobileMenu.classList.remove("active");
          document.body.classList.remove("mobile-menu-open");
        }
      }
    });
  });

  // Ініціалізація YouTube API для відео (якщо є відео на сторінці)
  const videoContainer = document.querySelector(".video-container");
  if (videoContainer) {
    // Додаємо клас для відео, щоб показати, що воно завантажується
    videoContainer.classList.add("loading");
    
    // Коли відео завантажиться, видаляємо клас loading
    const videoIframe = videoContainer.querySelector("iframe");
    if (videoIframe) {
      videoIframe.addEventListener("load", () => {
        videoContainer.classList.remove("loading");
      });
    }
  }
});