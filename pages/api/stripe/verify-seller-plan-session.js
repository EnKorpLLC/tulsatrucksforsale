import Stripe from 'stripe';
import { supabase } from '../../../lib/supabase';
import { emailTemplates, sendEmail } from '../../../lib/emailTemplates';
import { PLAN_LABELS } from '../../../lib/sellerPlan';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

const PLAN_AMOUNTS = { pro: 19.99, pro_plus: 39.99, dealer: 99.99 };

export default async function handler(req, res) {
  const { session_id } = req.query || {};
  if (!session_id || !process.env.STRIPE_SECRET_KEY) {
    return res.status(400).json({ ok: false });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['subscription'],
    });
    if (session.payment_status !== 'paid') {
      return res.status(200).json({ ok: false });
    }

    const sellerId = session.metadata?.sellerId;
    const planType = session.metadata?.planType || 'pro';
    if (!sellerId) return res.status(200).json({ ok: false });

    const amount = session.amount_total ? session.amount_total / 100 : PLAN_AMOUNTS[planType] || 19.99;
    const subscriptionId = session.subscription?.id || (typeof session.subscription === 'string' ? session.subscription : null);

    const now = new Date();
    const planExpires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const { data: existingPayment } = await supabase
      .from('truck_payments')
      .select('id')
      .eq('stripe_session_id', session_id)
      .limit(1)
      .single();

    if (existingPayment) {
      return res.status(200).json({ ok: true, sellerId });
    }

    const { data: existing } = await supabase
      .from('truck_seller_plans')
      .select('id')
      .eq('seller_id', sellerId)
      .single();

    const planPayload = {
      plan_type: planType,
      plan_expires: planExpires.toISOString(),
      updated_at: now.toISOString(),
    };
    if (subscriptionId) planPayload.stripe_subscription_id = subscriptionId;

    if (existing) {
      await supabase
        .from('truck_seller_plans')
        .update(planPayload)
        .eq('seller_id', sellerId);
    } else {
      await supabase.from('truck_seller_plans').insert({
        seller_id: sellerId,
        ...planPayload,
      });
    }

    await supabase.from('truck_payments').insert({
      payment_type: 'seller_plan',
      amount,
      stripe_session_id: session_id,
      seller_id: sellerId,
      metadata: { plan_type: planType, plan_expires: planExpires.toISOString(), stripe_subscription_id: subscriptionId },
    });

    const { data: seller } = await supabase.from('truck_sellers').select('name, email').eq('id', sellerId).single();
    if (seller?.email) {
      await sendEmail(
        seller.email,
        emailTemplates.sellerUpgraded({
          sellerName: seller.name,
          planLabel: PLAN_LABELS[planType] || planType,
          expiresAt: planExpires.toLocaleDateString(),
        })
      );
    }

    return res.status(200).json({ ok: true, sellerId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false });
  }
}
