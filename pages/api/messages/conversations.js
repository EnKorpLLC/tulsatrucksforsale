import { supabase } from '../../../lib/supabase';
import { getAuthUserFromRequest } from '../../../lib/getAuthUser';
import { sendEmail } from '../../../lib/mailer';
import { emailTemplates } from '../../../lib/emailTemplates';

export default async function handler(req, res) {
  const user = await getAuthUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ ok: false, error: 'Login required' });
  }

  // GET - List all conversations for the current user
  if (req.method === 'GET') {
    try {
      // Get conversations where user is a participant
      const { data: conversations, error } = await supabase
        .from('truck_conversations')
        .select('*')
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      // Get blocked users to filter them out
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

      // Filter out blocked conversations
      const filteredConversations = (conversations || []).filter(c => {
        const otherUserId = c.participant_1 === user.id ? c.participant_2 : c.participant_1;
        return !blockedIds.has(otherUserId);
      });

      // Get other participants' profiles
      const otherUserIds = filteredConversations.map(c => 
        c.participant_1 === user.id ? c.participant_2 : c.participant_1
      );

      const { data: profiles } = otherUserIds.length > 0
        ? await supabase.from('truck_profiles').select('user_id, full_name, email').in('user_id', otherUserIds)
        : { data: [] };

      const { data: sellers } = otherUserIds.length > 0
        ? await supabase.from('truck_sellers').select('user_id, name, profile_picture_url').in('user_id', otherUserIds)
        : { data: [] };

      const profileMap = (profiles || []).reduce((acc, p) => { acc[p.user_id] = p; return acc; }, {});
      const sellerMap = (sellers || []).reduce((acc, s) => { acc[s.user_id] = s; return acc; }, {});

      // Get truck info if conversation is about a truck
      const truckIds = filteredConversations.map(c => c.truck_id).filter(Boolean);
      const { data: trucks } = truckIds.length > 0
        ? await supabase.from('truck_trucks').select('id, make, model, year, photos').in('id', truckIds)
        : { data: [] };
      const truckMap = (trucks || []).reduce((acc, t) => { acc[t.id] = t; return acc; }, {});

      // Get last message and unread count for each conversation
      const conversationIds = filteredConversations.map(c => c.id);
      const { data: lastMessages } = conversationIds.length > 0
        ? await supabase
            .from('truck_messages')
            .select('conversation_id, content, sender_id, created_at')
            .in('conversation_id', conversationIds)
            .order('created_at', { ascending: false })
        : { data: [] };

      // Group by conversation and get the latest
      const lastMessageMap = {};
      (lastMessages || []).forEach(m => {
        if (!lastMessageMap[m.conversation_id]) {
          lastMessageMap[m.conversation_id] = m;
        }
      });

      // Get unread counts
      const { data: unreadCounts } = conversationIds.length > 0
        ? await supabase
            .from('truck_messages')
            .select('conversation_id')
            .in('conversation_id', conversationIds)
            .neq('sender_id', user.id)
            .eq('is_read', false)
        : { data: [] };

      const unreadMap = {};
      (unreadCounts || []).forEach(m => {
        unreadMap[m.conversation_id] = (unreadMap[m.conversation_id] || 0) + 1;
      });

      // Build enriched response
      const enriched = filteredConversations.map(c => {
        const otherUserId = c.participant_1 === user.id ? c.participant_2 : c.participant_1;
        const profile = profileMap[otherUserId];
        const seller = sellerMap[otherUserId];
        const truck = c.truck_id ? truckMap[c.truck_id] : null;
        const lastMessage = lastMessageMap[c.id];
        const unreadCount = unreadMap[c.id] || 0;

        return {
          id: c.id,
          truckId: c.truck_id,
          truck: truck ? {
            id: truck.id,
            title: `${truck.year} ${truck.make} ${truck.model}`,
            photo: truck.photos?.[0] || null
          } : null,
          otherUser: {
            id: otherUserId,
            name: seller?.name || profile?.full_name || 'User',
            profilePicture: seller?.profile_picture_url || null
          },
          lastMessage: lastMessage ? {
            content: lastMessage.content,
            senderId: lastMessage.sender_id,
            createdAt: lastMessage.created_at,
            isFromMe: lastMessage.sender_id === user.id
          } : null,
          unreadCount,
          lastMessageAt: c.last_message_at,
          createdAt: c.created_at
        };
      });

      return res.status(200).json({ ok: true, conversations: enriched });
    } catch (err) {
      console.error('Error fetching conversations:', err);
      return res.status(500).json({ ok: false, error: 'Failed to fetch conversations' });
    }
  }

  // POST - Start a new conversation
  if (req.method === 'POST') {
    const { recipientId, truckId, message } = req.body;

    if (!recipientId) {
      return res.status(400).json({ ok: false, error: 'Recipient is required' });
    }

    if (!message?.trim()) {
      return res.status(400).json({ ok: false, error: 'Message is required' });
    }

    if (recipientId === user.id) {
      return res.status(400).json({ ok: false, error: 'Cannot message yourself' });
    }

    try {
      // Check if blocked
      const { data: blocked } = await supabase
        .from('truck_blocked_users')
        .select('id')
        .or(`and(blocker_id.eq.${user.id},blocked_id.eq.${recipientId}),and(blocker_id.eq.${recipientId},blocked_id.eq.${user.id})`)
        .limit(1);

      if (blocked && blocked.length > 0) {
        return res.status(403).json({ ok: false, error: 'Cannot message this user' });
      }

      // Check if conversation already exists
      let existingQuery = supabase
        .from('truck_conversations')
        .select('id')
        .or(
          `and(participant_1.eq.${user.id},participant_2.eq.${recipientId}),and(participant_1.eq.${recipientId},participant_2.eq.${user.id})`
        );

      if (truckId) {
        existingQuery = existingQuery.eq('truck_id', truckId);
      } else {
        existingQuery = existingQuery.is('truck_id', null);
      }

      const { data: existing } = await existingQuery.limit(1);

      let conversationId;

      if (existing && existing.length > 0) {
        conversationId = existing[0].id;
      } else {
        // Create new conversation
        const { data: newConv, error: convError } = await supabase
          .from('truck_conversations')
          .insert({
            participant_1: user.id,
            participant_2: recipientId,
            truck_id: truckId || null,
            last_message_at: new Date().toISOString()
          })
          .select()
          .single();

        if (convError) throw convError;
        conversationId = newConv.id;
      }

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
        .eq('user_id', recipientId)
        .single();

      const emailPref = recipientSeller?.message_email_pref || 'each';

      // Only send email if preference is 'each' (daily digest handled separately)
      if (emailPref === 'each') {
        const { data: recipientProfile } = await supabase
          .from('truck_profiles')
          .select('email, full_name')
          .eq('user_id', recipientId)
          .single();

        if (recipientProfile?.email) {
          let truckInfo = null;
          if (truckId) {
            const { data: truck } = await supabase
              .from('truck_trucks')
              .select('make, model, year')
              .eq('id', truckId)
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

      return res.status(200).json({ ok: true, conversationId, messageId: msg.id });
    } catch (err) {
      console.error('Error starting conversation:', err);
      return res.status(500).json({ ok: false, error: 'Failed to start conversation' });
    }
  }

  return res.status(405).json({ ok: false, error: 'Method not allowed' });
}
