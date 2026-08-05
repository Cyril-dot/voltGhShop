// ===== EXPRESS PAY INTEGRATION =====
const ExpressPayService = {

  getApiKey: () => {
    return window.EXPRESS_PAY_API_KEY || 'z009d07bz1exdbBHZUKh7-ut91xUQJuobm9zgLRyWp-8v0mMSbAWF5oJilycJNu-pGlutTFz8HsTjhA7nNt';
  },

  // Initialize Express Pay checkout — correct Express Pay Ghana endpoint
  async initiate(orderData) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('Express Pay API key not configured.');
    }

    try {
      // Generate unique reference
      const reference = `VGH-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      // Express Pay Ghana correct payload format
      const payload = {
        'merchant-id':  apiKey,
        'currency':     'GHS',
        'amount':       orderData.total.toFixed(2),
        'order-id':     orderData.orderId,
        'order-desc':   `VoltGH Order ${orderData.orderId}`,
        'redirect-url': `${window.location.origin}${window.location.pathname}?success=true&reference=${reference}`,
        'post-url':     `${window.location.origin}/verify-payment`,
        'firstname':    orderData.customer.name.split(' ')[0],
        'lastname':     orderData.customer.name.split(' ').slice(1).join(' ') || 'Customer',
        'phone':        orderData.customer.phone,
        'email':        orderData.customer.email || 'noreply@voltgh.com'
      };

      // Correct Express Pay Ghana API endpoint
      const response = await fetch('https://expresspaygh.com/api/submit.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Express Pay error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Express Pay Ghana returns { status: 1, token: '...' } on success
      if (!data || data.status !== 1) {
        throw new Error(data?.message || 'Failed to initialize Express Pay payment.');
      }

      // Build the checkout URL using the token
      const checkoutUrl = `https://expresspaygh.com/api/checkout.php?token=${data.token}`;

      return {
        success:      true,
        checkoutUrl:  checkoutUrl,
        reference:    reference,
        token:        data.token,
        orderId:      orderData.orderId
      };

    } catch (error) {
      console.error('Express Pay initialization error:', error);
      throw error;
    }
  },

  // Verify payment after redirect callback
  async verifyPayment(token) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('Express Pay API key not configured.');
    }

    try {
      const response = await fetch('https://expresspaygh.com/api/query.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey
        },
        body: JSON.stringify({
          'merchant-id': apiKey,
          'token':       token
        })
      });

      if (!response.ok) {
        throw new Error(`Verification error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
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
