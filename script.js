/* ==========================================================================
   CDI · Intranet Comercial — script.js  (vanilla, sin dependencias)
   ========================================================================== */
(function () {
  "use strict";
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* ---------- ABRIR TODO EN PESTAÑA NUEVA (salvaguarda) ------------------ */
  /* Cualquier enlace de herramienta/acceso con URL real abre en otra pestaña,
     para que la intranet quede siempre disponible durante la venta.          */
  $$("a.tool, a.access").forEach((a) => {
    const href = a.getAttribute("href") || "";
    if (href && href !== "#" && !href.startsWith("javascript:")) {
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener noreferrer");
      if (!a.title) a.title = "Se abre en una pestaña nueva";
    }
  });

  /* ------------------------------- TEMA ---------------------------------- */
  const root = document.documentElement;
  const THEME_KEY = "cdi-theme";
  const saved = localStorage.getItem(THEME_KEY);
  if (saved) {
    root.setAttribute("data-theme", saved);
  } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
    root.setAttribute("data-theme", "light");
  }
  $("#themeToggle")?.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem(THEME_KEY, next);
  });

  /* ---------------------- SALUDO + RELOJ EN VIVO ------------------------- */
  const greetingEl = $("#greeting");
  const clockEl = $("#clock");
  function refreshTime() {
    const now = new Date();
    const h = now.getHours();
    const salute = h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
    if (greetingEl) greetingEl.textContent = `${salute}, equipo CDI`;
    if (clockEl) {
      clockEl.textContent = now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) +
        " · " + now.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });
    }
  }
  refreshTime();
  setInterval(refreshTime, 15000);
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ------------------------ CONTADOR DE STATS --------------------------- */
  $$(".stat__num[data-count]").forEach((el) => {
    const target = parseInt(el.dataset.count, 10);
    if (isNaN(target)) return;
    let cur = 0;
    const step = Math.max(1, Math.round(target / 22));
    const tick = () => {
      cur = Math.min(target, cur + step);
      el.textContent = cur;
      if (cur < target) requestAnimationFrame(tick);
    };
    setTimeout(tick, 350);
  });

  /* --------------------------- REVEAL ON SCROLL -------------------------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add("is-in"), i * 90);
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  $$(".reveal").forEach((el) => io.observe(el));

  /* ---------------------- TOPBAR STUCK STATE ---------------------------- */
  const topbar = $("#topbar");
  const onScroll = () => topbar?.classList.toggle("is-stuck", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* --------------------- SPOTLIGHT EN TARJETAS -------------------------- */
  $$(".tool").forEach((tile) => {
    tile.addEventListener("pointermove", (e) => {
      const r = tile.getBoundingClientRect();
      tile.style.setProperty("--mx", `${e.clientX - r.left}px`);
      tile.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  });

  /* ------------------------- TOAST HELPER ------------------------------- */
  const toast = $("#toast");
  let toastT;
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("is-visible");
    clearTimeout(toastT);
    toastT = setTimeout(() => toast.classList.remove("is-visible"), 2600);
  }

  /* --------------------- PLACEHOLDERS "PRÓXIMAMENTE" -------------------- */
  function handleSoon(el) {
    const name = el.querySelector(".tool__name")?.textContent?.trim()
      || el.textContent.replace(/próximamente/i, "").trim();
    showToast(`“${name}” estará disponible muy pronto.`);
  }
  $$(".tool--soon").forEach((el) => {
    el.addEventListener("click", () => handleSoon(el));
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleSoon(el); }
    });
  });
  $$(".access[data-soon]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      showToast(`Acceso a ${el.querySelector(".access__name")?.textContent} en configuración.`);
    });
  });

  /* --------------------- PANEL DE ACCESOS (expand) ---------------------- */
  const group = $(".tool--group");
  const panel = $("#accesos-panel");
  group?.addEventListener("click", () => {
    const open = group.getAttribute("aria-expanded") === "true";
    group.setAttribute("aria-expanded", String(!open));
    if (open) {
      panel.classList.remove("is-open");
      panel.hidden = true;
    } else {
      panel.hidden = false;
      panel.classList.add("is-open");
    }
  });

  /* ======================= COMMAND PALETTE ============================== */
  // Índice de comandos, derivado del DOM para mantenerse siempre sincronizado.
  const ACCENTS = {
    comercial:     ["#F58634", "#E8541E"],
    entrenamiento: ["#7c9cff", "#6a5cff"],
    rrhh:          ["#35c46a", "#16a34a"],
  };
  const DEPT_LABEL = {
    comercial: "Gestión Comercial",
    entrenamiento: "Entrenamiento",
    rrhh: "Recursos Humanos",
  };
  const index = [];
  $$(".dept").forEach((dept) => {
    const key = dept.dataset.accent;
    $$(".tool", dept).forEach((tool) => {
      const name = tool.querySelector(".tool__name")?.textContent?.trim()
        || tool.textContent.replace(/próximamente/i, "").trim();
      const soon = tool.classList.contains("tool--soon");
      const href = tool.tagName === "A" ? tool.getAttribute("href") : null;
      index.push({ name, dept: key, soon, href, el: tool });
    });
  });

  const palette = $("#palette");
  const pInput = $("#paletteInput");
  const pList = $("#paletteList");
  const pEmpty = $("#paletteEmpty");
  let selIdx = 0;

  function iconFor(item) {
    if (item.href) return "↗";
    if (item.soon) return "◔";
    return "▸";
  }
  function renderList(query) {
    const q = query.trim().toLowerCase();
    const results = index.filter((it) =>
      !q || it.name.toLowerCase().includes(q) || DEPT_LABEL[it.dept].toLowerCase().includes(q)
    );
    selIdx = 0;
    pList.innerHTML = "";
    pEmpty.hidden = results.length > 0;
    results.forEach((it, i) => {
      const [a1, a2] = ACCENTS[it.dept] || ["#E8541E", "#F58634"];
      const li = document.createElement("li");
      li.className = "palette__item";
      li.setAttribute("role", "option");
      li.setAttribute("aria-selected", i === 0 ? "true" : "false");
      li.style.setProperty("--pa1", a1);
      li.style.setProperty("--pa2", a2);
      li.innerHTML =
        `<span class="p-ic">${iconFor(it)}</span>` +
        `<span class="p-body"><div class="p-name">${it.name}</div>` +
        `<div class="p-dep">${DEPT_LABEL[it.dept]}</div></span>` +
        (it.soon ? `<span class="p-tag">Pronto</span>` : "");
      li.addEventListener("click", () => activate(it));
      li.addEventListener("mousemove", () => setSelected(i));
      pList.appendChild(li);
    });
    return results;
  }
  let current = [];
  function setSelected(i) {
    const items = $$(".palette__item", pList);
    if (!items.length) return;
    selIdx = (i + items.length) % items.length;
    items.forEach((el, idx) => el.setAttribute("aria-selected", String(idx === selIdx)));
    items[selIdx].scrollIntoView({ block: "nearest" });
  }
  function activate(item) {
    closePalette();
    if (item.href) {
      window.open(item.href, "_blank", "noopener");
    } else if (item.soon) {
      handleSoon(item.el);
    } else {
      item.el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }
  function openPalette() {
    palette.hidden = false;
    current = renderList("");
    pInput.value = "";
    requestAnimationFrame(() => pInput.focus());
    document.body.style.overflow = "hidden";
  }
  function closePalette() {
    palette.hidden = true;
    document.body.style.overflow = "";
  }

  $("#cmdOpen")?.addEventListener("click", openPalette);
  pInput?.addEventListener("input", () => { current = renderList(pInput.value); });
  pInput?.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected(selIdx + 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSelected(selIdx - 1); }
    else if (e.key === "Enter") { e.preventDefault(); if (current[selIdx]) activate(current[selIdx]); }
  });
  $$("[data-close]").forEach((el) => el.addEventListener("click", closePalette));

  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      palette.hidden ? openPalette() : closePalette();
    } else if (e.key === "Escape" && !palette.hidden) {
      closePalette();
    }
  });
})();
