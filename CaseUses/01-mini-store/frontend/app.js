const cartStorageKey = "domingo-cart-v1";
const productGrid = document.querySelector("#product-grid");
const cartItems = document.querySelector("#cart-items");
const cartCount = document.querySelector("#cart-count");
const cartTotalLabel = document.querySelector("#cart-total-label");
const checkoutForm = document.querySelector("#checkout-form");
const checkoutMessage = document.querySelector("#checkout-message");
const productError = document.querySelector("#product-error");

let products = [];
let cart = loadCart();

function loadCart() {
  try {
    const storedCart = JSON.parse(localStorage.getItem(cartStorageKey) || "{}");
    if (!storedCart || typeof storedCart !== "object" || Array.isArray(storedCart)) return {};
    return Object.fromEntries(
      Object.entries(storedCart)
        .filter(([id, quantity]) => /^\d+$/.test(id) && Number.isSafeInteger(quantity) && quantity > 0)
        .map(([id, quantity]) => [id, Math.min(quantity, 20)])
    );
  } catch {
    return {};
  }
}

function saveCart() {
  localStorage.setItem(cartStorageKey, JSON.stringify(cart));
}

function money(cents) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 })
    .format(cents);
}

function renderProducts() {
  productGrid.replaceChildren();
  for (const product of products) {
    const column = document.createElement("div");
    column.className = "col-6 col-lg-3";
    column.innerHTML = `
      <article class="card product-card h-100 shadow-sm">
        <div class="product-art" aria-hidden="true">${product.emoji}</div>
        <div class="card-body d-flex flex-column">
          <div class="d-flex justify-content-between gap-2 align-items-start">
            <h3 class="h6 mb-2">${product.name}</h3>
            <span class="product-price text-nowrap">${money(product.priceCents)}</span>
          </div>
          <p class="small text-secondary flex-grow-1">${product.description}</p>
          <p class="small text-secondary mb-3">${product.stock ? `${product.stock} disponibles` : "Agotado"}</p>
          <button class="btn btn-outline-dark rounded-pill add-to-cart" data-product-id="${product.id}" ${product.stock && (cart[product.id] || 0) < product.stock ? "" : "disabled"}>
            Añadir a la bolsa
          </button>
        </div>
      </article>`;
    productGrid.append(column);
  }
}

function renderCart() {
  const entries = Object.entries(cart)
    .map(([id, quantity]) => ({ product: products.find((item) => item.id === Number(id)), quantity }))
    .filter((entry) => entry.product);
  const count = entries.reduce((sum, entry) => sum + entry.quantity, 0);
  const totalCents = entries.reduce((sum, entry) => sum + entry.product.priceCents * entry.quantity, 0);
  cartCount.textContent = count;
  cartTotalLabel.textContent = count ? `· ${money(totalCents)}` : "";
  cartItems.replaceChildren();

  if (!entries.length) {
    cartItems.innerHTML = '<p class="text-secondary py-4">Tu bolsa está esperando algo bonito.</p>';
  }

  for (const { product, quantity } of entries) {
    const row = document.createElement("div");
    row.className = "cart-row py-3 d-flex gap-3 align-items-center";
    row.innerHTML = `
      <span class="fs-2" aria-hidden="true">${product.emoji}</span>
      <div class="flex-grow-1">
        <div class="fw-semibold">${product.name}</div>
        <div class="small text-secondary">${money(product.priceCents)}</div>
      </div>
      <div class="quantity-control d-flex align-items-center gap-2">
        <button type="button" aria-label="Quitar uno de ${product.name}" data-cart-action="decrease" data-product-id="${product.id}">−</button>
        <span>${quantity}</span>
        <button type="button" aria-label="Añadir uno de ${product.name}" data-cart-action="increase" data-product-id="${product.id}" ${quantity >= product.stock ? "disabled" : ""}>+</button>
      </div>`;
    cartItems.append(row);
  }
}

productGrid.addEventListener("click", (event) => {
  const button = event.target.closest(".add-to-cart");
  if (!button) return;
  const id = button.dataset.productId;
  cart[id] = Math.min((cart[id] || 0) + 1, 20);
  saveCart();
  renderProducts();
  renderCart();
});

cartItems.addEventListener("click", (event) => {
  const button = event.target.closest("[data-cart-action]");
  if (!button) return;
  const id = button.dataset.productId;
  const nextQuantity = (cart[id] || 0) + (button.dataset.cartAction === "increase" ? 1 : -1);
  if (nextQuantity > 0) cart[id] = nextQuantity;
  else delete cart[id];
  saveCart();
  renderProducts();
  renderCart();
});

checkoutForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const items = Object.entries(cart).map(([productId, quantity]) => ({
    productId: Number(productId),
    quantity
  }));
  if (!items.length) {
    checkoutMessage.className = "small text-danger";
    checkoutMessage.textContent = "Añade al menos un producto antes de hacer el pedido.";
    return;
  }

  const submitButton = checkoutForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  checkoutMessage.className = "small text-secondary";
  checkoutMessage.textContent = "Guardando tu pedido…";
  try {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: checkoutForm.elements.customerName.value,
        items
      })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "No se pudo completar el pedido.");

    cart = {};
    saveCart();
    checkoutForm.elements.customerName.value = "";
    checkoutMessage.className = "small text-success";
    checkoutMessage.textContent = `¡Listo! Pedido #${result.order.id} guardado en la base local.`;
    await loadProducts();
    renderCart();
  } catch (error) {
    checkoutMessage.className = "small text-danger";
    checkoutMessage.textContent = error.message;
  } finally {
    submitButton.disabled = false;
  }
});

async function loadProducts() {
  const response = await fetch("/api/products");
  if (!response.ok) throw new Error(`No se pudieron cargar los productos (${response.status}).`);
  const result = await response.json();
  products = result.products;
  for (const [id, quantity] of Object.entries(cart)) {
    const product = products.find((item) => item.id === Number(id));
    if (!product || product.stock === 0) delete cart[id];
    else if (quantity > product.stock) cart[id] = product.stock;
  }
  saveCart();
  renderProducts();
  renderCart();
}

loadProducts().catch((error) => {
  productError.textContent = error.message;
  productError.classList.remove("d-none");
});
