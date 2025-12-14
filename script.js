// Mobile nav toggle
const navToggle = document.getElementById("navToggle");
const navList = document.getElementById("navList");

if (navToggle && navList) {
  navToggle.addEventListener("click", () => {
    navList.classList.toggle("open");
  });

  navList.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navList.classList.remove("open");
    });
  });
}

/* Gallery filters */
const thumbs = document.querySelectorAll(".thumb");
const orientButtons = document.querySelectorAll(".orient-btn");

let currentOrient = "horizontal";

const applyGalleryFilters = () => {
  thumbs.forEach((thumb) => {
    const isVertical = thumb.classList.contains("thumb-vertical");
    const matchesOrient =
      (currentOrient === "vertical" && isVertical) ||
      (currentOrient === "horizontal" && !isVertical);

    // Treat thumbs without a data-youtube-id as "empty"
    const hasYoutube = !!thumb.dataset.youtubeId;
    const isEmptyHorizontal = !isVertical && !hasYoutube;
    const isEmptyVertical = isVertical && !hasYoutube;

    // Hide empty thumbs only in their respective orientation views.
    // (horizontal behavior preserved; vertical now also hides empty vertical thumbs)
    let shouldShow = matchesOrient;
    if (currentOrient === "horizontal" && isEmptyHorizontal) shouldShow = false;
    if (currentOrient === "vertical" && isEmptyVertical) shouldShow = false;

    thumb.style.display = shouldShow ? "" : "none";
  });
};

orientButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    currentOrient = btn.dataset.orient;
    orientButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    applyGalleryFilters();
    // move the animated highlight to the clicked button
    moveOrientationHighlight(btn);
  });
});

// Ensure initial orientation state is applied
applyGalleryFilters();

// New: animated highlight wiring for orientation controls
(function () {
  const container = document.querySelector(".orientation-controls");
  if (!container) return;

  const updateHighlight = (targetBtn) => {
    const rectC = container.getBoundingClientRect();
    const rectB = targetBtn.getBoundingClientRect();

    const left = rectB.left - rectC.left + 4; // small inset
    const width = Math.max(rectB.width - 8, 56); // slightly inset highlight width

    container.style.setProperty("--hl-left", left + "px");
    container.style.setProperty("--hl-width", width + "px");
    // briefly add animation class to trigger sheen
    container.classList.remove("hl-animate");
    // force reflow so repeated clicks retrigger animation
    void container.offsetWidth;
    container.classList.add("hl-animate");
  };

  // move highlight to currently active button on load
  const initialBtn = container.querySelector(".orient-btn.active") || container.querySelector(".orient-btn[data-orient='horizontal']");
  if (initialBtn) {
    // show highlight (visible) and position it
    container.style.setProperty("--hl-left", "4px");
    container.style.setProperty("--hl-width", initialBtn.getBoundingClientRect().width + "px");
    // small timeout to allow CSS to reflect initial values, then animate sheen
    setTimeout(() => updateHighlight(initialBtn), 60);
  }

  // expose for clicks from earlier handler
  window.moveOrientationHighlight = (btn) => {
    if (!btn) return;
    updateHighlight(btn);
  };

  // update on resize to keep highlight aligned
  window.addEventListener("resize", () => {
    const active = container.querySelector(".orient-btn.active");
    if (active) moveOrientationHighlight(active);
  });
})();

/* Services carousel behavior */
(function () {
  // Initialize every .services-carousel on the page
  const carousels = Array.from(document.querySelectorAll(".services-carousel"));
  if (!carousels.length) return;

  carousels.forEach((carousel) => {
    const track = carousel.querySelector(".carousel-track");
    const slides = Array.from(carousel.querySelectorAll(".carousel-slide"));
    const prevBtn = carousel.querySelector(".carousel-prev");
    const nextBtn = carousel.querySelector(".carousel-next");
    const dotsContainer = carousel.querySelector(".carousel-dots");

    let index = 0;

    // build dots if container exists
    if (dotsContainer) {
      slides.forEach((_, i) => {
        const btn = document.createElement("button");
        btn.setAttribute("role", "tab");
        btn.setAttribute("aria-selected", i === index ? "true" : "false");
        btn.dataset.index = i;
        btn.addEventListener("click", () => goTo(i));
        dotsContainer.appendChild(btn);
      });
    }

    const update = () => {
      if (!slides.length || !track) return;
      const gap = parseFloat(getComputedStyle(track).gap || 0);
      const slideWidth = slides[0].getBoundingClientRect().width + gap;
      const offset = index * slideWidth;
      track.style.transform = `translateX(-${offset}px)`;
      if (dotsContainer) {
        dotsContainer.querySelectorAll("button").forEach((b) => b.setAttribute("aria-selected", b.dataset.index == index ? "true" : "false"));
      }
    };

    const goTo = (i) => {
      index = Math.max(0, Math.min(i, Math.max(0, slides.length - 1)));
      update();
    };

    if (prevBtn) prevBtn.addEventListener("click", () => goTo(index - 1));
    if (nextBtn) nextBtn.addEventListener("click", () => goTo(index + 1));

    // keyboard left/right
    carousel.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") prevBtn && prevBtn.click();
      if (e.key === "ArrowRight") nextBtn && nextBtn.click();
    });

    // make carousel focusable for keyboard
    carousel.tabIndex = 0;

    // responsive: recalc on resize
    window.addEventListener("resize", () => requestAnimationFrame(update));

    // initialize
    requestAnimationFrame(update);
  });
})();

