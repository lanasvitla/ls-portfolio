(() => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function initAudienceTabs() {
    const tabList = document.querySelector(".audience-tabs-draft");
    const tabs = Array.from(document.querySelectorAll(".audience-tab[data-audience]"));
    const composition = document.querySelector(".audience-composition");
    const copy = composition?.querySelector(".hero-copy");
    const services = document.querySelector(".hero-services-preview-b");
    if (!tabList || tabs.length !== 2 || !composition || !copy || !services) return;

    const templateHtml = (kind, audience) =>
      document.querySelector(`template[data-audience-${kind}="${audience}"]`)?.innerHTML.trim();
    const content = {
      companies: {
        copy: templateHtml("copy", "companies") || copy.innerHTML.trim(),
        services: templateHtml("services", "companies") || services.innerHTML.trim(),
      },
      experts: {
        copy: templateHtml("copy", "experts") || copy.innerHTML.trim(),
        services: templateHtml("services", "experts") || services.innerHTML.trim(),
      },
    };
    const audienceLabel = (audience) =>
      tabs.find((tab) => tab.dataset.audience === audience)?.textContent.trim().toLowerCase() || audience;

    let active = tabs.find((tab) => tab.getAttribute("aria-selected") === "true")?.dataset.audience || "experts";
    if (content[active]) {
      copy.innerHTML = content[active].copy;
      services.innerHTML = content[active].services;
      composition.setAttribute("aria-label", `${tabList.getAttribute("aria-label")}: ${audienceLabel(active)}`);
    }
    let timer;

    const replay = (node) => {
      node.classList.remove("audience-reveal", "tab-panel-reveal");
      void node.offsetWidth;
      node.classList.add("audience-reveal", "tab-panel-reveal");
    };

    const setAudience = (next, manual = false) => {
      if (next === active || !content[next]) return;
      if (manual && timer) {
        window.clearInterval(timer);
        timer = null;
      }

      active = next;
      copy.innerHTML = content[next].copy;
      services.innerHTML = content[next].services;

      tabs.forEach((tab) => {
        const selected = tab.dataset.audience === next;
        tab.setAttribute("aria-selected", String(selected));
        tab.classList.toggle("is-active", selected);
      });

      tabList.classList.toggle("is-experts", next === "experts");
      composition.setAttribute("aria-label", `${tabList.getAttribute("aria-label")}: ${audienceLabel(next)}`);
      replay(copy);
      replay(services);
    };

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => setAudience(tab.dataset.audience, true));
    });

    timer = window.setInterval(() => {
      setAudience(active === "companies" ? "experts" : "companies");
    }, 16500);
  }

  function initMyWorkTracks() {
    const tracks = document.querySelectorAll(".mywork-track");
    tracks.forEach((track) => {
      const showcase = track.closest(".mywork-showcase");
      const previousButton = showcase?.querySelector("[data-mywork-prev]");
      const nextButton = showcase?.querySelector("[data-mywork-next]");
      const originalCards = Array.from(track.querySelectorAll('.mywork-card:not([aria-hidden="true"])'));
      const loopCopies = 1;
      let isLooping = false;
      let isDragging = false;
      let dragStartX = 0;
      let dragStartScrollLeft = 0;
      let dragPointerId = null;

      if (!originalCards.length) return;

      const cloneCards = () =>
        originalCards.map((card) => {
          const clone = card.cloneNode(true);
          clone.setAttribute("aria-hidden", "true");
          return clone;
        });

      const cloneSets = (count) => {
        const fragment = [];
        for (let index = 0; index < count; index += 1) fragment.push(...cloneCards());
        return fragment;
      };

      if (!track.dataset.loopReady) {
        Array.from(track.querySelectorAll('.mywork-card[aria-hidden="true"]')).forEach((card) => card.remove());
        track.prepend(...cloneSets(loopCopies));
        track.append(...cloneSets(loopCopies));
        track.dataset.loopReady = "true";
      }

      const trackPaddingLeft = () => Number.parseFloat(getComputedStyle(track).paddingLeft) || 0;
      const firstOriginalScrollLeft = () => (originalCards[0] ? originalCards[0].offsetLeft - trackPaddingLeft() : 0);
      const loopWidth = () => {
        const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 0;
        const cardsWidth = originalCards.reduce((total, card) => total + card.getBoundingClientRect().width, 0);
        return cardsWidth + gap * originalCards.length;
      };
      const setInitialScroll = () => {
        track.scrollLeft = firstOriginalScrollLeft();
      };
      const normalizeScroll = () => {
        if (isLooping) return;
        const width = loopWidth();
        const base = firstOriginalScrollLeft();
        if (width <= 0) return;

        if (track.scrollLeft < base - width * 0.45) {
          isLooping = true;
          track.scrollLeft += width;
          isLooping = false;
        } else if (track.scrollLeft > base + width * 0.55) {
          isLooping = true;
          track.scrollLeft -= width;
          isLooping = false;
        }
      };

      const slideBy = (direction) => {
        const firstCard = originalCards[0] || track.querySelector(".mywork-card");
        const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 0;
        const step = firstCard ? firstCard.getBoundingClientRect().width + gap : track.getBoundingClientRect().width * 0.62;
        normalizeScroll();
        track.scrollBy({ left: direction * step, behavior: prefersReducedMotion ? "auto" : "smooth" });
        window.setTimeout(normalizeScroll, prefersReducedMotion ? 0 : 700);
      };

      track.addEventListener("scroll", () => window.requestAnimationFrame(normalizeScroll), { passive: true });
      track.addEventListener("pointerdown", (event) => {
        if (event.button !== undefined && event.button !== 0) return;
        normalizeScroll();
        isDragging = true;
        dragPointerId = event.pointerId;
        dragStartX = event.clientX;
        dragStartScrollLeft = track.scrollLeft;
        track.classList.add("is-dragging");
        track.setPointerCapture(event.pointerId);
      });
      track.addEventListener("pointermove", (event) => {
        if (!isDragging || event.pointerId !== dragPointerId) return;
        track.scrollLeft = dragStartScrollLeft - (event.clientX - dragStartX);
      });

      const stopDrag = (event) => {
        if (!isDragging || event.pointerId !== dragPointerId) return;
        isDragging = false;
        dragPointerId = null;
        track.classList.remove("is-dragging");
        normalizeScroll();
        if (track.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId);
      };

      track.addEventListener("pointerup", stopDrag);
      track.addEventListener("pointercancel", stopDrag);
      track.addEventListener("wheel", (event) => {
        if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) normalizeScroll();
      }, { passive: true });
      previousButton?.addEventListener("click", () => slideBy(1));
      nextButton?.addEventListener("click", () => slideBy(-1));

      setInitialScroll();
      window.requestAnimationFrame(setInitialScroll);
      window.addEventListener("resize", setInitialScroll);
    });
  }

  function init() {
    initAudienceTabs();
    initMyWorkTracks();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
