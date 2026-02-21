(function () {
  function menuHandlers() {
    return {
      getQty: function (id) {
        var c = window.billing.getCart().find(function (x) { return x.id === id; });
        return c ? (c.quantity || 0) : 0;
      },
      onAdd: function (id) {
        var item = window.menuStore.getById(id);
        if (item) {
          window.billing.addToCart(item);
          renderCart();
          window.menuUI.renderMenuGrid('menu-grid', null, menuHandlers());
        }
      },
      onSubtract: function (id) {
        window.billing.updateQuantity(id, -1);
        renderCart();
        window.menuUI.renderMenuGrid('menu-grid', null, menuHandlers());
      }
    };
  }

  function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(function (s) {
      s.classList.remove('active');
    });
    document.querySelectorAll('.nav-btn').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-section') === sectionId);
    });
    const section = document.getElementById('section-' + sectionId);
    if (section) section.classList.add('active');

    if (sectionId === 'menu') {
      window.menuUI.renderMenuGrid('menu-grid', null, menuHandlers());
    } else if (sectionId === 'cart') {
      renderCart();
    } else if (sectionId === 'manage') {
      window.menuUI.renderManageList('manage-list', onEditItem, onDeleteItem);
    } else if (sectionId === 'sales') {
      if (window.salesReport) window.salesReport.render();
    }
  }

  function renderCart() {
    const container = document.getElementById('cart-items');
    const totalEl = document.getElementById('bill-total');
    if (!container || !totalEl) return;

    const cart = window.billing.getCart();
    const total = window.billing.getBillTotal(cart);

    if (cart.length === 0) {
      container.innerHTML = '<p class="empty-cart">Cart is empty. Add items from the Menu.</p>';
    } else {
      container.innerHTML = cart.map(function (c) {
        const lineTotal = (c.price || 0) * (c.quantity || 0);
        const qty = c.quantity || 1;
        return '<div class="cart-row" data-id="' + c.id + '">' +
          '<span class="cart-row-name">' + escapeHtml(c.name) + '</span>' +
          '<div class="cart-qty-controls">' +
          '<button type="button" class="btn-qty btn-cart-minus" aria-label="Decrease quantity">−</button>' +
          '<span class="qty">' + qty + '</span>' +
          '<button type="button" class="btn-qty btn-cart-plus" aria-label="Increase quantity">+</button>' +
          '</div>' +
          '<span class="cart-row-total">₹' + lineTotal.toFixed(2) + '</span>' +
          '</div>';
      }).join('');

      container.querySelectorAll('.btn-cart-minus').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var row = btn.closest('.cart-row');
          if (row) {
            window.billing.updateQuantity(row.getAttribute('data-id'), -1);
            renderCart();
          }
        });
      });
      container.querySelectorAll('.btn-cart-plus').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var row = btn.closest('.cart-row');
          if (row) {
            window.billing.updateQuantity(row.getAttribute('data-id'), 1);
            renderCart();
          }
        });
      });
    }

    totalEl.textContent = '₹' + total.toFixed(2);
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function onPayNow() {
    var cart = window.billing.getCart();
    if (!cart.length) return;
    var order = window.billing.createOrderFromCart(cart);
    window.billing.saveOrder(order);
    window.qrPay.show(order.total, order.id, function () {
      if (confirm('Print bill?')) {
        doPrintBill(cart);
      }
      if (confirm('Clear cart?')) {
        window.billing.clearCart();
        renderCart();
      }
    });
  }

  function doPrintBill(cart) {
    if (!cart || !cart.length) return;
    var total = window.billing.getBillTotal(cart);
    var printArea = document.getElementById('bill-print-area');
    if (printArea) {
      var lines = [
        '--- Bill ---',
        'Date: ' + new Date().toLocaleString(),
        '',
        cart.map(function (c) {
          return c.name + ' x ' + (c.quantity || 1) + ' = ₹' + ((c.price || 0) * (c.quantity || 1)).toFixed(2);
        }).join('\n'),
        '',
        'Total: ₹' + total.toFixed(2),
        '--- Thank you ---'
      ];
      printArea.innerHTML = '<div class="print-bill-content">' + lines.join('\n').replace(/\n/g, '<br>') + '</div>';
    }
    window.print();
  }

  function onPrintBill() {
    var cart = window.billing.getCart();
    if (!cart.length) return;
    var order = window.billing.createOrderFromCart(cart);
    window.billing.saveOrder(order);
    doPrintBill(cart);
  }

  function onClearCart() {
    window.billing.clearCart();
    renderCart();
  }

  function onEditItem(id) {
    const item = window.menuStore.getById(id);
    if (!item) return;
    document.getElementById('edit-id').value = item.id;
    document.getElementById('item-name').value = item.name || '';
    document.getElementById('item-price').value = item.price ?? '';
    document.getElementById('item-image').value = item.imageUrl || '';
  }

  function onDeleteItem(id) {
    if (!confirm('Delete this item from the menu?')) return;
    window.menuStore.remove(id);
    document.getElementById('edit-id').value = '';
    document.getElementById('item-name').value = '';
    document.getElementById('item-price').value = '';
    document.getElementById('item-image').value = '';
    window.menuUI.renderManageList('manage-list', onEditItem, onDeleteItem);
    window.menuUI.renderMenuGrid('menu-grid', null, menuHandlers());
  }

  function onSaveItem() {
    const editId = document.getElementById('edit-id').value.trim();
    const name = document.getElementById('item-name').value.trim();
    const price = document.getElementById('item-price').value;
    const imageUrl = document.getElementById('item-image').value.trim();
    if (!name) return;

    if (editId) {
      window.menuStore.update(editId, { name: name, price: price, imageUrl: imageUrl });
    } else {
      window.menuStore.add({ name: name, price: price, imageUrl: imageUrl });
    }
    document.getElementById('edit-id').value = '';
    document.getElementById('item-name').value = '';
    document.getElementById('item-price').value = '';
    document.getElementById('item-image').value = '';

    window.menuUI.renderManageList('manage-list', onEditItem, onDeleteItem);
    window.menuUI.renderMenuGrid('menu-grid', null, menuHandlers());
  }

  function onCancelEdit() {
    document.getElementById('edit-id').value = '';
    document.getElementById('item-name').value = '';
    document.getElementById('item-price').value = '';
    document.getElementById('item-image').value = '';
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.nav-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        showSection(btn.getAttribute('data-section'));
      });
    });

    document.getElementById('btn-pay-now').addEventListener('click', onPayNow);
    document.getElementById('btn-print-bill').addEventListener('click', onPrintBill);
    document.getElementById('btn-clear-cart').addEventListener('click', onClearCart);
    document.getElementById('btn-save-item').addEventListener('click', onSaveItem);
    document.getElementById('btn-cancel-edit').addEventListener('click', onCancelEdit);

    var upiInput = document.getElementById('setting-upi-id');
    var btnSaveUpi = document.getElementById('btn-save-upi');
    if (upiInput) upiInput.value = window.qrPay.getUpiId();
    if (btnSaveUpi) btnSaveUpi.addEventListener('click', function () {
      if (upiInput) window.qrPay.setUpiId(upiInput.value);
    });

    showSection('menu');
  });
})();
