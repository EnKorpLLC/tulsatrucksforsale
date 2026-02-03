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

    const { title, image_url, link_url, placement } = session.metadata || {};
    if (!title || !image_url || !placement) {
      return res.status(200).json({ ok: false });
    }

    const now = new Date();
    const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const { data: newAd } = await supabase.from('truck_ads').insert({
      title,
      image_url,
      link_url: link_url || null,
      placement,
      start_date: now.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      is_active: false,
    }).select().single();

    // Track revenue
    await supabase.from('truck_payments').insert({
      payment_type: 'ad',
      amount: 99,
      stripe_session_id: session_id,
      ad_id: newAd?.id || null,
      metadata: { placement, end_date: endDate.toISOString() },
    });

    const buyerEmail = session.customer_details?.email;
    if (buyerEmail) {
      await sendEmail(buyerEmail, emailTemplates.adPurchased({ buyerEmail, placement }));
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false });
  }
}
