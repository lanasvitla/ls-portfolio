(() => {
  const root = document.documentElement;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function easeInOut(value) {
    return value * value * (3 - 2 * value);
  }

  function cssToken(name, fallback) {
    const value = getComputedStyle(root).getPropertyValue(name).trim();
    return value || fallback;
  }

  function blendColor(from, to, progress) {
    const normalize = (color) => {
      if (color.startsWith("#")) {
        const clean = color.slice(1);
        return [0, 2, 4].map((index) => Number.parseInt(clean.slice(index, index + 2), 16));
      }
      const rgb = color.match(/\d+(\.\d+)?/g);
      return rgb ? rgb.slice(0, 3).map(Number) : [67, 67, 67];
    };

    const normalized = clamp(progress, 0, 1);
    const fromRgb = normalize(from);
    const toRgb = normalize(to);
    const mixed = fromRgb.map((channel, index) => Math.round(channel + (toRgb[index] - channel) * normalized));
    return `rgb(${mixed[0]}, ${mixed[1]}, ${mixed[2]})`;
  }

  function initClock() {
    const timeElement = document.querySelector(".time");
    if (!timeElement) return;

    const update = () => {
      timeElement.textContent = new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    };

    update();
    window.setInterval(update, 1000);
  }

  function initCursor() {
    const cursor = document.querySelector(".cursor-dot");
    if (!cursor || !finePointer.matches) return;

    const interactiveSelector = "a, button, .work-card, .mock-full, .mock-square";

    window.addEventListener(
      "pointermove",
      (event) => {
        cursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0) translate3d(-50%, -50%, 0)`;
        cursor.classList.add("is-visible");
      },
      { passive: true },
    );

    window.addEventListener("pointerleave", () => {
      cursor.classList.remove("is-visible", "is-hovering");
    });

    document.addEventListener("mouseover", (event) => {
      if (event.target.closest(interactiveSelector)) cursor.classList.add("is-hovering");
    });

    document.addEventListener("mouseout", (event) => {
      if (event.target.closest(interactiveSelector)) cursor.classList.remove("is-hovering");
    });
  }

  function initMotionCards() {
    const cards = Array.from(document.querySelectorAll(".work-card"));
    if (!cards.length || prefersReducedMotion) return;

    const motion = {
      scroll: window.scrollY,
      mouseX: 0,
      mouseY: 0,
      currentMouseX: 0,
      currentMouseY: 0,
    };

    window.addEventListener(
      "mousemove",
      (event) => {
        motion.mouseX = (event.clientX / window.innerWidth - 0.5) * 2;
        motion.mouseY = (event.clientY / window.innerHeight - 0.5) * 2;
      },
      { passive: true },
    );

    window.addEventListener("mouseleave", () => {
      motion.mouseX = 0;
      motion.mouseY = 0;
    });

    const render = () => {
      motion.scroll += (window.scrollY - motion.scroll) * 0.08;
      motion.currentMouseX += (motion.mouseX - motion.currentMouseX) * 0.08;
      motion.currentMouseY += (motion.mouseY - motion.currentMouseY) * 0.08;

      const viewport = window.innerHeight || 1;
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const documentCenter = rect.top + window.scrollY + rect.height * 0.5;
        const center = documentCenter - motion.scroll;
        const progress = (center - viewport * 0.5) / viewport;
        const depth = Number(getComputedStyle(card).getPropertyValue("--depth")) || Number(card.dataset.speed) || 0;
        const cursorDepth = Number(getComputedStyle(card).getPropertyValue("--cursor-depth")) || 0;
        const x = motion.currentMouseX * cursorDepth * 16;
        const y = progress * depth * -360 + motion.currentMouseY * cursorDepth * 10;

        card.style.setProperty("--motion-x", `${x.toFixed(2)}px`);
        card.style.setProperty("--motion-y", `${y.toFixed(2)}px`);
      });

      window.requestAnimationFrame(render);
    };

    render();
  }

  function applyMorph(word, progress) {
    const eased = prefersReducedMotion ? Math.round(progress) : easeInOut(progress);
    const split = eased * 100;
    const maskGap = prefersReducedMotion ? 0 : Math.sin(eased * Math.PI) * 3.2;
    const fromClipBottom = clamp(split + maskGap * 0.5, 0, 100);
    const toClipTop = clamp(100 - split + maskGap * 0.5, 0, 100);
    const fromY = `${(-8 * eased).toFixed(2)}px`;
    const toY = `${(10 * (1 - eased)).toFixed(2)}px`;
    const activeColor = cssToken("--ink", "#434343");
    const mutedColor = cssToken("--surface-soft", "#f9f9fa");
    const emphasisShift = prefersReducedMotion ? (eased > 0.5 ? 1 : 0) : easeInOut(clamp((eased - 0.44) / 0.12, 0, 1));
    const fromColor = blendColor(activeColor, mutedColor, emphasisShift);
    const toColor = blendColor(mutedColor, activeColor, emphasisShift);

    word.style.setProperty("--from-opacity", (1 - eased).toFixed(3));
    word.style.setProperty("--to-opacity", eased.toFixed(3));
    word.style.setProperty("--from-y", fromY);
    word.style.setProperty("--to-y", toY);
    word.style.setProperty("--from-clip", `inset(0 0 ${fromClipBottom.toFixed(2)}% 0)`);
    word.style.setProperty("--to-clip", `inset(${toClipTop.toFixed(2)}% 0 0 0)`);
    word.style.setProperty("--from-layer-color", fromColor);
    word.style.setProperty("--to-layer-color", toColor);
    word.style.setProperty("--morph-from-y", fromY);
    word.style.setProperty("--morph-to-y", toY);
    word.style.setProperty("--morph-from-clip", `inset(0 0 ${fromClipBottom.toFixed(2)}% 0)`);
    word.style.setProperty("--morph-to-clip", `inset(${toClipTop.toFixed(2)}% 0 0 0)`);
    word.style.setProperty("--morph-from-color", fromColor);
    word.style.setProperty("--morph-to-color", toColor);
  }

  function renderHomeWordMorph() {
    const morphWord = document.querySelector(".hero .morph-word");
    const workSection = document.querySelector("#work");
    if (!morphWord || !workSection) return;

    const heroSection = document.querySelector(".hero");
    const heroFigures = document.querySelector(".hero-figures");
    const viewport = window.innerHeight || 1;
    const heroShortShift = heroSection
      ? Number.parseFloat(getComputedStyle(heroSection).getPropertyValue("--hero-short-shift")) || 0
      : 0;
    const workOffsetTop = workSection.offsetTop - heroShortShift;
    const start = workOffsetTop - viewport * 0.78;
    const end = workOffsetTop - viewport * 0.38;
    const raw = clamp((window.scrollY - start) / Math.max(end - start, 1), 0, 1);
    const progress = prefersReducedMotion ? Math.round(raw) : easeInOut(raw);

    applyMorph(morphWord, raw);

    if (heroFigures) {
      const figureExitSpan = 0.64;
      const figureExitDelay = figureExitSpan * 0.5;
      const figureTwoExit = prefersReducedMotion ? progress : easeInOut(clamp(progress / figureExitSpan, 0, 1));
      const figureOneExit = prefersReducedMotion ? progress : easeInOut(clamp((progress - figureExitDelay) / figureExitSpan, 0, 1));

      heroFigures.style.setProperty("--figures-opacity", "1");
      heroFigures.style.setProperty("--figures-y", "0px");
      heroFigures.style.setProperty("--figure-two-exit-clip", `inset(0 ${(figureTwoExit * 100).toFixed(2)}% 0 0)`);
      heroFigures.style.setProperty("--figure-one-exit-clip", `inset(0 ${(figureOneExit * 100).toFixed(2)}% 0 0)`);
    }

    morphWord.setAttribute("aria-label", progress > 0.55 ? "Works" : "Design");
    morphWord.dataset.word = progress > 0.55 ? "works" : "design";
  }

  function renderGenericMorphWords() {
    const morphWords = Array.from(document.querySelectorAll(".morph-word")).filter((word) => !word.closest(".hero"));
    if (!morphWords.length) return;

    const viewport = window.innerHeight || 1;
    morphWords.forEach((word) => {
      const rect = word.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const start = word.closest(".other") ? viewport * 0.5 : viewport * 0.9;
      const end = word.closest(".other") ? viewport * 0.25 : viewport * 0.5;
      const progress = clamp((start - center) / Math.max(start - end, 1), 0, 1);
      const cut = progress * 50;
      word.style.setProperty("--from-bottom", `${cut}%`);
      word.style.setProperty("--to-top", `${50 - cut}%`);
    });
  }

  function renderContactMorph() {
    const contactMorphWord = document.querySelector(".contact-morph-word");
    const contactSection = document.querySelector("#contact");
    if (!contactMorphWord || !contactSection) return;

    const viewport = window.innerHeight || 1;
    const isDesktop = window.matchMedia("(min-width: 1181px)").matches;
    const contactTop = contactMorphWord.getBoundingClientRect().top + window.scrollY;
    const contactCenter = contactTop + contactMorphWord.offsetHeight * 0.5;
    const start = isDesktop ? contactCenter - viewport * 0.5 : contactSection.offsetTop - viewport * 0.82;
    const end = isDesktop ? start + viewport * 0.4 : contactSection.offsetTop - viewport * 0.42;
    const raw = clamp((window.scrollY - start) / Math.max(end - start, 1), 0, 1);
    const progress = prefersReducedMotion ? Math.round(raw) : easeInOut(raw);
    const split = progress * 100;
    const maskGap = prefersReducedMotion ? 0 : Math.sin(progress * Math.PI) * 3.2;
    const fromClipBottom = clamp(split + maskGap * 0.5, 0, 100);
    const toClipTop = clamp(100 - split + maskGap * 0.5, 0, 100);
    const emphasisShift = prefersReducedMotion ? (progress > 0.5 ? 1 : 0) : easeInOut(clamp((progress - 0.44) / 0.12, 0, 1));
    const activeColor = cssToken("--ink", "#434343");
    const mutedColor = cssToken("--surface-soft", "#f9f9fa");

    contactMorphWord.style.setProperty("--contact-from-clip", `inset(0 0 ${fromClipBottom.toFixed(2)}% 0)`);
    contactMorphWord.style.setProperty("--contact-to-clip", `inset(${toClipTop.toFixed(2)}% 0 0 0)`);
    contactMorphWord.style.setProperty("--morph-from-clip", `inset(0 0 ${fromClipBottom.toFixed(2)}% 0)`);
    contactMorphWord.style.setProperty("--morph-to-clip", `inset(${toClipTop.toFixed(2)}% 0 0 0)`);
    contactMorphWord.style.setProperty("--contact-from-layer-color", blendColor(activeColor, mutedColor, emphasisShift));
    contactMorphWord.style.setProperty("--contact-to-layer-color", blendColor(mutedColor, activeColor, emphasisShift));
  }

  function initDisplayMorphs() {
    const render = () => {
      renderHomeWordMorph();
      renderGenericMorphWords();
      renderContactMorph();
    };

    render();
    window.addEventListener("scroll", render, { passive: true });
    window.addEventListener("resize", render);
  }

  function initHeroFiguresIntro() {
    const heroFigures = document.querySelector(".hero-figures");
    if (!heroFigures) return;

    const play = () => window.setTimeout(() => heroFigures.classList.add("is-revealing"), 180);
    if (document.readyState === "complete") {
      play();
    } else {
      window.addEventListener("load", play, { once: true });
    }
  }

  function initCaseLightbox() {
    const frames = Array.from(document.querySelectorAll(".gallery .mock-full, .gallery .mock-square"));
    const images = frames.map((frame) => frame.querySelector("img")).filter(Boolean);
    const lightbox = document.getElementById("case-lightbox");
    if (!frames.length || !images.length || !lightbox) return;

    const lightboxImage = lightbox.querySelector(".lightbox-image");
    const lightboxCount = lightbox.querySelector(".lightbox-count");
    const prevButton = lightbox.querySelector(".lightbox-prev");
    const nextButton = lightbox.querySelector(".lightbox-next");
    const closeButton = lightbox.querySelector(".lightbox-close");
    let currentIndex = 0;
    let touchStartX = 0;

    const showImage = (index) => {
      currentIndex = (index + images.length) % images.length;
      const source = images[currentIndex];
      lightboxImage.src = source.currentSrc || source.src;
      lightboxImage.alt = source.alt || `Изображение проекта ${currentIndex + 1}`;
      lightboxCount.textContent = `${currentIndex + 1} / ${images.length}`;
    };

    const openLightbox = (index) => {
      showImage(index);
      lightbox.hidden = false;
      document.body.classList.add("lightbox-open");
      closeButton.focus();
    };

    const closeLightbox = () => {
      lightbox.hidden = true;
      document.body.classList.remove("lightbox-open");
      frames[currentIndex]?.focus();
    };

    frames.forEach((frame, index) => {
      const image = frame.querySelector("img");
      frame.tabIndex = 0;
      frame.setAttribute("role", "button");
      frame.setAttribute("aria-label", `Открыть изображение ${index + 1} из ${images.length}`);

      frame.addEventListener("click", () => openLightbox(index));
      frame.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openLightbox(index);
        }
      });

      frame.addEventListener(
        "pointermove",
        (event) => {
          if (!finePointer.matches || prefersReducedMotion || !image) return;
          const rect = frame.getBoundingClientRect();
          const x = ((event.clientX - rect.left) / rect.width - 0.5) * 8;
          const y = ((event.clientY - rect.top) / rect.height - 0.5) * 8;
          image.style.transform = `translate3d(${x}px, ${y}px, 0) scale(1.018)`;
        },
        { passive: true },
      );

      frame.addEventListener("pointerleave", () => {
        if (image) image.style.transform = "";
      });
    });

    prevButton.addEventListener("click", () => showImage(currentIndex - 1));
    nextButton.addEventListener("click", () => showImage(currentIndex + 1));
    closeButton.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox || event.target.classList.contains("lightbox-stage")) closeLightbox();
    });
    lightbox.addEventListener(
      "touchstart",
      (event) => {
        touchStartX = event.changedTouches[0].clientX;
      },
      { passive: true },
    );
    lightbox.addEventListener(
      "touchend",
      (event) => {
        const distance = event.changedTouches[0].clientX - touchStartX;
        if (Math.abs(distance) >= 50) showImage(currentIndex + (distance < 0 ? 1 : -1));
      },
      { passive: true },
    );
    document.addEventListener("keydown", (event) => {
      if (lightbox.hidden) return;
      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowLeft") showImage(currentIndex - 1);
      if (event.key === "ArrowRight") showImage(currentIndex + 1);
    });
  }

  function init() {
    initClock();
    initCursor();
    initMotionCards();
    initDisplayMorphs();
    initHeroFiguresIntro();
    initCaseLightbox();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  window.LSPortfolioSite = { init };
})();
