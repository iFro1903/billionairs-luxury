/**
 * Generate VAPID Keys for Web Push Notifications
 * Run: node scripts/generate-vapid-keys.js
 */

async function generateVapidKeys() {
  // Generate VAPID key pair using Web Crypto API
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256'
    },
    true,
    ['sign', 'verify']
  );

  // Export public key
  const publicKeyRaw = await crypto.subtle.exportKey('raw', keyPair.publicKey);
  const publicKeyArray = new Uint8Array(publicKeyRaw);
  const publicKeyBase64 = Buffer.from(publicKeyArray).toString('base64url');

  // Export private key
  const privateKeyRaw = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
  const privateKeyArray = new Uint8Array(privateKeyRaw);
  const privateKeyBase64 = Buffer.from(privateKeyArray).toString('base64url');

  console.log('\n🔑 VAPID Keys Generated Successfully!\n');
  console.log('Add these to your Vercel Environment Variables:\n');
  console.log('VAPID_PUBLIC_KEY=' + publicKeyBase64);
  console.log('VAPID_PRIVATE_KEY=' + privateKeyBase64);
  console.log('\nVAPID_SUBJECT=mailto:furkan_akaslan@hotmail.com');
  console.log('\n⚠️  Keep the private key secret! Never commit it to git.\n');
}

generateVapidKeys().catch(console.error);
