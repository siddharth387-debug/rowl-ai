const mongoose = require('mongoose');

const TEST_DB_URI = process.env.TEST_MONGO_URI || 'mongodb://localhost:27017/rowl_ai_test';

async function connectTestDb() {
  await mongoose.connect(TEST_DB_URI);
}

async function closeTestDb() {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
}

async function clearTestDb() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

module.exports = { connectTestDb, closeTestDb, clearTestDb };