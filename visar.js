document.addEventListener("DOMContentLoaded", () => {
  // Header scroll effect
  const header = document.querySelector("header")

  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      header.style.backgroundColor = "rgba(0, 0, 0, 0.9)"
      header.style.padding = "10px 0"
    } else {
      header.style.backgroundColor = "rgba(0, 0, 0, 0.8)"
      header.style.padding = "15px 0"
    }
  })

  // Mobile menu functionality
  const mobileMenuToggle = document.querySelector(".mobile-menu-toggle")
  const mobileMenuClose = document.querySelector(".mobile-menu-close")
  const mobileMenu = document.querySelector(".mobile-menu")
  const mobileMenuLinks = document.querySelectorAll(".mobile-menu-items a")

  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener("click", () => {
      mobileMenu.classList.add("active")
      document.body.classList.add("mobile-menu-open")
    })
  }

  if (mobileMenuClose) {
    mobileMenuClose.addEventListener("click", () => {
      mobileMenu.classList.remove("active")
      document.body.classList.remove("mobile-menu-open")
    })
  }

  // Close mobile menu when clicking on a link
  mobileMenuLinks.forEach((link) => {
    link.addEventListener("click", () => {
      mobileMenu.classList.remove("active")
      document.body.classList.remove("mobile-menu-open")
    })
  })

  // Close mobile menu when clicking outside
  document.addEventListener("click", (e) => {
    if (
      mobileMenu &&
      mobileMenu.classList.contains("active") &&
      !mobileMenu.contains(e.target) &&
      !mobileMenuToggle.contains(e.target)
    ) {
      mobileMenu.classList.remove("active")
      document.body.classList.remove("mobile-menu-open")
    }
  })

  // Product slider functionality
  const sliderTrack = document.querySelector(".slider-track")
  const slides = document.querySelectorAll(".slide")
  const prevButton = document.querySelector(".prev-slide")
  const nextButton = document.querySelector(".next-slide")

  let currentIndex = 0
  let slideWidth = 100 / 3 // For 3 slides visible at once

  // Set initial position
  updateSliderPosition()

  // Add click event listeners to buttons
  if (prevButton) {
    prevButton.addEventListener("click", () => {
      if (currentIndex > 0) {
        currentIndex--
        updateSliderPosition()
      }
    })
  }

  if (nextButton) {
    nextButton.addEventListener("click", () => {
      if (currentIndex < slides.length - 3) {
        // Assuming 3 slides visible at once
        currentIndex++
        updateSliderPosition()
      }
    })
  }

  // Update slider position based on current index
  function updateSliderPosition() {
    if (!sliderTrack) return

    const translateX = -currentIndex * slideWidth
    sliderTrack.style.transform = `translateX(${translateX}%)`

    // Update button states
    if (prevButton) {
      prevButton.disabled = currentIndex === 0
      prevButton.style.opacity = currentIndex === 0 ? "0.5" : "1"
      prevButton.style.cursor = currentIndex === 0 ? "not-allowed" : "pointer"
    }

    if (nextButton) {
      const isLastSlide = currentIndex >= slides.length - getVisibleSlides()
      nextButton.disabled = isLastSlide
      nextButton.style.opacity = isLastSlide ? "0.5" : "1"
      nextButton.style.cursor = isLastSlide ? "not-allowed" : "pointer"
    }
  }

  // Get number of visible slides based on screen width
  function getVisibleSlides() {
    const windowWidth = window.innerWidth
    if (windowWidth <= 768) {
      return 1
    } else if (windowWidth <= 1024) {
      return 2
    } else {
      return 3
    }
  }

  // Responsive slider adjustments
  function updateSliderForScreenSize() {
    const windowWidth = window.innerWidth

    if (windowWidth <= 768) {
      // For mobile: 1 slide at a time
      slideWidth = 100
    } else if (windowWidth <= 1024) {
      // For tablet: 2 slides at a time
      slideWidth = 50
    } else {
      // For desktop: 3 slides at a time
      slideWidth = 100 / 3
    }

    // Reset current index if needed
    if (currentIndex > slides.length - getVisibleSlides()) {
      currentIndex = slides.length - getVisibleSlides()
      if (currentIndex < 0) currentIndex = 0
    }

    updateSliderPosition()
  }

  // Update on resize
  window.addEventListener("resize", updateSliderForScreenSize)

  // Initial update
  updateSliderForScreenSize()

  // Add parallax effect to hero section
  const heroBackground = document.querySelector(".hero-background")

  window.addEventListener("scroll", () => {
    const scrollPosition = window.scrollY
    if (heroBackground) {
      heroBackground.style.transform = `translateY(${scrollPosition * 0.3}px)`
    }
  })

  // Add hover animations for buttons
  const buttons = document.querySelectorAll(
    ".btn-catalog, .btn-contact, .btn-view-cart, .btn-add-to-cart, .btn-full-catalog, .btn-view",
  )

  buttons.forEach((button) => {
    button.addEventListener("mouseenter", function () {
      this.style.transform = "scale(1.05)"
    })

    button.addEventListener("mouseleave", function () {
      this.style.transform = "scale(1)"
    })
  })

  // Protection types interaction
  const protectionTypes = document.querySelectorAll(".protection-type")

  protectionTypes.forEach((type) => {
    type.addEventListener("click", function () {
      // Remove active class from all types
      protectionTypes.forEach((t) => t.classList.remove("active"))

      // Add active class to clicked type
      this.classList.add("active")
    })
  })

  // Add animation for features
  const features = document.querySelectorAll(".feature-item")

  features.forEach((feature, index) => {
    feature.style.opacity = "0"
    feature.style.transform = "translateY(30px)"

    setTimeout(() => {
      feature.style.transition = "all 0.5s ease"
      feature.style.opacity = "1"
      feature.style.transform = "translateY(0)"
    }, 300 * index)
  })

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault()

      const targetId = this.getAttribute("href")
      if (targetId === "#") return

      const targetElement = document.querySelector(targetId)

      if (targetElement) {
        const headerHeight = document.querySelector("header").offsetHeight
        // Increase the offset for product-slider to ensure products are fully visible
        const extraOffset = targetId === "#product-slider" ? 100 : 0
        const targetPosition =
          targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight - extraOffset

        // Smooth scroll animation
        window.scrollTo({
          top: targetPosition,
          behavior: "smooth",
        })
      }
    })
  })

  // Add page transition animation
  const links = document.querySelectorAll('a:not([href^="#"]):not([target="_blank"])')
  links.forEach((link) => {
    link.addEventListener("click", function (e) {
      if (this.hostname === window.location.hostname) {
        e.preventDefault()
        const href = this.getAttribute("href")

        // Add fade-out animation
        document.body.classList.add("page-transition")

        // Navigate after animation completes
        setTimeout(() => {
          window.location.href = href
        }, 300)
      }
    })
  })

  // Touch events for slider on mobile
  let touchStartX = 0
  let touchEndX = 0

  if (sliderTrack) {
    sliderTrack.addEventListener("touchstart", (e) => {
      touchStartX = e.changedTouches[0].screenX
    })

    sliderTrack.addEventListener("touchend", (e) => {
      touchEndX = e.changedTouches[0].screenX
      handleSwipe()
    })
  }

  function handleSwipe() {
    const minSwipeDistance = 50
    if (touchEndX < touchStartX - minSwipeDistance && currentIndex < slides.length - getVisibleSlides()) {
      // Swipe left
      currentIndex++
      updateSliderPosition()
    }
    if (touchEndX > touchStartX + minSwipeDistance && currentIndex > 0) {
      // Swipe right
      currentIndex--
      updateSliderPosition()
    }
  }

  // Функціонал переключення повного каталогу
  const toggleCatalogBtn = document.getElementById("toggle-catalog")
  const productSlider = document.querySelector(".product-slider")
  const hiddenProducts = document.querySelectorAll(".hidden-product")

  if (toggleCatalogBtn) {
    toggleCatalogBtn.addEventListener("click", (e) => {
      e.preventDefault()

      // Переключення класу для відображення сітки
      productSlider.classList.toggle("full-catalog")

      // Переключення тексту кнопки
      if (productSlider.classList.contains("full-catalog")) {
        toggleCatalogBtn.textContent = "ЗГОРНУТИ КАТАЛОГ"
        toggleCatalogBtn.classList.add("active")

        // Показати всі приховані продукти
        hiddenProducts.forEach((product) => {
          product.style.display = "block"
        })
      } else {
        toggleCatalogBtn.textContent = "ПОВНИЙ КАТАЛОГ"
        toggleCatalogBtn.classList.remove("active")

        // Приховати додаткові продукти
        hiddenProducts.forEach((product) => {
          product.style.display = "none"
        })

        // Прокрутити до початку секції продуктів
        const headerHeight = document.querySelector("header").offsetHeight
        const targetPosition = productSlider.getBoundingClientRect().top + window.pageYOffset - headerHeight

        window.scrollTo({
          top: targetPosition,
          behavior: "smooth",
        })
      }
    })
  }
})

// Add fade-in animation when page loads
window.addEventListener("load", () => {
  document.body.classList.add("page-loaded")
})
