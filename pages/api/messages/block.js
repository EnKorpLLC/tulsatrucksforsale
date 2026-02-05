import { supabase } from '../../../lib/supabase';
import { getAuthUserFromRequest } from '../../../lib/getAuthUser';

export default async function handler(req, res) {
  const user = await getAuthUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ ok: false, error: 'Login required' });
  }

  // POST - Block a user
  if (req.method === 'POST') {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ ok: false, error: 'User ID is required' });
    }

    if (userId === user.id) {
      return res.status(400).json({ ok: false, error: 'Cannot block yourself' });
    }

    try {
      // Check if already blocked
      const { data: existing } = await supabase
        .from('truck_blocked_users')
        .select('id')
        .eq('blocker_id', user.id)
        .eq('blocked_id', userId)
        .single();

      if (existing) {
        return res.status(200).json({ ok: true, message: 'User already blocked' });
      }

      // Create block record
      const { error } = await supabase
        .from('truck_blocked_users')
        .insert({
          blocker_id: user.id,
          blocked_id: userId
        });

      if (error) throw error;

      return res.status(200).json({ ok: true, message: 'User blocked successfully' });
    } catch (err) {
      console.error('Error blocking user:', err);
      return res.status(500).json({ ok: false, error: 'Failed to block user' });
    }
  }

  // DELETE - Unblock a user
  if (req.method === 'DELETE') {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ ok: false, error: 'User ID is required' });
    }

    try {
      const { error } = await supabase
        .from('truck_blocked_users')
        .delete()
        .eq('blocker_id', user.id)
        .eq('blocked_id', userId);

      if (error) throw error;

      return res.status(200).json({ ok: true, message: 'User unblocked successfully' });
    } catch (err) {
      console.error('Error unblocking user:', err);
      return res.status(500).json({ ok: false, error: 'Failed to unblock user' });
    }
  }

  // GET - List blocked users
  if (req.method === 'GET') {
    try {
      const { data: blocked, error } = await supabase
        .from('truck_blocked_users')
        .select('blocked_id, created_at')
        .eq('blocker_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user info for blocked users
      const blockedIds = (blocked || []).map(b => b.blocked_id);
      
      const { data: profiles } = blockedIds.length > 0
        ? await supabase.from('truck_profiles').select('user_id, full_name').in('user_id', blockedIds)
        : { data: [] };

      const { data: sellers } = blockedIds.length > 0
        ? await supabase.from('truck_sellers').select('user_id, name').in('user_id', blockedIds)
        : { data: [] };

      const profileMap = (profiles || []).reduce((acc, p) => { acc[p.user_id] = p; return acc; }, {});
      const sellerMap = (sellers || []).reduce((acc, s) => { acc[s.user_id] = s; return acc; }, {});

      const blockedUsers = (blocked || []).map(b => ({
        userId: b.blocked_id,
        name: sellerMap[b.blocked_id]?.name || profileMap[b.blocked_id]?.full_name || 'User',
        blockedAt: b.created_at
      }));

      return res.status(200).json({ ok: true, blockedUsers });
    } catch (err) {
      console.error('Error fetching blocked users:', err);
      return res.status(500).json({ ok: false, error: 'Failed to fetch blocked users' });
    }
  }

  return res.status(405).json({ ok: false, error: 'Method not allowed' });
}
