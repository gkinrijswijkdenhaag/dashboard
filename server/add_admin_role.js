const db = require('./config/db');

async function addAdminRole() {
  try {
    console.log('Adding admin role to database...');
    
    // Check if admin role already exists
    const roleExists = await db.query('SELECT * FROM role_passcodes WHERE role = $1', ['admin']);
    
    if (roleExists.rows.length > 0) {
      console.log('Admin role already exists in the database');
    } else {
      // Insert admin role with a placeholder — update via the admin panel after login
      await db.query(
        'INSERT INTO role_passcodes (role, passcode) VALUES ($1, $2)',
        ['admin', 'admin2025']
      );
      console.log('Admin role added. Set a strong passcode via the admin panel.');
    }
    
    // Verify roles in database (do not log passcode values)
    const roles = await db.query('SELECT role FROM role_passcodes');
    console.log('\nRoles in database:');
    roles.rows.forEach(row => {
      console.log(`- ${row.role}`);
    });
    
    console.log('\nAdmin role setup completed');
  } catch (error) {
    console.error('Error adding admin role:', error);
  } finally {
    // Close database connection
    db.pool.end();
  }
}

// Run the function
addAdminRole();
