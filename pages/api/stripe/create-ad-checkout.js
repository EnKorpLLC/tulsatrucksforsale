import Stripe from 'stripe';
import { getAuthUserWithProfile } from '../../../lib/getAuthUserWithProfile';
import { requiresEmailVerification } from '../../../lib/emailVerification';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const auth = await getAuthUserWithProfile(req);
  if (!auth) return res.status(401).json({ error: 'You must be logged in to purchase an ad' });
  if (requiresEmailVerification(auth.profile)) {
    return res.status(403).json({ error: 'EMAIL_VERIFICATION_REQUIRED', message: 'Please verify your email before purchasing an ad.' });
  }

  const { title, image_url, link_url, placement } = req.body || {};
  if (!title || !image_url || !placement || !process.env.STRIPE_SECRET_KEY) {
    return res.status(400).json({ error: 'Missing required fields or Stripe not configured' });
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
              name: 'Advertisement - 30 Days',
              description: `Ad placement: ${placement}`,
              images: [image_url],
            },
            unit_amount: 9900,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/advertise/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/advertise/buy`,
      metadata: { title, image_url, link_url: link_url || '', placement },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
