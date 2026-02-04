import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

const PLAN_CONFIG = {
  pro: { price: 19.99, listings: 3, label: 'Pro', priceId: process.env.STRIPE_PRICE_PRO },
  pro_plus: { price: 39.99, listings: 6, label: 'Pro+', priceId: process.env.STRIPE_PRICE_PRO_PLUS },
  dealer: { price: 99.99, listings: 25, label: 'Dealer', priceId: process.env.STRIPE_PRICE_DEALER },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { sellerId, planType } = req.body || {};
  if (!sellerId || !process.env.STRIPE_SECRET_KEY) {
    return res.status(400).json({ error: 'Missing sellerId or Stripe not configured' });
  }

  const config = PLAN_CONFIG[planType] || PLAN_CONFIG.pro;
  const priceId = config.priceId;

  if (!priceId) {
    return res.status(500).json({
      error: `Stripe Price ID not configured for ${planType || 'pro'}. Add STRIPE_PRICE_PRO, STRIPE_PRICE_PRO_PLUS, STRIPE_PRICE_DEALER to .env. Run: node scripts/create-stripe-products.js`,
    });
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      allow_promotion_codes: true,
      success_url: `${baseUrl}/upgrade-seller/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/upgrade-seller/${sellerId}`,
      metadata: { sellerId, planType: planType || 'pro' },
      subscription_data: {
        metadata: { sellerId, planType: planType || 'pro' },
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
