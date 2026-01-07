require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pgPool } = require('./src/config/database');

async function createAdmin() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.log('Usage: node create-admin.js <email> <password>');
    console.log('Exemple: node create-admin.js admin@example.com motdepasse123');
    process.exit(1);
  }

  try {
    console.log('🔄 Test de connexion à PostgreSQL...');
    console.log(`   Host: ${process.env.PG_HOST || 'localhost'}`);
    console.log(`   Database: ${process.env.PG_DATABASE || 'sportapp'}`);
    console.log(`   User: ${process.env.PG_USER || 'postgres'}`);
    
    await pgPool.query('SELECT NOW()');
    console.log('✅ Connexion à PostgreSQL réussie\n');

    console.log(`🔍 Vérification de l'utilisateur ${email}...`);
    const existingUser = await pgPool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      console.log('   Utilisateur existant trouvé, mise à jour en admin...');
      const hashedPassword = await bcrypt.hash(password, 12);
      const result = await pgPool.query(
        'UPDATE users SET password = $1, role = $2 WHERE email = $3 RETURNING id, email, role',
        [hashedPassword, 'admin', email]
      );
      console.log('\n✅ Utilisateur mis à jour en admin:');
      console.log(`   ID: ${result.rows[0].id}`);
      console.log(`   Email: ${result.rows[0].email}`);
      console.log(`   Rôle: ${result.rows[0].role}`);
    } else {
      console.log('   Création d\'un nouvel utilisateur admin...');
      const hashedPassword = await bcrypt.hash(password, 12);
      const result = await pgPool.query(
        'INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id, email, role',
        [email, hashedPassword, 'admin']
      );
      console.log('\n✅ Admin créé avec succès:');
      console.log(`   ID: ${result.rows[0].id}`);
      console.log(`   Email: ${result.rows[0].email}`);
      console.log(`   Rôle: ${result.rows[0].role}`);
    }
    
    console.log('\n🎉 Vous pouvez maintenant vous connecter avec cet email et mot de passe !');
    await pgPool.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    if (error.code === '28P01') {
      console.error('\n💡 Problème d\'authentification PostgreSQL.');
      console.error('   Vérifiez votre fichier .env et les paramètres PG_USER et PG_PASSWORD.');
      console.error('   Assurez-vous que le mot de passe PostgreSQL est correct.');
    } else if (error.code === '3D000') {
      console.error('\n💡 La base de données n\'existe pas.');
      console.error('   Créez la base de données avec: CREATE DATABASE sportapp;');
    } else if (error.code === '42P01') {
      console.error('\n💡 La table users n\'existe pas.');
      console.error('   Exécutez le script SQL: psql -U postgres -d sportapp -f database/schema.sql');
    }
    await pgPool.end();
    process.exit(1);
  }
}

createAdmin();

