const { pgPool } = require('../config/database');
class Activity {
  static async create({ userId, type, duration, calories, distance, notes }) {
    const query = `
      INSERT INTO activities (user_id, type, duration, calories, distance, notes) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *
    `;
    const values = [userId, type, duration, calories, distance, notes];
    const result = await pgPool.query(query, values);
    return result.rows[0];
  }
  static async findByUserId(userId) {
    const query = 'SELECT * FROM activities WHERE user_id = $1 ORDER BY date DESC';
    const result = await pgPool.query(query, [userId]);
    return result.rows;
  }
  static async findById(id) {
    const query = 'SELECT * FROM activities WHERE id = $1';
    const result = await pgPool.query(query, [id]);
    return result.rows[0];
  }
  static async update(id, userId, { type, duration, calories, distance, notes }) {
    const query = `
      UPDATE activities 
      SET type = $3, duration = $4, calories = $5, distance = $6, notes = $7, updated_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    const values = [id, userId, type, duration, calories, distance, notes];
    const result = await pgPool.query(query, values);
    return result.rows[0];
  }
  
  static async delete(id, userId) {
    const query = 'DELETE FROM activities WHERE id = $1 AND user_id = $2';
    await pgPool.query(query, [id, userId]);
  }
}

module.exports = Activity;