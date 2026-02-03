import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const DEFAULT_FROM = 'Tulsa Trucks <team@tulsatrucksforsale.com>';

export function isEmailConfigured() {
  return !!resend;
}

export async function sendEmail(to, template) {
  if (!resend || !template?.subject) return;
  const from = process.env.RESEND_FROM || DEFAULT_FROM;
  try {
    await resend.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject: template.subject,
      html: template.html,
    });
  } catch (err) {
    console.error('Resend send error:', err);
  }
}
