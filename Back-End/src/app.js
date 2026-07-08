const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const morgan = require('morgan');

const { env } = require('./config/env');
const authRoutes = require('./modules/auth/auth.routes');
const customerRoutes = require('./modules/customers/customer.routes');
const dashboardRoutes = require('./modules/dashboard/dashboard.routes');
const invoiceRoutes = require('./modules/invoices/invoice.routes');
const priceListRoutes = require('./modules/priceLists/priceList.routes');
const productRoutes = require('./modules/products/product.routes');
const recommendationRoutes = require('./modules/recommendations/recommendation.routes');
const userRoutes = require('./modules/users/user.routes');
const visitRoutes = require('./modules/visits/visit.routes');
const { sendSuccess, sendError } = require('./utils/apiResponse');
const { notFound } = require('./middlewares/notFound.middleware');
const { errorHandler } = require('./middlewares/error.middleware');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (env.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

app.get('/api/v1/health', (req, res) => sendSuccess(res, {
  message: 'IntelliSales backend is healthy',
  data: {
    status: 'ok',
    environment: env.nodeEnv,
  },
}));

app.get('/api/v1/health/db', (req, res) => {
  const readyState = mongoose.connection.readyState;
  const isConnected = readyState === 1;
  const data = {
    database: isConnected ? 'connected' : 'disconnected',
    readyState,
  };

  if (isConnected) {
    return sendSuccess(res, {
      message: 'Database connection is healthy',
      data,
    });
  }

  return sendError(res, {
    statusCode: 503,
    message: 'Database connection is not healthy',
    data,
  });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1/price-lists', priceListRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/recommendations', recommendationRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/visits', visitRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
