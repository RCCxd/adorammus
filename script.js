'use strict';

const $ = (id) => document.getElementById(id);

const cartBackdrop = $('cartBackdrop');
const cartModal = $('cartModal');
const cartItems = $('cartItems');
const cartTotal = $('cartTotal');
const btnClearCart = $('btnClearCart');
const btnCheckout = $('btnCheckout');

const registerForm = $('registerForm');
const loginForm = $('loginForm');
const authFeedback = $('authFeedback');
const sessionBox = $('sessionBox');
const sessionBoxName = $('sessionBoxName');
const sessionEmail = $('sessionEmail');
const btnLogoutAuth = $('btnLogoutAuth');
const profilePanel = $('profilePanel');
const profileForm = $('profileForm');
const profilePhone = $('profilePhone');
const profileCity = $('profileCity');
const profileNotes = $('profileNotes');
const profileContactPref = $('profileContactPref');
const profileHint = $('profileHint');
const profileFeedback = $('profileFeedback');
const btnDownloadAccounts = $('btnDownloadAccounts');
const sessionNameNodes = document.querySelectorAll('[data-session-name]');

const AUTH_USERS_KEY = 'lk_auth_users';
const AUTH_SESSION_KEY = 'lk_auth_session';
const AUTH_PROFILES_KEY = 'lk_auth_profiles';
const CONTACT_PREF_LABEL = {
  whatsapp: 'WhatsApp',
  email: 'Email',
  ligacao: 'Ligação',
};

let lastCartCount = null;

function shakeCart(el) {
  if (!el) return;
  const target = el.querySelector('[data-cart-count]') || el;
  target.classList.remove('cart-shake');
  void target.offsetWidth;
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
    if (count > lastCartCount) {
      shakeCart(el1);
      shakeCart(el2);
    }
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
  if (cartItems) {
    cartItems.innerHTML = lines.map((line) => {
      const product = products.find((p) => p.id === line.id);
      if (!product) return '';
      const qty = line.qty || 0;
      const lineTotal = product.price * qty;
      total += lineTotal;
      const safeColor = line.color ? ` &bull; Cor: ${line.color}` : '';
      return `
        <div class="flex items-center justify-between gap-3 py-3">
          <div class="flex items-center gap-3">
            <img src="${product.image}" alt="${product.name}"
                 loading="lazy" decoding="async"
                 onerror="this.src=this.dataset.fallback;"
                 data-fallback="${Store.placeholderImg(product.name || 'item')}"
                 class="w-16 h-16 object-cover rounded border border-gray-800" />
            <div>
              <div class="font-medium">${product.name} <span class="text-xs text-gray-400">&bull; Tamanho: ${line.size}${safeColor}</span></div>
              <div class="text-sm text-gray-400">${Store.fmtBRL(product.price)} &bull; Qtd:
                <button class="icon-btn" data-dec data-id="${product.id}" data-size="${line.size}" data-color="${(line.color || '').replace(/"/g, '&quot;')}">-</button>
                <span class="mx-2">${qty}</span>
                <button class="icon-btn" data-inc data-id="${product.id}" data-size="${line.size}" data-color="${(line.color || '').replace(/"/g, '&quot;')}">+</button>
              </div>
            </div>
          </div>
          <div class="text-right">
            <div class="font-semibold">${Store.fmtBRL(lineTotal)}</div>
            <button class="btn-danger mt-1" data-remove data-id="${product.id}" data-size="${line.size}" data-color="${(line.color || '').replace(/"/g, '&quot;')}">Remover</button>
          </div>
        </div>`;
    }).join('');
  }
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
    return;
  }
  if (t.closest('#btnCloseCart')) {
    e.preventDefault();
    closeCart();
    return;
  }
  if (t === cartBackdrop) {
    closeCart();
    return;
  }

  const rem = t.closest('[data-remove]');
  const inc = t.closest('[data-inc]');
  const dec = t.closest('[data-dec]');
  if (rem) {
    const id = rem.getAttribute('data-id');
    const size = rem.getAttribute('data-size');
    const color = rem.getAttribute('data-color') || null;
    if (id && size) {
      Store.removeFromCart(id, size, color || null);
      renderCart();
      updateCartBadge();
    }
    return;
  }
  if (inc) {
    const id = inc.getAttribute('data-id');
    const size = inc.getAttribute('data-size');
    const color = inc.getAttribute('data-color') || null;
    if (id && size) {
      const line = Store.getCart().find((item) => item.id === id && item.size === size && ((item.color || null) === (color || null)));
      const next = (line?.qty || 0) + 1;
      Store.setCartQty(id, size, color || null, next);
      renderCart();
      updateCartBadge();
    }
    return;
  }
  if (dec) {
    const id = dec.getAttribute('data-id');
    const size = dec.getAttribute('data-size');
    const color = dec.getAttribute('data-color') || null;
    if (id && size) {
      const line = Store.getCart().find((item) => item.id === id && item.size === size && ((item.color || null) === (color || null)));
      const next = (line?.qty || 0) - 1;
      Store.setCartQty(id, size, color || null, next);
      renderCart();
      updateCartBadge();
    }
  }
});

