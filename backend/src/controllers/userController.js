const User = require('../models/User');
const { pgPool } = require('../config/database');
const bcrypt = require('bcryptjs');

exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      created_at: user.created_at
    });
  } catch (error) {
    next(error);
  }
};

exports.updateUserProfile = async (req, res, next) => {
  try {
    const { email, currentPassword, newPassword } = req.body;
    const updates = {};
    const values = [];
    let paramCount = 1;

    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    if (email && email !== currentUser.email) {
      const existingUser = await User.findByEmail(email);
      if (existingUser && existingUser.id !== req.user.id) {
        return res.status(400).json({ message: 'Email déjà utilisé' });
      }
      updates.email = email;
    }

    
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Mot de passe actuel requis' });
      }

    
      const isValidPassword = await bcrypt.compare(currentPassword, currentUser.password);
      if (!isValidPassword) {
        return res.status(400).json({ message: 'Mot de passe actuel incorrect' });
      }


      const hashedPassword = await bcrypt.hash(newPassword, 12);
      updates.password = hashedPassword;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'Aucune modification fournie' });
    }

    let setClause = [];
    if (updates.email) {
      setClause.push(`email = $${paramCount}`);
      values.push(updates.email);
      paramCount++;
    }
    if (updates.password) {
      setClause.push(`password = $${paramCount}`);
      values.push(updates.password);
      paramCount++;
    }
    setClause.push(`updated_at = CURRENT_TIMESTAMP`);

    values.push(req.user.id);

    const query = `
      UPDATE users 
      SET ${setClause.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, role, created_at, updated_at
    `;

    const result = await pgPool.query(query, values);
    
    res.json({
      message: 'Profil mis à jour avec succès',
      user: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT id, email, role, created_at 
      FROM users 
      WHERE 1=1
    `;
    let countQuery = `SELECT COUNT(*) FROM users WHERE 1=1`;
    const values = [];
    let paramCount = 1;

    if (search) {
      query += ` AND email ILIKE $${paramCount}`;
      countQuery += ` AND email ILIKE $${paramCount}`;
      values.push(`%${search}%`);
      paramCount++;
    }


    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(parseInt(limit), offset);

   
    const usersResult = await pgPool.query(query, values);
    
    const countValues = search ? [values[0]] : [];
    const countResult = await pgPool.query(countQuery, countValues);
    const totalUsers = parseInt(countResult.rows[0].count);

    res.json({
      users: usersResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalUsers,
        pages: Math.ceil(totalUsers / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.id;

    
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({ message: 'Vous ne pouvez pas supprimer votre propre compte' });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    const query = 'DELETE FROM users WHERE id = $1';
    await pgPool.query(query, [userId]);

    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    next(error);
  }
};

exports.getUserStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { period = 'month' } = req.query;

    let dateFilter = '';
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
      default:
        dateFilter = '';
    }

    const activitiesQuery = `
      SELECT 
        COUNT(*) as total_activities,
        SUM(duration) as total_duration,
        SUM(calories) as total_calories,
        SUM(distance) as total_distance,
        AVG(duration) as avg_duration
      FROM activities 
      WHERE user_id = $1 ${dateFilter}
    `;
    const byTypeQuery = `
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

    const workoutsQuery = `
      SELECT COUNT(*) as total_workouts
      FROM workouts 
      WHERE user_id = $1 ${dateFilter.replace('date', 'created_at')}
    `;

    const mealsQuery = `
      SELECT 
        COUNT(*) as total_meals,
        SUM(calories) as total_calories_consumed
      FROM meals 
      WHERE user_id = $1 ${dateFilter.replace('date', 'date')}
    `;

    const [activitiesResult, byTypeResult, workoutsResult, mealsResult] = await Promise.all([
      pgPool.query(activitiesQuery, [userId]),
      pgPool.query(byTypeQuery, [userId]),
      pgPool.query(workoutsQuery, [userId]),
      pgPool.query(mealsQuery, [userId])
    ]);

    const stats = {
      period,
      summary: {
        totalActivities: parseInt(activitiesResult.rows[0]?.total_activities) || 0,
        totalDuration: parseInt(activitiesResult.rows[0]?.total_duration) || 0,
        totalCaloriesBurned: parseInt(activitiesResult.rows[0]?.total_calories) || 0,
        totalDistance: parseFloat(activitiesResult.rows[0]?.total_distance) || 0,
        totalWorkouts: parseInt(workoutsResult.rows[0]?.total_workouts) || 0,
        totalMeals: parseInt(mealsResult.rows[0]?.total_meals) || 0,
        totalCaloriesConsumed: parseInt(mealsResult.rows[0]?.total_calories_consumed) || 0
      },
      byType: byTypeResult.rows,
      averages: {
        avgDuration: parseFloat(activitiesResult.rows[0]?.avg_duration) || 0,
        caloriesPerActivity: activitiesResult.rows[0]?.total_activities > 0 
          ? Math.round(activitiesResult.rows[0]?.total_calories / activitiesResult.rows[0]?.total_activities)
          : 0,
        activitiesPerWeek: period === 'week' 
          ? parseInt(activitiesResult.rows[0]?.total_activities) || 0
          : Math.round((parseInt(activitiesResult.rows[0]?.total_activities) || 0) / 
              (period === 'month' ? 4.33 : period === 'year' ? 52 : 1))
      }
    };

    res.json(stats);
  } catch (error) {
    next(error);
  }
};

exports.getUserActivities = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, type } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT * FROM activities 
      WHERE user_id = $1
    `;
    let countQuery = `SELECT COUNT(*) FROM activities WHERE user_id = $1`;
    const values = [userId];
    let paramCount = 2;

    if (type) {
      query += ` AND type = $${paramCount}`;
      countQuery += ` AND type = $${paramCount}`;
      values.push(type);
      paramCount++;
    }
    query += ` ORDER BY date DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(parseInt(limit), offset);

    const [activitiesResult, countResult] = await Promise.all([
      pgPool.query(query, values),
      pgPool.query(countQuery, [userId])
    ]);

    const total = parseInt(countResult.rows[0].count);

    res.json({
      activities: activitiesResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};