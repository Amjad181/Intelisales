const { connectDatabase } = require('../config/database');
const { User, USER_ROLES, USER_STATUSES } = require('../models/User');
const mongoose = require('mongoose');

const seedUsers = [
  {
    name: 'Company Admin',
    email: 'admin@intellisales.com',
    password: 'Password123!',
    role: USER_ROLES.COMPANY_ADMIN,
  },
  {
    name: 'Sales Manager',
    email: 'manager@intellisales.com',
    password: 'Password123!',
    role: USER_ROLES.SALES_MANAGER,
  },
  {
    name: 'Sales Supervisor',
    email: 'supervisor@intellisales.com',
    password: 'Password123!',
    role: USER_ROLES.SALES_SUPERVISOR,
  },
  {
    name: 'Sales Representative',
    email: 'rep@intellisales.com',
    password: 'Password123!',
    role: USER_ROLES.SALES_REPRESENTATIVE,
  },
  {
    name: 'Accountant',
    email: 'accountant@intellisales.com',
    password: 'Password123!',
    role: USER_ROLES.ACCOUNTANT,
  },
];

const runSeed = async () => {
  await connectDatabase();

  for (const seedUser of seedUsers) {
    const existingUser = await User.findOne({ email: seedUser.email }).select('+password');

    if (existingUser) {
      existingUser.name = seedUser.name;
      existingUser.password = seedUser.password;
      existingUser.role = seedUser.role;
      existingUser.status = USER_STATUSES.ACTIVE;
      existingUser.refreshTokenVersion += 1;
      await existingUser.save();
    } else {
      await User.create({
        ...seedUser,
        status: USER_STATUSES.ACTIVE,
      });
    }
  }

  console.log('Seed users created or updated successfully.');
};

runSeed()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('Seed users failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  });
