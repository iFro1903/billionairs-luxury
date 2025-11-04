#!/usr/bin/env node

/**
 * Generate Admin Password Hash for BILLIONAIRS LUXURY
 * 
 * Usage:
 *   node scripts/generate-admin-password-hash.js
 *   node scripts/generate-admin-password-hash.js "YourPassword123"
 * 
 * The hash uses SHA-256 with UUID salt for Edge Runtime compatibility
 * (bcrypt doesn't work in Vercel Edge Runtime)
 */

const crypto = require('crypto');
const readline = require('readline');

// Get password from command line or prompt
const password = process.argv[2];

if (password) {
    generateHash(password);
} else {
    // Prompt for password
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question('Enter admin password: ', (password) => {
        rl.close();
        generateHash(password);
    });
}

function generateHash(password) {
    if (!password || password.trim().length === 0) {
        console.error('❌ Error: Password cannot be empty');
        process.exit(1);
    }

    if (password.length < 8) {
        console.error('❌ Error: Password must be at least 8 characters long');
        process.exit(1);
    }

    // Generate UUID salt
    const uuid = crypto.randomUUID();
    
    // Create hash with SHA-256
    const hash = crypto.createHash('sha256')
        .update(password + uuid)
        .digest('hex');
    
    const fullHash = `${uuid}$${hash}`;
    
    console.log('\n✅ Admin Password Hash Generated Successfully!\n');
    console.log('Add this to your .env file:\n');
    console.log(`ADMIN_PASSWORD_HASH=${fullHash}`);
    console.log('\n📋 Copy the line above to your .env file');
    console.log('🚀 Also add it to Vercel Environment Variables:');
    console.log('   vercel env add ADMIN_PASSWORD_HASH\n');
    console.log('🔒 Keep this hash secure and never commit it to git!\n');
}
