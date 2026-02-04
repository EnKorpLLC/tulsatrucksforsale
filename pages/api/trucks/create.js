import { supabase } from '../../../lib/supabase';
import { emailTemplates, sendEmail } from '../../../lib/emailTemplates';
import { getAuthUserWithProfile } from '../../../lib/getAuthUserWithProfile';
import { requiresEmailVerification } from '../../../lib/emailVerification';
import { getListingLimit } from '../../../lib/sellerPlan';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const auth = await getAuthUserWithProfile(req);
  if (!auth) return res.status(401).json({ error: 'You must be logged in to list a truck' });
  if (requiresEmailVerification(auth.profile)) {
    return res.status(403).json({ error: 'EMAIL_VERIFICATION_REQUIRED', message: 'Please verify your email before listing a truck.' });
  }

  try {
    const truckData = req.body;
    const { seller_id, city, state } = truckData;

    // Verify the seller belongs to the logged-in user
    if (seller_id) {
      const { data: seller, error: sellerError } = await supabase
        .from('truck_sellers')
        .select('*')
        .eq('id', seller_id)
        .single();

      if (sellerError || !seller) {
        return res.status(400).json({ error: 'Invalid seller' });
      }

      // Check if this seller belongs to the logged-in user
      if (seller.user_id && seller.user_id !== auth.id) {
        return res.status(403).json({ error: 'You can only list trucks under your own seller profile' });
      }

      // Also check by email if user_id is not set yet (migration case)
      if (!seller.user_id && seller.email?.toLowerCase() !== auth.email?.toLowerCase()) {
        return res.status(403).json({ error: 'You can only list trucks under your own seller profile' });
      }

      // Check if seller profile is complete (has phone and seller_type)
      if (!seller.phone) {
        return res.status(400).json({ error: 'PROFILE_INCOMPLETE', message: 'Please complete your seller profile before listing a truck.' });
      }
      if (!seller.seller_type || !['private', 'dealer'].includes(seller.seller_type)) {
        return res.status(400).json({ error: 'PROFILE_INCOMPLETE', message: 'Please update your profile and select whether you are a private seller or dealer.' });
      }

      // Check listing limit (only for new "available" listings)
      const status = truckData.status || 'available';
      if (status === 'available') {
        const { data: plan } = await supabase.from('truck_seller_plans').select('plan_type, plan_expires').eq('seller_id', seller_id).single();
        const limit = getListingLimit(plan);
        const { count } = await supabase.from('truck_trucks').select('*', { count: 'exact', head: true }).eq('seller_id', seller_id).eq('status', 'available');
        if (count >= limit) {
          return res.status(400).json({
            error: 'LISTING_LIMIT_REACHED',
            message: `Your plan allows ${limit} active listing${limit === 1 ? '' : 's'}. Upgrade to add more.`,
            limit,
          });
        }
      }
    } else {
      return res.status(400).json({ error: 'Seller ID is required' });
    }

    const insertData = { ...truckData };
    if (city !== undefined) insertData.city = city || null;
    if (state !== undefined) insertData.state = state || null;

    const { data: truck, error } = await supabase.from('truck_trucks').insert(insertData).select().single();
    
    if (error) return res.status(400).json({ error: error.message });

      if (truck?.seller_id) {
      const { data: seller } = await supabase.from('truck_sellers').select('*').eq('id', truck.seller_id).single();
      if (seller?.email) {
        const truckName = `${truck.year} ${truck.make} ${truck.model}`;
        await sendEmail(
          seller.email,
          emailTemplates.truckListed({
              sellerName: seller.name,
              truckName,
              truckId: truck.id,
            })
        );
      }
    }

    return res.status(200).json({ ok: true, id: truck.id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
