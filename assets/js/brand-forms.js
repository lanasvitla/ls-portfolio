(() => {
  const formFiles = [
    "Union.svg",
    "Vector.svg",
    "Vector-1.svg",
    "Vector-2.svg",
    "Vector-3.svg",
    "Vector-4.svg",
    "Vector-5.svg",
    "Vector-6.svg",
    "Vector-7.svg",
    "Vector-8.svg",
    "Vector-9.svg",
    "Vector-10.svg",
    "Vector-11.svg",
    "Vector-12.svg",
    "Vector-13.svg",
    "Vector-14.svg",
    "Vector-15.svg",
    "Vector-16.svg",
    "Vector-17.svg",
    "Vector-18.svg",
    "Vector-19.svg",
    "Vector-21.svg",
    "Vector-22.svg",
    "Vector-23.svg",
    "Vector-24.svg",
    "Vector-25.svg",
    "Vector-26.svg",
    "Vector-27.svg",
    "Vector-28.svg",
    "Vector-29.svg",
    "Vector-30.svg",
    "Vector-31.svg",
    "Vector-32.svg",
    "Vector-33.svg",
    "Vector-34.svg",
    "Vector-35.svg",
    "Vector-36.svg",
    "Vector-37.svg",
    "Vector-38.svg"
  ];

  const flipInterval = 6800;
  const spinInterval = Math.round(flipInterval * 2.35);
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function chooseForm(exclude = []) {
    const pool = formFiles.filter((file) => !exclude.includes(file));
    const options = pool.length ? pool : formFiles;
    return options[Math.floor(Math.random() * options.length)] || formFiles[0];
  }

  function formsBase(root) {
    const rawPath = root.dataset.formsPath || "../../assets/images/forms/";
    return rawPath.endsWith("/") ? rawPath : `${rawPath}/`;
  }

  function setFormImage(root, image, file) {
    if (!image || !file) return;
    image.src = new URL(`${formsBase(root)}${file}`, document.baseURI).href;
  }

  function initialiseBrandForms(root) {
    if (!root || root.dataset.formsReady === "true") return;

    const flipFrame = root.querySelector('[data-form-slot="flip"]');
    const spinFrame = root.querySelector('[data-form-slot="spin"]');
    const flipImage = flipFrame?.querySelector("img");
    const spinImage = spinFrame?.querySelector("img");

    if (!flipFrame || !spinFrame || !flipImage || !spinImage || formFiles.length === 0) return;

    root.dataset.formsReady = "true";

    let currentFlip = chooseForm();
    let currentSpin = chooseForm([currentFlip]);
    setFormImage(root, flipImage, currentFlip);
    setFormImage(root, spinImage, currentSpin);

    if (prefersReducedMotion) return;

    window.setInterval(() => {
      const next = chooseForm([currentFlip, currentSpin]);
      flipFrame.classList.add("is-flipping");

      window.setTimeout(() => {
        currentFlip = next;
        setFormImage(root, flipImage, currentFlip);
      }, 360);

      window.setTimeout(() => {
        flipFrame.classList.remove("is-flipping");
      }, 740);
    }, flipInterval);

    window.setInterval(() => {
      const next = chooseForm([currentFlip, currentSpin]);
      spinFrame.classList.add("is-flipping-reverse");

      window.setTimeout(() => {
        currentSpin = next;
        setFormImage(root, spinImage, currentSpin);
      }, 460);

      window.setTimeout(() => {
        spinFrame.classList.remove("is-flipping-reverse");
      }, 920);
    }, spinInterval);
  }

  function initialiseAllBrandForms() {
    document.querySelectorAll("[data-form-root]").forEach(initialiseBrandForms);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialiseAllBrandForms, { once: true });
  } else {
    initialiseAllBrandForms();
  }

  window.LSPortfolioBrandForms = { initialiseAllBrandForms };
})();
