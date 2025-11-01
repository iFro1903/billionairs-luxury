// Password Reset Request API// Password Reset Request API

// Sendet Email mit Reset-Link über zentralen Email-Service// Sendet Email mit Reset-Link

import { neon } from '@neondatabase/serverless';import { neon } from '@neondatabase/serverless';

import crypto from 'crypto';import crypto from 'crypto';



export const config = {export const config = {

  runtime: 'nodejs'  runtime: 'nodejs'

};};



export default async function handler(request) {export default async function handler(request) {

  if (request.method !== 'POST') {  if (request.method !== 'POST') {

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {    return new Response(JSON.stringify({ error: 'Method not allowed' }), {

      status: 405,      status: 405,

      headers: { 'Content-Type': 'application/json' }      headers: { 'Content-Type': 'application/json' }

    });    });

  }  }



  try {  try {

    const { email } = await request.json();    const { email } = await request.json();



    if (!email || !email.includes('@')) {    if (!email || !email.includes('@')) {

      return new Response(JSON.stringify({       return new Response(JSON.stringify({ 

        error: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.'         error: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.' 

      }), {      }), {

        status: 400,        status: 400,

        headers: { 'Content-Type': 'application/json' }        headers: { 'Content-Type': 'application/json' }

      });      });

    }    }



    const sql = neon(process.env.DATABASE_URL);    const sql = neon(process.env.DATABASE_URL);



    // Prüfe ob User existiert    // Prüfe ob User existiert

    const users = await sql`    const users = await sql`

      SELECT id, email, first_name FROM users       SELECT id, email, first_name FROM users 

      WHERE email = ${email.toLowerCase()}      WHERE email = ${email.toLowerCase()}

      LIMIT 1      LIMIT 1

    `;    `;



    if (users.length === 0) {    if (users.length === 0) {

      // WICHTIG: Aus Sicherheitsgründen KEINE Fehlermeldung wenn Email nicht existiert      // WICHTIG: Aus Sicherheitsgründen KEINE Fehlermeldung wenn Email nicht existiert

      // Immer Success zurückgeben, aber keine Email senden      // Immer Success zurückgeben, aber keine Email senden

      return new Response(JSON.stringify({       return new Response(JSON.stringify({ 

        success: true,        success: true,

        message: 'Falls ein Konto mit dieser E-Mail existiert, wurde ein Reset-Link versendet.'         message: 'Falls ein Konto mit dieser E-Mail existiert, wurde ein Reset-Link versendet.' 

      }), {      }), {

        status: 200,        status: 200,

        headers: { 'Content-Type': 'application/json' }        headers: { 'Content-Type': 'application/json' }

      });      });

    }    }



    const user = users[0];    const user = users[0];



    // Generiere sicheren Reset Token    // Generiere sicheren Reset Token

    const resetToken = crypto.randomBytes(32).toString('hex');    const resetToken = crypto.randomBytes(32).toString('hex');

    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    const expiresAt = new Date(Date.now() + 3600000); // 1 Stunde gültig    const expiresAt = new Date(Date.now() + 3600000); // 1 Stunde gültig



    // Speichere Reset Token in Datenbank    // Speichere Reset Token in Datenbank

    await sql`    await sql`

      INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, used)      INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, used)

      VALUES (${user.id}, ${resetTokenHash}, ${expiresAt}, false)      VALUES (${user.id}, ${resetTokenHash}, ${expiresAt}, false)

      ON CONFLICT (user_id)       ON CONFLICT (user_id) 

      DO UPDATE SET       DO UPDATE SET 

        token_hash = ${resetTokenHash},        token_hash = ${resetTokenHash},

        expires_at = ${expiresAt},        expires_at = ${expiresAt},

        used = false,        used = false,

        created_at = NOW()        created_at = NOW()

    `;    `;



    // Erstelle Reset-Link    // Erstelle Reset-Link

    const baseUrl = request.headers.get('origin') || 'https://www.billionairs.luxury';    const baseUrl = request.headers.get('origin') || 'https://billionairs.luxury';

    const resetLink = `${baseUrl}/reset-password.html?token=${resetToken}&email=${encodeURIComponent(email)}`;    const resetLink = `${baseUrl}/reset-password.html?token=${resetToken}&email=${encodeURIComponent(email)}`;



    // Sende Email über zentralen Email-Service (respektiert Test-Modus)    // Sende Email direkt mit Resend API

    try {    const RESEND_API_KEY = process.env.RESEND_API_KEY;

      const emailServiceUrl = `${baseUrl}/api/email-service`;    const emailHtml = `

      const emailResponse = await fetch(emailServiceUrl, {<!DOCTYPE html>

        method: 'POST',<html>

        headers: {<head>

          'Content-Type': 'application/json'  <meta charset="UTF-8">

        },  <style>

        body: JSON.stringify({    body {

          type: 'password-reset',      font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif;

          to: email,      background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);

          userName: user.first_name || 'Member',      color: #ffffff;

          resetLink: resetLink      margin: 0;

        })      padding: 0;

      });    }

    .container {

      if (!emailResponse.ok) {      max-width: 600px;

        const errorText = await emailResponse.text();      margin: 40px auto;

        console.error('❌ Email service error:', errorText);      background: linear-gradient(135deg, rgba(232, 180, 160, 0.1) 0%, rgba(26, 26, 26, 0.95) 100%);

        // Trotzdem Erfolg zurückgeben aus Sicherheitsgründen      border: 2px solid rgba(232, 180, 160, 0.3);

      } else {      border-radius: 15px;

        console.log('✅ Password reset email sent successfully');      padding: 40px;

      }    }

    } catch (emailError) {    .logo {

      console.error('❌ Email sending failed:', emailError.message);      text-align: center;

      // Trotzdem Erfolg zurückgeben aus Sicherheitsgründen      margin-bottom: 30px;

    }    }

    .logo-text {

    return new Response(JSON.stringify({       font-family: 'Playfair Display', serif;

      success: true,      font-size: 32px;

      message: 'Falls ein Konto mit dieser E-Mail existiert, wurde ein Reset-Link versendet.'       font-weight: 700;

    }), {      letter-spacing: 4px;

      status: 200,      background: linear-gradient(135deg, #E8B4A0 0%, #D9A090 100%);

      headers: { 'Content-Type': 'application/json' }      -webkit-background-clip: text;

    });      -webkit-text-fill-color: transparent;

      background-clip: text;

  } catch (error) {    }

    console.error('❌ Password reset request error:', error);    h1 {

    return new Response(JSON.stringify({       color: #E8B4A0;

      error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.',      font-size: 24px;

      details: error.message      font-weight: 300;

    }), {      letter-spacing: 2px;

      status: 500,      margin-bottom: 20px;

      headers: { 'Content-Type': 'application/json' }      text-transform: uppercase;

    });    }

  }    p {

}      color: rgba(255, 255, 255, 0.85);

      line-height: 1.8;
      margin-bottom: 20px;
      font-size: 15px;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #E8B4A0 0%, #D9A090 100%);
      color: #000000;
      padding: 16px 40px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      letter-spacing: 2px;
      text-transform: uppercase;
      font-size: 13px;
      margin: 30px 0;
      box-shadow: 0 10px 30px rgba(232, 180, 160, 0.3);
    }
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 15px 40px rgba(232, 180, 160, 0.4);
    }
    .warning {
      background: rgba(232, 180, 160, 0.1);
      border-left: 3px solid #E8B4A0;
      padding: 15px;
      margin: 20px 0;
      font-size: 13px;
      color: rgba(255, 255, 255, 0.7);
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 30px;
      border-top: 1px solid rgba(232, 180, 160, 0.2);
      color: rgba(255, 255, 255, 0.5);
      font-size: 12px;
    }
    .link {
      color: #E8B4A0;
      text-decoration: none;
      word-break: break-all;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <div class="logo-text">BILLIONAIRS</div>
    </div>
    
    <h1>Passwort zurücksetzen</h1>
    
    <p>Hallo ${user.first_name || 'Member'},</p>
    
    <p>Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts gestellt. Klicken Sie auf den Button unten, um ein neues Passwort zu erstellen:</p>
    
    <div style="text-align: center;">
      <a href="${resetLink}" class="button">Passwort zurücksetzen</a>
    </div>
    
    <p>Oder kopieren Sie diesen Link in Ihren Browser:</p>
    <p><a href="${resetLink}" class="link">${resetLink}</a></p>
    
    <div class="warning">
      <strong>⚠️ Wichtige Sicherheitshinweise:</strong><br>
      • Dieser Link ist 1 Stunde lang gültig<br>
      • Der Link kann nur einmal verwendet werden<br>
      • Falls Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail<br>
      • Teilen Sie diesen Link niemals mit anderen Personen
    </div>
    
    <p>Bei Fragen kontaktieren Sie uns unter support@billionairs.luxury</p>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} BILLIONAIRS - Exclusive Luxury Watches</p>
      <p>Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht darauf.</p>
    </div>
  </div>
</body>
</html>
`;

    const emailText = `
BILLIONAIRS - Passwort zurücksetzen

Hallo ${user.first_name || 'Member'},

Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts gestellt.

Klicken Sie auf diesen Link, um ein neues Passwort zu erstellen:
${resetLink}

Dieser Link ist 1 Stunde lang gültig und kann nur einmal verwendet werden.

Falls Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail.

Bei Fragen: support@billionairs.luxury

© ${new Date().getFullYear()} BILLIONAIRS
`;

    // Sende Email direkt mit Resend API
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'BILLIONAIRS <onboarding@resend.dev>',
        to: [email],
        subject: 'BILLIONAIRS - Passwort zurücksetzen',
        html: emailHtml,
        text: emailText
      })
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error('Resend API error:', emailData);
      // Trotzdem Erfolg zurückgeben aus Sicherheitsgründen (Email Enumeration Prevention)
    } else {
      console.log('Email sent successfully. Resend ID:', emailData.id);
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Falls ein Konto mit dieser E-Mail existiert, wurde ein Reset-Link versendet.' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Password reset request error:', error);
    return new Response(JSON.stringify({ 
      error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