/* FAQ toggle (hide/show) */
const faqsToggle = document.getElementById("faqsToggle");
const faqsSection = document.getElementById("faqs");
if (faqsToggle && faqsSection) {
  faqsToggle.addEventListener("click", () => {
    const isCollapsed = faqsSection.classList.toggle("collapsed");
    faqsSection.setAttribute("aria-hidden", isCollapsed ? "true" : "false");
    faqsToggle.setAttribute("aria-expanded", isCollapsed ? "false" : "true");
    faqsToggle.textContent = isCollapsed ? "Mostrar preguntas frecuentes" : "Ocultar preguntas frecuentes";
    // when revealing, ensure layout adjustments run so accordion measurements are correct
    if (!isCollapsed) {
      requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
    }
  });
}

/* Accordion */
const accordion = document.getElementById("faqAccordion");
if (accordion) {
  const items = accordion.querySelectorAll(".accordion-item");

  // helper to close an item smoothly (faster hide)
  const closeItem = (it) => {
    const b = it.querySelector(".accordion-body");
    if (!b) return;
    // start fade/slide out
    b.style.opacity = "0";
    b.style.transform = "translateY(-6px)";
    // collapse maxHeight immediately so it closes quickly
    b.style.maxHeight = "0px";
    // short delay to remove 'open' class after visual collapse
    const delay = 80; // much faster hide
    setTimeout(() => {
      it.classList.remove("open");
      // clear inline maxHeight so it can reopen and measure correctly
      b.style.maxHeight = null;
    }, delay);
  };

  // helper to open an item smoothly
  const openItem = (it) => {
    const b = it.querySelector(".accordion-body");
    if (!b) return;
    it.classList.add("open");
    // measure and set maxHeight to allow smooth expansion
    b.style.maxHeight = b.scrollHeight + "px";
    // trigger the reveal (opacity/transform)
    // small timeout to ensure the maxHeight has been applied before starting opacity animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        b.style.opacity = "1";
        b.style.transform = "translateY(0)";
      });
    });
  };

  items.forEach((item) => {
    const header = item.querySelector(".accordion-header");
    const body = item.querySelector(".accordion-body");

    header.addEventListener("click", () => {
      const isOpen = item.classList.contains("open");

      // Close all (smoothly)
      items.forEach((it) => {
        if (it === item) return;
        closeItem(it);
      });

      // Toggle clicked
      if (!isOpen) {
        openItem(item);
      } else {
        closeItem(item);
      }
    });

    // Ensure body starts hidden (in case JS loads after CSS render)
    if (!item.classList.contains("open") && body) {
      body.style.opacity = "0";
      body.style.transform = "translateY(-6px)";
      body.style.maxHeight = null;
    } else if (item.classList.contains("open") && body) {
      // If pre-opened, ensure visible state
      body.style.opacity = "1";
      body.style.transform = "translateY(0)";
      body.style.maxHeight = body.scrollHeight + "px";
    }
  });
}

/* Ticker: keyboard (Space) + pointer (click/touch) toggle behavior.
   Each pointer/click alternates the ticker between running and paused. */
const ticker = document.querySelector(".testimonial-ticker");
if (ticker) {
  ticker.setAttribute("tabindex", "0");

  // helper to toggle the track's animation state
  const toggleTrack = () => {
    const track = ticker.querySelector(".ticker-track");
    if (!track) return;
    // if no explicit inline state set, treat as running
    const cur = track.style.animationPlayState || "running";
    track.style.animationPlayState = cur === "paused" ? "running" : "paused";
  };

  // Space key toggles (keyboard accessibility)
  ticker.addEventListener("keydown", (e) => {
    if (e.code === "Space" || e.key === " ") {
      toggleTrack();
      e.preventDefault();
    }
  });

  // Pointer/click toggles for both mouse and touch.
  // Use pointerdown to respond quickly to touch; ignore clicks on interactive descendants (links, buttons).
  ticker.addEventListener("pointerdown", (ev) => {
    const interactive = ev.target.closest("a, button, input, textarea, label");
    if (interactive) return; // don't interfere with interactive elements inside the ticker
    toggleTrack();
  });
}

