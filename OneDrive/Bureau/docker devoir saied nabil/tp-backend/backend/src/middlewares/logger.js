const Log = require('../models/Log');

const requestLogger = async (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', async () => {
    try {
      await Log.create({
        userId: req.user ? req.user.id : 'anonymous',
        action: `${req.method} ${req.path}`,
        endpoint: req.path,
        method: req.method,
        statusCode: res.statusCode,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        metadata: {
          responseTime: Date.now() - start,
          query: req.query,
          body: req.method !== 'GET' ? req.body : undefined
        }
      });
    } catch (error) {
      console.error('Erreur journalisation:', error);
    }
  });

  next();
};

module.exports = requestLogger;