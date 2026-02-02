// Email service using Resend integration
import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return {
    apiKey: connectionSettings.settings.api_key, 
    fromEmail: connectionSettings.settings.from_email
  };
}

async function getResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail
  };
}

export async function sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const baseUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : process.env.REPL_SLUG 
        ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
        : 'http://localhost:5000';
    
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
    
    const result = await client.emails.send({
      from: fromEmail || 'Creator Pulse <noreply@resend.dev>',
      to: email,
      subject: 'Reset Your Creator Pulse Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #030303; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #030303; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" max-width="500" cellpadding="0" cellspacing="0" style="max-width: 500px;">
                  <tr>
                    <td align="center" style="padding-bottom: 30px;">
                      <h1 style="margin: 0; font-size: 28px; font-weight: 700;">
                        <span style="color: #ffffff;">CREATOR</span>
                        <span style="background: linear-gradient(to right, #a78bfa, #e879f9); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">PULSE</span>
                      </h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #18181b; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 40px;">
                      <h2 style="margin: 0 0 16px 0; color: #ffffff; font-size: 22px; font-weight: 600;">Reset Your Password</h2>
                      <p style="margin: 0 0 24px 0; color: #a1a1aa; font-size: 15px; line-height: 1.6;">
                        We received a request to reset your password. Click the button below to create a new password. This link will expire in 1 hour.
                      </p>
                      <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(to right, #7c3aed, #c026d3); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">
                        Reset Password
                      </a>
                      <p style="margin: 24px 0 0 0; color: #71717a; font-size: 13px; line-height: 1.5;">
                        If you didn't request this, you can safely ignore this email. Your password will remain unchanged.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-top: 24px;">
                      <p style="margin: 0; color: #52525b; font-size: 12px;">
                        © ${new Date().getFullYear()} Creator Pulse. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    console.log('[Email] Password reset email sent to:', email, 'Result:', result);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send password reset email:', error);
    return false;
  }
}