/* Minecraft-like press animation wiring for all .btn elements:
   - on pointerdown: add .mc-active for immediate offset
   - on pointerup/cancel: add .mc-press to play the stepped animation, remove classes on animationend
   This ensures a quick tactile feel and a blocky release like a Minecraft button. */
(function () {
  const buttons = document.querySelectorAll(".btn");
  if (!buttons.length) return;

  buttons.forEach((btn) => {
    // pointerdown: instant visual offset
    btn.addEventListener("pointerdown", (e) => {
      // only left/touch presses
      if (e.button !== 0 && e.pointerType !== "touch") return;
      // remove any lingering press animation to avoid conflict
      btn.classList.remove("mc-press");
      btn.classList.add("mc-active");
      // capture pointer so we see pointerup even if leaving element
      try { btn.setPointerCapture && btn.setPointerCapture(e.pointerId); } catch (err) {}
    });

    // pointerup / pointercancel: play the chunky press-release animation
    const onRelease = (e) => {
      // remove immediate active state
      btn.classList.remove("mc-active");
      // force reflow to ensure animation starts reliably
      void btn.offsetWidth;
      btn.classList.add("mc-press");

      const cleanup = () => {
        btn.classList.remove("mc-press");
        btn.removeEventListener("animationend", cleanup);
      };
      btn.addEventListener("animationend", cleanup, { once: true });
      try { btn.releasePointerCapture && btn.releasePointerCapture(e.pointerId); } catch (err) {}
    };

    btn.addEventListener("pointerup", onRelease);
    btn.addEventListener("pointercancel", onRelease);

    // If pointer leaves the element while pressed, ensure we remove the instant active state
    btn.addEventListener("pointerleave", (e) => {
      // only remove if it was the active pointer
      if (btn.classList.contains("mc-active")) {
        btn.classList.remove("mc-active");
      }
    });

    // keyboard: space/enter should also trigger the animation for accessibility
    btn.addEventListener("keydown", (e) => {
      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        // simulate press animation
        // ensure no duplicate classes
        btn.classList.remove("mc-active");
        btn.classList.add("mc-press");
        const cleanup = () => {
          btn.classList.remove("mc-press");
          btn.removeEventListener("animationend", cleanup);
        };
        btn.addEventListener("animationend", cleanup, { once: true });
      } else if (e.code === "Enter") {
        btn.classList.remove("mc-active");
        btn.classList.add("mc-press");
        const cleanup = () => {
          btn.classList.remove("mc-press");
          btn.removeEventListener("animationend", cleanup);
        };
        btn.addEventListener("animationend", cleanup, { once: true });
      }
    });
  });
})();

