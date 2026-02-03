import { supabase } from '../../../../lib/supabase';
import { getAuthUserFromRequest } from '../../../../lib/getAuthUser';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await getAuthUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'You must be logged in to leave a review' });
  }

  const { seller_id, rating, comment } = req.body;

  if (!seller_id || !rating) {
    return res.status(400).json({ error: 'seller_id and rating are required' });
  }
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  const { data, error } = await supabase
    .from('truck_seller_reviews')
    .insert({
      seller_id,
      reviewer_user_id: user.id,
      reviewer_name: user.name || 'Buyer',
      rating: parseInt(rating),
      comment: comment?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.json({ ok: true, review: data });
}
