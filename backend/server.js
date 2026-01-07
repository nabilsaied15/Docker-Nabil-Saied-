const app = require('./src/app');
const { initializeDatabases } = require('./src/config/database');

const startPort = parseInt(process.env.PORT, 10) || 3000;
const maxAttempts = 10;
let attempts = 0;

const startServer = async () => {
  try {
    console.log('🔄 Initialisation des bases de données...');
    await initializeDatabases();
    
    const tryListen = (port) => {
      attempts += 1;
      const server = app.listen(port, () => {
        console.log(`\n Serveur démarré sur le port ${port}`);
        console.log(` Documentation: http://localhost:${port}/api-docs`);
        console.log(` API: http://localhost:${port}/api`);
        console.log(`\n Application prête à recevoir des requêtes!\n`);
      });

      server.on('error', (err) => {
        if (err && err.code === 'EADDRINUSE') {
          console.warn(`⚠️  Port ${port} déjà utilisé.`);
          if (attempts < maxAttempts) {
            const nextPort = port + 1;
            console.log(`🔄 Tentative pour démarrer sur le port ${nextPort} (essai ${attempts + 1}/${maxAttempts})...`);
            setTimeout(() => tryListen(nextPort), 100);
          } else {
            console.error(`❌ Impossible de trouver un port libre après ${maxAttempts} tentatives.`);
            console.error(`💡 Définissez une autre valeur pour PORT ou libérez le port.`);
            process.exit(1);
          }
        } else {
          console.error('❌ Erreur du serveur :', err);
          process.exit(1);
        }
      });
    };

    tryListen(startPort);
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', async () => {
  console.log('\n🛑 Arrêt du serveur...');
  const { pgPool } = require('./src/config/database');
  await pgPool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 Arrêt du serveur...');
  const { pgPool } = require('./src/config/database');
  await pgPool.end();
  process.exit(0);
});

startServer();
