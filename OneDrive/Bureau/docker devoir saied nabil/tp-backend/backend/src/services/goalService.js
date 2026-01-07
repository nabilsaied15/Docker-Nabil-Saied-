const Goal = require('../models/Goal');
const Activity = require('../models/Activity');
const { pgPool } = require('../config/database');

class GoalService {
  static async createGoal(goalData, userId) {
    const goal = await Goal.create({
      userId,
      title: goalData.title,
      description: goalData.description,
      type: goalData.type,
      targetValue: parseFloat(goalData.target_value),
      startDate: goalData.start_date,
      endDate: goalData.end_date
    });
    return {
      ...goal,
      current_value: parseFloat(goal.current_value) || 0,
      target_value: parseFloat(goal.target_value) || 0
    };
  }

  static async getUserGoals(userId, status = null) {
    try {
      await this.checkExpiredGoals(userId);
      
      const goals = await Goal.findByUserId(userId, status);
      return goals.map(goal => ({
        ...goal,
        current_value: parseFloat(goal.current_value) || 0,
        target_value: parseFloat(goal.target_value) || 0
      }));
    } catch (error) {
      console.error('Erreur dans getUserGoals:', error);
      throw error;
    }
  }

  static async getGoalById(id, userId) {
    const goal = await Goal.findById(id);
    if (!goal) {
      throw new Error('Objectif non trouvé');
    }
    if (goal.user_id !== userId) {
      throw new Error('Accès non autorisé');
    }
    return {
      ...goal,
      current_value: parseFloat(goal.current_value) || 0,
      target_value: parseFloat(goal.target_value) || 0
    };
  }

  static async updateGoal(id, userId, updates) {
    const goal = await Goal.findById(id);
    if (!goal) {
      throw new Error('Objectif non trouvé');
    }
    if (goal.user_id !== userId) {
      throw new Error('Accès non autorisé');
    }
    const updatedGoal = await Goal.update(id, userId, updates);
    return {
      ...updatedGoal,
      current_value: parseFloat(updatedGoal.current_value) || 0,
      target_value: parseFloat(updatedGoal.target_value) || 0
    };
  }

  static async deleteGoal(id, userId) {
    const goal = await Goal.findById(id);
    if (!goal) {
      throw new Error('Objectif non trouvé');
    }
    if (goal.user_id !== userId) {
      throw new Error('Accès non autorisé');
    }
    await Goal.delete(id, userId);
  }

  static async updateGoalProgress(goalId, userId) {
    try {
      console.log(`[updateGoalProgress] Début - goalId: ${goalId}, userId: ${userId}`);
      
      const goalIdInt = parseInt(goalId);
      const userIdInt = parseInt(userId);
      
      if (isNaN(goalIdInt) || isNaN(userIdInt)) {
        throw new Error('ID invalide');
      }
      
      const goal = await Goal.findById(goalIdInt);
      if (!goal) {
        console.log(`[updateGoalProgress] Objectif ${goalIdInt} non trouvé`);
        throw new Error('Objectif non trouvé');
      }
      
      console.log(`[updateGoalProgress] Objectif trouvé - user_id: ${goal.user_id}, type: ${goal.type}`);
      
      const goalUserId = parseInt(goal.user_id);
      
      if (goalUserId !== userIdInt) {
        console.log(`[updateGoalProgress] Accès refusé - goal.user_id: ${goalUserId}, userId: ${userIdInt}`);
        throw new Error('Accès non autorisé');
      }

      console.log(`[updateGoalProgress] Récupération des activités pour userId: ${userIdInt}`);
      const activities = await Activity.findByUserId(userIdInt);
      console.log(`[updateGoalProgress] ${activities.length} activités trouvées`);
      
      let currentValue = 0;

      const startDate = new Date(goal.start_date);
      const endDate = new Date(goal.end_date);
      
      console.log(`[updateGoalProgress] Période: ${startDate.toISOString()} - ${endDate.toISOString()}`);
      
      const relevantActivities = activities.filter(activity => {
        if (!activity) return false;
        
        const activityDate = new Date(activity.date || activity.created_at);
        const isInRange = activityDate >= startDate && activityDate <= endDate;
        return isInRange;
      });
      
      console.log(`[updateGoalProgress] ${relevantActivities.length} activités dans la période`);

      switch (goal.type) {
        case 'duration':
          currentValue = relevantActivities.reduce((sum, act) => {
            const duration = parseFloat(act.duration) || 0;
            return sum + duration;
          }, 0);
          break;
        case 'distance':
          currentValue = relevantActivities.reduce((sum, act) => {
            const distance = parseFloat(act.distance) || 0;
            return sum + distance;
          }, 0);
          break;
        case 'calories':
          currentValue = relevantActivities.reduce((sum, act) => {
            const calories = parseFloat(act.calories) || 0;
            return sum + calories;
          }, 0);
          break;
        case 'activities_count':
          currentValue = relevantActivities.length;
          break;
        default:
          console.warn(`[updateGoalProgress] Type d'objectif inconnu: ${goal.type}`);
          currentValue = 0;
      }

      currentValue = parseFloat(currentValue) || 0;
      
      console.log(`[updateGoalProgress] Valeur calculée: ${currentValue} pour type: ${goal.type}`);

      console.log(`[updateGoalProgress] Mise à jour de l'objectif ${goalIdInt} avec currentValue: ${currentValue}`);
      const updatedGoal = await Goal.updateProgress(goalIdInt, userIdInt, currentValue);
      
      if (!updatedGoal) {
        console.error(`[updateGoalProgress] updatedGoal est null/undefined`);
        throw new Error('Erreur lors de la mise à jour de l\'objectif');
      }
      
      console.log(`[updateGoalProgress] Objectif mis à jour avec succès`);

      return {
        ...updatedGoal,
        current_value: parseFloat(updatedGoal.current_value) || 0,
        target_value: parseFloat(updatedGoal.target_value) || 0
      };
    } catch (error) {
      console.error('Erreur dans updateGoalProgress:', error);
      console.error('Stack:', error.stack);
      throw error;
    }
  }
  
  static async checkExpiredGoals(userId) {
    try {
      const now = new Date();
      const query = `
        UPDATE goals 
        SET status = 'cancelled',
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1 
          AND status = 'active'
          AND end_date < $2
          AND current_value < target_value
        RETURNING id, title
      `;
      const result = await pgPool.query(query, [userId, now]);
      
      if (result.rows.length > 0) {
        console.log(`[checkExpiredGoals] ${result.rows.length} objectif(s) expiré(s) marqué(s) comme annulé(s)`);
      }
      
      return result.rows;
    } catch (error) {
      console.error('Erreur dans checkExpiredGoals:', error);
      throw error;
    }
  }
}

module.exports = GoalService;

