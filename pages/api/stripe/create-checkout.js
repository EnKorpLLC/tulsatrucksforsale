import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { truckId } = req.body || {};
  if (!truckId || !process.env.STRIPE_SECRET_KEY) {
    return res.status(400).json({ error: 'Missing truckId or Stripe not configured' });
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      allow_promotion_codes: true,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Featured Listing - 7 Days',
              description: 'Get your truck seen first on homepage and listings for 7 days',
              images: ['https://via.placeholder.com/300x200?text=Featured+Listing'],
            },
            unit_amount: 2900,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/boost-listing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/boost-listing/${truckId}`,
      metadata: { truckId },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
