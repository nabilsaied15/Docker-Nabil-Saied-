const Activity = require('../models/Activity');
const Goal = require('../models/Goal');
const { pgPool } = require('../config/database');

class ActivityService {
  static async createActivity(activityData, userId) {
    console.log(`[createActivity] Création d'une activité pour userId: ${userId}`);
    const activity = await Activity.create({
      ...activityData,
      userId
    });
    
    console.log(`[createActivity] Activité créée avec succès (id: ${activity.id})`);
    
    try {
      console.log(`[createActivity] Déclenchement de la mise à jour automatique des objectifs...`);
      await this.updateActiveGoals(userId);
      console.log(`[createActivity] Mise à jour des objectifs terminée`);
    } catch (error) {
      console.error('[createActivity] Erreur lors de la mise à jour automatique des objectifs:', error);
      console.error('[createActivity] Stack:', error.stack);
    }
    
    return activity;
  }
  
  static async updateActiveGoals(userId) {
    try {
      const activeGoals = await Goal.findByUserId(userId, 'active');
      
      if (activeGoals.length === 0) {
        return;
      }
      
      const activities = await Activity.findByUserId(userId);
      
      for (const goal of activeGoals) {
        try {
          const startDate = new Date(goal.start_date);
          const endDate = new Date(goal.end_date);
          endDate.setHours(23, 59, 59, 999);
          
          console.log(`[updateActiveGoals] Traitement objectif ${goal.id} (${goal.title}) - Période: ${startDate.toISOString().split('T')[0]} à ${endDate.toISOString().split('T')[0]}`);
          
          const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
          const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
          
          const relevantActivities = activities.filter(activity => {
            if (!activity) return false;
            
            const activityDate = new Date(activity.date || activity.created_at);
            const activityDateOnly = new Date(activityDate.getFullYear(), activityDate.getMonth(), activityDate.getDate());
            
            const isInRange = activityDateOnly >= startDateOnly && activityDateOnly <= endDateOnly;
            if (isInRange) {
              console.log(`[updateActiveGoals] Activité ${activity.id} (${activity.type}) du ${activityDateOnly.toISOString().split('T')[0]} incluse`);
            }
            
            return isInRange;
          });
          
          console.log(`[updateActiveGoals] Objectif ${goal.id}: ${relevantActivities.length} activités dans la période`);
          
          let currentValue = 0;
          
          switch (goal.type) {
            case 'duration':
              currentValue = relevantActivities.reduce((sum, act) => {
                return sum + (parseFloat(act.duration) || 0);
              }, 0);
              break;
            case 'distance':
              currentValue = relevantActivities.reduce((sum, act) => {
                return sum + (parseFloat(act.distance) || 0);
              }, 0);
              break;
            case 'calories':
              currentValue = relevantActivities.reduce((sum, act) => {
                return sum + (parseFloat(act.calories) || 0);
              }, 0);
              break;
            case 'activities_count':
              currentValue = relevantActivities.length;
              break;
          }
          
          currentValue = parseFloat(currentValue) || 0;
          
          console.log(`[updateActiveGoals] Objectif ${goal.id}: valeur calculée = ${currentValue}, cible = ${goal.target_value}`);
          
          const updatedGoal = await Goal.updateProgress(goal.id, userId, currentValue);
          
          if (updatedGoal && updatedGoal.status === 'completed') {
            console.log(`[updateActiveGoals] ✅ Objectif ${goal.id} (${goal.title}) est maintenant COMPLÉTÉ !`);
          }
        } catch (error) {
          console.error(`Erreur lors de la mise à jour de l'objectif ${goal.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Erreur dans updateActiveGoals:', error);
      throw error;
    }
  }

  static async getUserActivities(userId) {
    return await Activity.findByUserId(userId);
  }

  static async getActivityById(id, userId) {
    const activity = await Activity.findById(id);
    if (!activity) {
      throw new Error('Activité non trouvée');
    }
    if (activity.user_id !== userId) {
      throw new Error('Accès non autorisé');
    }
    return activity;
  }

  static async updateActivity(id, activityData, userId) {
    const activity = await Activity.findById(id);
    if (!activity) {
      throw new Error('Activité non trouvée');
    }
    if (activity.user_id !== userId) {
      throw new Error('Accès non autorisé');
    }
    
    const updatedActivity = await Activity.update(id, userId, activityData);
    
    try {
      await this.updateActiveGoals(userId);
    } catch (error) {
      console.error('Erreur lors de la mise à jour automatique des objectifs:', error);
    }
    
    return updatedActivity;
  }

  static async deleteActivity(id, userId) {
    const activity = await Activity.findById(id);
    if (!activity) {
      throw new Error('Activité non trouvée');
    }
    if (activity.user_id !== userId) {
      throw new Error('Accès non autorisé');
    }
    await Activity.delete(id, userId);
    
    try {
      await this.updateActiveGoals(userId);
    } catch (error) {
      console.error('Erreur lors de la mise à jour automatique des objectifs:', error);
    }
  }

  static async getUserStats(userId, period = 'all') {
    let dateFilter = '';
    const values = [userId];
    
    if (period !== 'all') {
      switch (period) {
        case 'week':
          dateFilter = "AND date >= NOW() - INTERVAL '7 days'";
          break;
        case 'month':
          dateFilter = "AND date >= NOW() - INTERVAL '30 days'";
          break;
        case 'year':
          dateFilter = "AND date >= NOW() - INTERVAL '365 days'";
          break;
      }
    }

    const statsQuery = `
      SELECT 
        COUNT(*) as total_activities,
        COALESCE(SUM(duration), 0) as total_duration,
        COALESCE(SUM(calories), 0) as total_calories,
        COALESCE(SUM(distance), 0) as total_distance,
        COALESCE(AVG(duration), 0) as avg_duration
      FROM activities 
      WHERE user_id = $1 ${dateFilter}
    `;

    const typeQuery = `
      SELECT 
        type,
        COUNT(*) as count,
        SUM(duration) as total_duration,
        SUM(calories) as total_calories,
        SUM(distance) as total_distance
      FROM activities 
      WHERE user_id = $1 ${dateFilter}
      GROUP BY type
      ORDER BY count DESC
    `;

    const { pgPool } = require('../config/database');
    const [statsResult, typeResult] = await Promise.all([
      pgPool.query(statsQuery, values),
      pgPool.query(typeQuery, values)
    ]);

    const stats = statsResult.rows[0];
    const activitiesByType = {};
    
    typeResult.rows.forEach(row => {
      activitiesByType[row.type] = {
        count: parseInt(row.count),
        totalDuration: parseInt(row.total_duration) || 0,
        totalCalories: parseInt(row.total_calories) || 0,
        totalDistance: parseFloat(row.total_distance) || 0
      };
    });

    return {
      period,
      totalActivities: parseInt(stats.total_activities) || 0,
      totalDuration: parseInt(stats.total_duration) || 0,
      totalCalories: parseInt(stats.total_calories) || 0,
      totalDistance: parseFloat(stats.total_distance) || 0,
      avgDuration: parseFloat(stats.avg_duration) || 0,
      activitiesByType
    };
  }
}

module.exports = ActivityService;