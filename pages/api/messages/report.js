import { supabase } from '../../../lib/supabase';
import { getAuthUserFromRequest } from '../../../lib/getAuthUser';

const VALID_REASONS = ['harassment', 'spam', 'scam', 'inappropriate', 'other'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const user = await getAuthUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ ok: false, error: 'Login required' });
  }

  const { messageId, conversationId, reportedUserId, reason, details } = req.body;

  if (!reportedUserId) {
    return res.status(400).json({ ok: false, error: 'Reported user ID is required' });
  }

  if (!reason || !VALID_REASONS.includes(reason)) {
    return res.status(400).json({ ok: false, error: 'Valid reason is required', validReasons: VALID_REASONS });
  }

  if (reportedUserId === user.id) {
    return res.status(400).json({ ok: false, error: 'Cannot report yourself' });
  }

  try {
    // Verify the conversation/message exists and user is a participant
    if (conversationId) {
      const { data: conv } = await supabase
        .from('truck_conversations')
        .select('participant_1, participant_2')
        .eq('id', conversationId)
        .single();

      if (!conv || (conv.participant_1 !== user.id && conv.participant_2 !== user.id)) {
        return res.status(403).json({ ok: false, error: 'Not authorized to report this conversation' });
      }
    }

    if (messageId) {
      const { data: msg } = await supabase
        .from('truck_messages')
        .select('id, sender_id')
        .eq('id', messageId)
        .single();

      if (!msg) {
        return res.status(404).json({ ok: false, error: 'Message not found' });
      }
    }

    // Create the report
    const { error } = await supabase
      .from('truck_message_reports')
      .insert({
        message_id: messageId || null,
        conversation_id: conversationId || null,
        reporter_id: user.id,
        reported_user_id: reportedUserId,
        reason,
        details: details?.trim() || null
      });

    if (error) throw error;

    return res.status(200).json({ ok: true, message: 'Report submitted successfully' });
  } catch (err) {
    console.error('Error creating report:', err);
    return res.status(500).json({ ok: false, error: 'Failed to submit report' });
  }
}
