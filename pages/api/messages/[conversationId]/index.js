import { supabase } from '../../../../lib/supabase';
import { getAuthUserFromRequest } from '../../../../lib/getAuthUser';
import { sendEmail } from '../../../../lib/mailer';
import { emailTemplates } from '../../../../lib/emailTemplates';

export default async function handler(req, res) {
  const user = await getAuthUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ ok: false, error: 'Login required' });
  }

  const { conversationId } = req.query;

  // Verify user is a participant in this conversation
  const { data: conversation, error: convError } = await supabase
    .from('truck_conversations')
    .select('*')
    .eq('id', conversationId)
    .single();

  if (convError || !conversation) {
    return res.status(404).json({ ok: false, error: 'Conversation not found' });
  }

  if (conversation.participant_1 !== user.id && conversation.participant_2 !== user.id) {
    return res.status(403).json({ ok: false, error: 'Not authorized' });
  }

  const otherUserId = conversation.participant_1 === user.id 
    ? conversation.participant_2 
    : conversation.participant_1;

  // Check if blocked
  const { data: blocked } = await supabase
    .from('truck_blocked_users')
    .select('id, blocker_id')
    .or(`and(blocker_id.eq.${user.id},blocked_id.eq.${otherUserId}),and(blocker_id.eq.${otherUserId},blocked_id.eq.${user.id})`)
    .limit(1);

  const isBlocked = blocked && blocked.length > 0;
  const blockedByMe = isBlocked && blocked[0].blocker_id === user.id;

  // GET - Get messages in conversation
  if (req.method === 'GET') {
    try {
      const { data: messages, error: msgError } = await supabase
        .from('truck_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (msgError) throw msgError;

      // Get other user's profile info
      const { data: otherProfile } = await supabase
        .from('truck_profiles')
        .select('user_id, full_name, email')
        .eq('user_id', otherUserId)
        .single();

      const { data: otherSeller } = await supabase
        .from('truck_sellers')
        .select('user_id, name, profile_picture_url')
        .eq('user_id', otherUserId)
        .single();

      // Get truck info if applicable
      let truckInfo = null;
      if (conversation.truck_id) {
        const { data: truck } = await supabase
          .from('truck_trucks')
          .select('id, make, model, year, photos, price')
          .eq('id', conversation.truck_id)
          .single();
        if (truck) {
          truckInfo = {
            id: truck.id,
            title: `${truck.year} ${truck.make} ${truck.model}`,
            photo: truck.photos?.[0] || null,
            price: truck.price
          };
        }
      }

      const formattedMessages = (messages || []).map(m => ({
        id: m.id,
        content: m.content,
        senderId: m.sender_id,
        isFromMe: m.sender_id === user.id,
        isRead: m.is_read,
        createdAt: m.created_at
      }));

      return res.status(200).json({
        ok: true,
        conversation: {
          id: conversation.id,
          truck: truckInfo,
          otherUser: {
            id: otherUserId,
            name: otherSeller?.name || otherProfile?.full_name || 'User',
            profilePicture: otherSeller?.profile_picture_url || null
          },
          isBlocked,
          blockedByMe,
          createdAt: conversation.created_at
        },
        messages: formattedMessages
      });
    } catch (err) {
      console.error('Error fetching messages:', err);
      return res.status(500).json({ ok: false, error: 'Failed to fetch messages' });
    }
  }

  // POST - Send a new message
  if (req.method === 'POST') {
    if (isBlocked) {
      return res.status(403).json({ ok: false, error: 'Cannot message this user' });
    }

    const { message } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ ok: false, error: 'Message is required' });
    }

    try {
      // Create the message
      const { data: msg, error: msgError } = await supabase
        .from('truck_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: message.trim()
        })
        .select()
        .single();

      if (msgError) throw msgError;

      // Update last_message_at
      await supabase
        .from('truck_conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      // Check recipient's email notification preference
      const { data: recipientSeller } = await supabase
        .from('truck_sellers')
        .select('message_email_pref')
        .eq('user_id', otherUserId)
        .single();

      const emailPref = recipientSeller?.message_email_pref || 'each';

      // Only send email if preference is 'each' (daily digest handled separately)
      if (emailPref === 'each') {
        const { data: recipientProfile } = await supabase
          .from('truck_profiles')
          .select('email, full_name')
          .eq('user_id', otherUserId)
          .single();

        if (recipientProfile?.email) {
          let truckInfo = null;
          if (conversation.truck_id) {
            const { data: truck } = await supabase
              .from('truck_trucks')
              .select('make, model, year')
              .eq('id', conversation.truck_id)
              .single();
            if (truck) {
              truckInfo = `${truck.year} ${truck.make} ${truck.model}`;
            }
          }

          await sendEmail(recipientProfile.email, emailTemplates.newMessage({
            recipientName: recipientProfile.full_name || 'there',
            senderName: user.name || 'Someone',
            messagePreview: message.trim().slice(0, 100) + (message.length > 100 ? '...' : ''),
            truckInfo,
            conversationUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/messages/${conversationId}`
          }));
        }
      }

      return res.status(200).json({
        ok: true,
        message: {
          id: msg.id,
          content: msg.content,
          senderId: msg.sender_id,
          isFromMe: true,
          isRead: false,
          createdAt: msg.created_at
        }
      });
    } catch (err) {
      console.error('Error sending message:', err);
      return res.status(500).json({ ok: false, error: 'Failed to send message' });
    }
  }

  return res.status(405).json({ ok: false, error: 'Method not allowed' });
}
