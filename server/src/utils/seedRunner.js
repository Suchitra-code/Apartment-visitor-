require('dotenv').config();
const { connectDB, disconnectDB } = require('../config/db');
const seedData = require('./seedData');

const run = async () => {
  try {
    await connectDB();
    await seedData();
    console.log('🎉 Seed Runner finished cleanly.');
    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('Fatal Seed Runner Failure:', err);
    process.exit(1);
  }
};

run();