/* YouTube overlay player: show thumbnail (from ytimg) and open embed in overlay */
(function () {
  // Helper: get thumbnail URL from YouTube ID (hqdefault is fine for gallery)
  const ytThumb = (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

  // Enhance thumbs that have data-youtube-id: set background thumbnail, fetch real titles via oEmbed and wiring
  const ytTitleCache = {};
  document.querySelectorAll('.thumb[data-youtube-id]').forEach((thumb) => {
    const id = thumb.dataset.youtubeId;
    // set background image to appear as thumbnail
    thumb.style.backgroundImage = `url("${ytThumb(id)}")`;
    thumb.style.backgroundSize = 'cover';
    thumb.style.backgroundPosition = 'center center';

    // if there's a title element in the thumb, try to replace it with the real YouTube title via oEmbed
    const titleEl = thumb.querySelector('.thumb-title');
    if (titleEl) {
      // If cached, use it immediately
      if (ytTitleCache[id]) {
        titleEl.textContent = ytTitleCache[id];
      } else {
        // Fetch oEmbed JSON for a simple no-key title lookup
        // Use YouTube's oEmbed endpoint which returns JSON including "title"
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent("https://www.youtube.com/watch?v=" + id)}&format=json`;
        fetch(oembedUrl)
          .then((res) => {
            if (!res.ok) throw new Error('oEmbed fetch failed');
            return res.json();
          })
          .then((data) => {
            if (data && data.title) {
              ytTitleCache[id] = data.title;
              titleEl.textContent = data.title;
            }
          })
          .catch((err) => {
            // silently ignore errors (leave placeholder title) but keep console info for debugging
            console.warn('YouTube oEmbed failed for', id, err);
          });
      }
    }

    // ensure overlay player exists (create once)
  });

  // create overlay DOM
  let overlay = document.querySelector('.yt-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'yt-overlay';
    overlay.innerHTML = `
      <div class="yt-player" role="dialog" aria-modal="true" aria-label="Reproductor de video">
        <button class="yt-close" aria-label="Cerrar reproductor">✕</button>
        <div class="yt-iframe-wrap" style="width:100%;height:100%;"></div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  const iframeWrap = overlay.querySelector('.yt-iframe-wrap');
  const closeBtn = overlay.querySelector('.yt-close');

  // Small guard to prevent immediate reopen when closing via backdrop click:
  // set overlayIgnoreUntil (timestamp ms) when we close; document click handler will ignore thumb opens until then.
  let overlayIgnoreUntil = 0;

  const openOverlay = (id, title, isVertical = false) => {
    // set vertical class if requested so CSS can switch aspect ratio/width
    if (isVertical) {
      overlay.querySelector('.yt-player').classList.add('vertical');
    } else {
      overlay.querySelector('.yt-player').classList.remove('vertical');
    }

    // inject iframe with modest params (autoplay)
    iframeWrap.innerHTML = `<iframe src="https://www.youtube.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&modestbranding=1" title="${(title||'Video')}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="width:100%;height:100%;"></iframe>`;
    overlay.classList.add('active');
    // lock scroll
    document.documentElement.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    // focus close for accessibility
    closeBtn.focus();
  };

  const closeOverlay = () => {
    overlay.classList.remove('active');
    // remove iframe to stop playback
    iframeWrap.innerHTML = '';
    document.documentElement.style.overflow = '';
    document.body.style.touchAction = '';
    // ignore document-level thumb clicks for a short window to avoid immediate reopen
    overlayIgnoreUntil = Date.now() + 350;
  };

  // click wiring: open overlay when thumb clicked
  document.addEventListener('click', (ev) => {
    // if overlay is currently active, avoid opening another
    if (overlay.classList.contains('active')) return;

    // If we recently closed the overlay via backdrop, ignore clicks for a short period
    if (Date.now() < overlayIgnoreUntil) return;

    const thumb = ev.target.closest('.thumb[data-youtube-id]');
    if (!thumb) return;
    // prevent activating gallery filter toggles etc.
    const interactive = ev.target.closest('a, button, input, textarea, label');
    if (interactive && !thumb.contains(interactive)) return;
    const id = thumb.dataset.youtubeId;
    const titleEl = thumb.querySelector('.thumb-title');
    const title = titleEl ? titleEl.textContent.trim() : '';
    const isVertical = thumb.classList.contains('thumb-vertical');
    openOverlay(id, title, isVertical);
  });

  // close actions: button, overlay background, ESC
  closeBtn.addEventListener('click', closeOverlay);
  overlay.addEventListener('pointerdown', (e) => {
    // if click on backdrop (not the player inner), close
    if (e.target === overlay) closeOverlay();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('active')) {
      closeOverlay();
    }
  });

  // ensure orientation filter's applyGalleryFilters won't hide active overlay (no-op here)

})();

// NEW: play a pleasant click/chime sound when WhatsApp buttons are pressed
(function () {
  // load audio and allow quick replay by resetting currentTime
  const sfx = new Audio('/whatsapp_click.mp3');
  sfx.preload = 'auto';
  sfx.volume = 0.9; // slightly reduced if needed
  sfx.addEventListener('error', (e) => {
    // fail silently if asset isn't available
    console.warn('WhatsApp SFX failed to load', e);
  });

  // play with small debounce to prevent overlapping spamming
  let lastPlay = 0;
  const MIN_GAP = 120; // ms between plays

  const playSfx = () => {
    const now = Date.now();
    if (now - lastPlay < MIN_GAP) return;
    lastPlay = now;
    try {
      sfx.pause();
      sfx.currentTime = 0;
      // some browsers require a user gesture; pointer events qualify
      const playPromise = sfx.play();
      if (playPromise && playPromise.catch) {
        playPromise.catch(() => {
          // ignore play rejections (autoplay policy)
        });
      }
    } catch (err) {
      // ignore playback errors
    }
  };

  // wire to pointerdown for immediate feedback and keyboard activation
  const waButtons = document.querySelectorAll('.btn-whatsapp');
  if (!waButtons || waButtons.length === 0) return;

  waButtons.forEach((btn) => {
    // pointerdown gives immediate audio feedback
    btn.addEventListener('pointerdown', (e) => {
      // only play for primary button/touch
      if (e.button !== 0 && e.pointerType !== 'touch') return;
      playSfx();
    });

    // keyboard activation: space or enter
    btn.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        playSfx();
      } else if (e.code === 'Enter') {
        playSfx();
      }
    });
  });
})();

