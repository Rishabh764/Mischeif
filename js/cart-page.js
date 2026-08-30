/* ==========================================================================
   MISCHEIF — Cart page rendering & logic
   ========================================================================== */

(function () {
  const SHIPPING_THRESHOLD = 75;
  const SHIPPING_COST = 8;

  const VIEW_ZONES_FOR_CART = { front: ["neck", "front", "sleeveLeft", "sleeveRight"], back: ["back", "hem"] };

  function customLineHTML(item, index) {
    const zoneKeys = Object.keys(item.zones || {}).filter((k) => item.zones[k]);
    const previewView = zoneKeys.includes("front") || zoneKeys.includes("neck") || zoneKeys.includes("sleeveLeft") || zoneKeys.includes("sleeveRight") || !zoneKeys.length
      ? "front"
      : "back";
    const svg = garmentSVG(item.garment, previewView, item.mainColor, item.trimColor);
    const visibleZones = (VIEW_ZONES_FOR_CART[previewView] || []).filter((k) => item.zones && item.zones[k]);
    const artLayers = visibleZones
      .map((key) => {
        const rect = GARMENT_ZONES[item.garment][previewView][key];
        const p = zoneToPercent(rect);
        const z = item.zones[key];
        const t = `translate(-50%,-50%) translate(${z.offsetX}%, ${z.offsetY}%) scale(${z.scale}) rotate(${z.rotate}deg)`;
        return `<img class="mini-zone-art" src="${z.src}" alt="" style="left:${p.left + p.width / 2}%; top:${p.top + p.height / 2}%; transform:${t}">`;
      })
      .join("");
    const zoneLabels = zoneKeys.map((k) => GARMENT_ZONES[item.garment].front[k] || GARMENT_ZONES[item.garment].back[k]).map((r) => r.label);

    return `
    <div class="cart-line">
      <div class="cart-line__img"><div class="mini-garment">${svg}${artLayers}</div></div>
      <div>
        <a class="cart-line__name" href="customize.html">Custom ${item.garmentLabel} <span class="badge badge--new" style="position:static;display:inline-flex;vertical-align:middle;margin-left:6px">Custom</span></a>
        <div class="cart-line__opts">Size ${item.size} · ${zoneLabels.join(", ") || "No designs"}</div>
        <div class="cart-line__qty">
          <div class="qty-stepper">
            <button data-qty-minus="${index}">–</button>
            <span>${item.qty}</span>
            <button data-qty-plus="${index}">+</button>
          </div>
          <a href="#" class="cart-line__remove" data-remove="${index}">Remove</a>
        </div>
      </div>
      <div class="cart-line__price">${formatPrice(item.price * item.qty)}</div>
    </div>`;
  }

  function renderCart() {
    const cart = getCart();
    const host = document.getElementById("cart-content");

    if (!cart.length) {
      host.innerHTML = `
        <div class="empty-cart" data-reveal>
          <div style="font-size:60px">🛍️</div>
          <h2>Your bag is empty</h2>
          <p>Looks like you haven't caused any trouble yet.</p>
          <a href="shop.html" class="btn btn--primary">Start Shopping</a>
        </div>`;
      initReveal();
      return;
    }

    const lines = cart
      .map((item, index) => {
        if (item.type === "custom") return customLineHTML(item, index);

        const product = getProductById(item.id);
        if (!product) return "";
        const img = productImage(product, item.color, 0);
        return `
        <div class="cart-line">
          <div class="cart-line__img"><img src="${img}" alt="${product.name}"></div>
          <div>
            <a class="cart-line__name" href="product.html?id=${product.id}">${product.name}</a>
            <div class="cart-line__opts">${item.color} · Size ${item.size}</div>
            <div class="cart-line__qty">
              <div class="qty-stepper">
                <button data-qty-minus="${index}">–</button>
                <span>${item.qty}</span>
                <button data-qty-plus="${index}">+</button>
              </div>
              <a href="#" class="cart-line__remove" data-remove="${index}">Remove</a>
            </div>
          </div>
          <div class="cart-line__price">${formatPrice(product.price * item.qty)}</div>
        </div>`;
      })
      .join("");

    const subtotal = cartSubtotal();
    const shipping = subtotal >= SHIPPING_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_COST;
    const total = subtotal + shipping;
    const remaining = SHIPPING_THRESHOLD - subtotal;

    host.innerHTML = `
      <div class="cart-layout">
        <div class="cart-lines">
          ${remaining > 0 ? `<p class="empty-state" style="text-align:left;padding:0 0 20px;color:var(--muted)">Add <strong style="color:var(--fg)">${formatPrice(remaining)}</strong> more to unlock free shipping.</p>` : ""}
          ${lines}
        </div>
        <div class="summary-card" data-reveal>
          <h3>Order Summary</h3>
          <div class="summary-row"><span>Subtotal</span><strong>${formatPrice(subtotal)}</strong></div>
          <div class="summary-row"><span>Shipping</span><strong>${shipping === 0 ? "Free" : formatPrice(shipping)}</strong></div>
          <div class="promo-row">
            <input type="text" placeholder="Promo code" id="promo-input">
            <button class="btn btn--outline btn--sm" id="promo-apply">Apply</button>
          </div>
          <div class="summary-total"><span>Total</span><span>${formatPrice(total)}</span></div>
          <button class="btn btn--primary btn--block" id="checkout-btn">Checkout</button>
          <p style="text-align:center;color:var(--muted);font-size:11.5px;margin-top:14px">This is a demo store — checkout is simulated, no payment is taken.</p>
        </div>
      </div>`;

    document.querySelectorAll("[data-qty-minus]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const i = parseInt(btn.getAttribute("data-qty-minus"), 10);
        const line = getCart()[i];
        setCartLineQty(i, line.qty - 1 <= 0 ? 1 : line.qty - 1);
        renderCart();
      })
    );
    document.querySelectorAll("[data-qty-plus]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const i = parseInt(btn.getAttribute("data-qty-plus"), 10);
        const line = getCart()[i];
        setCartLineQty(i, line.qty + 1);
        renderCart();
      })
    );
    document.querySelectorAll("[data-remove]").forEach((btn) =>
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        removeFromCartLine(parseInt(btn.getAttribute("data-remove"), 10));
        renderCart();
        toast("Removed from bag");
      })
    );
    const promoBtn = document.getElementById("promo-apply");
    if (promoBtn) promoBtn.addEventListener("click", () => toast("Invalid or expired promo code"));
    const checkoutBtn = document.getElementById("checkout-btn");
    if (checkoutBtn) checkoutBtn.addEventListener("click", () => toast("Checkout is simulated in this demo — no order was placed."));

    initReveal();
  }

  document.addEventListener("DOMContentLoaded", renderCart);
})();
