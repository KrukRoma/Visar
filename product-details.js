async function loadCatalog() {
    const catalogContainers = document.querySelectorAll('#dynamic-catalog, #mobile-catalog');
    if (catalogContainers.length === 0) {
        console.warn('No catalog containers found');
        return;
    }

    try {
        console.log('Fetching categories from:', `${API_URL}/api/categories`);
        const response = await Promise.race([
            fetch(`${API_URL}/api/categories`),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), 5000))
        ]);
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        const categories = await response.json();
        console.log('Received categories:', categories);

        catalogContainers.forEach(catalogContainer => {
            catalogContainer.innerHTML = '';
            categories.forEach(category => {
                const categoryItem = createCategoryItem(category);
                catalogContainer.appendChild(categoryItem);
            });
        });
    } catch (error) {
        console.error("Помилка завантаження каталогу:", error);
        catalogContainers.forEach(catalogContainer => {
            catalogContainer.innerHTML = '<p>Не вдалося завантажити каталог. Спробуйте пізніше.</p>';
        });
    }
}

function createCategoryItem(category) {
    const categoryItem = document.createElement("div");
    categoryItem.classList.add("dropdown-item");

    if (category.Subcategories && category.Subcategories.length > 0) {
        categoryItem.classList.add("has-submenu");
        const categoryLink = document.createElement("a");
        categoryLink.href = `category-products.html?categoryId=${category.CategoryID}`;
        categoryLink.classList.add("submenu-toggle");
        categoryLink.textContent = category.CategoryName || 'Без назви';
        categoryLink.innerHTML += ' <i class="fas fa-chevron-right"></i>';
        const subMenu = document.createElement("div");
        subMenu.classList.add("submenu");

        category.Subcategories.forEach(subcategory => {
            const subcategoryLink = document.createElement("a");
            subcategoryLink.href = `category-products.html?subcategoryId=${subcategory.SubcategoryID}`;
            subcategoryLink.textContent = subcategory.SubcategoryName || 'Без назви';
            subMenu.appendChild(subcategoryLink);
        });

        categoryItem.appendChild(categoryLink);
        categoryItem.appendChild(subMenu);
    } else {
        const categoryLink = document.createElement("a");
        categoryLink.href = `category-products.html?categoryId=${category.CategoryID}`;
        categoryLink.textContent = category.CategoryName || 'Без назви';
        categoryItem.appendChild(categoryLink);
    }

    return categoryItem;
}

async function loadProductDetails() {
    const productDetailsContainer = document.getElementById("product-details");
    const skeletonProductDetails = document.getElementById("skeleton-product-details");
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get("id");

    if (!productId) {
        skeletonProductDetails.style.display = "none";
        productDetailsContainer.innerHTML = '<p class="error-message">Продукт не знайдено. Відсутній ідентифікатор продукту.</p>';
        productDetailsContainer.classList.add("loaded");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/products/${productId}`);
        if (!response.ok) {
            if (response.status === 404) {
                skeletonProductDetails.style.display = "none";
                productDetailsContainer.innerHTML = '<p class="error-message">Продукт із ID ' + productId + ' не знайдено.</p>';
                productDetailsContainer.classList.add("loaded");
                throw new Error("Продукт не знайдено");
            }
            throw new Error(`HTTP помилка: ${response.status}`);
        }

        const product = await response.json();
        if (!product || typeof product !== 'object') {
            throw new Error("Дані про продукт некоректні або відсутні.");
        }

        const productName = product.name || "Назва продукту недоступна";
        const productPhoto = product.photo || "https://via.placeholder.com/300?text=Зображення+недоступне";
        const productDescription = product.description || "Опис продукту відсутній.";
        let variantData = [];
        let sizeHtml = '';
        let initialPrice = "Ціна недоступна";

        if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
            const variantWithPrice = product.variants.find(variant => variant.price != null);
            if (variantWithPrice) initialPrice = `${variantWithPrice.price} грн`;
            const filteredVariants = product.variants.filter(variant => variant.size && variant.size.toLowerCase() !== "default");
            if (filteredVariants.length > 0) {
                variantData = filteredVariants.map(variant => {
                    const size = variant.size || "Розмір недоступний";
                    const price = variant.price != null ? `${variant.price} грн` : "Ціна недоступна";
                    return { size, price };
                });
                initialPrice = variantData[0].price;
                if (variantData.length === 1) {
                    sizeHtml = `<span>Розмір: ${variantData[0].size}</span>`;
                } else {
                    sizeHtml = `
                        <label for="size-select">Розмір: </label>
                        <select id="size-select" name="size">
                            ${variantData.map((variant, index) => `<option value="${index}" ${index === 0 ? 'selected' : ''}>${variant.size}</option>`).join('')}
                        </select>
                    `;
                }
            }
        }

        productDetailsContainer.innerHTML = `
            <img src="${productPhoto}" alt="${productName}" class="product-image" loading="lazy">
            <div class="product-info-container">
                <h1 class="product-title">${productName}</h1>
                ${sizeHtml ? `<div class="product-size">${sizeHtml}</div>` : ''}
                <div class="product-price" id="product-price">${initialPrice}</div>
                <div class="product-description-container">
                    <div class="product-description-title">Опис продукту</div>
                    <p class="product-description">${productDescription}</p>
                </div>
            </div>
        `;

        if (variantData.length > 1) {
            const sizeSelect = document.getElementById("size-select");
            const priceElement = document.getElementById("product-price");
            sizeSelect.addEventListener("change", (e) => {
                const selectedIndex = e.target.value;
                const selectedVariant = variantData[selectedIndex];
                priceElement.textContent = selectedVariant.price;
            });
        }

        skeletonProductDetails.style.display = "none";
        productDetailsContainer.classList.add("loaded");
    } catch (error) {
        console.error("Помилка завантаження продукту:", error);
        skeletonProductDetails.style.display = "none";
        productDetailsContainer.innerHTML = '<p class="error-message">Не вдалося завантажити продукт із ID ' + productId + '. Спробуйте пізніше.</p>';
        productDetailsContainer.classList.add("loaded");
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    await loadCatalog();
    await loadProductDetails();
    document.querySelectorAll('.info-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const currentPage = window.location.pathname;
            if (currentPage.includes('visar.html')) {
                const targetSection = document.querySelector('#why-need');
                if (targetSection) targetSection.scrollIntoView({ behavior: 'smooth' });
            } else {
                window.location.href = 'visar.html#why-need';
            }
        });
    });

    const modal = document.getElementById('contact-modal');
    const contactLinks = document.querySelectorAll('.contact-link');
    const closeBtn = document.querySelector('.close-btn');

    contactLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            modal.style.display = 'flex';
        });
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'flex') modal.style.display = 'none';
    });
});