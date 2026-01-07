const { pgPool } = require('../config/database');

class User {
  static async create({ email, password, role = 'user' }) {
    const query = `
      INSERT INTO users (email, password, role) 
      VALUES ($1, $2, $3) 
      RETURNING id, email, role, created_at
    `;
    const values = [email, password, role];
    const result = await pgPool.query(query, values);
    return result.rows[0];
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pgPool.query(query, [email]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT id, email, password, role, created_at FROM users WHERE id = $1';
    const result = await pgPool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = User;