#!/usr/bin/env node

/**
 * Generate Admin Password Hash for BILLIONAIRS LUXURY
 * 
 * Usage:
 *   node scripts/generate-admin-password-hash.js
 *   node scripts/generate-admin-password-hash.js "YourPassword123"
 * 
 * Uses PBKDF2 with 100,000 iterations (Edge Runtime compatible)
 */

const crypto = require('crypto');
const readline = require('readline');

const PBKDF2_ITERATIONS = 100000;

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

async function generateHash(password) {
    if (!password || password.trim().length === 0) {
        console.error('❌ Error: Password cannot be empty');
        process.exit(1);
    }

    if (password.length < 8) {
        console.error('❌ Error: Password must be at least 8 characters long');
        process.exit(1);
    }

    // Generate 16-byte random salt
    const saltBuffer = crypto.randomBytes(16);
    const saltHex = saltBuffer.toString('hex');
    
    // Derive key with PBKDF2 (100k iterations)
    const derivedKey = crypto.pbkdf2Sync(password, saltBuffer, PBKDF2_ITERATIONS, 32, 'sha256');
    const hashHex = derivedKey.toString('hex');
    
    const fullHash = `pbkdf2$${PBKDF2_ITERATIONS}$${saltHex}$${hashHex}`;
    
    console.log('\n✅ Admin Password Hash Generated Successfully!\n');
    console.log('🔐 Algorithm: PBKDF2 with 100,000 iterations\n');
    console.log('Add this to your .env file:\n');
    console.log(`ADMIN_PASSWORD_HASH=${fullHash}`);
    console.log('\n📋 Copy the line above to your .env file');
    console.log('🚀 Also add it to Vercel Environment Variables:');
    console.log('   vercel env add ADMIN_PASSWORD_HASH\n');
    console.log('🔒 Keep this hash secure and never commit it to git!\n');
}
