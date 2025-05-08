// Визначення API_URL для продакшену
const API_URL = window.API_URL || 'https://www.visar.com.ua';
console.log('API_URL:', API_URL);

// Виконання коду після завантаження DOM
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM fully loaded');

    // Перевірка наявності елементів для каталогу
    const dynamicCatalog = document.querySelector('#dynamic-catalog');
    console.log('Dynamic catalog element:', dynamicCatalog);
    if (!dynamicCatalog) {
        console.error('Element #dynamic-catalog not found in DOM');
    }

    // Завантаження каталогу
    loadCatalog();

    // Обробка мобільного меню
    const mobileMenuBtn = document.querySelector('#mobile-menu-btn');
    const mobileMenu = document.querySelector('#mobile-menu');
    const mobileMenuClose = document.querySelector('#mobile-menu-close');

    console.log('Mobile menu button:', mobileMenuBtn);
    console.log('Mobile menu:', mobileMenu);
    console.log('Mobile menu close:', mobileMenuClose);

    if (mobileMenuBtn && mobileMenu && mobileMenuClose) {
        console.log('Mobile menu elements found');
        mobileMenuBtn.addEventListener('click', () => {
            console.log('Mobile menu button clicked');
            mobileMenu.classList.toggle('active');
        });

        mobileMenuClose.addEventListener('click', () => {
            console.log('Mobile menu close button clicked');
            mobileMenu.classList.remove('active');
        });
    } else {
        console.warn('Some mobile menu elements not found, skipping mobile menu initialization');
    }

    // Обробка dropdown меню
    const dropdown = document.querySelector('.dropdown');
    const dropdownMenu = document.querySelector('.dropdown-menu');

    if (dropdown && dropdownMenu) {
        console.log('Dropdown and dropdownMenu found');
        dropdown.addEventListener('mouseenter', () => {
            console.log('Mouseenter: Adding active class to dropdown-menu');
            dropdownMenu.classList.add('active');
        });

        dropdown.addEventListener('mouseleave', () => {
            console.log('Mouseleave: Removing active class from dropdown-menu');
            dropdownMenu.classList.remove('active');
        });
    } else {
        console.error('Dropdown or dropdownMenu not found');
    }

    // Обробка посилань "Корисна інформація"
    document.querySelectorAll('.info-link').forEach(link => {
        link.addEventListener('click', (e) => {
            console.log('Info link clicked');
            e.preventDefault();
            const currentPage = window.location.pathname;
            console.log('Current page:', currentPage);
            if (currentPage.includes('visar.html') || currentPage === '/' || currentPage === '') {
                const targetSection = document.querySelector('#why-need');
                if (targetSection) {
                    console.log('Scrolling to #why-need');
                    window.scrollTo({
                        top: targetSection.offsetTop - 100, // Зміщення для фіксованої шапки
                        behavior: 'smooth'
                    });
                } else {
                    console.log('Target section #why-need not found');
                }
            } else {
                console.log('Redirecting to /visar.html#why-need');
                window.location.href = '/visar.html#why-need';
            }
        });
    });

    // Обробка хешу при завантаженні
    if (window.location.hash === '#why-need') {
        const targetSection = document.querySelector('#why-need');
        if (targetSection) {
            console.log('Hash #why-need detected, scrolling');
            setTimeout(() => {
                window.scrollTo({
                    top: targetSection.offsetTop - 100,
                    behavior: 'smooth'
                });
            }, 100); // Затримка для забезпечення рендерингу
        }
    }
});

// Очищення хешу, крім #why-need
if (window.location.hash && window.location.hash !== '#why-need') {
    history.replaceState(null, null, window.location.pathname);
}

// Функція для створення елементів каталогу
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
            console.log('Added subcategory:', subcategory.SubcategoryName);
        });

        categoryItem.appendChild(categoryLink);
        categoryItem.appendChild(subMenu);
    } else {
        const categoryLink = document.createElement('a');
        categoryLink.href = `/category-products.html?categoryId=${category.CategoryID}`;
        categoryLink.textContent = category.CategoryName || 'Без назви';
        categoryItem.appendChild(categoryLink);
    }

    console.log('Generated category item:', categoryItem.outerHTML);
    return categoryItem;
}

// Функція для завантаження каталогу
async function loadCatalog() {
    const catalogContainers = document.querySelectorAll('#dynamic-catalog, #mobile-catalog');
    console.log('Catalog containers found:', catalogContainers.length);
    if (catalogContainers.length === 0) {
        console.warn('No catalog containers found, skipping catalog load');
        return;
    }

    try {
        console.log('Fetching categories from:', `${API_URL}/api/categories`);
        const response = await Promise.race([
            fetch(`${API_URL}/api/categories`),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), 5000))
        ]);
        console.log('Response status:', response.status);
        console.log('Response headers:', [...response.headers.entries()]);
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
            console.log('Processing container:', catalogContainer.id);
            catalogContainer.innerHTML = '';
            validCategories.forEach(category => {
                const categoryItem = createCategoryItem(category);
                console.log('Appending category:', category.CategoryName, categoryItem.outerHTML);
                catalogContainer.appendChild(categoryItem);
            });
            console.log('Container updated:', catalogContainer.id, catalogContainer.innerHTML);
        });
    } catch (error) {
        console.error('Error loading catalog:', error.message);
        catalogContainers.forEach(catalogContainer => {
            catalogContainer.innerHTML = '<p>Не вдалося завантажити каталог. Спробуйте пізніше.</p>';
        });
    }
}