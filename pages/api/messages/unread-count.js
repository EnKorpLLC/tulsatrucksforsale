import { supabase } from '../../../lib/supabase';
import { getAuthUserFromRequest } from '../../../lib/getAuthUser';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const user = await getAuthUserFromRequest(req);
  if (!user) {
    return res.status(200).json({ ok: true, count: 0 });
  }

  try {
    // Get conversations where user is a participant
    const { data: conversations } = await supabase
      .from('truck_conversations')
      .select('id')
      .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`);

    if (!conversations || conversations.length === 0) {
      return res.status(200).json({ ok: true, count: 0 });
    }

    const conversationIds = conversations.map(c => c.id);

    // Get blocked user IDs to exclude
    const { data: blockedByMe } = await supabase
      .from('truck_blocked_users')
      .select('blocked_id')
      .eq('blocker_id', user.id);
    
    const { data: blockedMe } = await supabase
      .from('truck_blocked_users')
      .select('blocker_id')
      .eq('blocked_id', user.id);

    const blockedIds = new Set([
      ...(blockedByMe || []).map(b => b.blocked_id),
      ...(blockedMe || []).map(b => b.blocker_id)
    ]);

    // Get conversations with blocked users
    const { data: convWithBlocked } = await supabase
      .from('truck_conversations')
      .select('id, participant_1, participant_2')
      .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`);

    const blockedConvIds = new Set(
      (convWithBlocked || [])
        .filter(c => {
          const otherId = c.participant_1 === user.id ? c.participant_2 : c.participant_1;
          return blockedIds.has(otherId);
        })
        .map(c => c.id)
    );

    // Count unread messages (not sent by me) in non-blocked conversations
    const validConvIds = conversationIds.filter(id => !blockedConvIds.has(id));

    if (validConvIds.length === 0) {
      return res.status(200).json({ ok: true, count: 0 });
    }

    const { count, error } = await supabase
      .from('truck_messages')
      .select('id', { count: 'exact', head: true })
      .in('conversation_id', validConvIds)
      .neq('sender_id', user.id)
      .eq('is_read', false);

    if (error) throw error;

    return res.status(200).json({ ok: true, count: count || 0 });
  } catch (err) {
    console.error('Error getting unread count:', err);
    return res.status(500).json({ ok: false, error: 'Failed to get unread count' });
  }
}
