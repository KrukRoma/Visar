let isCatalogLoaded = false;

async function loadCatalog() {
    const catalogContainers = document.querySelectorAll('#dynamic-catalog, #mobile-catalog');
    if (catalogContainers.length === 0) {
        console.warn('No catalog containers found');
        return;
    }

    try {
        console.log('Fetching categories from:', `${API_URL}/api/categories`);
        const response = await fetch(`${API_URL}/api/categories`);
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        const categories = await response.json();

        catalogContainers.forEach(catalogContainer => {
            catalogContainer.innerHTML = '';
            const allProductsItem = document.createElement('div');
            allProductsItem.classList.add('dropdown-item');
            const allProductsLink = document.createElement('a');
            allProductsLink.href = '/category-products.html';
            allProductsLink.textContent = 'Каталог товарів';
            allProductsItem.appendChild(allProductsLink);
            catalogContainer.appendChild(allProductsItem);

            categories.forEach(category => {
                const categoryItem = createCategoryItem(category);
                catalogContainer.appendChild(categoryItem);
            });
        });
    } catch (error) {
        console.error('Помилка завантаження каталогу:', error);
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

    async function loadCategoryProducts() {
        const categoryTitle = document.getElementById("category-title");
        const skeletonTitle = document.getElementById("skeleton-title");
        const productsGrid = document.getElementById("products-grid");
        const paginationContainer = document.getElementById("pagination");
        const loader = document.getElementById("loader");
        const urlParams = new URLSearchParams(window.location.search);
        const categoryId = urlParams.get("categoryId");
        const subcategoryId = urlParams.get("subcategoryId");
        const page = parseInt(urlParams.get("page")) || 1;
        const productsPerPage = 21;

        const hasInvalidParams = Array.from(urlParams.keys()).some(
            key => key !== "categoryId" && key !== "subcategoryId" && key !== "page"
        );
        if (hasInvalidParams) {
            loader.style.display = "none";
            skeletonTitle.style.display = "none";
            categoryTitle.textContent = "Категорію не знайдено";
            categoryTitle.classList.add("loaded");
            productsGrid.innerHTML = '<p class="error-message">Категорію не знайдено. Відсутній ідентифікатор категорії.</p>';
            productsGrid.classList.add("loaded");
            paginationContainer.style.display = "none";
            return;
        }

        try {
            const productsResponse = await fetch(`${API_URL}/api/products`);
            if (!productsResponse.ok) throw new Error(`HTTP помилка (продукти): ${productsResponse.status}`);
            const allProducts = await productsResponse.json();
            let categoryName = "Всі товари";
            let filteredProducts = allProducts;

            if (categoryId || subcategoryId) {
                const categoriesResponse = await fetch(`${API_URL}/api/categories`);
                if (!categoriesResponse.ok) throw new Error(`HTTP помилка (категорії): ${categoriesResponse.status}`);
                const categories = await categoriesResponse.json();

                if (categoryId) {
                    if (isNaN(categoryId)) {
                        loader.style.display = "none";
                        skeletonTitle.style.display = "none";
                        categoryTitle.textContent = "Категорію не знайдено";
                        categoryTitle.classList.add("loaded");
                        productsGrid.innerHTML = '<p class="error-message">Категорію не знайдено. Відсутній ідентифікатор категорії.</p>';
                        productsGrid.classList.add("loaded");
                        paginationContainer.style.display = "none";
                        return;
                    }
                    const category = categories.find(cat => cat.id === parseInt(categoryId));
                    if (!category) {
                        loader.style.display = "none";
                        skeletonTitle.style.display = "none";
                        categoryTitle.textContent = "Категорію не знайдено";
                        categoryTitle.classList.add("loaded");
                        productsGrid.innerHTML = '<p class="error-message">Категорію не знайдено.</p>';
                        productsGrid.classList.add("loaded");
                        paginationContainer.style.display = "none";
                        return;
                    }
                    categoryName = category.name;
                    filteredProducts = allProducts.filter(product =>
                        product.category && parseInt(product.category.id) === parseInt(categoryId)
                    );
                } else if (subcategoryId) {
                    if (isNaN(subcategoryId)) {
                        loader.style.display = "none";
                        skeletonTitle.style.display = "none";
                        categoryTitle.textContent = "Категорію не знайдено";
                        categoryTitle.classList.add("loaded");
                        productsGrid.innerHTML = '<p class="error-message">Категорію не знайдено. Відсутній ідентифікатор категорії.</p>';
                        productsGrid.classList.add("loaded");
                        paginationContainer.style.display = "none";
                        return;
                    }
                    let subcategory = null;
                    for (const category of categories) {
                        if (category.subcategories) {
                            subcategory = category.subcategories.find(sub => sub.id === parseInt(subcategoryId));
                            if (subcategory) break;
                        }
                    }
                    if (!subcategory) {
                        loader.style.display = "none";
                        skeletonTitle.style.display = "none";
                        categoryTitle.textContent = "Підкатегорію не знайдено";
                        categoryTitle.classList.add("loaded");
                        productsGrid.innerHTML = '<p class="error-message">Підкатегорію не знайдено.</p>';
                        productsGrid.classList.add("loaded");
                        paginationContainer.style.display = "none";
                        return;
                    }
                    categoryName = subcategory.name;
                    filteredProducts = allProducts.filter(product =>
                        product.subcategory && parseInt(product.subcategory.id) === parseInt(subcategoryId)
                    );
                }
            }

            categoryTitle.textContent = categoryName;
            skeletonTitle.style.display = "none";
            categoryTitle.classList.add("loaded");

            if (filteredProducts.length === 0) {
                loader.style.display = "none";
                productsGrid.innerHTML = '<p class="error-message">Товарів у цій категорії немає.</p>';
                productsGrid.classList.add("loaded");
                paginationContainer.style.display = "none";
                return;
            }

            const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
            const startIndex = (page - 1) * productsPerPage;
            const endIndex = startIndex + productsPerPage;
            const currentProducts = filteredProducts.slice(startIndex, endIndex);

            productsGrid.innerHTML = '';
            currentProducts.forEach(product => {
                const productCard = document.createElement("div");
                productCard.classList.add("product-card");
                productCard.dataset.productId = product.id;
                const imageContainer = document.createElement("div");
                imageContainer.classList.add("product-image-container");
                const img = document.createElement("img");
                img.src = product.photo;
                img.alt = product.name;
                img.classList.add("product-image");
                img.loading = "lazy";
                imageContainer.appendChild(img);
                const productInfo = document.createElement("div");
                productInfo.classList.add("product-info");
                const h3 = document.createElement("h3");
                h3.textContent = product.name;
                const price = document.createElement("div");
                price.classList.add("product-price");
                if (product.variants && product.variants.length > 0) {
                    const prices = product.variants
                        .filter(variant => variant.price != null)
                        .map(variant => parseFloat(variant.price));
                    if (prices.length > 0) {
                        const minPrice = Math.min(...prices);
                        const maxPrice = Math.max(...prices);
                        if (minPrice === maxPrice) {
                            price.textContent = `${minPrice.toLocaleString('uk-UA', { minimumFractionDigits: 2 })} ₴`;
                        } else {
                            price.textContent = `${minPrice.toLocaleString('uk-UA', { minimumFractionDigits: 2 })} – ${maxPrice.toLocaleString('uk-UA', { minimumFractionDigits: 2 })} ₴`;
                        }
                    } else {
                        price.textContent = "Ціна недоступна";
                    }
                } else {
                    price.textContent = "Ціна недоступна";
                }
                const viewButton = document.createElement("a");
                viewButton.href = `product-details.html?id=${product.id}`;
                viewButton.classList.add("btn-view-cart");
                viewButton.textContent = "Переглянути";
                productInfo.appendChild(h3);
                productInfo.appendChild(price);
                productInfo.appendChild(viewButton);
                productCard.appendChild(imageContainer);
                productCard.appendChild(productInfo);
                productsGrid.appendChild(productCard);
            });

            document.querySelectorAll(".product-card").forEach(card => {
                card.addEventListener("click", (e) => {
                    if (!e.target.closest(".btn-view-cart")) {
                        const productId = card.dataset.productId;
                        window.location.href = `product-details.html?id=${productId}`;
                    }
                });
            });

            paginationContainer.innerHTML = '';
            const baseUrl = categoryId 
                ? `category-products.html?categoryId=${categoryId}` 
                : subcategoryId 
                ? `category-products.html?subcategoryId=${subcategoryId}` 
                : `category-products.html`;

            if (page > 1) {
                const prevLink = document.createElement("a");
                prevLink.href = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}page=${page - 1}`;
                prevLink.classList.add("arrow");
                prevLink.innerHTML = "<";
                paginationContainer.appendChild(prevLink);
            }

            const maxVisiblePages = 5;
            let startPage = Math.max(1, page - 2);
            let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
            if (endPage - startPage + 1 < maxVisiblePages) {
                startPage = Math.max(1, endPage - maxVisiblePages + 1);
            }

            if (startPage > 1) {
                const firstPage = document.createElement("a");
                firstPage.href = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}page=1`;
                firstPage.textContent = "1";
                paginationContainer.appendChild(firstPage);
                if (startPage > 2) {
                    const dots = document.createElement("a");
                    dots.classList.add("dots");
                    dots.textContent = "...";
                    paginationContainer.appendChild(dots);
                }
            }

            for (let i = startPage; i <= endPage; i++) {
                const pageLink = document.createElement("a");
                pageLink.href = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}page=${i}`;
                pageLink.textContent = i;
                if (i === page) pageLink.classList.add("active");
                paginationContainer.appendChild(pageLink);
            }

            if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                    const dots = document.createElement("a");
                    dots.classList.add("dots");
                    dots.textContent = "...";
                    paginationContainer.appendChild(dots);
                }
                const lastPage = document.createElement("a");
                lastPage.href = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}page=${totalPages}`;
                lastPage.textContent = totalPages;
                paginationContainer.appendChild(lastPage);
            }

            if (page < totalPages) {
                const nextLink = document.createElement("a");
                nextLink.href = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}page=${page + 1}`;
                nextLink.classList.add("arrow");
                nextLink.innerHTML = ">";
                paginationContainer.appendChild(nextLink);
            }

            loader.style.display = "none";
            productsGrid.classList.add("loaded");
            paginationContainer.classList.add("loaded");
        } catch (error) {
            console.error("Помилка завантаження товарів:", error);
            loader.style.display = "none";
            skeletonTitle.style.display = "none";
            categoryTitle.textContent = "Помилка завантаження";
            categoryTitle.classList.add("loaded");
            productsGrid.innerHTML = '<p class="error-message">Не вдалося завантажити товари. Спробуйте пізніше.</p>';
            productsGrid.classList.add("loaded");
            paginationContainer.style.display = "none";
        }
    }

    document.addEventListener("DOMContentLoaded", async () => {
        await loadCatalog();
        await loadCategoryProducts();
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

    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.addEventListener("beforeunload", () => {
        const urlParams = new URLSearchParams(window.location.search);
        const categoryId = urlParams.get("categoryId");
        const subcategoryId = urlParams.get("subcategoryId");
        const page = urlParams.get("page") || "1";
        const categoryKey = categoryId ? `category-${categoryId}` : subcategoryId ? `subcategory-${subcategoryId}` : "all-products";
        Object.keys(sessionStorage).forEach(key => {
            if (key.startsWith('savedScrollPosition-')) sessionStorage.removeItem(key);
        });
        sessionStorage.setItem(`savedScrollPosition-${categoryKey}-page${page}`, window.scrollY);
        sessionStorage.setItem(`lastVisitedPage-${categoryKey}`, page);
    });

    document.addEventListener("DOMContentLoaded", () => {
        const observer = new MutationObserver(() => {
            const productsGrid = document.getElementById('products-grid');
            if (productsGrid && productsGrid.classList.contains('loaded')) {
                const urlParams = new URLSearchParams(window.location.search);
                const categoryId = urlParams.get("categoryId");
                const subcategoryId = urlParams.get("subcategoryId");
                const page = urlParams.get("page") || "1";
                const categoryKey = categoryId ? `category-${categoryId}` : subcategoryId ? `subcategory-${subcategoryId}` : "all-products";
                const previousPage = sessionStorage.getItem(`lastVisitedPage-${categoryKey}`);
                const isPaginationChange = previousPage && previousPage !== page;
                if (isPaginationChange) {
                    document.documentElement.style.scrollBehavior = "auto";
                    window.scrollTo(0, 0);
                    document.documentElement.style.scrollBehavior = "";
                } else {
                    const savedScroll = sessionStorage.getItem(`savedScrollPosition-${categoryKey}-page${page}`);
                    if (savedScroll !== null) {
                        document.documentElement.style.scrollBehavior = "auto";
                        window.scrollTo(0, parseInt(savedScroll, 10));
                        setTimeout(() => {
                            document.documentElement.style.scrollBehavior = "";
                        }, 100);
                    } else {
                        document.documentElement.style.scrollBehavior = "auto";
                        window.scrollTo(0, 0);
                        document.documentElement.style.scrollBehavior = "";
                    }
                }
                sessionStorage.setItem(`lastVisitedPage-${categoryKey}`, page);
                observer.disconnect();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    });