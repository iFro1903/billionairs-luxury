// Generiere Admin Password Hash
import { hashPassword } from './lib/password-hash.js';

const password = 'Masallah1,';
const hash = await hashPassword(password);

console.log('='.repeat(60));
console.log('ADMIN PASSWORD HASH (Edge-kompatibel)');
console.log('='.repeat(60));
console.log('\nFüge diese Variable in Vercel Environment Variables ein:\n');
console.log('Name:  ADMIN_PASSWORD_HASH');
console.log('Value:', hash);
console.log('\n' + '='.repeat(60));
