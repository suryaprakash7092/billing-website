(function () {
  const DEFAULT_UPI = 'restaurant@upi';

  function getUpiId() {
    try {
      return localStorage.getItem('restaurant_upi_id') || DEFAULT_UPI;
    } catch (_) {
      return DEFAULT_UPI;
    }
  }

  function setUpiId(id) {
    try {
      localStorage.setItem('restaurant_upi_id', (id || '').trim() || DEFAULT_UPI);
    } catch (_) {}
  }

  function buildUpiString(amount, billId) {
    const pa = encodeURIComponent(getUpiId());
    const am = parseFloat(amount);
    const tn = encodeURIComponent('Bill-' + (billId || Date.now()));
    return 'upi://pay?pa=' + pa + '&am=' + am.toFixed(2) + '&tn=' + tn;
  }

  var onCloseCallback = null;

  function showQrModal(amount, billId, onClose) {
    onCloseCallback = typeof onClose === 'function' ? onClose : null;
    const modal = document.getElementById('qr-modal');
    const container = document.getElementById('qr-container');
    const amountEl = document.getElementById('qr-amount');
    if (!modal || !container || !amountEl) return;

    container.innerHTML = '';
    const total = parseFloat(amount) || 0;
    amountEl.textContent = '₹' + total.toFixed(2);

    if (total <= 0) {
      container.textContent = 'Add items to cart first.';
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
      return;
    }

    const upiString = buildUpiString(total, billId);
    try {
      if (typeof QRCode !== 'undefined') {
        new QRCode(container, {
          text: upiString,
          width: 200,
          height: 200
        });
      } else {
        container.textContent = 'QR library not loaded.';
      }
    } catch (e) {
      container.textContent = 'Could not generate QR.';
    }

    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeQrModal() {
    if (onCloseCallback) {
      var fn = onCloseCallback;
      onCloseCallback = null;
      fn();
    }
    const modal = document.getElementById('qr-modal');
    if (modal) {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    const closeBtn = document.getElementById('btn-close-qr');
    if (closeBtn) closeBtn.addEventListener('click', closeQrModal);
    const modal = document.getElementById('qr-modal');
    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal) closeQrModal();
      });
    }
  });

  window.qrPay = {
    show: showQrModal,
    close: closeQrModal,
    getUpiId: getUpiId,
    setUpiId: setUpiId,
    buildUpiString: buildUpiString
  };
})();
