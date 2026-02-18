// Email Utility Functions with GDPR Unsubscribe Support
// Use this for all outgoing emails

/**
 * Generate unsubscribe token for email
 */
export async function generateUnsubscribeToken(email) {
    const data = email.toLowerCase() + 'unsubscribe_secret_2024';
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('').substring(0, 16);
}

/**
 * Add GDPR-compliant email footer with unsubscribe link
 */
export async function addEmailFooter(htmlContent, recipientEmail, baseUrl = 'https://billionairs.luxury') {
    const token = await generateUnsubscribeToken(recipientEmail);
    const unsubscribeLink = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(recipientEmail)}&token=${token}`;
    
    const footer = `
        <div style="margin-top: 50px; padding-top: 30px; border-top: 1px solid #333;">
            <p style="font-size: 12px; color: #888; text-align: center; line-height: 1.6;">
                You received this email because you are a BILLIONAIRS member.<br>
                <a href="${unsubscribeLink}" style="color: #D4A574; text-decoration: none;">
                    Unsubscribe from marketing emails
                </a>
            </p>
            <p style="font-size: 11px; color: #666; text-align: center; margin-top: 10px;">
                BILLIONAIRS Luxury Lifestyle<br>
                © ${new Date().getFullYear()} All rights reserved
            </p>
        </div>
    `;
    
    // Insert footer before closing body tag
    if (htmlContent.includes('</body>')) {
        return htmlContent.replace('</body>', footer + '</body>');
    }
    
    // If no body tag, append at end
    return htmlContent + footer;
}

/**
 * Wrap email content in consistent template
 */
export function wrapEmailTemplate(content, title = 'BILLIONAIRS') {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a; color: #ffffff;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border-radius: 12px; overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 30px; text-align: center; background: linear-gradient(135deg, #D4A574 0%, #F4C2A1 100%);">
                            <h1 style="margin: 0; font-size: 28px; color: #000; font-weight: 700;">
                                &#9670; BILLIONAIRS
                            </h1>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            ${content}
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
}
