import { supabase } from '../../../../lib/supabase';
import { getAuthUserFromRequest } from '../../../../lib/getAuthUser';

export default async function handler(req, res) {
  if (req.method !== 'PATCH' && req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const user = await getAuthUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ ok: false, error: 'Login required' });
  }

  const { conversationId } = req.query;

  // Verify user is a participant in this conversation
  const { data: conversation, error: convError } = await supabase
    .from('truck_conversations')
    .select('participant_1, participant_2')
    .eq('id', conversationId)
    .single();

  if (convError || !conversation) {
    return res.status(404).json({ ok: false, error: 'Conversation not found' });
  }

  if (conversation.participant_1 !== user.id && conversation.participant_2 !== user.id) {
    return res.status(403).json({ ok: false, error: 'Not authorized' });
  }

  try {
    // Mark all messages from the OTHER user as read
    const { error: updateError } = await supabase
      .from('truck_messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', user.id)
      .eq('is_read', false);

    if (updateError) throw updateError;

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Error marking messages as read:', err);
    return res.status(500).json({ ok: false, error: 'Failed to mark messages as read' });
  }
}
