const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod = null;

const connectDB = async () => {
  try {
    let mongoURI = process.env.MONGODB_URI;

    // Check if real URI is available and valid
    if (!mongoURI || mongoURI.includes('your_mongodb_connection_string_here')) {
      console.log('⚠️ No valid MONGODB_URI found. Initializing MongoMemoryServer (In-Memory Database fallback)...');
      mongod = await MongoMemoryServer.create();
      mongoURI = mongod.getUri();
      console.log(`✅ In-Memory MongoDB running at: ${mongoURI}`);
    } else {
      console.log('Connecting to provided MongoDB Atlas / Remote Cluster...');
    }

    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 8000,
    });

    console.log(`🚀 MongoDB Connected successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // If remote connection failed, fall back to memory server automatically
    if (!mongod) {
      console.log('🔄 Attempting fallback to in-memory MongoDB server...');
      try {
        mongod = await MongoMemoryServer.create();
        const fallbackURI = mongod.getUri();
        const conn = await mongoose.connect(fallbackURI);
        console.log(`✅ Fallback in-memory MongoDB connected: ${conn.connection.host}`);
        return conn;
      } catch (memErr) {
        console.error('Failed to start in-memory MongoDB fallback:', memErr);
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongod) {
      await mongod.stop();
    }
  } catch (error) {
    console.error('Error disconnecting database:', error);
  }
};

module.exports = { connectDB, disconnectDB };
