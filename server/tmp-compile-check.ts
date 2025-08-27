import('./src/middleware/cloudinaryUpload').then(m => console.log('loaded', Object.keys(m))).catch(err => { console.error('err', err); process.exit(1); });
