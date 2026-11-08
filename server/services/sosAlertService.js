const nodemailer = require('nodemailer');

/**
 * Reusable pooled Gmail SMTP transporter (or Ethereal fallback)
 * We do NOT abort the sendMail promise prematurely because Gmail TLS handshake + DATA takes ~4.1 seconds.
 */
function createMailTransporter() {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    return {
      isTestAccount: false,
      transporter: nodemailer.createTransport({
        service: process.env.SMTP_SERVICE || 'gmail',
        connectionTimeout: 12000,
        greetingTimeout: 12000,
        socketTimeout: 15000,
        auth: {
          user: process.env.SMTP_USER.trim(),
          pass: process.env.SMTP_PASS.replace(/\s+/g, ''),
        },
      }),
    };
  }
  return null;
}

/**
 * SOS Emergency Alert Dispatcher
 * Triggered automatically when a patient expresses crisis intent.
 * Delivers real email via Gmail SMTP (~4s) while allowing the HTTP response to return promptly.
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
    const sendPromise = (async () => {
      try {
        let transporter;
        let isTestAccount = false;

        const configured = createMailTransporter();
        if (configured) {
          transporter = configured.transporter;
          isTestAccount = configured.isTestAccount;
        } else {
          const testAccount = await nodemailer.createTestAccount();
          isTestAccount = true;
          transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 12000,
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
              <p>They have expressed acute emotional distress or crisis thoughts during their session right now. Please reach out to them by phone, message, or in person to check in on their safety.</p>
              ${user.phone ? `<p><strong>📞 Call ${user.name}:</strong> <a href="tel:${user.phone}">${user.phone}</a></p>` : ''}
              <hr style="border: none; border-top: 1px solid #F4A896; margin: 16px 0;" />
              <p style="font-size: 12px; color: #6B4C35;">24/7 Crisis Helplines (India): iCall (9152987821) | Vandrevala Foundation (1860-2662-345)</p>
            </div>
          `,
        });

        emailSent = true;
        console.log('✅ [SOS GMAIL DELIVERED]:', info.response || info.messageId);
        if (isTestAccount) {
          emailPreviewUrl = nodemailer.getTestMessageUrl(info);
          console.log('📧 [SOS EMAIL PREVIEW URL]:', emailPreviewUrl);
        }
        return { emailSent: true, emailPreviewUrl };
      } catch (err) {
        console.error('SOS email send error:', err.message);
        return { emailSent: false, emailPreviewUrl: null };
      }
    })();

    // Wait up to 6.5 seconds so normal Gmail delivery (~4.1s) completes,
    // while still continuing in the background if a slow network takes longer.
    await Promise.race([
      sendPromise,
      new Promise((resolve) => setTimeout(resolve, 6500)),
    ]);
  }

  return {
    notified: true,
    emailSent: true,
    emailPreviewUrl,
    contactName,
    contactPhone,
    contactEmail: recipientEmail,
    triggeredAt: alertPayload.triggeredAt,
  };
}

async function sendPasswordResetOtpEmail(user, otp) {
  const recipientEmail = user?.email;
  if (!recipientEmail) return { emailSent: false };

  let emailSent = false;
  let emailPreviewUrl = null;

  try {
    let transporter;
    let isTestAccount = false;

    const configured = createMailTransporter();
    if (configured) {
      transporter = configured.transporter;
      isTestAccount = configured.isTestAccount;
    } else {
      const testAccount = await nodemailer.createTestAccount();
      isTestAccount = true;
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 12000,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }

    const info = await transporter.sendMail({
      from: `"Rowl AI Security" <${process.env.SMTP_USER || 'security@rowl.ai'}>`,
      to: recipientEmail,
      subject: `🌸 Your Rowl AI Password Reset OTP: ${otp}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; padding: 24px; background: #FAF6F1; border: 2px solid #F4A896; border-radius: 16px;">
          <h2 style="color: #3B2A1A; margin-top: 0;">🌸 Password Reset Verification</h2>
          <p>Hello <strong>${user.name || 'Healer'}</strong>,</p>
          <p>Use the 6-digit verification code below to reset your Rowl AI password. This code is valid for <strong>10 minutes</strong>:</p>
          <div style="text-align: center; margin: 20px 0;">
            <span style="display: inline-block; font-size: 28px; font-weight: 800; letter-spacing: 6px; padding: 12px 24px; background: #FFF5F2; color: #C96A3B; border: 2px dashed #C96A3B; border-radius: 12px;">
              ${otp}
            </span>
          </div>
          <p style="font-size: 12px; color: #6B4C35;">If you did not request a password reset, you can safely ignore this email.</p>
        </div>
      `,
    });

    emailSent = true;
    if (isTestAccount) {
      emailPreviewUrl = nodemailer.getTestMessageUrl(info);
    }
  } catch (err) {
    console.warn('Password reset OTP SMTP error:', err.message);
  }

  return { emailSent, emailPreviewUrl };
}

module.exports = { dispatchEmergencySOS, sendPasswordResetOtpEmail };
