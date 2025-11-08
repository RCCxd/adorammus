'use strict';

// Script comum: badge do carrinho + modal de carrinho.

const $ = (id) => document.getElementById(id);
const cartBackdrop = $('cartBackdrop');
const cartModal = $('cartModal');
const cartItems = $('cartItems');
const cartTotal = $('cartTotal');
const btnClearCart = $('btnClearCart');
const btnCheckout = $('btnCheckout');

let lastCartCount = null;

function shakeCart(el) {
  if (!el) return;
  const target = el.querySelector('[data-cart-count]') || el;
  target.classList.remove('cart-shake');
  void target.offsetWidth; // restart animation
  target.classList.add('cart-shake');
  target.addEventListener('animationend', () => target.classList.remove('cart-shake'), { once: true });
}

function setCartCount(el, count) {
  if (!el) return;
  const span = el.querySelector('[data-cart-count]');
  if (span) span.textContent = String(count);
  else el.textContent = `Carrinho (${count})`;
}

function updateCartBadge() {
  const count = Store.cartCount();
  const el1 = $('btnCart');
  const el2 = $('btnCartHero');
  setCartCount(el1, count);
  setCartCount(el2, count);
  if (lastCartCount !== null && count !== lastCartCount) {
    if (count > lastCartCount) { shakeCart(el1); shakeCart(el2); }
  }
  lastCartCount = count;
}

function renderCart() {
  const lines = Store.getCart();
  const products = Store.getProducts();
  if (!lines.length) {
    if (cartItems) cartItems.innerHTML = '<div class="py-8 text-center text-gray-400">Seu carrinho está vazio.</div>';
    if (cartTotal) cartTotal.textContent = Store.fmtBRL(0);
    return;
  }
  let total = 0;
  if (cartItems) cartItems.innerHTML = lines.map(l => {
    const p = products.find(x => x.id === l.id);
    if (!p) return '';
    const qty = l.qty || 0;
    const line = p.price * qty;
    total += line;
    return `
      <div class="flex items-center justify-between gap-3 py-3">
        <div class="flex items-center gap-3">
          <img src="${p.image}" alt="${p.name}"
               loading="lazy" decoding="async"
               onerror="this.src=this.dataset.fallback;"
               data-fallback="${Store.placeholderImg(p.name || 'item')}"
               class="w-16 h-16 object-cover rounded border border-gray-800" />
          <div>
            <div class="font-medium">${p.name} <span class="text-xs text-gray-400">&bull; Tamanho: ${l.size}</span></div>
            <div class="text-sm text-gray-400">${Store.fmtBRL(p.price)} &bull;  Qtd: 
              <button class="icon-btn" data-dec data-id="${p.id}" data-size="${l.size}">-</button>
              <span class="mx-2">${qty}</span>
              <button class="icon-btn" data-inc data-id="${p.id}" data-size="${l.size}">+</button>
            </div>
          </div>
        </div>
        <div class="text-right">
          <div class="font-semibold">${Store.fmtBRL(line)}</div>
          <button class="btn-danger mt-1" data-remove data-id="${p.id}" data-size="${l.size}">Remover</button>
        </div>
      </div>`;
  }).join('');
  if (cartTotal) cartTotal.textContent = Store.fmtBRL(total);
}

function openCart() {
  if (!cartBackdrop || !cartModal) return;
  renderCart();
  cartBackdrop.classList.remove('hidden');
  cartModal.classList.remove('hidden');
  cartModal.classList.add('anim-scale');
}
function closeCart() {
  if (!cartBackdrop || !cartModal) return;
  cartBackdrop.classList.add('hidden');
  cartModal.classList.add('hidden');
}

document.addEventListener('click', (e) => {
  const t = e.target;
  if (!(t instanceof Element)) return;

  if (t.closest('#btnCart') || t.closest('#btnCartHero')) {
    e.preventDefault();
    openCart();
  }
  if (t.closest('#btnCloseCart')) {
    e.preventDefault();
    closeCart();
  }
  if (t === cartBackdrop) {
    closeCart();
  }

  const rem = t.closest('[data-remove]');
  const inc = t.closest('[data-inc]');
  const dec = t.closest('[data-dec]');
  if (rem) {
    const id = rem.getAttribute('data-id');
    const size = rem.getAttribute('data-size');
    if (id && size) { Store.removeFromCart(id, size); renderCart(); updateCartBadge(); }
  } else if (inc) {
    const id = inc.getAttribute('data-id');
    const size = inc.getAttribute('data-size');
    if (id && size) {
      const lines = Store.getCart();
      const line = lines.find(l => l.id === id && l.size === size);
      const next = (line?.qty || 0) + 1;
      Store.setCartQty(id, size, next); renderCart(); updateCartBadge();
    }
  } else if (dec) {
    const id = dec.getAttribute('data-id');
    const size = dec.getAttribute('data-size');
    if (id && size) {
      const lines = Store.getCart();
      const line = lines.find(l => l.id === id && l.size === size);
      const next = (line?.qty || 0) - 1;
      Store.setCartQty(id, size, next); renderCart(); updateCartBadge();
    }
  }
});

if (btnClearCart) btnClearCart.addEventListener('click', () => { Store.clearCart(); updateCartBadge(); renderCart(); });
if (btnCheckout) btnCheckout.addEventListener('click', () => {
  if (!Object.keys(Store.getCart()).length) { alert('Seu carrinho está vazio.'); return; }
  alert('Obrigado! Integração de checkout irá ser adicionada depois.');
});

document.addEventListener('DOMContentLoaded', async () => {
  await (window.Store?.initFromRemote?.() || Promise.resolve(false));
  updateCartBadge();
});

// Also trigger immediately in case DOMContentLoaded already fired
updateCartBadge();

// Direct listeners as fallback
$('btnCart')?.addEventListener('click', (e) => { e.preventDefault(); openCart(); });
$('btnCartHero')?.addEventListener('click', (e) => { e.preventDefault(); openCart(); });
