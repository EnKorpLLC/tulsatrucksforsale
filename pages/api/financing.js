import { supabase } from '../../lib/supabase';
import { emailTemplates, sendEmail } from '../../lib/emailTemplates';
import { getAuthUserFromRequest } from '../../lib/getAuthUser';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await getAuthUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'You must be logged in to apply for financing' });

  try {
    const { phone, down_payment, credit_score, referral_source, notes, truck_id, truck_name } = req.body;
    if (!truck_id) return res.status(400).json({ error: 'Truck is required' });

    const name = user.name || user.email?.split('@')[0] || 'Applicant';
    const email = user.email;

    let buyerId = null;
    const { data: existing } = await supabase.from('truck_buyers').select('id').eq('email', email).limit(1);
    if (existing?.length) {
      buyerId = existing[0].id;
      await supabase.from('truck_buyers').update({ name, phone }).eq('id', buyerId);
    } else {
      const { data: inserted } = await supabase.from('truck_buyers').insert({ name, email, phone }).select('id').single();
      buyerId = inserted?.id;
    }

    const { data: fr } = await supabase
      .from('truck_financing_requests')
      .insert({
        buyer_id: buyerId,
        truck_id,
        down_payment: down_payment ? parseFloat(down_payment) : null,
        credit_score: credit_score ? parseInt(credit_score) : null,
        lender_status: 'pending',
        lead_status: 'new',
        referral_source: referral_source || null,
        notes: notes || null,
      })
      .select()
      .single();

    if (fr?.id) {
      await supabase.from('truck_financing_request_activity').insert({
        financing_request_id: fr.id,
        activity_type: 'created',
        description: 'Lead created from financing inquiry',
        metadata: {},
      });
    }

    await Promise.all([
      sendEmail('team@enkorpllc.com', {
        subject: `Financing Inquiry: ${truck_name}`,
        html: `
          <h2>New Financing Inquiry</h2>
          <p><strong>Truck:</strong> ${truck_name}</p>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
          <p><strong>Down Payment:</strong> $${down_payment || 'N/A'}</p>
          <p><strong>Credit Score:</strong> ${credit_score || 'N/A'}</p>
          <p><strong>Referral Source:</strong> ${referral_source || 'N/A'}</p>
          <p><strong>Notes:</strong> ${notes || 'None'}</p>
        `,
      }),
      sendEmail(email, emailTemplates.financingConfirmation({ buyerName: name, truckName: truck_name })),
    ]);

    return res.status(200).json({ ok: true, id: fr?.id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
