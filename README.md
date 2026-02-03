# Tulsa Trucks For Sale

Truck marketplace website built with Next.js, Tailwind CSS, Supabase, and Gmail SMTP.

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Run Supabase schema** (for shared database with home services site)
   - Open [Supabase SQL Editor](https://supabase.com/dashboard/project/wnzrqmahsthqkhgnrcop/sql)
   - Copy and run the contents of `supabase-truck-tables.sql` (uses `truck_` prefix for shared DB)
   - For Featured Listings, run `supabase-featured-migration.sql`
   - For Pro Seller plans, run `supabase-seller-plans-migration.sql`

3. **Configure environment**
   - `.env.local` is pre-configured with Supabase URL and anon key
   - For Gmail SMTP notifications, add to `.env.local`:
     ```
     GMAIL_USER=your@gmail.com
     GMAIL_APP_PASSWORD=your-app-password
     ```
   - Get Gmail App Password: Google Account → Security → 2-Step Verification → App passwords
   - For Featured Listings (Stripe), add to `.env.local`:
     ```
     STRIPE_SECRET_KEY=sk_test_...
     NEXT_PUBLIC_BASE_URL=https://yoursite.com
     ```

4. **Run the app**
   ```bash
   npm run dev
   ```

## Admin Login

- URL: `/admin` or `/admin/login`
- Email: `team@enkorpllc.com`
- Password: `Qwas!@90`

On first login with these credentials, the master admin is created in the database.

## Features

- **Homepage** – Featured trucks
- **Listings** (`/listings`) – All trucks with filters (make, year, price, status)
- **Truck detail** (`/trucks/[id]`) – Full details + financing inquiry + Boost listing ($29/7 days)
- **Seller dashboard** (`/seller/dashboard`) – Add/edit trucks, manage inventory, mark sold
- **Financing form** – Saves to Supabase, emails admin via Gmail SMTP
- **Admin dashboard** (`/admin`) – Manage trucks, featured listings, sellers, financing requests, ads, notes, automation rules

## Photo uploads

Sellers add truck photos by pasting image URLs (one per line) in the add/edit truck form. Use any image hosting (Imgur, Cloudinary, etc.) or your own server.
