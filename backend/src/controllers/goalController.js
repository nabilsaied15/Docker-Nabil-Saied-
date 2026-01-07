const GoalService = require('../services/goalService');

exports.createGoal = async (req, res, next) => {
  try {
    const goal = await GoalService.createGoal(req.body, req.user.id);
    res.status(201).json(goal);
  } catch (error) {
    next(error);
  }
};

exports.getUserGoals = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Utilisateur non authentifié' });
    }
    const { status } = req.query;
    const goals = await GoalService.getUserGoals(req.user.id, status);
    res.json(goals);
  } catch (error) {
    console.error('Erreur dans getUserGoals controller:', error);
    next(error);
  }
};

exports.getGoal = async (req, res, next) => {
  try {
    const goal = await GoalService.getGoalById(req.params.id, req.user.id);
    res.json(goal);
  } catch (error) {
    if (error.message === 'Objectif non trouvé') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'Accès non autorisé') {
      return res.status(403).json({ message: error.message });
    }
    next(error);
  }
};

exports.updateGoal = async (req, res, next) => {
  try {
    const goal = await GoalService.updateGoal(req.params.id, req.user.id, req.body);
    res.json(goal);
  } catch (error) {
    if (error.message === 'Objectif non trouvé') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'Accès non autorisé') {
      return res.status(403).json({ message: error.message });
    }
    next(error);
  }
};

exports.deleteGoal = async (req, res, next) => {
  try {
    await GoalService.deleteGoal(req.params.id, req.user.id);
    res.json({ message: 'Objectif supprimé avec succès' });
  } catch (error) {
    if (error.message === 'Objectif non trouvé') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'Accès non autorisé') {
      return res.status(403).json({ message: error.message });
    }
    next(error);
  }
};

exports.updateProgress = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Utilisateur non authentifié' });
    }
    const goal = await GoalService.updateGoalProgress(req.params.id, req.user.id);
    res.json(goal);
  } catch (error) {
    console.error('Erreur dans updateProgress controller:', error);
    if (error.message === 'Objectif non trouvé' || error.message.includes('non trouvé')) {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
};

