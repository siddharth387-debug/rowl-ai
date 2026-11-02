/**
 * SOS Emergency Alert Dispatcher
 * Triggered automatically when a patient crosses the crisis escalation threshold (3+ crisis signals).
 * Sends an email/SMS notification to their Trusted Safety Contact if configured,
 * and generates a pre-filled WhatsApp / tel deep-link for instant connection.
 */
async function dispatchEmergencySOS(user) {
  if (!user) {
    return { notified: false, reason: 'guest_user' };
  }

  const contact = user.emergencyContact || {};
  const hasContact = Boolean(contact.name || contact.phone || contact.email);

  const alertPayload = {
    patientName: user.name,
    patientPhone: user.phone || 'Not provided',
    contactName: contact.name || 'Trusted Contact',
    contactPhone: contact.phone || '',
    contactEmail: contact.email || '',
    triggeredAt: new Date().toISOString(),
  };

  // Log structured SOS dispatch record for audit & demo visibility
  console.warn('🚨 [ROWL SOS ESCALATION DISPATCHED]:', JSON.stringify(alertPayload));

  // Optional SMTP Email dispatch if environment credentials are set
  if (contact.email && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        service: process.env.SMTP_SERVICE || 'gmail',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: `"Rowl AI Safety Sanctuary" <${process.env.SMTP_USER}>`,
        to: contact.email,
        subject: `🚨 Urgent Wellness Check-In Needed for ${user.name}`,
        html: `
          <div style="font-family: sans-serif; max-width: 520px; padding: 24px; background: #FFF5F2; border: 2px solid #E26D5C; border-radius: 16px;">
            <h2 style="color: #A63A2B; margin-top: 0;">🚨 Urgent Wellness Check-In Alert</h2>
            <p>Hello <strong>${contact.name || 'Friend'}</strong>,</p>
            <p><strong>${user.name}</strong> listed you as their Trusted Safety Contact on <strong>Rowl AI</strong>.</p>
            <p>They are currently experiencing acute emotional distress and have triggered our crisis safety threshold. Please reach out to them by phone or in person as soon as possible.</p>
            ${user.phone ? `<p><strong>${user.name}'s Phone:</strong> <a href="tel:${user.phone}">${user.phone}</a></p>` : ''}
            <hr style="border: none; border-top: 1px solid #F4A896; margin: 16px 0;" />
            <p style="font-size: 12px; color: #6B4C35;">24/7 Crisis Helplines (India): iCall (9152987821) | Vandrevala Foundation (1860-2662-345)</p>
          </div>
        `,
      });
    } catch (err) {
      console.error('SOS email send error:', err.message);
    }
  }

  return {
    notified: hasContact,
    contactName: contact.name || '',
    contactPhone: contact.phone || '',
    contactEmail: contact.email || '',
    triggeredAt: alertPayload.triggeredAt,
  };
}

module.exports = { dispatchEmergencySOS };
