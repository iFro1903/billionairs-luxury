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
    
    // Parse request body
    const body = await req.json();
    const { email, action } = body;

    if (!email || !action) {
      return new Response(
        JSON.stringify({ error: 'Email and action required' }),
        { status: 400, headers }
      );
    }

    // Get user
    const users = await sql`SELECT * FROM users WHERE email = ${email}`;
    if (users.length === 0) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers }
      );
    }
    const user = users[0];

    switch (action) {
      // ===== CHECK STATUS =====
      case 'check_status': {
        const now = new Date();
        let showPyramid = false;
        let eyeReady = false;
        let chatReady = false;

        // Check if pyramid should show (20 seconds after first access)
        if (user.first_dashboard_access && !user.pyramid_unlocked) {
          const timeSinceFirst = now - new Date(user.first_dashboard_access);
          showPyramid = timeSinceFirst >= 20000; // 20 seconds
        }

        // Check if eye should be ready (72 hours + 3 logins)
        if (user.pyramid_opened_at && !user.eye_unlocked && user.login_streak >= 3) {
          const hoursSincePyramid = (now - new Date(user.pyramid_opened_at)) / (1000 * 60 * 60);
          eyeReady = hoursSincePyramid >= 72;
        }

        // Check if chat should be ready (168 hours from eye unlock)
        let daysSinceEyeOpened = 0;
        if (user.eye_opened_at) {
          const hoursSinceEye = (now - new Date(user.eye_opened_at)) / (1000 * 60 * 60);
          if (!user.chat_unlocked) {
            chatReady = hoursSinceEye >= 168;
            
            // Auto-unlock chat if ready
            if (chatReady) {
              await sql`
                UPDATE users 
                SET chat_ready = TRUE
                WHERE email = ${email}
              `;
            }
          } else {
            // Already unlocked
            chatReady = true;
          }
          daysSinceEyeOpened = Math.min(Math.floor(hoursSinceEye / 24) + 1, 7); // 1-7 days
        }

        return new Response(
          JSON.stringify({
            showPyramid,
            pyramidUnlocked: user.pyramid_unlocked || false,
            eyeUnlocked: user.eye_unlocked || false,
            eyeReady,
            chatUnlocked: user.chat_unlocked || false,
            chatReady,
            loginStreak: user.login_streak || 0,
            daysSinceEyeOpened
          }),
          { status: 200, headers }
        );
      }

      // ===== FIRST ACCESS =====
      case 'first_access': {
        if (!user.first_dashboard_access) {
          await sql`
            UPDATE users 
            SET first_dashboard_access = NOW() 
            WHERE email = ${email}
          `;
        }
        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers }
        );
      }

      // ===== OPEN PYRAMID =====
      case 'open_pyramid': {
        await sql`
          UPDATE users 
          SET pyramid_unlocked = TRUE,
              pyramid_opened_at = NOW()
          WHERE email = ${email}
        `;

        const riddle = `The mark of power inverted lies.
Three dawns must break before your eyes.
Only those who persist shall see
What lies beyond eternity.`;

        // Send Easter Egg Email
        try {
          const userName = user.first_name || user.last_name ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : email.split('@')[0];
          const url = new URL(req.url);
          const baseUrl = `${url.protocol}//${url.host}`;
          await fetch(`${baseUrl}/api/email-service`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'easterEgg',
              to: email,
              userName: userName,
              eggName: '🔺 The Pyramid Awakens',
              eggDescription: 'You have discovered the hidden pyramid. A riddle awaits those who dare to look beyond the surface.'
            })
          });
          console.log(`📧 Pyramid unlock email sent to ${email}`);
        } catch (emailError) {
          console.error('Failed to send pyramid email:', emailError);
        }

        return new Response(
          JSON.stringify({ success: true, riddle }),
          { status: 200, headers }
        );
      }

      // ===== DAILY LOGIN =====
      case 'daily_login': {
        const now = new Date();
        const lastLogin = user.last_daily_login ? new Date(user.last_daily_login) : null;
        let newStreak = 1;

        if (lastLogin) {
          const hoursSinceLastLogin = (now - lastLogin) / (1000 * 60 * 60);
          
          if (hoursSinceLastLogin < 24) {
            // Same day, keep streak
            newStreak = user.login_streak || 1;
          } else if (hoursSinceLastLogin < 48) {
            // Next day, increment streak
            newStreak = (user.login_streak || 0) + 1;
          } else {
            // Gap > 1 day, reset streak
            newStreak = 1;
          }
        }

        await sql`
          UPDATE users 
          SET last_daily_login = NOW(),
              login_streak = ${newStreak}
          WHERE email = ${email}
        `;

        return new Response(
          JSON.stringify({ success: true, loginStreak: newStreak }),
          { status: 200, headers }
        );
      }

      // ===== UNLOCK EYE =====
      case 'unlock_eye': {
        const now = new Date();
        const hoursSincePyramid = (now - new Date(user.pyramid_opened_at)) / (1000 * 60 * 60);
        
        if (hoursSincePyramid < 72 || user.login_streak < 3) {
          return new Response(
            JSON.stringify({ 
              error: 'Requirements not met',
              hoursSincePyramid,
              loginStreak: user.login_streak
            }),
            { status: 400, headers }
          );
        }

        await sql`
          UPDATE users 
          SET eye_unlocked = TRUE,
              eye_opened_at = NOW()
          WHERE email = ${email}
        `;

        const riddle = `Count the days of creation.
One for each wonder of the world.
When seven suns have risen and fallen,
The final door will open.`;

        // Send Easter Egg Email
        try {
          const userName = user.first_name || user.last_name ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : email.split('@')[0];
          const url = new URL(req.url);
          const baseUrl = `${url.protocol}//${url.host}`;
          await fetch(`${baseUrl}/api/email-service`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'easterEgg',
              to: email,
              userName: userName,
              eggName: '👁️ The All-Seeing Eye',
              eggDescription: 'The eye has opened. You see what others cannot. Seven suns must rise before the final door reveals itself.'
            })
          });
          console.log(`📧 Eye unlock email sent to ${email}`);
        } catch (emailError) {
          console.error('Failed to send eye email:', emailError);
        }

        return new Response(
          JSON.stringify({ success: true, riddle }),
          { status: 200, headers }
        );
      }

      // ===== UNLOCK CHAT =====
      case 'unlock_chat': {
        const now = new Date();
        const hoursSinceEye = (now - new Date(user.eye_opened_at)) / (1000 * 60 * 60);
        
        if (hoursSinceEye < 168) {
          return new Response(
            JSON.stringify({ error: 'Must wait 168 hours', hoursSinceEye }),
            { status: 400, headers }
          );
        }

        await sql`
          UPDATE users 
          SET chat_unlocked = TRUE,
              chat_ready = TRUE,
              chat_opened_at = NOW()
          WHERE email = ${email}
        `;

        // Send Final Easter Egg Email
        try {
          const userName = user.first_name || user.last_name ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : email.split('@')[0];
          const url = new URL(req.url);
          const baseUrl = `${url.protocol}//${url.host}`;
          await fetch(`${baseUrl}/api/email-service`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'easterEgg',
              to: email,
              userName: userName,
              eggName: '💬 The Global Elite Chat',
              eggDescription: 'Seven days have passed. The final door opens. You are now among the elite few who have unlocked the complete experience. Welcome to the inner circle.'
            })
          });
          console.log(`📧 Chat unlock email sent to ${email}`);
        } catch (emailError) {
          console.error('Failed to send chat email:', emailError);
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Chat unlocked!' }),
          { status: 200, headers }
        );
      }

      // ===== MARK CHAT SESSION =====
      case 'mark_chat_session': {
        // Update chat_opened_at to NOW for new session
        await sql`
          UPDATE users 
          SET chat_opened_at = NOW()
          WHERE email = ${email}
        `;

        return new Response(
          JSON.stringify({ success: true, message: 'Session marked' }),
          { status: 200, headers }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers }
        );
    }

  } catch (error) {
    console.error('Easter Egg API Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers }
    );
  }
}
