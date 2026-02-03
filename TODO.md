# Tulsa Trucks – Remaining Tasks

## 1. Vercel Deployment (do this first)
*Webhook needs a public URL—deploy before finishing Stripe webhook setup.*

- [ ] Push code to GitHub (if not already)
- [ ] Go to [vercel.com](https://vercel.com) → New Project → Import your repo
- [ ] Add environment variables (match your `.env.local`):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `RESEND_API_KEY`
  - `RESEND_FROM`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_PRICE_PRO`, `STRIPE_PRICE_PRO_PLUS`, `STRIPE_PRICE_DEALER`
  - `STRIPE_WEBHOOK_SECRET` (add after webhook is created in step 2)
  - `NEXT_PUBLIC_BASE_URL` (your Vercel URL, e.g. `https://tulsatrucksforsale.vercel.app`)
  - `SKIP_EMAIL_VERIFICATION` (set to `false` for production)
- [ ] Deploy
- [ ] Optional: Add custom domain (tulsatrucksforsale.com) in Vercel project settings

## 2. Finish Stripe Webhook (after Vercel is live)
- [ ] Create Webhook in [dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks):
  - Endpoint: `https://YOUR-VERCEL-URL.vercel.app/api/stripe/webhook`
  - Events: `checkout.session.completed`, `invoice.paid`
- [ ] Copy the webhook signing secret → add `STRIPE_WEBHOOK_SECRET=whsec_xxx` to Vercel env vars and `.env.local`

## Legal & Accessibility
- [x] Terms & Conditions page (`/terms`)
- [x] Privacy Policy page (`/privacy`)
- [x] Accessibility – Skip link, focus styles, ARIA labels, form labels (WCAG 2.1 basics)

## Done
- [x] Resend – Domain verified, sending from team@tulsatrucksforsale.com
- [x] Schema – Run in Supabase
- [x] Stripe – API key, Products/Prices created, Price IDs in `.env.local`
- [x] Stripe – `stripe_subscription_id` column added to `truck_seller_plans`
