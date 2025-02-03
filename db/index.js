const { Pool } = require('pg');

// Replace these values with your actual PostgreSQL credentials
const pool = new Pool({
  user: 'your_username',
  host: 'localhost',
  database: 'employee_db',
  password: 'your_password',
  port: 5432,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
