Promise.all([
  import('./src/controllers/userAvatar'),
  import('./src/controllers/questions'),
  import('./src/controllers/profileController')
]).then(mods => {
  console.log('loaded controllers:', mods.map(m => Object.keys(m)));
}).catch(err => { console.error('load error', err); process.exit(1); });
