const mongoose = require('mongoose');

// MongoDB connection string
const MONGODB_URI = 'mongodb+srv://bcs24020018_db_user:A2P6jOGa3UmZ8TOU@servease.xa4tlyb.mongodb.net/?retryWrites=true&w=majority&appName=ServEase';

async function clearDatabase() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📋 Found collections:', collections.map(c => c.name));

    // Clear all collections
    for (const collection of collections) {
      const result = await mongoose.connection.db.collection(collection.name).deleteMany({});
      console.log(`🗑️  Cleared ${collection.name}: ${result.deletedCount} documents`);
    }

    console.log('✅ Database cleared successfully!');
    console.log('🎯 You can now register a new user');
    
  } catch (error) {
    console.error('❌ Error clearing database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

clearDatabase();
