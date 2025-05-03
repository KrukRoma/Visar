const API_URL = window.API_URL || 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', function () {
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

    const dropdownToggle = document.querySelector('.dropdown-toggle');
    const dropdownMenu = document.querySelector('.dropdown-menu');

    if (dropdownToggle && dropdownMenu) {
        dropdownToggle.addEventListener('click', (e) => {
            if (e.target.tagName === 'A' && e.target.href) {
                return; 
            }
            e.preventDefault();
            dropdownMenu.classList.toggle('active');
        });

        document.addEventListener('click', (e) => {
            if (!dropdownToggle.contains(e.target) && !dropdownMenu.contains(e.target)) {
                dropdownMenu.classList.remove('active');
            }
        });
    }
});

async function loadCatalog() {
    const catalogContainers = document.querySelectorAll('#desktop-catalog, #mobile-catalog');
    if (catalogContainers.length === 0) return;

    try {
        const response = await fetch(`${API_URL}/api/categories`);
        if (!response.ok) throw new Error(`HTTP помилка: ${response.status}`);
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
    const categoryItem = document.createElement('div');
    categoryItem.classList.add('dropdown-item');

    if (category.subcategories && category.subcategories.length > 0) {
        categoryItem.classList.add('has-submenu');
        const categoryLink = document.createElement('a');
        categoryLink.href = `category-products.html?categoryId=${category.id}`;
        categoryLink.classList.add('submenu-toggle');
        categoryLink.textContent = category.name;
        categoryLink.innerHTML += ' <i class="fas fa-chevron-right"></i>';

        const subMenu = document.createElement('div');
        subMenu.classList.add('submenu');

        category.subcategories.forEach(subcategory => {
            const subcategoryLink = document.createElement('a');
            subcategoryLink.href = `category-products.html?subcategoryId=${subcategory.id}`;
            subcategoryLink.textContent = subcategory.name;
            subMenu.appendChild(subcategoryLink);
        });

        categoryItem.appendChild(categoryLink);
        categoryItem.appendChild(subMenu);
    } else {
        const categoryLink = document.createElement('a');
        categoryLink.href = `category-products.html?categoryId=${category.id}`;
        categoryLink.textContent = category.name;
        categoryItem.appendChild(categoryLink);
    }

    return categoryItem;
}