// API endpoints
const API = {
  categories: 'https://openapi.programming-hero.com/api/categories',
  allPlants: 'https://openapi.programming-hero.com/api/plants',
  byCategory: (id) => `https://openapi.programming-hero.com/api/category/${id}`,
  detail: (id) => `https://openapi.programming-hero.com/api/plant/${id}`,
};

// DOM Elements
const categoriesEl = document.getElementById('categories');
const plantGrid = document.getElementById('plantGrid');
const cartList = document.getElementById('cartList');
const cartTotal = document.getElementById('cartTotal');
const checkoutBtn = document.getElementById('checkoutBtn');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');
const modalClose = document.getElementById('modalClose');
const toast = document.getElementById('toast');
const toastMsg = document.getElementById('toastMsg');

let cart = [];

// Helpers
const formatPrice = (num) => `$${Number(num || 0).toFixed(2)}`;
const showToast = (msg) => {
  toastMsg.textContent = msg;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 1800);
};

// Fetch utility
async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// Highlight active category
function highlightCategory(activeBtn) {
  categoriesEl.querySelectorAll('button').forEach(btn => {
    btn.classList.remove('bg-ge-primary', 'text-white');
  });
  activeBtn.classList.add('bg-ge-primary', 'text-white');
}
// Render categories
function renderCategories(list = []) {
  categoriesEl.innerHTML = '';

  // "All Trees" button
  const allBtn = document.createElement('button');
  allBtn.textContent = 'All Trees';
  allBtn.className= 'w-full text-left px-4 py-2 rounded-lg border hover:bg-ge-primary/10 transition';

  allBtn.addEventListener('click', () => {
    highlightCategory(allBtn);
    loadPlants(); 
  });
  categoriesEl.append(allBtn);

  // If no categories
  if (!Array.isArray(list) || list.length === 0) {
    const placeholder = document.createElement('div');
    placeholder.textContent = 'No categories found.';
    placeholder.className = 'text-sm text-slate-500 mt-2';
    categoriesEl.append(placeholder);
    return;
  }

  // Add categories
  list.forEach(cat => {
    const btn = document.createElement('button');
    btn.textContent = cat.category_name || cat.category || 'Unknown';
    btn.setAttribute('data-id', cat.id || cat._id || '');
    btn.className = 'w-full text-left px-4 py-2 rounded-lg border hover:bg-ge-primary/10 transition';
    btn.addEventListener('click', () => {
      highlightCategory(btn);
      loadPlants(cat.id || cat._id);
    });
    categoriesEl.append(btn);
  });

  highlightCategory(allBtn);
}
// Render plants
function renderPlants(plants = []) {
  plantGrid.innerHTML = '';
  plants.forEach((p) => {
    const el = document.createElement('article');
    el.className = 'bg-white rounded-2xl shadow-soft flex flex-col overflow-hidden';
    el.innerHTML = `
      <div class="aspect-[4/3] bg-slate-100 overflow-hidden"><img src="${p.image}" alt="${p.name}" class="h-full w-full object-cover"></div>
      <div class="p-4 flex flex-1 flex-col">
        <h3 class="text-lg font-bold text-ge-primary cursor-pointer" data-id="${p.id}">${p.name}</h3>
        <p class="mt-1 text-sm text-slate-600">${p.description?.slice(0, 80)}...</p>
        <span class="mt-3 inline-block text-xs bg-ge-light/50 text-ge-dark px-2 py-0.5 rounded-full">${p.category}</span>
        <div class="mt-4 flex justify-between items-center">
          <span class="font-bold">${formatPrice(p.price)}</span>
          <button class="bg-ge-primary text-white px-3 py-2 rounded-xl hover:bg-ge-dark" data-id="${p.id}" data-name="${p.name}" data-price="${p.price}">Add to Cart</button>
        </div>
      </div>`;
    plantGrid.append(el);

    el.querySelector('h3').addEventListener('click', () => openModal(p.id));
    el.querySelector('button').addEventListener('click', (e) => addToCart(e.target.dataset));
  });
}

// Cart functions
function renderCart() {
  cartList.innerHTML = '';
  let total = 0;
  cart.forEach((item, idx) => {
    total += Number(item.price);
    const row = document.createElement('div');
    row.className = 'flex justify-between items-center gap-2 rounded-xl border px-3 py-2';
    row.innerHTML = `
      <div class="truncate">${item.name}</div>
      <div>${formatPrice(item.price)}</div>
      <button data-idx="${idx}" class="hover:text-red-600">❌</button>`;
    row.querySelector('button').addEventListener('click', () => removeFromCart(idx));
    cartList.append(row);
  });
  cartTotal.textContent = formatPrice(total);
  checkoutBtn.disabled = cart.length === 0;
}

function addToCart(item) {
  cart.push(item);
  renderCart();
  showToast(`${item.name} added to cart`);
}

function removeFromCart(idx) {
  showToast(`${cart[idx].name} removed`);
  cart.splice(idx, 1);
  renderCart();
}

// Modal
async function openModal(id) {
  modal.classList.remove('hidden');
  modalBody.innerHTML = 'Loading...';
  try {
    const data = await fetchJSON(API.detail(id));
    const plant = data?.plant;
    modalTitle.textContent = plant?.name || 'Tree Detail';
    modalBody.innerHTML = `
      <div class="grid md:grid-cols-2 gap-4">
        <img src="${plant?.image}" alt="${plant?.name}" class="rounded-xl w-full object-cover"/>
        <div>
          <p><strong>Category:</strong> ${plant?.category}</p>
          <p><strong>Price:</strong> ${formatPrice(plant?.price)}</p>
          <p class="mt-2">${plant?.details || plant?.description || 'No details available.'}</p>
          <button id="modalAdd" class="mt-4 bg-ge-primary text-white px-4 py-2 rounded-xl hover:bg-ge-dark">Add to Cart</button>
        </div>
      </div>`;
    document.getElementById('modalAdd').addEventListener('click', () => {
      addToCart({ id, name: plant.name, price: plant.price });
      closeModal();
    });
  } catch (err) {
    console.error('Failed to fetch plant details:', err);
    modalBody.innerHTML = `<p class="text-red-600">Error loading details.</p>`;
  }
}

function closeModal() {
  modal.classList.add('hidden');
}

modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});

// Load categories and plants
async function init() {
  try {
    const response = await fetchJSON(API.categories);
    console.log("Categories API response:", response);
    
    const catList = response?.categories;
    console.log("Parsed category list:", catList);
    
    renderCategories(catList || []);
    await loadPlants();
  } catch (err) {
    console.error("Failed to load categories:", err);
  }
}


// Load plants by category
async function loadPlants(categoryId = null) {
  try {
    const url = categoryId && categoryId !== 'all' ? API.byCategory(categoryId) : API.allPlants;
    const data = await fetchJSON(url);
    const plants = data?.data?.plants || data?.plants || [];
    renderPlants(plants);
  } catch (err) {
    console.error("Failed to load plants:", err);
  }
}

init();
