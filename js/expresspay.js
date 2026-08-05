// ===== EXPRESS PAY INTEGRATION =====
const ExpressPayService = {
  // Get API key from environment - will be injected at runtime
  getApiKey: () => {
    // For development, fallback to env var from window or empty
    return window.EXPRESS_PAY_API_KEY || 'z009d07bz1exdbBHZUKh7-ut91xUQJuobm9zgLRyWp-8v0mMSbAWF5oJilycJNu-pGlutTFz8HsTjhA7nNt';
  },

  getPublicKey: () => {
    return window.EXPRESS_PAY_PUBLIC_KEY || '';
  },

  // Initialize Express Pay checkout
  async initiate(orderData) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('Express Pay API key not configured. Please check environment variables.');
    }

    try {
      // Create reference
      const reference = `VGH-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      // Express Pay payload
      const payload = {
        amount: Math.round(orderData.total * 100), // Convert to pesewas (cents)
        currency: 'GHS',
        description: `VoltGH Order - ${orderData.orderId}`,
        reference: reference,
        customer: {
          name: orderData.customer.name,
          email: orderData.customer.email || 'noreply@voltgh.com',
          phone: orderData.customer.phone
        },
        metadata: {
          orderId: orderData.orderId,
          items: orderData.items.length,
          city: orderData.customer.city,
          address: orderData.customer.address,
          notes: orderData.customer.notes || ''
        },
        // Callback URLs
        callbackUrl: `${window.location.origin}/verify-payment`,
        redirectUrl: `${window.location.origin}/?page=checkout&success=true`
      };

      // Make request to Express Pay API
      const response = await fetch('https://api.expresspaygh.com/api/v1/checkout/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Express Pay error: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to initialize Express Pay payment');
      }

      return {
        success: true,
        checkoutUrl: data.data.authorization_url,
        reference: reference,
        orderId: orderData.orderId
      };

    } catch (error) {
      console.error('Express Pay initialization error:', error);
      throw error;
    }
  },

  // Verify payment after callback
  async verifyPayment(reference) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('Express Pay API key not configured');
    }

    try {
      const response = await fetch(`https://api.expresspaygh.com/api/v1/transaction/verify/${reference}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Verification error: ${response.statusText}`);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Payment verification error:', error);
      throw error;
    }
  },

  // Handle payment webhook (for server-side verification)
  verifyWebhook(payload, signature) {
    // Verify webhook signature using your Express Pay secret key
    // This would typically be done server-side
    const crypto = require('crypto');
    const secretKey = window.EXPRESS_PAY_SECRET_KEY;
    
    const hash = crypto
      .createHmac('sha256', secretKey)
      .update(JSON.stringify(payload))
      .digest('hex');

    return hash === signature;
  },

  // Generate Express Pay embed code for inline payments
  generateEmbedCode(checkoutUrl) {
    return `
      <script src="https://checkout.expresspaygh.com/js/express-pay.js"></script>
      <button onclick="window.open('${checkoutUrl}', 'Express Pay Checkout', 'width=700,height=600')">
        Pay with Express Pay
      </button>
    `;
  }
};

// ===== PAYMENT HELPER FUNCTIONS =====
async function initiateExpressPayPayment(order) {
  try {
    showToast('Initializing Express Pay...', 'info');
    
    const result = await ExpressPayService.initiate({
      orderId: order.id,
      total: order.total,
      customer: order.customer,
      items: order.items
    });

    if (result.success) {
      // Store payment reference in order
      order.paymentReference = result.reference;
      StorageService.updateOrder(order.id, { paymentReference: result.reference });

      // Redirect to Express Pay
      window.location.href = result.checkoutUrl;
    } else {
      showToast('Failed to initialize payment', 'error');
    }
  } catch (error) {
    console.error('Payment initiation error:', error);
    showToast(`Payment error: ${error.message}`, 'error');
  }
}

async function handlePaymentCallback() {
  // This runs on the redirect page after payment
  const urlParams = new URLSearchParams(window.location.search);
  const reference = urlParams.get('reference');
  const success = urlParams.get('success');

  if (reference && success === 'true') {
    try {
      showToast('Verifying payment...', 'info');
      const verification = await ExpressPayService.verifyPayment(reference);

      if (verification.status === 'success') {
        // Update order status
        const orders = StorageService.getOrders();
        const order = orders.find(o => o.paymentReference === reference);
        if (order) {
          StorageService.updateOrder(order.id, { status: 'paid' });
          showToast('Payment verified! Order confirmed.', 'success');
          // Redirect to tracking
          setTimeout(() => {
            App.navigate('tracking');
          }, 1500);
        }
      }
    } catch (error) {
      console.error('Verification error:', error);
      showToast('Could not verify payment. Please contact support.', 'error');
    }
  }
}

// Initialize Express Pay on page load if needed
document.addEventListener('DOMContentLoaded', () => {
  // Check if this is a payment verification page
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('reference') || urlParams.has('success')) {
    handlePaymentCallback();
  }
});
