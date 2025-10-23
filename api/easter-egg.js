import { neon } from '@neondatabase/serverless';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  // CORS Headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    const { email, action } = await req.json();

    if (!email || !action) {
      return new Response(
        JSON.stringify({ error: 'Email and action required' }),
        { status: 400, headers }
      );
    }

    const now = new Date().toISOString();

    // Verschiedene Actions
    switch (action) {
      case 'check_status':
        // Gibt aktuellen Status des Easter Egg Systems zurück
        const user = await sql`
          SELECT 
            first_dashboard_access,
            pyramid_unlocked,
            pyramid_opened_at,
            eye_unlocked,
            eye_opened_at,
            chat_unlocked,
            last_daily_login,
            login_streak
          FROM users 
          WHERE email = ${email}
        `;

        if (user.length === 0) {
          return new Response(
            JSON.stringify({ error: 'User not found' }),
            { status: 404, headers }
          );
        }

        const userData = user[0];
        const currentTime = new Date();

        // Berechne ob Pyramide angezeigt werden soll (20 Sekunden nach erstem Zugriff)
        let showPyramid = false;
        if (userData.first_dashboard_access && !userData.pyramid_unlocked) {
          const firstAccess = new Date(userData.first_dashboard_access);
          const secondsSinceFirstAccess = (currentTime - firstAccess) / 1000;
          showPyramid = secondsSinceFirstAccess >= 20;
        }

        // Berechne ob Auge freigeschaltet ist (72h nach pyramid_opened_at)
        let eyeReady = false;
        if (userData.pyramid_opened_at && !userData.eye_unlocked) {
          const pyramidOpenedAt = new Date(userData.pyramid_opened_at);
          const hoursSincePyramid = (currentTime - pyramidOpenedAt) / (1000 * 60 * 60);
          eyeReady = hoursSincePyramid >= 72 && userData.login_streak >= 3;
        }

        // Berechne ob Chat freigeschaltet ist (168h nach eye_opened_at)
        let chatReady = false;
        if (userData.eye_opened_at && !userData.chat_unlocked) {
          const eyeOpenedAt = new Date(userData.eye_opened_at);
          const hoursSinceEye = (currentTime - eyeOpenedAt) / (1000 * 60 * 60);
          chatReady = hoursSinceEye >= 168;
        }

        return new Response(
          JSON.stringify({
            success: true,
            showPyramid,
            pyramidUnlocked: userData.pyramid_unlocked,
            eyeUnlocked: userData.eye_unlocked,
            eyeReady,
            chatUnlocked: userData.chat_unlocked,
            chatReady,
            loginStreak: userData.login_streak || 0,
            firstDashboardAccess: userData.first_dashboard_access,
          }),
          { status: 200, headers }
        );

      case 'first_access':
        // Setze first_dashboard_access wenn noch nicht gesetzt
        await sql`
          UPDATE users 
          SET first_dashboard_access = ${now}
          WHERE email = ${email} 
          AND first_dashboard_access IS NULL
        `;

        return new Response(
          JSON.stringify({ success: true, message: 'First access recorded' }),
          { status: 200, headers }
        );

      case 'open_pyramid':
        // User hat Pyramide angeklickt
        await sql`
          UPDATE users 
          SET 
            pyramid_unlocked = TRUE,
            pyramid_opened_at = ${now}
          WHERE email = ${email}
        `;

        return new Response(
          JSON.stringify({ 
            success: true, 
            riddle: "The triangle has three sides.\nEach side demands your presence.\nReturn when the sun rises. Three times."
          }),
          { status: 200, headers }
        );

      case 'daily_login':
        // Tracke täglichen Login für Streak
        const userForStreak = await sql`
          SELECT last_daily_login, login_streak 
          FROM users 
          WHERE email = ${email}
        `;

        if (userForStreak.length === 0) {
          return new Response(
            JSON.stringify({ error: 'User not found' }),
            { status: 404, headers }
          );
        }

        const lastLogin = userForStreak[0].last_daily_login;
        const currentStreak = userForStreak[0].login_streak || 0;
        let newStreak = 1;

        if (lastLogin) {
          const lastLoginDate = new Date(lastLogin);
          const daysSinceLastLogin = Math.floor((currentTime - lastLoginDate) / (1000 * 60 * 60 * 24));

          if (daysSinceLastLogin === 1) {
            // Aufeinanderfolgender Tag
            newStreak = currentStreak + 1;
          } else if (daysSinceLastLogin === 0) {
            // Gleicher Tag, Streak bleibt
            newStreak = currentStreak;
          } else {
            // Streak unterbrochen
            newStreak = 1;
          }
        }

        await sql`
          UPDATE users 
          SET 
            last_daily_login = ${now},
            login_streak = ${newStreak}
          WHERE email = ${email}
        `;

        return new Response(
          JSON.stringify({ success: true, loginStreak: newStreak }),
          { status: 200, headers }
        );

      case 'unlock_eye':
        // Auge freischalten (nach 72h und 3 Logins)
        await sql`
          UPDATE users 
          SET 
            eye_unlocked = TRUE,
            eye_opened_at = ${now}
          WHERE email = ${email}
        `;

        return new Response(
          JSON.stringify({ 
            success: true,
            riddle: "The number of divine perfection.\nDays of creation. Wonders of the world.\nCount them. Return for each."
          }),
          { status: 200, headers }
        );

      case 'unlock_chat':
        // Chat freischalten (nach 168h)
        await sql`
          UPDATE users 
          SET chat_unlocked = TRUE
          WHERE email = ${email}
        `;

        return new Response(
          JSON.stringify({ success: true, message: 'Chat unlocked' }),
          { status: 200, headers }
        );

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers }
        );
    }

  } catch (error) {
    console.error('Easter egg error:', error);
    return new Response(
      JSON.stringify({ error: 'Server error', details: error.message }),
      { status: 500, headers }
    );
  }
}
