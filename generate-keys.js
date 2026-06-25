const crypto = require('crypto');
const fs = require('fs');

console.log('⏳ Generating secure 2048-bit RSA keypair...');

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
  }
});

// 1. Save the raw files to disk
fs.writeFileSync('private.pem', privateKey);
fs.writeFileSync('public.pem', publicKey);

// 2. Format the keys specifically for .env files (escaped newlines)
const envPrivateKey = privateKey.replace(/\r?\n/g, '\\n');
const envPublicKey = publicKey.replace(/\r?\n/g, '\\n');

console.log('✅ Keys generated and saved to private.pem and public.pem!');
console.log('\n================ COPY THESE LINES TO YOUR .env FILE ================');
console.log(`JWT_PRIVATE_KEY="${envPrivateKey}"`);
console.log(`JWT_PUBLIC_KEY="${envPublicKey}"`);
console.log('====================================================================\n');