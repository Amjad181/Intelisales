const app = require('./app');
const { env } = require('./config/env');
const { connectDatabase } = require('./config/database');

const startServer = async () => {
  try {
    await connectDatabase();

    app.listen(env.port, env.host, () => {
      console.log(`IntelliSales backend running on http://${env.host}:${env.port}`);
    });
  } catch (error) {
    console.error('Failed to start IntelliSales backend:', error);
    process.exit(1);
  }
};

startServer();
