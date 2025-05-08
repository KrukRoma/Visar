const API_URL = 'https://www.visar.com.ua';
document.addEventListener('DOMContentLoaded', function () {
    const hash = window.location.hash;

    window.scrollTo({ top: 0, behavior: 'instant' });

    if (hash) {
        const target = document.querySelector(hash);
        if (target) {
            setTimeout(() => {
                target.scrollIntoView({ behavior: 'smooth' });
                history.replaceState(null, null, window.location.pathname);
            }, 100);
        }
    }

    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileMenuClose = document.querySelector('.mobile-menu-close');

    if (mobileMenuToggle && mobileMenu && mobileMenuClose) {
        mobileMenuToggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');
        });

        mobileMenuClose.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
        });
    }

    const dropdown = document.querySelector('.dropdown');
    const dropdownMenu = document.querySelector('.dropdown-menu');

    if (dropdown && dropdownMenu) {
        dropdown.addEventListener('mouseenter', () => {
            dropdownMenu.classList.add('active');
        });

        dropdown.addEventListener('mouseleave', () => {
            dropdownMenu.classList.remove('active');
        });
    }

    loadCatalog();

    document.querySelectorAll('.info-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const currentPage = window.location.pathname;
            if (currentPage.includes('visar.html') || currentPage === '/') {
                const targetSection = document.querySelector('#why-need');
                if (targetSection) {
                    window.scrollTo({
                        top: targetSection.offsetTop - 100,
                        behavior: 'smooth'
                    });
                }
            } else {
                window.location.href = '/visar.html#why-need';
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

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && modal.style.display === 'flex') {
            modal.style.display = 'none';
        }
    });
});

window.addEventListener('load', () => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    setTimeout(() => {
        if (window.scrollY > 0) {
            window.scrollTo({ top: 0, behavior: 'instant' });
        }
    }, 100);
});

async function loadCatalog() {
    const catalogContainers = document.querySelectorAll('#dynamic-catalog, #mobile-catalog');
    if (catalogContainers.length === 0) return;

    try {
        console.log('Fetching categories from:', `${API_URL}/api/categories`);
        const response = await Promise.race([
            fetch(`${API_URL}/api/categories`),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), 5000))
        ]);
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        const categories = await response.json();
        console.log('Received categories:', categories);

        const validCategories = categories
            .filter(category => category.CategoryID && category.CategoryName)
            .map(category => ({
                ...category,
                Subcategories: (category.Subcategories || []).filter(sub => sub.SubcategoryID && sub.SubcategoryName)
            }));

        console.log('Valid categories:', validCategories);

        catalogContainers.forEach(catalogContainer => {
            catalogContainer.innerHTML = '';
            validCategories.forEach(category => {
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
    console.log('Creating category item:', category);
    const categoryItem = document.createElement('div');
    categoryItem.classList.add('dropdown-item');

    if (category.Subcategories && category.Subcategories.length > 0) {
        categoryItem.classList.add('has-submenu');
        const categoryLink = document.createElement('a');
        categoryLink.href = `/category-products.html?categoryId=${category.CategoryID}`;
        categoryLink.classList.add('submenu-toggle');
        categoryLink.textContent = category.CategoryName || 'Без назви';
        categoryLink.innerHTML += ' <i class="fas fa-chevron-right"></i>';

        const subMenu = document.createElement('div');
        subMenu.classList.add('submenu');

        category.Subcategories.forEach(subcategory => {
            const subcategoryLink = document.createElement('a');
            subcategoryLink.href = `/category-products.html?subcategoryId=${subcategory.SubcategoryID}`;
            subcategoryLink.textContent = subcategory.SubcategoryName || 'Без назви';
            subMenu.appendChild(subcategoryLink);
        });

        categoryItem.appendChild(categoryLink);
        categoryItem.appendChild(subMenu);
    } else {
        const categoryLink = document.createElement('a');
        categoryLink.href = `/category-products.html?categoryId=${category.CategoryID}`;
        categoryLink.textContent = category.CategoryName || 'Без назви';
        categoryItem.appendChild(categoryLink);
    }

    return categoryItem;
}

async function loadProducts() {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryId = urlParams.get('categoryId');
    const subcategoryId = urlParams.get('subcategoryId');
    const sliderContainer = document.querySelector('.slider-container');
    const sliderTrack = document.querySelector('.slider-track');

    try {
        let apiUrl = `${API_URL}/api/products`;
        if (categoryId) {
            apiUrl += `?categoryId=${categoryId}`;
        } else if (subcategoryId) {
            apiUrl += `?subcategoryId=${subcategoryId}`;
        }

        console.log('API_URL:', API_URL);
        console.log('Fetching products from:', apiUrl);
        const response = await fetch(apiUrl);
        console.log('Response status:', response.status);
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        const products = await response.json();
        console.log('Received products:', products);

        if (products.length === 0) {
            console.log('No products found for:', { categoryId, subcategoryId });
            sliderTrack.innerHTML = '<p>Категорію не знайдено</p>';
            return;
        }

        sliderTrack.innerHTML = '';
        products.forEach(product => {
            const slide = createProductSlide(product);
            sliderTrack.appendChild(slide);
        });

        sliderContainer.classList.add('full-catalog');
    } catch (error) {
        console.error('Помилка завантаження продуктів:', error);
        sliderTrack.innerHTML = '<p>Не вдалося завантажити продукти. Спробуйте пізніше.</p>';
    }
}
