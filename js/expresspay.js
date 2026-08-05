// ===== EXPRESS PAY INTEGRATION (CLIENT) =====
// All calls go through our own backend (/api/payment).
// The merchant-id and api-key never touch the browser.

const ExpressPayService = {

  // Initialize Express Pay checkout via our backend
  async initiate(orderData) {
    try {
      const response = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action:   'create',
          orderId:  orderData.orderId,
          total:    orderData.total,
          customer: orderData.customer
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data?.message || 'Failed to initialize Express Pay payment.');
      }

      return {
        success:     true,
        checkoutUrl: data.checkoutUrl,
        reference:   data.reference,
        token:       data.token,
        orderId:     data.orderId
      };

    } catch (error) {
      console.error('Express Pay initialization error:', error);
      throw error;
    }
  },

  // Verify payment after redirect callback via our backend
  async verifyPayment(token) {
    try {
      const response = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', token })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || `Verification error: ${response.status}`);
      }

      return data;

    } catch (error) {
      console.error('Payment verification error:', error);
      throw error;
    }
  }
};

// ===== PAYMENT HELPER FUNCTIONS =====
async function initiateExpressPayPayment(order) {
  try {
    showToast('Initializing Express Pay...', 'info');

    const result = await ExpressPayService.initiate({
      orderId:  order.id,
      total:    order.total,
      customer: order.customer,
      items:    order.items
    });

    if (result.success) {
      order.paymentReference = result.reference;
      order.paymentToken     = result.token;
      StorageService.updateOrder(order.id, {
        paymentReference: result.reference,
        paymentToken:     result.token
      });

      // Redirect to Express Pay checkout
      window.location.href = result.checkoutUrl;
    } else {
      showToast('Failed to initialize payment.', 'error');
    }

  } catch (error) {
    console.error('Payment initiation error:', error);
    showToast(`Payment error: ${error.message}`, 'error');
  }
}

async function handlePaymentCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const token     = urlParams.get('token');
  const reference = urlParams.get('reference');
  const success   = urlParams.get('success');

  // Only run if we're back from an Express Pay redirect
  if (!success || success !== 'true') return;

  try {
    // Use token if available (Express Pay Ghana returns token on redirect)
    if (token) {
      showToast('Verifying payment...', 'info');

      const verification = await ExpressPayService.verifyPayment(token);

      // Express Pay Ghana returns status 1 for successful payment
      if (verification && verification.status === 1) {
        const orders = StorageService.getOrders();
        const order  = orders.find(o =>
          o.paymentToken === token || o.paymentReference === reference
        );

        if (order) {
          StorageService.updateOrder(order.id, { status: 'paid' });
          showToast('Payment verified! Order confirmed. ✅', 'success');
          // Clean URL then redirect to tracking
          history.replaceState({}, document.title, window.location.pathname);
          setTimeout(() => App.navigate('tracking'), 1500);
        } else {
          showToast('Order found but could not be matched. Contact support.', 'warning');
        }
      } else {
        showToast('Payment could not be verified. Please contact support.', 'error');
      }

    } else if (reference) {
      // Fallback: try matching by reference alone without API call
      const orders = StorageService.getOrders();
      const order  = orders.find(o => o.paymentReference === reference);
      if (order) {
        StorageService.updateOrder(order.id, { status: 'paid' });
        showToast('Payment received! Order confirmed. ✅', 'success');
        history.replaceState({}, document.title, window.location.pathname);
        setTimeout(() => App.navigate('tracking'), 1500);
      }
    }

  } catch (error) {
    console.error('Verification error:', error);
    showToast('Could not verify payment. Please contact support.', 'error');
  }
}