btnClearCart?.addEventListener('click', () => {
  Store.clearCart();
  updateCartBadge();
  renderCart();
});

btnCheckout?.addEventListener('click', () => {
  const cartLines = Store.getCart();
  if (!cartLines.length) {
    alert('Seu carrinho está vazio.');
    return;
  }
  const products = Store.getProducts();
  let total = 0;
  const itemsText = cartLines.map((line) => {
    const product = products.find((p) => p.id === line.id);
    const name = product ? product.name : 'Produto';
    const qty = line.qty || 0;
    const unit = product ? product.price : 0;
    const lineTotal = unit * qty;
    total += lineTotal;
    const colorInfo = line.color ? ` | Cor: ${line.color}` : '';
    return `- ${name} (Tamanho: ${line.size}${colorInfo}) x${qty} - ${Store.fmtBRL(lineTotal)}`;
  }).join('\n');
  const messageParts = [
    'Olá, gostaria de finalizar minha compra na Adorammus.',
    '',
    'Resumo do pedido:',
    itemsText,
    '',
    `Total: ${Store.fmtBRL(total)}`
  ];
  const activeUser = getActiveUser();
  const profile = activeUser ? getProfileData(activeUser.email) : null;
  const contactLines = [];
  if (activeUser) {
    contactLines.push(`Cliente: ${activeUser.name || activeUser.email}`);
    contactLines.push(`Email: ${activeUser.email}`);
  }
  if (profile?.phone) contactLines.push(`Telefone: ${profile.phone}`);
  if (profile?.city) contactLines.push(`Cidade: ${profile.city}`);
  if (profile?.contactPref) {
    const label = CONTACT_PREF_LABEL[profile.contactPref] || profile.contactPref;
    contactLines.push(`Preferência de contato: ${label}`);
  }
  if (profile?.notes) contactLines.push(`Notas: ${profile.notes}`);
  if (contactLines.length) {
    messageParts.push('', 'Dados do cliente:', ...contactLines);
  }
  const message = messageParts.join('\n');
  const phone = '558393023960';
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
});

function loadUsers() {
  try {
    const raw = localStorage.getItem(AUTH_USERS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function saveUsers(list) {
  localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(list));
}

function findUser(email) {
  const target = (email || '').trim().toLowerCase();
  if (!target) return null;
  return loadUsers().find((user) => (user.email || '').toLowerCase() === target) || null;
}

function addUser(user) {
  const list = loadUsers();
  list.push(user);
  saveUsers(list);
}

function loadProfiles() {
  try {
    const raw = localStorage.getItem(AUTH_PROFILES_KEY);
    const data = raw ? JSON.parse(raw) : {};
    return data && typeof data === 'object' ? data : {};
  } catch {
    return {};
  }
}

function saveProfiles(map) {
  const payload = map && typeof map === 'object' ? map : {};
  localStorage.setItem(AUTH_PROFILES_KEY, JSON.stringify(payload));
}

function getProfileData(email) {
  if (!email) return null;
  const map = loadProfiles();
  const key = String(email).trim().toLowerCase();
  return map[key] || null;
}

function setProfileData(email, data) {
  if (!email) return null;
  const key = String(email).trim().toLowerCase();
  const map = loadProfiles();
  const current = map[key] || {};
  const next = {
    ...current,
    ...data,
    updatedAt: new Date().toISOString(),
  };
  map[key] = next;
  saveProfiles(map);
  return next;
}

function setSession(email) {
  localStorage.setItem(AUTH_SESSION_KEY, email);
}

function getSessionEmail() {
  return localStorage.getItem(AUTH_SESSION_KEY) || null;
}

function clearSession() {
  localStorage.removeItem(AUTH_SESSION_KEY);
}

function getActiveUser() {
  const email = getSessionEmail();
  if (!email) return null;
  const user = findUser(email);
  if (user) return { ...user, email };
  return { name: 'Cliente', email };
}

function showAuthMessage(message, type = 'info') {
  if (!authFeedback) return;
  authFeedback.textContent = message;
  authFeedback.classList.remove('is-error', 'is-success');
  if (type === 'error') authFeedback.classList.add('is-error');
  else if (type === 'success') authFeedback.classList.add('is-success');
}

function clearProfileMessage() {
  if (!profileFeedback) return;
  profileFeedback.textContent = '';
  profileFeedback.classList.add('hidden');
  profileFeedback.classList.remove('is-error', 'is-success');
}

function showProfileMessage(message, type = 'info') {
  if (!profileFeedback) return;
  profileFeedback.textContent = message;
  profileFeedback.classList.remove('hidden', 'is-error', 'is-success');
  if (type === 'error') profileFeedback.classList.add('is-error');
  else if (type === 'success') profileFeedback.classList.add('is-success');
}

function updateSessionDisplays() {
  const active = getActiveUser();
  sessionNameNodes.forEach((node) => {
    if (!node) return;
    node.textContent = active?.name || 'Visitante';
  });
}

function hydrateAuthUI() {
  if (!sessionBox) return;
  const email = getSessionEmail();
  if (email) {
    const user = findUser(email);
    if (sessionBoxName) sessionBoxName.textContent = user?.name || 'Cliente';
    if (sessionEmail) sessionEmail.textContent = email;
    sessionBox.classList.remove('hidden');
    loginForm?.classList.add('hidden');
  } else {
    sessionBox.classList.add('hidden');
    loginForm?.classList.remove('hidden');
  }
  hydrateProfilePanel();
}

function setProfileFormDisabled(disabled) {
  if (!profileForm) return;
  profileForm.querySelectorAll('input, textarea, select, button[type="submit"]').forEach((field) => {
    field.disabled = disabled;
  });
}

function hydrateProfilePanel() {
  if (!profilePanel || !profileForm) return;
  const active = getActiveUser();
  const disabled = !active;
  setProfileFormDisabled(disabled);
  if (disabled) {
    profilePanel.classList.add('profile-panel-locked');
    profileForm.reset();
    if (profileHint) profileHint.textContent = 'Faça login para editar seus dados.';
    clearProfileMessage();
    return;
  }
  profilePanel.classList.remove('profile-panel-locked');
  const profile = getProfileData(active.email) || {};
  if (profilePhone) profilePhone.value = profile.phone || '';
  if (profileCity) profileCity.value = profile.city || '';
  if (profileNotes) profileNotes.value = profile.notes || '';
  if (profileContactPref) {
    const allowed = ['whatsapp', 'email', 'ligacao'];
    profileContactPref.value = allowed.includes(profile.contactPref) ? profile.contactPref : 'whatsapp';
  }
  if (profileHint) profileHint.textContent = `Você está atualizando ${active.name || active.email}.`;
}

registerForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = (document.getElementById('registerName')?.value || '').trim();
  const email = (document.getElementById('registerEmail')?.value || '').trim().toLowerCase();
  const password = document.getElementById('registerPassword')?.value || '';
  if (!name || !email || !password) {
    showAuthMessage('Preencha todos os campos para concluir o cadastro.', 'error');
    return;
  }
  if (findUser(email)) {
    showAuthMessage('Este email já está cadastrado. Faça login para continuar.', 'error');
    return;
  }
  addUser({ name, email, password, createdAt: new Date().toISOString() });
  registerForm.reset();
  showAuthMessage('Conta criada! Use seus dados para fazer login.', 'success');
  updateSessionDisplays();
});

loginForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = (document.getElementById('loginEmail')?.value || '').trim().toLowerCase();
  const password = document.getElementById('loginPassword')?.value || '';
  const user = findUser(email);
  if (!user || user.password !== password) {
    showAuthMessage('Email ou senha inválidos.', 'error');
    return;
  }
  setSession(email);
  loginForm.reset();
  hydrateAuthUI();
  updateSessionDisplays();
  showAuthMessage('Login realizado com sucesso!', 'success');
  hydrateProfilePanel();
});

btnLogoutAuth?.addEventListener('click', () => {
  clearSession();
  hydrateAuthUI();
  updateSessionDisplays();
  showAuthMessage('Sessão encerrada.', 'info');
  hydrateProfilePanel();
});

profileForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const active = getActiveUser();
  if (!active) {
    showProfileMessage('Faça login para salvar suas preferências.', 'error');
    return;
  }
  const allowed = ['whatsapp', 'email', 'ligacao'];
  const chosenPref = (profileContactPref?.value || 'whatsapp').toLowerCase();
  const payload = {
    phone: (profilePhone?.value || '').trim(),
    city: (profileCity?.value || '').trim(),
    contactPref: allowed.includes(chosenPref) ? chosenPref : 'whatsapp',
    notes: (profileNotes?.value || '').trim(),
  };
  setProfileData(active.email, payload);
  showProfileMessage('Preferências atualizadas!', 'success');
});

btnDownloadAccounts?.addEventListener('click', () => {
  const rows = loadUsers();
  if (!rows.length) {
    showProfileMessage('Nenhum cadastro encontrado para exportar.', 'error');
    return;
  }
  const header = ['Nome', 'Email', 'Senha', 'Desde'];
  const csvLines = [header.join(';')];
  rows.forEach((row) => {
    const created = row.createdAt ? new Date(row.createdAt).toLocaleString('pt-BR') : '';
    const safe = [
      row.name || '',
      row.email || '',
      row.password || '',
      created,
    ].map((value) => `"${String(value).replace(/"/g, '""')}"`);
    csvLines.push(safe.join(';'));
  });
  const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `contas-adorammus-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showProfileMessage('Arquivo CSV gerado com sucesso.', 'success');
});

document.addEventListener('DOMContentLoaded', async () => {
  await (window.Store?.initFromRemote?.() || Promise.resolve(false));
  updateCartBadge();
  hydrateAuthUI();
  updateSessionDisplays();
});

updateCartBadge();
hydrateAuthUI();
updateSessionDisplays();
hydrateProfilePanel();

$('btnCart')?.addEventListener('click', (e) => { e.preventDefault(); openCart(); });
$('btnCartHero')?.addEventListener('click', (e) => { e.preventDefault(); openCart(); });

window.Auth = {
  loadUsers,
  findUser,
  getSessionEmail,
  getActiveUser,
};
