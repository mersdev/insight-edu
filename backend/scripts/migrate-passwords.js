import bcrypt from 'bcrypt';
import pool from '../src/config/database.js';

const SALT_ROUNDS = 10;

/**
 * Migrate all plain text passwords to hashed passwords
 */
async function migratePasswords() {
  try {
    console.log('Starting password migration...');

    // Get all users with plain text passwords
    const result = await pool.query(
      'SELECT id, email, password FROM users WHERE password IS NOT NULL AND password_hash IS NULL'
    );

    const users = result.rows;
    console.log(`Found ${users.length} users with plain text passwords`);

    if (users.length === 0) {
      console.log('No passwords to migrate');
      await pool.end();
      return;
    }

    // Hash each password
    let successCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        console.log(`Migrating password for user: ${user.email}`);
        
        // Hash the password
        const passwordHash = await bcrypt.hash(user.password, SALT_ROUNDS);

        // Update the user record
        await pool.query(
          `UPDATE users 
           SET password_hash = $1, 
               must_change_password = true,
               last_password_change = NOW()
           WHERE id = $2`,
          [passwordHash, user.id]
        );

        successCount++;
        console.log(`✓ Successfully migrated password for ${user.email}`);
      } catch (error) {
        errorCount++;
        console.error(`✗ Failed to migrate password for ${user.email}:`, error.message);
      }
    }

    console.log('\n=== Migration Summary ===');
    console.log(`Total users: ${users.length}`);
    console.log(`Successfully migrated: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log('========================\n');

    // Optionally, remove the old password column after successful migration
    // Uncomment the following lines if you want to drop the password column
    // console.log('Removing old password column...');
    // await pool.query('ALTER TABLE users DROP COLUMN IF EXISTS password');
    // console.log('✓ Old password column removed');

    await pool.end();
    console.log('Migration completed');
  } catch (error) {
    console.error('Migration failed:', error);
    await pool.end();
    process.exit(1);
  }
}

// Run migration
migratePasswords();

