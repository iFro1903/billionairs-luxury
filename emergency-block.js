// Emergency Block Script - Run this once to block suspicious email
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function blockSuspiciousEmail() {
    const suspiciousEmail = 'kerem.yalcin.d@gmail.com';
    
    try {
        // Check if user exists
        const user = await sql`SELECT email, is_blocked FROM users WHERE email = ${suspiciousEmail}`;
        
        if (user.length > 0) {
            
            // Block the user
            await sql`UPDATE users SET is_blocked = TRUE WHERE email = ${suspiciousEmail}`;
            
            // Delete all sessions
            await sql`DELETE FROM sessions WHERE user_email = ${suspiciousEmail}`;
            
        } else {
            
            // Add to blocklist preventively
            await sql`
                INSERT INTO users (email, is_blocked, created_at) 
                VALUES (${suspiciousEmail}, TRUE, NOW())
                ON CONFLICT (email) DO UPDATE SET is_blocked = TRUE
            `;
        }
        
    } catch (error) {
        console.error('Error:', error);
    }
}

blockSuspiciousEmail();
