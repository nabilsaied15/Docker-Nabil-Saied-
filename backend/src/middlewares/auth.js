const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[authMiddleware] Token manquant pour:', req.originalUrl);
      return res.status(401).json({ message: 'Token manquant' });
    }

    const token = authHeader.substring(7);
    
    if (!process.env.JWT_SECRET) {
      console.error('[authMiddleware] JWT_SECRET non défini');
      return res.status(500).json({ message: 'Erreur de configuration serveur' });
    }
    
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      console.log('[authMiddleware] Token invalide ou expiré:', jwtError.message);
      return res.status(401).json({ message: 'Token invalide ou expiré' });
    }
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      console.log('[authMiddleware] Utilisateur non trouvé pour userId:', decoded.userId);
      return res.status(401).json({ message: 'Utilisateur non trouvé' });
    }

    const { password, ...safeUser } = user;
    req.user = safeUser;
    next();
  } catch (error) {
    console.error('[authMiddleware] Erreur inattendue:', error);
    res.status(401).json({ message: 'Erreur d\'authentification' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Accès refusé' });
  }
  next();
};

module.exports = { authMiddleware, adminMiddleware };