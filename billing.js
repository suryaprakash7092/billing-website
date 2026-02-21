(function () {
  const CART_KEY = 'restaurant_cart';
  const ORDERS_KEY = 'restaurant_order_history';

  function getCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) return arr;
      }
    } catch (_) {}
    return [];
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  function addToCart(menuItem) {
    const cart = getCart();
    const existing = cart.find(function (c) { return c.id === menuItem.id; });
    if (existing) {
      existing.quantity = (existing.quantity || 1) + 1;
    } else {
      cart.push({
        id: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: 1
      });
    }
    saveCart(cart);
    return cart;
  }

  function removeFromCart(itemId) {
    const cart = getCart().filter(function (c) { return c.id !== itemId; });
    saveCart(cart);
    return cart;
  }

  function updateQuantity(itemId, delta) {
    const cart = getCart();
    const item = cart.find(function (c) { return c.id === itemId; });
    if (!item) return cart;
    item.quantity = Math.max(0, (item.quantity || 1) + delta);
    const newCart = cart.filter(function (c) { return c.quantity > 0; });
    saveCart(newCart);
    return newCart;
  }

  function clearCart() {
    saveCart([]);
    return [];
  }

  function getBillTotal(cart) {
    return cart.reduce(function (sum, c) {
      return sum + (c.price || 0) * (c.quantity || 0);
    }, 0);
  }

  function getOrderHistory() {
    try {
      const raw = localStorage.getItem(ORDERS_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) return arr;
      }
    } catch (_) {}
    return [];
  }

  function saveOrder(order) {
    const history = getOrderHistory();
    history.push(order);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(history));
  }

  function createOrderFromCart(cart) {
    const total = getBillTotal(cart);
    const order = {
      id: 'bill-' + Date.now(),
      date: new Date().toISOString().slice(0, 10),
      timestamp: Date.now(),
      items: cart.map(function (c) {
        return { id: c.id, name: c.name, price: c.price, quantity: c.quantity };
      }),
      total: total
    };
    return order;
  }

  window.billing = {
    getCart: getCart,
    saveCart: saveCart,
    addToCart: addToCart,
    removeFromCart: removeFromCart,
    updateQuantity: updateQuantity,
    clearCart: clearCart,
    getBillTotal: getBillTotal,
    getOrderHistory: getOrderHistory,
    saveOrder: saveOrder,
    createOrderFromCart: createOrderFromCart
  };
})();
