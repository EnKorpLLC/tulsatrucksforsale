import Stripe from 'stripe';
import { supabase } from '../../../lib/supabase';
import { emailTemplates, sendEmail } from '../../../lib/emailTemplates';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

export default async function handler(req, res) {
  const { session_id } = req.query || {};
  if (!session_id || !process.env.STRIPE_SECRET_KEY) {
    return res.status(400).json({ ok: false });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status !== 'paid') {
      return res.status(200).json({ ok: false });
    }

    const truckId = session.metadata?.truckId;
    if (!truckId) return res.status(200).json({ ok: false });

    const now = new Date();
    const featuredUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const { data: truck } = await supabase
      .from('truck_trucks')
      .update({
        is_featured: true,
        featured_until: featuredUntil.toISOString(),
      })
      .eq('id', truckId)
      .select('*, seller:truck_sellers(name, email)')
      .single();

    // Track revenue
    await supabase.from('truck_payments').insert({
      payment_type: 'boost',
      amount: 29,
      stripe_session_id: session_id,
      truck_id: truckId,
      seller_id: truck?.seller_id || null,
      metadata: { featured_until: featuredUntil.toISOString() },
    });

    if (truck?.seller?.email) {
      await sendEmail(
        truck.seller.email,
        emailTemplates.truckBoosted({
          sellerName: truck.seller.name,
          truckName: `${truck.year} ${truck.make} ${truck.model}`,
          expiresAt: featuredUntil.toLocaleDateString(),
        })
      );
    }

    return res.status(200).json({ ok: true, truckId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false });
  }
}
