const navToggle = document.querySelector("[data-nav-toggle]");
const nav = document.querySelector("[data-nav]");

if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");

    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const heroCarousel = document.querySelector("[data-hero-carousel]");

  if (heroCarousel && window.gsap) {
    const slides = Array.from(heroCarousel.querySelectorAll("[data-slide]"));
    const prevButton = heroCarousel.querySelector("[data-carousel-prev]");
    const nextButton = heroCarousel.querySelector("[data-carousel-next]");
    const currentCounter = heroCarousel.querySelector("[data-carousel-current]");
    const totalCounter = heroCarousel.querySelector("[data-carousel-total]");

    let currentIndex = 0;
    let autoplayId = null;
    let isAnimating = false;
    let touchStartX = 0;
    const autoplayDelay = 6500;

    const updateCounter = () => {
      if (currentCounter) {
        currentCounter.textContent = String(currentIndex + 1).padStart(2, "0");
      }

      if (totalCounter) {
        totalCounter.textContent = String(slides.length).padStart(2, "0");
      }
    };

    const setInitialState = () => {
      slides.forEach((slide, index) => {
        const slideItems = slide.querySelectorAll("[data-slide-item]");
        const slideImage = slide.querySelector(".hero-slide__image");

        slide.classList.toggle("is-active", index === 0);

        gsap.set(slide, {
          autoAlpha: index === 0 ? 1 : 0
        });

        gsap.set(slideItems, {
          autoAlpha: index === 0 ? 1 : 0,
          y: index === 0 ? 0 : 24
        });

        if (slideImage) {
          gsap.set(slideImage, {
            scale: index === 0 ? 1 : 1.08
          });
        }
      });

      updateCounter();
    };

    const goToSlide = (nextIndex) => {
      if (isAnimating || nextIndex === currentIndex) {
        return;
      }

      isAnimating = true;

      const currentSlide = slides[currentIndex];
      const nextSlide = slides[nextIndex];

      const currentItems = currentSlide.querySelectorAll("[data-slide-item]");
      const nextItems = nextSlide.querySelectorAll("[data-slide-item]");

      const currentImage = currentSlide.querySelector(".hero-slide__image");
      const nextImage = nextSlide.querySelector(".hero-slide__image");

      nextSlide.classList.add("is-active");

      gsap.set(nextSlide, { autoAlpha: 1 });
      gsap.set(nextItems, { autoAlpha: 0, y: 24 });

      if (nextImage) {
        gsap.set(nextImage, { scale: 1.08 });
      }

      const tl = gsap.timeline({
        defaults: {
          ease: "power3.out"
        },
        onComplete: () => {
          currentSlide.classList.remove("is-active");
          gsap.set(currentSlide, { autoAlpha: 0 });

          currentIndex = nextIndex;
          updateCounter();
          isAnimating = false;
        }
      });

      tl.to(
        currentItems,
        {
          autoAlpha: 0,
          y: -16,
          duration: 0.35,
          stagger: 0.04
        },
        0
      )
        .fromTo(
          currentSlide,
          {
            autoAlpha: 1
          },
          {
            autoAlpha: 0,
            duration: 0.95
          },
          0
        )
        .fromTo(
          nextSlide,
          {
            autoAlpha: 0
          },
          {
            autoAlpha: 1,
            duration: 0.95
          },
          0
        )
        .to(
          currentImage,
          {
            scale: 1.02,
            duration: 1.2,
            ease: "power2.out"
          },
          0
        )
        .to(
          nextImage,
          {
            scale: 1,
            duration: 1.6,
            ease: "power2.out"
          },
          0
        )
        .to(
          nextItems,
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.75,
            stagger: 0.08
          },
          0.22
        );
    };

    const nextSlide = () => {
      goToSlide((currentIndex + 1) % slides.length);
    };

    const prevSlide = () => {
      goToSlide((currentIndex - 1 + slides.length) % slides.length);
    };

    const stopAutoplay = () => {
      if (autoplayId) {
        clearInterval(autoplayId);
        autoplayId = null;
      }
    };

    const startAutoplay = () => {
      stopAutoplay();
      autoplayId = setInterval(() => {
        nextSlide();
      }, autoplayDelay);
    };

    if (nextButton) {
      nextButton.addEventListener("click", () => {
        nextSlide();
        startAutoplay();
      });
    }

    if (prevButton) {
      prevButton.addEventListener("click", () => {
        prevSlide();
        startAutoplay();
      });
    }

    heroCarousel.addEventListener("mouseenter", stopAutoplay);
    heroCarousel.addEventListener("mouseleave", startAutoplay);
    heroCarousel.addEventListener("focusin", stopAutoplay);
    heroCarousel.addEventListener("focusout", startAutoplay);

    heroCarousel.addEventListener(
      "touchstart",
      (event) => {
        touchStartX = event.changedTouches[0].clientX;
      },
      { passive: true }
    );

    heroCarousel.addEventListener(
      "touchend",
      (event) => {
        const touchEndX = event.changedTouches[0].clientX;
        const diffX = touchStartX - touchEndX;

        if (Math.abs(diffX) < 40) {
          return;
        }

        if (diffX > 0) {
          nextSlide();
        } else {
          prevSlide();
        }

        startAutoplay();
      },
      { passive: true }
    );

    setInitialState();
    startAutoplay();
  }
});