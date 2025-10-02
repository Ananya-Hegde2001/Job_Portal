// EmailJS helper wrapper
// 1. Run: npm install @emailjs/browser (already added to package.json)
// 2. Create an EmailJS account at https://www.emailjs.com/
// 3. Add an Email Service (e.g., Gmail, Outlook, or SMTP)
// 4. Create an Email Template with variables: user_email, message, user_name (optional)
// 5. Get your public key (previously called user ID), service ID, and template ID
// 6. Set environment variables in .env (see below) or put them directly (not recommended for production)
//
// Create client/.env (NOT committed) with:
//   VITE_EMAILJS_PUBLIC_KEY=your_public_key
//   VITE_EMAILJS_SERVICE_ID=your_service_id
//   VITE_EMAILJS_TEMPLATE_ID=your_template_id
//
// Then import { sendFeedbackEmail } and call it.

import emailjs from '@emailjs/browser';

const PUB_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
// Destination override (if your template expects a dynamic to_email variable)
const TO_EMAIL = import.meta.env.VITE_EMAILJS_TO_EMAIL; // optional

// Initialize once if possible (safe to call multiple times)
if (PUB_KEY) {
  try { emailjs.init({ publicKey: PUB_KEY }); } catch (e) { /* ignore */ }
}

export function emailEnvReady(){
  return Boolean(PUB_KEY && SERVICE_ID && TEMPLATE_ID);
}

export async function sendFeedbackEmail({ email, message, name }) {
  if(!emailEnvReady()) throw new Error('Email service not configured');
  const safeEmail = email && email.includes('@') ? email : 'anonymous@no-reply.local';
  const safeName = name || (email ? email.split('@')[0] : 'Anonymous User');
  // Provide multiple alias param names so whichever exists in the template will populate.
  const params = {
    user_email: safeEmail,
    user_name: safeName,
    message, // generic
    from_email: safeEmail,
    from_name: safeName,
    reply_to: safeEmail,
    // If the template's "To" field uses {{to_email}} ensure we provide it.
    to_email: TO_EMAIL || undefined,
    to_name: TO_EMAIL ? 'Support' : undefined
  };
  try {
    const res = await emailjs.send(SERVICE_ID, TEMPLATE_ID, params, { publicKey: PUB_KEY });
    return res;
  } catch (e) {
    // Provide more actionable error detail
    let extra = (e && (e.text || e.message || e.status)) ? `: ${(e.text || e.message || e.status)}` : '';
    if (String(extra).toLowerCase().includes('recipients address is empty')) {
      extra += '\nHint: Set a static recipient inside the EmailJS template OR add VITE_EMAILJS_TO_EMAIL in client/.env and reference {{to_email}} in the template To field.';
    }
    console.error('EmailJS send failed', e);
    throw new Error('Failed to send email' + extra);
  }
}

export function debugEmailConfig(){
  return { havePub: !!PUB_KEY, haveService: !!SERVICE_ID, haveTemplate: !!TEMPLATE_ID, haveTo: !!TO_EMAIL, service: SERVICE_ID, template: TEMPLATE_ID, to: TO_EMAIL };
}
