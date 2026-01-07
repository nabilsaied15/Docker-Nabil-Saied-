const { pgPool } = require('../config/database');

class Goal {
  static async create({ userId, title, description, type, targetValue, startDate, endDate }) {
    const query = `
      INSERT INTO goals (user_id, title, description, type, target_value, start_date, end_date) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *
    `;
    const values = [userId, title, description, type, targetValue, startDate, endDate];
    const result = await pgPool.query(query, values);
    return result.rows[0];
  }

  static async findByUserId(userId, status = null) {
    let query = 'SELECT * FROM goals WHERE user_id = $1';
    const values = [userId];
    
    if (status) {
      query += ' AND status = $2';
      values.push(status);
    }
    
    query += ' ORDER BY created_at DESC';
    const result = await pgPool.query(query, values);
    return result.rows;
  }

  static async findById(id) {
    const query = 'SELECT * FROM goals WHERE id = $1';
    const result = await pgPool.query(query, [id]);
    return result.rows[0];
  }

  static async update(id, userId, updates) {
    const allowedFields = ['title', 'description', 'target_value', 'current_value', 'start_date', 'end_date', 'status'];
    const setClause = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        setClause.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (setClause.length === 0) {
      throw new Error('Aucun champ valide à mettre à jour');
    }

    values.push(id, userId);
    const query = `
      UPDATE goals 
      SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
      RETURNING *
    `;
    const result = await pgPool.query(query, values);
    return result.rows[0];
  }

  static async delete(id, userId) {
    const query = 'DELETE FROM goals WHERE id = $1 AND user_id = $2';
    await pgPool.query(query, [id, userId]);
  }

  static async updateProgress(goalId, userId, currentValue) {
    try {
      const existingGoal = await this.findById(goalId);
      if (!existingGoal) {
        throw new Error('Objectif non trouvé');
      }
      if (parseInt(existingGoal.user_id) !== parseInt(userId)) {
        throw new Error('Accès non autorisé');
      }

      const query = `
        UPDATE goals 
        SET current_value = $1, 
            status = CASE 
              WHEN $1 >= target_value THEN 'completed'
              ELSE status
            END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND user_id = $3
        RETURNING *
      `;
      const result = await pgPool.query(query, [currentValue, goalId, userId]);
      
      if (!result.rows || result.rows.length === 0) {
        throw new Error('Erreur lors de la mise à jour de l\'objectif');
      }
      return result.rows[0];
    } catch (error) {
      if (error.message === 'Objectif non trouvé' || error.message === 'Accès non autorisé') {
        throw error;
      }
      console.error('[Goal.updateProgress] Erreur SQL:', error);
      throw new Error('Erreur lors de la mise à jour de l\'objectif');
    }
  }
}

module.exports = Goal;

