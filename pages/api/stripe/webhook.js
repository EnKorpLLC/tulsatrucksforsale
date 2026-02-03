import Stripe from 'stripe';
import { supabase } from '../../../lib/supabase';
import { emailTemplates, sendEmail } from '../../../lib/emailTemplates';
import { PLAN_LABELS } from '../../../lib/sellerPlan';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

export const config = { api: { bodyParser: false } };

function buffer(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret || !sig) {
    return res.status(400).json({ error: 'Missing webhook secret or signature' });
  }

  let event;
  try {
    const body = await buffer(req);
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.mode !== 'subscription' || !session.subscription) break;

        const sellerId = session.metadata?.sellerId;
        const planType = session.metadata?.planType || 'pro';
        if (!sellerId) break;

        const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
        const { data: existingPayment } = await supabase
          .from('truck_payments')
          .select('id')
          .eq('stripe_session_id', session.id)
          .limit(1)
          .single();

        if (existingPayment) break;

        const now = new Date();
        const planExpires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const amount = session.amount_total ? session.amount_total / 100 : 19.99;

        const { data: existing } = await supabase
          .from('truck_seller_plans')
          .select('id')
          .eq('seller_id', sellerId)
          .single();

        const planPayload = {
          plan_type: planType,
          plan_expires: planExpires.toISOString(),
          updated_at: now.toISOString(),
          stripe_subscription_id: subscriptionId,
        };

        if (existing) {
          await supabase.from('truck_seller_plans').update(planPayload).eq('seller_id', sellerId);
        } else {
          await supabase.from('truck_seller_plans').insert({ seller_id: sellerId, ...planPayload });
        }

        await supabase.from('truck_payments').insert({
          payment_type: 'seller_plan',
          amount,
          stripe_session_id: session.id,
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
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object;
        if (invoice.billing_reason !== 'subscription_cycle') break;

        const subscriptionId = invoice.subscription;
        if (!subscriptionId) break;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const sellerId = subscription.metadata?.sellerId;
        const planType = subscription.metadata?.planType || 'pro';
        if (!sellerId) break;

        const { data: plan } = await supabase
          .from('truck_seller_plans')
          .select('plan_expires')
          .eq('stripe_subscription_id', subscriptionId)
          .single();

        if (!plan) break;

        const currentExpires = plan.plan_expires ? new Date(plan.plan_expires) : new Date();
        const baseDate = currentExpires > new Date() ? currentExpires : new Date();
        const newExpires = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);

        await supabase
          .from('truck_seller_plans')
          .update({
            plan_expires: newExpires.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscriptionId);

        const amount = invoice.amount_paid ? invoice.amount_paid / 100 : 19.99;
        await supabase.from('truck_payments').insert({
          payment_type: 'seller_plan',
          amount,
          stripe_session_id: null,
          seller_id: sellerId,
          metadata: { plan_type: planType, plan_expires: newExpires.toISOString(), stripe_subscription_id: subscriptionId, renewal: true },
        });

        const { data: seller } = await supabase.from('truck_sellers').select('name, email').eq('id', sellerId).single();
        if (seller?.email) {
          await sendEmail(
            seller.email,
            emailTemplates.sellerUpgraded({
              sellerName: seller.name,
              planLabel: PLAN_LABELS[planType] || planType,
              expiresAt: newExpires.toLocaleDateString(),
            })
          );
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }

  return res.status(200).json({ received: true });
}
