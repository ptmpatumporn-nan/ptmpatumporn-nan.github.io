const languageLinks = document.querySelectorAll(".languages a:not([aria-current='page'])");

function openLinkedCase(hash = window.location.hash) {
  const caseId = hash.slice(1);
  if (!caseId) return;
  const target = document.getElementById(caseId);
  const details = target?.querySelector(":scope > .case-detail");
  if (details) details.open = true;
}

for (const link of languageLinks) {
  const baseHref = link.getAttribute("href");
  function syncLanguageHref() {
    link.setAttribute("href", baseHref + window.location.hash);
  }
  window.addEventListener("hashchange", syncLanguageHref);
  syncLanguageHref();
}

for (const link of document.querySelectorAll(".proof a")) {
  link.addEventListener("click", () => openLinkedCase(link.hash));
}

window.addEventListener("hashchange", () => openLinkedCase());
openLinkedCase();

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const galleryLabels = document.documentElement.lang === "th"
  ? { previous: "ภาพก่อนหน้า", next: "ภาพถัดไป", pause: "หยุดสไลด์", play: "เล่นสไลด์" }
  : { previous: "Previous image", next: "Next image", pause: "Pause slideshow", play: "Play slideshow" };

for (const gallery of document.querySelectorAll(".case-gallery")) {
  const track = gallery.querySelector(".case-gallery-grid");
  const titleId = gallery.getAttribute("aria-labelledby");
  const canAutoplay = gallery.hasAttribute("data-autoplay");
  const controls = document.createElement("div");
  controls.className = "gallery-controls";
  controls.setAttribute("role", "group");
  controls.setAttribute("aria-labelledby", titleId);
  track.id = `${titleId}-track`;
  track.tabIndex = 0;
  track.setAttribute("role", "group");
  track.setAttribute("aria-labelledby", titleId);
  track.after(controls);

  function addControl(label, callback) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.setAttribute("aria-controls", track.id);
    button.addEventListener("click", callback);
    controls.append(button);
    return button;
  }

  const previous = addControl(galleryLabels.previous, () => move(-1));
  const next = addControl(galleryLabels.next, () => move(1));

  function atEnd() {
    return track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
  }

  function syncControls() {
    previous.setAttribute("aria-disabled", String(track.scrollLeft <= 2));
    next.setAttribute("aria-disabled", String(atEnd()));
  }

  function move(direction, loop = false) {
    const behavior = reducedMotion.matches ? "instant" : "smooth";
    if (direction === 1 && atEnd()) {
      if (loop) track.scrollTo({ left: 0, behavior });
      return;
    }
    const gap = Number.parseFloat(getComputedStyle(track).columnGap);
    const distance = track.firstElementChild.getBoundingClientRect().width + gap;
    track.scrollBy({ left: direction * distance, behavior });
  }

  track.addEventListener("scroll", syncControls, { passive: true });
  new ResizeObserver(syncControls).observe(track);
  syncControls();

  if (canAutoplay) {
    let paused = false;
    let visible = false;
    let touching = false;
    const toggle = addControl(galleryLabels.pause, () => {
      paused = !paused;
      toggle.textContent = paused ? galleryLabels.play : galleryLabels.pause;
    });

    function syncMotionPreference() {
      toggle.hidden = reducedMotion.matches;
    }

    reducedMotion.addEventListener("change", syncMotionPreference);
    syncMotionPreference();
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && entry.intersectionRatio >= 0.55;
    }, { threshold: 0.55 }).observe(gallery);

    track.addEventListener("touchstart", () => { touching = true; }, { passive: true });
    track.addEventListener("touchend", () => { touching = false; });
    track.addEventListener("touchcancel", () => { touching = false; });
    window.setInterval(() => {
      if (paused || reducedMotion.matches || document.hidden || !visible || touching) return;
      if (gallery.matches(":focus-within") || (window.matchMedia("(hover: hover)").matches && gallery.matches(":hover"))) return;
      move(1, true);
    }, 6800);
  }
}
