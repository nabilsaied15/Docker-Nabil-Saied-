const ActivityService = require('../services/activityService');

exports.createActivity = async (req, res, next) => {
  try {
    const activity = await ActivityService.createActivity(req.body, req.user.id);
    res.status(201).json(activity);
  } catch (error) {
    next(error);
  }
};

exports.updateActivity = async (req, res, next) => {
  try {
    const activity = await ActivityService.updateActivity(req.params.id, req.body, req.user.id);
    res.json(activity);
  } catch (error) {
    if (error && error.message === 'Activité non trouvée') {
      return res.status(404).json({ message: error.message });
    }
    if (error && error.message === 'Accès non autorisé') {
      return res.status(403).json({ message: error.message });
    }
    next(error);
  }
};

exports.getUserActivities = async (req, res, next) => {
  try {
    const activities = await ActivityService.getUserActivities(req.user.id);
    res.json(activities);
  } catch (error) {
    next(error);
  }
};

exports.getActivity = async (req, res, next) => {
  try {
    const activity = await ActivityService.getActivityById(req.params.id, req.user.id);
    res.json(activity);
  } catch (error) {
    if (error && error.message === 'Activité non trouvée') {
      return res.status(404).json({ message: error.message });
    }
    if (error && error.message === 'Accès non autorisé') {
      return res.status(403).json({ message: error.message });
    }
    next(error);
  }
};

exports.deleteActivity = async (req, res, next) => {
  try {
    await ActivityService.deleteActivity(req.params.id, req.user.id);
    res.json({ message: 'Activité supprimée avec succès' });
  } catch (error) {
    if (error && error.message === 'Activité non trouvée') {
      return res.status(404).json({ message: error.message });
    }
    if (error && error.message === 'Accès non autorisé') {
      return res.status(403).json({ message: error.message });
    }
    next(error);
  }
};

exports.getStats = async (req, res, next) => {
  try {
    const { period = 'all' } = req.query;
    const stats = await ActivityService.getUserStats(req.user.id, period);
    res.json(stats);
  } catch (error) {
    next(error);
  }
};