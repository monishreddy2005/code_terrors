const { query } = require('./db/database');

async function testConnection() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const result = await query('SELECT NOW() as current_time');
    console.log('✅ Database connection successful!');
    console.log('Current time from database:', result.rows[0].current_time);
    
    // Test if tables exist
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'skills', 'swap_requests')
      ORDER BY table_name
    `);
    
    console.log('✅ Database tables found:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    console.log('\n🎉 Database setup is complete and working!');
    console.log('You can now start the server with: npm run dev');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\nPlease check:');
    console.log('1. PostgreSQL is running');
    console.log('2. Database credentials in config.env are correct');
    console.log('3. Database "odoo_hackathon" exists');
    console.log('4. Schema has been imported from odoo_hackathon.sql');
  }
}

testConnection(); 