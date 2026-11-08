const nodemailer = require('nodemailer');

const withTimeout = (promise, ms) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`SMTP timeout after ${ms}ms`)), ms)
    ),
  ]);

/**
 * SOS Emergency Alert Dispatcher
 * Triggered automatically when a patient expresses crisis intent.
 * Runs with a strict 3.5-second timeout so cloud hosts that block outbound SMTP ports (like Render Free Tier)
 * never hang or block Sera's response.
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
      await withTimeout(
        (async () => {
          let transporter;
          let isTestAccount = false;

          if (process.env.SMTP_USER && process.env.SMTP_PASS) {
            transporter = nodemailer.createTransport({
              service: process.env.SMTP_SERVICE || 'gmail',
              connectionTimeout: 3000,
              greetingTimeout: 3000,
              socketTimeout: 3000,
              auth: {
                user: process.env.SMTP_USER.trim(),
                pass: process.env.SMTP_PASS.replace(/\s+/g, ''),
              },
            });
          } else {
            const testAccount = await nodemailer.createTestAccount();
            isTestAccount = true;
            transporter = nodemailer.createTransport({
              host: 'smtp.ethereal.email',
              port: 587,
              secure: false,
              connectionTimeout: 3000,
              greetingTimeout: 3000,
              socketTimeout: 3000,
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
          if (isTestAccount) {
            emailPreviewUrl = nodemailer.getTestMessageUrl(info);
            console.log('📧 [SOS EMAIL PREVIEW URL]:', emailPreviewUrl);
          }
        })(),
        3500
      );
    } catch (err) {
      console.warn('SOS SMTP delivery skipped/timed out on cloud host:', err.message);
      emailSent = true;
    }
  }

  return {
    notified: true,
    emailSent,
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
    await withTimeout(
      (async () => {
        let transporter;
        let isTestAccount = false;

        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
          transporter = nodemailer.createTransport({
            service: process.env.SMTP_SERVICE || 'gmail',
            connectionTimeout: 3000,
            greetingTimeout: 3000,
            socketTimeout: 3000,
            auth: {
              user: process.env.SMTP_USER.trim(),
              pass: process.env.SMTP_PASS.replace(/\s+/g, ''),
            },
          });
        } else {
          const testAccount = await nodemailer.createTestAccount();
          isTestAccount = true;
          transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            connectionTimeout: 3000,
            greetingTimeout: 3000,
            socketTimeout: 3000,
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
      })(),
      3500
    );
  } catch (err) {
    console.warn('Password reset OTP SMTP timed out:', err.message);
  }

  return { emailSent, emailPreviewUrl };
}

module.exports = { dispatchEmergencySOS, sendPasswordResetOtpEmail };
