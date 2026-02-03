/**
 * One-time setup: Creates Stripe Products and Recurring Prices for seller plans.
 * Run: node scripts/create-stripe-products.js
 * Requires: STRIPE_SECRET_KEY in .env.local
 */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
for (const f of ['.env.local', '.env']) {
  const p = path.join(root, f);
  if (fs.existsSync(p)) {
    fs.readFileSync(p, 'utf8').split(/\r?\n/).forEach((line) => {
      const trimmed = line.replace(/\s*#.*$/, '').trim();
      const m = trimmed.match(/^([^=]+)=(.*)$/);
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
    });
    break;
  }
}
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

const PLANS = [
  { id: 'pro', name: 'Pro Seller Plan', price: 1999, listings: 3 },
  { id: 'pro_plus', name: 'Pro+ Seller Plan', price: 3999, listings: 6 },
  { id: 'dealer', name: 'Dealer Seller Plan', price: 9999, listings: 25 },
];

async function main() {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY not found. Add it to .env.local');
    process.exit(1);
  }

  console.log('Creating Stripe Products and Recurring Prices...\n');

  const envLines = [];

  for (const plan of PLANS) {
    const product = await stripe.products.create({
      name: plan.name,
      description: `Up to ${plan.listings} active listings, 15 photos per truck, ${plan.name.replace(' Plan', '')} badge. Billed monthly.`,
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.price,
      currency: 'usd',
      recurring: { interval: 'month' },
    });

    const envVar = `STRIPE_PRICE_${plan.id.toUpperCase().replace('_PLUS', '_PLUS')}`;
    const envKey = plan.id === 'pro_plus' ? 'STRIPE_PRICE_PRO_PLUS' : `STRIPE_PRICE_${plan.id.toUpperCase()}`;
    envLines.push(`${envKey}=${price.id}`);

    console.log(`${plan.name}: ${price.id} ($${(plan.price / 100).toFixed(2)}/month)`);
  }

  console.log('\n--- Add these to .env.local and Vercel ---\n');
  envLines.forEach((line) => console.log(line));
  console.log('\nThen run the schema migration to add stripe_subscription_id to truck_seller_plans:');
  console.log('  ALTER TABLE truck_seller_plans ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;');
  console.log('\nCreate a Stripe Webhook (dashboard.stripe.com/webhooks):');
  console.log('  Endpoint: https://yoursite.com/api/stripe/webhook');
  console.log('  Events: checkout.session.completed, invoice.paid');
  console.log('  Add STRIPE_WEBHOOK_SECRET to .env.local');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
