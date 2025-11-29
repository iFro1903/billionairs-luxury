// Emergency Block Script - Run this once to block suspicious email
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function blockSuspiciousEmail() {
    const suspiciousEmail = 'kerem.yalcin.d@gmail.com';
    
    try {
        // Check if user exists
        const user = await sql`SELECT email, is_blocked FROM users WHERE email = ${suspiciousEmail}`;
        
        if (user.length > 0) {
            console.log('User found:', user[0]);
            
            // Block the user
            await sql`UPDATE users SET is_blocked = TRUE WHERE email = ${suspiciousEmail}`;
            console.log('✅ User blocked successfully');
            
            // Delete all sessions
            await sql`DELETE FROM sessions WHERE user_email = ${suspiciousEmail}`;
            console.log('✅ All sessions deleted');
            
        } else {
            console.log('❌ User does not exist in database');
            
            // Add to blocklist preventively
            await sql`
                INSERT INTO users (email, is_blocked, created_at) 
                VALUES (${suspiciousEmail}, TRUE, NOW())
                ON CONFLICT (email) DO UPDATE SET is_blocked = TRUE
            `;
            console.log('✅ Email added to blocklist preventively');
        }
        
    } catch (error) {
        console.error('Error:', error);
    }
}

blockSuspiciousEmail();
