import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendDocumentEmail({ toEmail, subject, message, attachmentBuffer, filename }) {
    if (!toEmail) {
      throw new Error('Recipient email is required.');
    }

    try {
      const formattedMessage = (message || 'Please find your document attached.').replace(/\n/g, '<br>');
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject || 'Your Document from CorePack'}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; -webkit-font-smoothing: antialiased;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 40px 0;">
    <tr>
      <td align="center">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01); overflow: hidden; border: 1px solid #e2e8f0;">
          
          <!-- Header with Logo -->
          <tr>
            <td style="padding: 40px 40px 30px 40px; text-align: center; border-bottom: 3px solid #f1f5f9;">
              <img src="cid:corepack-logo" alt="COREPACK INDIA" style="max-height: 60px; width: auto; border: 0; display: block; margin: 0 auto;">
            </td>
          </tr>

          <!-- Content Area -->
          <tr>
            <td style="padding: 40px;">
              <!-- Message Block with styling -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border-radius: 8px; border-left: 4px solid #ea580c;">
                <tr>
                  <td style="padding: 25px 30px; font-size: 16px; line-height: 1.8; color: #334155;">
                    ${formattedMessage}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Document CTA Callout (Navy Banner with Orange Accent) -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0f172a; border-radius: 10px;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <p style="margin: 0; font-size: 16px; color: #ffffff; font-weight: 600;">
                      <span style="color: #f97316; margin-right: 8px;">&#128196;</span> Your Document is Attached
                    </p>
                    <p style="margin: 6px 0 0 0; font-size: 13px; color: #94a3b8;">
                      Please review the attached PDF file for full details.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #1e293b; text-align: center;">
              <p style="margin: 0 0 10px 0; font-size: 13px; color: #94a3b8; line-height: 1.5;">
                This is an automated message securely delivered by CorePack India.<br>
                Please do not reply directly to this email unless you have questions regarding the attachment.
              </p>
              <p style="margin: 0; font-size: 13px; color: #64748b; font-weight: 500;">
                &copy; ${new Date().getFullYear()} CorePack India. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `;

      // Read logo for CID attachment
      const logoPath = path.resolve(process.cwd(), '../frontend/public/branding/logo-trimmed.png');
      let logoBuffer = null;
      try {
        logoBuffer = fs.readFileSync(logoPath);
      } catch (e) {
        console.error("Could not load logo for email attachment:", e.message);
      }

      const attachments = [
        {
          filename: filename || 'document.pdf',
          content: Buffer.from(attachmentBuffer),
          contentType: 'application/pdf',
        },
      ];

      if (logoBuffer) {
        attachments.push({
          filename: 'logo-trimmed.png',
          content: logoBuffer,
          cid: 'corepack-logo'
        });
      }

      const mailOptions = {
        from: process.env.EMAIL_FROM || '"CorePack" <no-reply@corepack.com>',
        to: toEmail,
        subject: subject || 'Your Document from CorePack',
        text: message || 'Please find your document attached.',
        html: htmlContent,
        attachments: attachments,
      };

      const info = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Email sending failed:', error);
      throw new Error(`Email delivery failed: ${error.message}`);
    }
  }
}

export default new EmailService();
