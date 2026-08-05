// ===== EXPRESS PAY INTEGRATION (BACKEND) =====
// Vercel serverless function: POST /api/payment
//
// Handles both steps of the flow via an `action` field in the body:
//   { action: 'create', orderId, total, customer }  -> initiates payment
//   { action: 'verify', token }                      -> checks payment status
//
// Express Pay's own post-url webhook can also hit this endpoint directly
// with { action: 'verify', token } in its payload.
//
// Required environment variables (set in Vercel Project Settings):
//   EXPRESS_PAY_MERCHANT_ID
//   EXPRESS_PAY_API_KEY
//   EXPRESS_PAY_ENV        ('sandbox' or 'production', defaults to 'production')

const EXPRESS_PAY_BASE = {
  sandbox:    'https://sandbox.expresspaygh.com',
  production: 'https://expresspaygh.com'
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const MERCHANT_ID = process.env.EXPRESS_PAY_MERCHANT_ID;
  const API_KEY      = process.env.EXPRESS_PAY_API_KEY;
  const ENV           = process.env.EXPRESS_PAY_ENV === 'sandbox' ? 'sandbox' : 'production';
  const BASE_URL      = EXPRESS_PAY_BASE[ENV];

  if (!MERCHANT_ID || !API_KEY) {
    return res.status(500).json({ success: false, message: 'Express Pay credentials not configured.' });
  }

  const { action } = req.body || {};

  if (action === 'create') {
    return createPayment(req, res, { MERCHANT_ID, API_KEY, BASE_URL });
  }

  if (action === 'verify') {
    return verifyPayment(req, res, { MERCHANT_ID, API_KEY, BASE_URL });
  }

  return res.status(400).json({ success: false, message: 'Unknown or missing action.' });
}

async function createPayment(req, res, { MERCHANT_ID, API_KEY, BASE_URL }) {
  try {
    const { orderId, total, customer } = req.body || {};

    if (!orderId || !total || !customer?.name || !customer?.phone) {
      return res.status(400).json({ success: false, message: 'Missing required order fields.' });
    }

    const reference = `VGH-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const origin = `https://${req.headers.host}`;

    const nameParts = customer.name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName  = nameParts.slice(1).join(' ') || 'Customer';

    // Express Pay's submit.php expects application/x-www-form-urlencoded,
    // with merchant-id and api-key as SEPARATE fields.
    const params = new URLSearchParams({
      'merchant-id':  MERCHANT_ID,
      'api-key':      API_KEY,
      'currency':     'GHS',
      'amount':       Number(total).toFixed(2),
      'order-id':     String(orderId),
      'order-desc':   `VoltGH Order ${orderId}`,
      'redirect-url': `${origin}/?success=true&reference=${reference}`,
      'post-url':     `${origin}/api/payment`,
      'firstname':    firstName,
      'lastname':     lastName,
      'phone':        customer.phone,
      'email':        customer.email || 'noreply@voltgh.com'
    });

    const response = await fetch(`${BASE_URL}/api/submit.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    if (!response.ok) {
      return res.status(502).json({
        success: false,
        message: `Express Pay error: ${response.status} ${response.statusText}`
      });
    }

    const data = await response.json();

    // Express Pay returns { status: 1, token: '...' } on success
    if (!data || data.status !== 1) {
      return res.status(400).json({
        success: false,
        message: data?.message || 'Failed to initialize Express Pay payment.'
      });
    }

    return res.status(200).json({
      success:     true,
      checkoutUrl: `${BASE_URL}/api/checkout.php?token=${data.token}`,
      reference,
      token:       data.token,
      orderId
    });

  } catch (error) {
    console.error('Express Pay create error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

async function verifyPayment(req, res, { MERCHANT_ID, API_KEY, BASE_URL }) {
  const token = req.body?.token;

  if (!token) {
    return res.status(400).json({ success: false, message: 'Missing token.' });
  }

  try {
    const params = new URLSearchParams({
      'merchant-id': MERCHANT_ID,
      'api-key':     API_KEY,
      'token':       token
    });

    const response = await fetch(`${BASE_URL}/api/query.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    if (!response.ok) {
      return res.status(502).json({
        success: false,
        message: `Verification error: ${response.status} ${response.statusText}`
      });
    }

    const data = await response.json();

    // Pass Express Pay's response straight through — the frontend checks
    // data.status === 1 for a confirmed payment.
    return res.status(200).json(data);

  } catch (error) {
    console.error('Express Pay verify error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}
