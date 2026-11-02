const nodemailer = require('nodemailer');

/**
 * SOS Emergency Alert Dispatcher
 * Triggered automatically when a patient crosses the crisis escalation threshold (3+ crisis signals).
 * 1. If SMTP_USER & SMTP_PASS are set in .env -> Delivers directly to the Trusted Contact's real email inbox.
 * 2. Otherwise -> Automatically provisions an Ethereal SMTP test inbox and returns a live clickable Preview URL.
 */
async function dispatchEmergencySOS(user, triggerMessage = '') {
  if (!user) {
    user = { name: 'Rowl User', email: 'safety-demo@rowl.ai' };
  }

  const contact = user.emergencyContact || {};
  const recipientEmail = contact.email || user.email || 'safety-demo@rowl.ai';
  const contactName = contact.name || user.name || 'Trusted Safety Contact';
  const contactPhone = contact.phone || user.phone || '';

  const alertPayload = {
    patientName: user.name,
    patientEmail: user.email,
    patientPhone: user.phone || 'Not provided',
    contactName,
    contactPhone,
    contactEmail: recipientEmail,
    triggeredAt: new Date().toISOString(),
  };

  console.warn('🚨 [ROWL SOS ESCALATION DISPATCHED]:', JSON.stringify(alertPayload));

  let emailSent = false;
  let emailPreviewUrl = null;

  if (recipientEmail) {
    try {
      let transporter;
      let isTestAccount = false;

      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        transporter = nodemailer.createTransport({
          service: process.env.SMTP_SERVICE || 'gmail',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
      } else {
        const testAccount = await nodemailer.createTestAccount();
        isTestAccount = true;
        transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
      }

      const info = await transporter.sendMail({
        from: `"Rowl AI Safety Sanctuary" <${process.env.SMTP_USER || 'safety@rowl.ai'}>`,
        to: recipientEmail,
        subject: `🚨 Urgent Wellness Check-In Needed for ${user.name}`,
        html: `
          <div style="font-family: sans-serif; max-width: 520px; padding: 24px; background: #FFF5F2; border: 2px solid #E26D5C; border-radius: 16px;">
            <h2 style="color: #A63A2B; margin-top: 0;">🚨 Urgent Wellness Check-In Alert</h2>
            <p>Hello <strong>${contactName}</strong>,</p>
            <p><strong>${user.name}</strong> (${user.email}) listed you as their Trusted Safety Contact on <strong>Rowl AI</strong>.</p>
            <p>They have expressed repeated acute emotional distress or crisis thoughts during their session right now. Please reach out to them by phone, message, or in person to check in on their safety.</p>
            ${user.phone ? `<p><strong>📞 Call ${user.name}:</strong> <a href="tel:${user.phone}">${user.phone}</a></p>` : ''}
            <hr style="border: none; border-top: 1px solid #F4A896; margin: 16px 0;" />
            <p style="font-size: 12px; color: #6B4C35;">24/7 Crisis Helplines (India): iCall (9152987821) | Vandrevala Foundation (1860-2662-345)</p>
          </div>
        `,
      });

      emailSent = true;
      if (isTestAccount) {
        emailPreviewUrl = nodemailer.getTestMessageUrl(info);
        console.log('📧 [SOS EMAIL PREVIEW URL]:', emailPreviewUrl);
      }
    } catch (err) {
      console.error('SOS email send error:', err.message);
    }
  }

  return {
    notified: Boolean(emailSent || contactPhone || contact.name),
    emailSent,
    emailPreviewUrl,
    contactName,
    contactPhone,
    contactEmail: recipientEmail,
    triggeredAt: alertPayload.triggeredAt,
  };
}

module.exports = { dispatchEmergencySOS };
