import('./src/controllers/userAvatar').then(mod => console.log('userAvatar OK', Object.keys(mod))).catch(err => { console.error('userAvatar import error', err); process.exit(1); });
