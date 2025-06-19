/* eslint-env node */
import webpush from 'web-push';

const vapidKeys = webpush.generateVAPIDKeys();

console.log('VAPID Keys Generated:');
console.log('=====================');
console.log('Public Key:', vapidKeys.publicKey);
console.log('Private Key:', vapidKeys.privateKey);
console.log('\nAdd these to your Netlify environment variables:');
console.log('VITE_VAPID_PUBLIC_KEY =', vapidKeys.publicKey);
console.log('VAPID_PRIVATE_KEY =', vapidKeys.privateKey);
