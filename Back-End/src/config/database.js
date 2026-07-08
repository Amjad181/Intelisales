const mongoose = require('mongoose');
const { env } = require('./env');

const connectDatabase = async () => {
  if (env.nodeEnv === 'test') {
    return null;
  }

  mongoose.set('strictQuery', true);
  return mongoose.connect(env.mongoUri);
};

module.exports = { connectDatabase };
