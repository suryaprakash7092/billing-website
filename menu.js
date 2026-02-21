(function () {
  const STORAGE_KEY = 'restaurant_menu';

  const DEFAULT_MENU = [
    { id: '1', name: 'Idly', price: 30, imageUrl: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&h=300&fit=crop' },
    { id: '2', name: 'Poori', price: 40, imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop' },
    { id: '3', name: 'Coffee', price: 25, imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop' },
    { id: '4', name: 'Tea', price: 20, imageUrl: 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=400&h=300&fit=crop' },
    { id: '5', name: 'Vada', price: 35, imageUrl: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&h=300&fit=crop' },
    { id: '6', name: 'Dosa', price: 50, imageUrl: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400&h=300&fit=crop' }
  ];

  function getMenu() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list) && list.length > 0) return list;
      }
    } catch (_) {}
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_MENU));
    return DEFAULT_MENU.slice();
  }

  function saveMenu(menu) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(menu));
  }

  function nextId(menu) {
    const nums = menu.map(function (m) { return parseInt(m.id, 10) || 0; });
    return String(Math.max(0, ...nums) + 1);
  }

  window.menuStore = {
    getAll: getMenu,
    add: function (item) {
      const menu = getMenu();
      const newItem = {
        id: nextId(menu),
        name: (item.name || '').trim(),
        price: parseFloat(item.price) || 0,
        imageUrl: (item.imageUrl || '').trim() || '#'
      };
      menu.push(newItem);
      saveMenu(menu);
      return newItem;
    },
    update: function (id, item) {
      const menu = getMenu();
      const i = menu.findIndex(function (m) { return m.id === id; });
      if (i === -1) return null;
      menu[i] = {
        id: menu[i].id,
        name: (item.name || '').trim() || menu[i].name,
        price: typeof item.price !== 'undefined' ? parseFloat(item.price) || 0 : menu[i].price,
        imageUrl: (item.imageUrl || '').trim() || menu[i].imageUrl
      };
      saveMenu(menu);
      return menu[i];
    },
    remove: function (id) {
      const menu = getMenu().filter(function (m) { return m.id !== id; });
      saveMenu(menu);
      return true;
    },
    getById: function (id) {
      return getMenu().find(function (m) { return m.id === id; });
    }
  };

  function renderMenuGrid(containerId, onItemClick, handlers) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const menu = getMenu();
    const getQty = handlers && handlers.getQty ? handlers.getQty : function () { return 0; };
    const hasControls = handlers && handlers.onAdd && handlers.onSubtract;

    container.innerHTML = menu.map(function (item) {
      const img = item.imageUrl && item.imageUrl !== '#' ? item.imageUrl : 'https://via.placeholder.com/400x300?text=' + encodeURIComponent(item.name);
      const qty = hasControls ? getQty(item.id) : 0;
      const controlsHtml = hasControls
        ? '<div class="menu-item-controls">' +
          '<button type="button" class="btn-menu-qty btn-menu-minus" aria-label="Remove one">−</button>' +
          '<span class="menu-qty-display">' + qty + '</span>' +
          '<button type="button" class="btn-menu-qty btn-menu-plus" aria-label="Add one">+</button>' +
          '</div>'
        : '';
      return '<div class="menu-item" data-id="' + item.id + '">' +
        '<img src="' + img + '" alt="' + escapeHtml(item.name) + '">' +
        '<div class="info">' +
        '<p class="name">' + escapeHtml(item.name) + '</p>' +
        '<p class="price">₹' + item.price + '</p>' +
        (controlsHtml ? controlsHtml : '') +
        '</div>' +
        '</div>';
    }).join('');

    container.querySelectorAll('.menu-item').forEach(function (el) {
      const id = el.getAttribute('data-id');
      if (!id) return;

      if (hasControls) {
        var minusBtn = el.querySelector('.btn-menu-minus');
        var plusBtn = el.querySelector('.btn-menu-plus');
        if (minusBtn) minusBtn.addEventListener('click', function (e) { e.stopPropagation(); handlers.onSubtract(id); });
        if (plusBtn) plusBtn.addEventListener('click', function (e) { e.stopPropagation(); handlers.onAdd(id); });
      } else if (onItemClick) {
        el.setAttribute('role', 'button');
        el.setAttribute('tabindex', '0');
        el.addEventListener('click', function () { onItemClick(id); });
        el.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onItemClick(id); }
        });
      }
    });
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function renderManageList(containerId, onEdit, onDelete) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const menu = getMenu();
    container.innerHTML = menu.map(function (item) {
      const img = item.imageUrl && item.imageUrl !== '#' ? item.imageUrl : 'https://via.placeholder.com/48?text=';
      return '<div class="manage-row" data-id="' + item.id + '">' +
        '<img src="' + img + '" alt="">' +
        '<div class="details"><p class="name">' + escapeHtml(item.name) + '</p><p class="price">₹' + item.price + '</p></div>' +
        '<div class="actions">' +
        '<button type="button" class="btn btn-outline btn-small btn-edit">Edit</button>' +
        '<button type="button" class="btn btn-outline btn-small btn-delete">Delete</button>' +
        '</div></div>';
    }).join('');

    container.querySelectorAll('.btn-edit').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const row = btn.closest('.manage-row');
        if (row && onEdit) onEdit(row.getAttribute('data-id'));
      });
    });
    container.querySelectorAll('.btn-delete').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const row = btn.closest('.manage-row');
        if (row && onDelete) onDelete(row.getAttribute('data-id'));
      });
    });
  }

  window.menuUI = {
    renderMenuGrid: renderMenuGrid,
    renderManageList: renderManageList
  };
})();
