const API_URL = window.API_URL || (window.location.protocol === 'https:' ? 'https://www.visar.com.ua' : '');
document.addEventListener('DOMContentLoaded', function () {
    if (window.location.hash) {
        history.replaceState(null, null, window.location.pathname);
    }

    window.scrollTo({ top: 0, behavior: 'instant' });

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
            if (currentPage.includes('visar.html')) {
                const targetSection = document.querySelector('#why-need');
                if (targetSection) {
                    targetSection.scrollIntoView({ behavior: 'smooth' });
                }
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
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
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

        // Фільтруємо категорії та підкатегорії
        const validCategories = categories
            .filter(category => category.categoryId && category.categoryName)
            .map(category => ({
                ...category,
                subcategories: (category.subcategories || []).filter(sub => sub.subcategoryId && sub.subcategoryName)
            }));
        console.log('Valid categories:', validCategories);

        catalogContainers.forEach(catalogContainer => {
            catalogContainer.innerHTML = '';

            // Додаємо пункт "Каталог товарів"
            const allProductsItem = document.createElement('div');
            allProductsItem.classList.add('dropdown-item');
            const allProductsLink = document.createElement('a');
            allProductsLink.href = '/category-products.html';
            allProductsLink.textContent = 'Каталог товарів';
            allProductsItem.appendChild(allProductsLink);
            catalogContainer.appendChild(allProductsItem);

            // Додаємо категорії
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

    if (category.subcategories && category.subcategories.length > 0) {
        categoryItem.classList.add('has-submenu');
        const categoryLink = document.createElement('a');
        categoryLink.href = `/category-products.html?categoryId=${category.categoryId}`;
        categoryLink.classList.add('submenu-toggle');
        categoryLink.textContent = category.categoryName || 'Без назви';
        categoryLink.innerHTML += ' <i class="fas fa-chevron-right"></i>';

        const subMenu = document.createElement('div');
        subMenu.classList.add('submenu');

        category.subcategories.forEach(subcategory => {
            const subcategoryLink = document.createElement('a');
            subcategoryLink.href = `/category-products.html?subcategoryId=${subcategory.subcategoryId}`;
            subcategoryLink.textContent = subcategory.subcategoryName || 'Без назви';
            subMenu.appendChild(subcategoryLink);
        });

        categoryItem.appendChild(categoryLink);
        categoryItem.appendChild(subMenu);
    } else {
        const categoryLink = document.createElement('a');
        categoryLink.href = `/category-products.html?categoryId=${category.categoryId}`;
        categoryLink.textContent = category.categoryName || 'Без назви';
        categoryItem.appendChild(categoryLink);
    }

    return categoryItem;
}