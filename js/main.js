/* ==========================================================================
   MISCHEIF — Shared site behavior: cart storage, nav, toasts, misc UI.
   ========================================================================== */

const CART_KEY = "mischeif_cart_v1";

/* ---------- Cart storage ------------------------------------------------ */

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
}

function addToCart({ id, size, color, qty }) {
  const cart = getCart();
  const existing = cart.find(
    (item) => item.id === id && item.size === size && item.color === color
  );
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ id, size, color, qty });
  }
  saveCart(cart);
}

/** Adds a one-off customized garment (see customizer.js). Never merged with
 *  another line — every custom design is treated as unique. */
function addCustomToCart(customItem) {
  const cart = getCart();
  cart.push({
    type: "custom",
    lineId: "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    ...customItem
  });
  saveCart(cart);
}

function removeFromCartLine(index) {
  const cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
}

function setCartLineQty(index, qty) {
  const cart = getCart();
  if (!cart[index]) return;
  cart[index].qty = Math.max(1, qty);
  saveCart(cart);
}

function cartCount() {
  return getCart().reduce((sum, item) => sum + item.qty, 0);
}

function cartSubtotal() {
  const cart = getCart();
  return cart.reduce((sum, item) => {
    if (item.type === "custom") return sum + item.price * item.qty;
    const product = typeof getProductById === "function" ? getProductById(item.id) : null;
    return sum + (product ? product.price * item.qty : 0);
  }, 0);
}

function updateCartCount() {
  const badges = document.querySelectorAll("[data-cart-count]");
  const count = cartCount();
  badges.forEach((b) => {
    b.textContent = count;
    b.style.display = count > 0 ? "inline-flex" : "none";
  });
}

/* ---------- Toast --------------------------------------------------------- */

function toast(message) {
  let host = document.querySelector(".toast-host");
  if (!host) {
    host = document.createElement("div");
    host.className = "toast-host";
    document.body.appendChild(host);
  }
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;
  host.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 300);
  }, 2600);
}

/* ---------- Mobile nav ---------------------------------------------------- */

function initNav() {
  const toggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-nav-panel]");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      nav.classList.toggle("open");
      toggle.classList.toggle("active");
      document.body.classList.toggle("nav-open");
    });
    nav.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        nav.classList.remove("open");
        toggle.classList.remove("active");
        document.body.classList.remove("nav-open");
      })
    );
  }

  // Sticky header shrink on scroll
  const header = document.querySelector(".site-header");
  if (header) {
    const onScroll = () => {
      header.classList.toggle("scrolled", window.scrollY > 12);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }
}

/* ---------- Newsletter (fake submit) -------------------------------------- */

function initNewsletterForms() {
  document.querySelectorAll("[data-newsletter-form]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = form.querySelector("input[type='email']");
      if (input && input.value.trim()) {
        toast("You're on the list. Welcome to the trouble.");
        form.reset();
      }
    });
  });
}

/* ---------- Quick add-to-cart buttons on product cards --------------------- */

function initQuickAdd() {
  document.querySelectorAll("[data-quick-add]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.getAttribute("data-quick-add");
      const product = getProductById(id);
      if (!product) return;
      addToCart({
        id,
        size: product.sizes[Math.floor(product.sizes.length / 2)],
        color: product.colors[0].name,
        qty: 1
      });
      toast(`Added "${product.name}" to your bag`);
    });
  });
}

/* ---------- Footer year ---------------------------------------------------- */

function initFooterYear() {
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
}

/* ---------- Reveal-on-scroll animations ------------------------------------ */

function initReveal() {
  const targets = document.querySelectorAll("[data-reveal]");
  if (!("IntersectionObserver" in window) || targets.length === 0) {
    targets.forEach((t) => t.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  targets.forEach((t) => io.observe(t));
}

/* ---------- Init ------------------------------------------------------------ */

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  updateCartCount();
  initNewsletterForms();
  initQuickAdd();
  initFooterYear();
  initReveal();
});
