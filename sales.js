(function () {
  function getOrderHistory() {
    return window.billing ? window.billing.getOrderHistory() : [];
  }

  function getMonthKey(dateStr) {
    if (!dateStr) return '';
    return dateStr.slice(0, 7);
  }

  function getMonthlyAggregates() {
    const orders = getOrderHistory();
    const byMonth = {};
    orders.forEach(function (order) {
      const key = getMonthKey(order.date);
      if (!key) return;
      if (!byMonth[key]) {
        byMonth[key] = { count: 0, total: 0, orders: [] };
      }
      byMonth[key].count += 1;
      byMonth[key].total += order.total || 0;
      byMonth[key].orders.push(order);
    });
    return byMonth;
  }

  function getSortedMonths() {
    const agg = getMonthlyAggregates();
    return Object.keys(agg).sort().reverse();
  }

  function renderSalesReport() {
    const monthSelect = document.getElementById('sales-month');
    const summaryEl = document.getElementById('sales-summary');
    const ordersEl = document.getElementById('sales-orders');
    if (!monthSelect || !summaryEl || !ordersEl) return;

    const months = getSortedMonths();
    const agg = getMonthlyAggregates();

    monthSelect.innerHTML = '<option value="">Select month</option>' +
      months.map(function (m) {
        const label = m.replace(/-/, ' ');
        return '<option value="' + m + '">' + label + '</option>';
      }).join('');

    function showMonth(monthKey) {
      if (!monthKey) {
        summaryEl.innerHTML = '<p>Select a month to view sales.</p>';
        ordersEl.innerHTML = '';
        return;
      }
      const data = agg[monthKey];
      if (!data) {
        summaryEl.innerHTML = '<p>No sales for this month.</p>';
        ordersEl.innerHTML = '';
        return;
      }
      summaryEl.innerHTML = '<p><strong>Bills:</strong> ' + data.count + '</p><p><strong>Total sales:</strong> ₹' + data.total.toFixed(2) + '</p>';
      data.orders.sort(function (a, b) { return (b.timestamp || 0) - (a.timestamp || 0); });
      ordersEl.innerHTML = data.orders.map(function (o) {
        const date = o.date || '';
        return '<div class="sales-order-card">' +
          '<span class="date">' + date + ' — ' + (o.id || '') + '</span>' +
          '<p class="total">₹' + (o.total || 0).toFixed(2) + '</p>' +
          '</div>';
      }).join('');
    }

    monthSelect.addEventListener('change', function () {
      showMonth(monthSelect.value);
    });

    if (months.length > 0 && !monthSelect.value) {
      monthSelect.value = months[0];
      showMonth(months[0]);
    } else {
      showMonth(monthSelect.value);
    }
  }

  window.salesReport = {
    render: renderSalesReport,
    getMonthlyAggregates: getMonthlyAggregates,
    getSortedMonths: getSortedMonths
  };
})();
