import { supabase } from '../../../lib/supabase';
import { getAuthUserFromRequest } from '../../../lib/getAuthUser';

export default async function handler(req, res) {
  const user = await getAuthUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    // Try to find seller by user_id first, then by email
    let { data: seller } = await supabase
      .from('truck_sellers')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!seller) {
      // Fallback: find by email (for migrating existing sellers)
      const { data: byEmail } = await supabase
        .from('truck_sellers')
        .select('*')
        .eq('email', user.email)
        .is('user_id', null)
        .single();

      seller = byEmail;
    }

    return res.json({ ok: true, seller: seller || null });
  }

  if (req.method === 'POST') {
    const { name, phone, company, profile_picture_url, seller_type, city, state, hide_email, hide_phone } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!phone?.trim()) {
      return res.status(400).json({ error: 'Phone number is required' });
    }
    if (!seller_type || !['private', 'dealer'].includes(seller_type)) {
      return res.status(400).json({ error: 'Please select whether you are a private seller or a dealer' });
    }

    // Check if user already has a seller profile
    let { data: existing } = await supabase
      .from('truck_sellers')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!existing) {
      // Check for existing seller with same email but no user_id (migration case)
      const { data: byEmail } = await supabase
        .from('truck_sellers')
        .select('*')
        .eq('email', user.email)
        .is('user_id', null)
        .single();

      if (byEmail) {
        // Link existing seller to this user
        const { data, error } = await supabase
          .from('truck_sellers')
          .update({
            user_id: user.id,
            name: name.trim(),
            phone: phone.trim(),
            company: company?.trim() || null,
            profile_picture_url: profile_picture_url || null,
            seller_type: seller_type,
            city: city?.trim() || null,
            state: state?.trim() || null,
            hide_email: hide_email || false,
            hide_phone: hide_phone || false,
          })
          .eq('id', byEmail.id)
          .select()
          .single();

        if (error) {
          return res.status(500).json({ error: error.message });
        }

        // Also update the user's profile name if provided
        await supabase
          .from('truck_profiles')
          .update({ full_name: name.trim() })
          .eq('user_id', user.id);

        return res.json({ ok: true, seller: data });
      }

      // Create new seller profile
      const { data, error } = await supabase
        .from('truck_sellers')
        .insert({
          user_id: user.id,
          email: user.email,
          name: name.trim(),
          phone: phone.trim(),
          company: company?.trim() || null,
          seller_type: seller_type,
          city: city?.trim() || null,
          state: state?.trim() || null,
          hide_email: hide_email || false,
          hide_phone: hide_phone || false,
        })
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      // Also update the user's profile name if provided
      await supabase
        .from('truck_profiles')
        .update({ full_name: name.trim() })
        .eq('user_id', user.id);

      return res.json({ ok: true, seller: data });
    }

    // Update existing seller profile
    const updateData = {
      name: name.trim(),
      phone: phone.trim(),
      company: company?.trim() || null,
      seller_type: seller_type,
      city: city?.trim() || null,
      state: state?.trim() || null,
      hide_email: hide_email || false,
      hide_phone: hide_phone || false,
    };
    if (profile_picture_url !== undefined) {
      updateData.profile_picture_url = profile_picture_url || null;
    }
    const { data, error } = await supabase
      .from('truck_sellers')
      .update(updateData)
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Also update the user's profile name if provided
    await supabase
      .from('truck_profiles')
      .update({ full_name: name.trim() })
      .eq('user_id', user.id);

    return res.json({ ok: true, seller: data });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Method not allowed' });
}
