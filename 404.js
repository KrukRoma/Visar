let isCatalogLoaded = false;

    function clearEventListeners() {
        const modal = document.getElementById('contact-modal');
        const contactLinks = document.querySelectorAll('.contact-link');
        const closeBtn = document.querySelector('.close-btn');
        const homeButton = document.querySelector('.btn-home');
        contactLinks.forEach(link => {
            const newLink = link.cloneNode(true);
            link.parentNode.replaceChild(newLink, link);
        });
        const newCloseBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
        const newModal = modal.cloneNode(true);
        modal.parentNode.replaceChild(newModal, modal);
        const newHomeButton = homeButton.cloneNode(true);
        homeButton.parentNode.replaceChild(newHomeButton, homeButton);
    }

    document.addEventListener("DOMContentLoaded", async () => {
        await loadCatalog();
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