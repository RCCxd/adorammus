'use strict';
// Estado e utilitarios compartilhados entre paginas (produtos, carrinho, preferencias)

const Store = (() => {
  const STORAGE_PRODUCTS = 'lk_products';
  const STORAGE_CART = 'lk_cart';
  const STORAGE_GENDER = 'lk_gender';
  const SINGLE_SIZE = 'Unico';

  // Util
  const uid = () => Math.random().toString(36).slice(2, 10);
  const fmtBRL = (n) => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const placeholderImg = (seed) => `https://picsum.photos/seed/${encodeURIComponent(seed || 'item')}/1000/700`;

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }
  function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function isValidItem(x) {
    return (
      x && typeof x === 'object' &&
      typeof x.name === 'string' && x.name.trim() !== '' &&
      typeof x.price === 'number' && Number.isFinite(x.price) && x.price >= 0
    );
  }

  function normalizeSizes(sizes) {
    if (!sizes) return ['P','M','G'];
    if (Array.isArray(sizes)) return sizes.map(String).filter(Boolean);
    if (typeof sizes === 'string') return sizes.split(',').map(s => s.trim()).filter(Boolean);
    return ['P','M','G'];
  }
  const COLOR_ENTRY_SPLIT = /[,;\n]+/;
  function normalizeColorEntry(entry) {
    if (!entry) return null;
    if (typeof entry === 'string') {
      const raw = entry.trim();
      if (!raw) return null;
      const parts = raw.split(/[:|]/);
      let name = (parts[0] || '').trim();
      let swatch = (parts[1] || '').trim();
      if (!name && swatch) {
        name = swatch;
        swatch = '';
      }
      return name ? { name, swatch: swatch || null } : null;
    }
    if (typeof entry === 'object') {
      const name = (entry.name || entry.label || entry.title || '').trim();
      const swatch = (entry.swatch || entry.hex || entry.color || '').trim();
      if (!name && !swatch) return null;
      return { name: name || swatch || 'Variante', swatch: swatch || null };
    }
    return null;
  }
  function normalizeColors(colors) {
    if (!colors) return [];
    if (Array.isArray(colors)) return colors.map(normalizeColorEntry).filter(Boolean);
    if (typeof colors === 'string') {
      return colors.split(COLOR_ENTRY_SPLIT).map(normalizeColorEntry).filter(Boolean);
    }
    if (typeof colors === 'object') return normalizeColors([colors]);
    return [];
  }

  function resolveImageUrl(src, seedName) {
    if (!src) return placeholderImg(seedName || 'item');
    const s = String(src).trim();
    if (!s) return placeholderImg(seedName || 'item');
    if (/^(https?:)?\/\//i.test(s) || s.startsWith('data:')) return s; // absoluto
    try {
      return new URL(s, document.baseURI).href; // relativo ao site (ex.: images/x.jpg)
    } catch {
      return placeholderImg(seedName || 'item');
    }
  }

  function sanitizeProduct(p) {
    const hasSizes = p.hasSizes === false ? false : true;
    const sizes = hasSizes ? normalizeSizes(p.sizes) : [SINGLE_SIZE];
    const name = (p.name || '').trim();
    const price = Number(p.price);
    const id = p.id || uid();
    const showMale = p.showMale !== false;
    const showFemale = p.showFemale !== false;
    const baseImage = resolveImageUrl(p.image, name || id);
    const altImage = resolveImageUrl(p.imageAlt || p.image, (name || id) + '-alt');
    return {
      id,
      name,
      price,
      category: p.category || 'Camisetas',
      image: baseImage,
      imageAlt: altImage,
      imageMale: resolveImageUrl(p.imageMale || baseImage, (name || id) + '-m'),
      imageFemale: resolveImageUrl(p.imageFemale || baseImage, (name || id) + '-f'),
      description: p.description || '',
      sizes,
      hasSizes,
      showMale,
      showFemale,
      colors: normalizeColors(p.colors),
      inStock: p.inStock === false ? false : true
    };
  }

  const defaultProducts = [
    sanitizeProduct({
      id: uid(),
      name: 'Camiseta Preta',
      price: 79.9,
      category: 'Camisetas',
      image: placeholderImg('camiseta-preta'),
      imageMale: placeholderImg('camiseta-preta-m'),
      imageFemale: placeholderImg('camiseta-preta-f'),
      description: 'Camiseta preta basica 100% algodao. Caimento confortavel.',
      colors: ['Preto:#111111', 'Branco:#e7e7e7'],
      inStock: true
    }),
    sanitizeProduct({
      id: uid(),
      name: 'Camiseta Branca',
      price: 74.9,
      category: 'Camisetas',
      image: placeholderImg('camiseta-branca'),
      imageMale: placeholderImg('camiseta-branca-m'),
      imageFemale: placeholderImg('camiseta-branca-f'),
      description: 'Camiseta branca essencial, macia e leve para o dia a dia.',
      colors: ['Branco:#f2f2f2', 'Azul:#2643ff'],
      inStock: true
    })
  ];

  // Produtos
  function ensureProducts() {
    let items = readJSON(STORAGE_PRODUCTS, null);
    if (!Array.isArray(items) || !items.length) {
      writeJSON(STORAGE_PRODUCTS, defaultProducts);
      items = defaultProducts;
    }
    const sanitized = items.filter(isValidItem).map(sanitizeProduct);
    writeJSON(STORAGE_PRODUCTS, sanitized);
    return sanitized;
  }

  function getProducts() {
    return ensureProducts().map(p => ({ ...p, sizes: p.hasSizes ? normalizeSizes(p.sizes) : [SINGLE_SIZE] }));
  }
  function getProduct(id) {
    const p = ensureProducts().find(p => p.id === id) || null;
    return p ? { ...p, sizes: p.hasSizes ? normalizeSizes(p.sizes) : [SINGLE_SIZE] } : null;
  }
  function setProducts(list) {
    if (!Array.isArray(list)) throw new Error('Lista invalida');
    const next = list.map(sanitizeProduct);
    writeJSON(STORAGE_PRODUCTS, next);
  }
  function addProduct(prod) {
    const items = ensureProducts();
    const item = sanitizeProduct(prod);
    if (!isValidItem(item)) throw new Error('Item invalido');
    items.unshift(item);
    writeJSON(STORAGE_PRODUCTS, items);
    return item;
  }
  function updateProduct(id, patch) {
    const items = ensureProducts();
    const idx = items.findIndex(p => p.id === id);
    if (idx < 0) throw new Error('Item nao encontrado');
    const merged = sanitizeProduct({ ...items[idx], ...patch, id });
    if (!isValidItem(merged)) throw new Error('Atualizacao invalida');
    items[idx] = merged;
    writeJSON(STORAGE_PRODUCTS, items);
    return merged;
  }
  function removeProduct(id) {
    const items = ensureProducts().filter(p => p.id !== id);
    writeJSON(STORAGE_PRODUCTS, items);
  }
  function resetProductsToDefaults() { writeJSON(STORAGE_PRODUCTS, defaultProducts); }

  function pickGender(prod, preferred) {
    const showMale = prod?.showMale !== false;
    const showFemale = prod?.showFemale !== false;
    if (preferred === 'feminino' && showFemale) return 'feminino';
    if (preferred === 'masculino' && showMale) return 'masculino';
    if (showMale) return 'masculino';
    if (showFemale) return 'feminino';
    return null;
  }

  // Carrinho
  function normalizeCartLine(line) {
    if (!line || typeof line !== 'object') return null;
    if (!line.id) return null;
    const qty = Number(line.qty) || 0;
    if (qty <= 0) return null;
    const size = line.size || SINGLE_SIZE;
    const color = typeof line.color === 'string' && line.color.trim() ? line.color.trim() : null;
    return { id: line.id, size, color, qty };
  }
  function migrateCart(raw) {
    let list = [];
    if (Array.isArray(raw)) {
      list = raw;
    } else if (raw && typeof raw === 'object') {
      const prods = getProducts();
      list = Object.entries(raw).map(([id, qty]) => {
        const p = prods.find(p => p.id === id);
        const size = p ? (p.sizes?.[0] || SINGLE_SIZE) : SINGLE_SIZE;
        return { id, size, qty };
      });
    }
    return list.map(normalizeCartLine).filter(Boolean);
  }
  function getCart() { return migrateCart(readJSON(STORAGE_CART, [])); }
  function saveCart(lines) { writeJSON(STORAGE_CART, lines.map(normalizeCartLine).filter(Boolean)); }
  function cartCount() { return getCart().reduce((a, b) => a + (b.qty || 0), 0); }
  function addToCart(id, size = null, color = null, qty = 1) {
    const amount = Number(qty) || 0;
    if (!amount) return getCart();
    const lines = getCart();
    const product = getProduct(id);
    const useSize = size || (product?.sizes?.[0] || SINGLE_SIZE);
    const availableColors = product?.colors || [];
    const chosenColor = (typeof color === 'string' && color.trim()) ? color.trim()
      : (availableColors[0]?.name || null);
    const idx = lines.findIndex(l =>
      l.id === id &&
      l.size === useSize &&
      ((l.color || null) === (chosenColor || null))
    );
    if (idx >= 0) {
      lines[idx].qty += amount;
    } else {
      lines.push({ id, size: useSize, color: chosenColor, qty: amount });
    }
    saveCart(lines);
    return lines;
  }
  function setCartQty(id, size, color, qty) {
    const lines = getCart();
    const idx = lines.findIndex(l =>
      l.id === id &&
      l.size === size &&
      ((l.color || null) === (color || null))
    );
    if (idx < 0) return lines;
    if (qty <= 0) { lines.splice(idx, 1); } else { lines[idx].qty = qty; }
    saveCart(lines);
    return lines;
  }
  function removeFromCart(id, size, color) {
    const lines = getCart().filter(l =>
      !(l.id === id && l.size === size && ((l.color || null) === (color || null)))
    );
    saveCart(lines);
    return lines;
  }
  function clearCart() { saveCart([]); }
  function cartTotal() {
    const lines = getCart();
    const prods = ensureProducts();
    return lines.reduce((sum, l) => {
      const p = prods.find(x => x.id === l.id);
      return sum + (p ? p.price * (l.qty || 0) : 0);
    }, 0);
  }

  // Preferencias de exibicao (genero)
  function getGender() {
    const g = localStorage.getItem(STORAGE_GENDER);
    return (g === 'feminino' || g === 'masculino') ? g : 'masculino';
  }
  function setGender(g) {
    const v = (g === 'feminino') ? 'feminino' : 'masculino';
    localStorage.setItem(STORAGE_GENDER, v);
    return v;
  }
  function getImageByGender(prod, gender) {
    const base = prod && typeof prod === 'object' ? prod : {};
    const name = base.name || base.id || 'item';
    const chosen = pickGender(base, gender);
    if (chosen === 'feminino') return resolveImageUrl(base.imageFemale || base.image, `${name}-f`);
    if (chosen === 'masculino') return resolveImageUrl(base.imageMale || base.image, `${name}-m`);
    return resolveImageUrl(base.image, `${name}-base`);
  }
  function getBaseImages(prod) {
    const base = prod && typeof prod === 'object' ? prod : {};
    const name = base.name || base.id || 'item';
    const primary = resolveImageUrl(base.image, `${name}-base`);
    const secondarySource = base.imageAlt || base.image;
    const secondary = resolveImageUrl(secondarySource, `${name}-base-alt`);
    return [primary, secondary];
  }

  // Carrega lista remota (GitHub Pages) e salva localmente
  async function initFromRemote(customUrl) {
    const buster = `v=${Math.floor(Date.now()/60000)}`; // muda a cada minuto
    const candidates = [];
    if (customUrl) candidates.push(customUrl);
    candidates.push('data/products.json');
    candidates.push('products.json');
    candidates.push('./data/products.json');
    candidates.push('./products.json');

    for (const u of candidates) {
      try {
        const url = u.includes('?') ? `${u}&${buster}` : `${u}?${buster}`;
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) continue;
        const data = await res.json();
        const list = Array.isArray(data) ? data : (Array.isArray(data?.products) ? data.products : null);
        if (!list) continue;
        const valid = list.filter(isValidItem);
        if (valid.length) {
          setProducts(valid);
          return true;
        }
      } catch { /* tenta proxima */ }
    }
    return false;
  }

  return {
    // util
    uid, fmtBRL, placeholderImg,
    // produtos
    getProducts, getProduct, setProducts, addProduct, updateProduct, removeProduct, resetProductsToDefaults,
    // carrinho
    getCart, cartCount, addToCart, setCartQty, removeFromCart, clearCart, cartTotal,
    // preferencias
    getGender, setGender, getImageByGender, getBaseImages, pickGender,
    // remoto
    initFromRemote,
  };
})();

window.Store = Store;
