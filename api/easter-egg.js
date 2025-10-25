import { neon } from '@neondatabase/serverless';
import { withRateLimit } from '../lib/rate-limiter.js';

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Rate Limiting: 50 Requests/Minute
  return withRateLimit(req, async () => {

  try {
    const sql = neon(process.env.DATABASE_URL);
    
    // Parse body manually for Vercel
    let body;
    if (typeof req.body === 'string') {
      body = JSON.parse(req.body);
    } else {
      body = req.body;
    }
    
    const { email, action } = body;

    if (!email || !action) {
      return res.status(400).json({ error: 'Email and action required' });
    }

    // Get user
    const users = await sql`SELECT * FROM users WHERE email = ${email}`;
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
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

        return res.status(200).json({
          showPyramid,
          pyramidUnlocked: user.pyramid_unlocked || false,
          eyeUnlocked: user.eye_unlocked || false,
          eyeReady,
          chatUnlocked: user.chat_unlocked || false,
          chatReady,
          loginStreak: user.login_streak || 0,
          daysSinceEyeOpened
        });
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
        return res.status(200).json({ success: true });
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

        return res.status(200).json({ 
          success: true,
          riddle
        });
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

        return res.status(200).json({ 
          success: true,
          loginStreak: newStreak
        });
      }

      // ===== UNLOCK EYE =====
      case 'unlock_eye': {
        const now = new Date();
        const hoursSincePyramid = (now - new Date(user.pyramid_opened_at)) / (1000 * 60 * 60);
        
        if (hoursSincePyramid < 72 || user.login_streak < 3) {
          return res.status(400).json({ 
            error: 'Requirements not met',
            hoursSincePyramid,
            loginStreak: user.login_streak
          });
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

        return res.status(200).json({ 
          success: true,
          riddle
        });
      }

      // ===== UNLOCK CHAT =====
      case 'unlock_chat': {
        const now = new Date();
        const hoursSinceEye = (now - new Date(user.eye_opened_at)) / (1000 * 60 * 60);
        
        if (hoursSinceEye < 168) {
          return res.status(400).json({ 
            error: 'Must wait 168 hours',
            hoursSinceEye
          });
        }

        await sql`
          UPDATE users 
          SET chat_unlocked = TRUE,
              chat_ready = TRUE,
              chat_opened_at = NOW()
          WHERE email = ${email}
        `;

        return res.status(200).json({ 
          success: true,
          message: 'Chat unlocked!'
        });
      }

      // ===== MARK CHAT SESSION =====
      case 'mark_chat_session': {
        // Update chat_opened_at to NOW for new session
        await sql`
          UPDATE users 
          SET chat_opened_at = NOW()
          WHERE email = ${email}
        `;

        return res.status(200).json({ 
          success: true,
          message: 'Session marked'
        });
      }

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

  } catch (error) {
    console.error('Easter Egg API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
  }, { limit: 50, windowMs: 60000 }); // 50 Requests pro Minute
}
