const mongoose = require('mongoose');

const { connectDatabase } = require('../config/database');
const { Product, PRODUCT_STATUSES } = require('../modules/products/product.model');
const {
  PriceList,
  PRICE_LIST_CUSTOMER_TYPES,
  PRICE_LIST_STATUSES,
} = require('../modules/priceLists/priceList.model');

const priceListDefinitions = [
  {
    name: 'Retail Price List',
    customerType: PRICE_LIST_CUSTOMER_TYPES.RETAIL,
    description: 'Default retail prices for standard customers.',
    multiplier: 1,
  },
  {
    name: 'Wholesale Price List',
    customerType: PRICE_LIST_CUSTOMER_TYPES.WHOLESALE,
    description: 'Wholesale prices for larger recurring customers.',
    multiplier: 0.9,
  },
  {
    name: 'Key Account Price List',
    customerType: PRICE_LIST_CUSTOMER_TYPES.KEY_ACCOUNT,
    description: 'Preferred prices for key account customers.',
    multiplier: 0.85,
  },
];

const roundMoney = (value) => Math.round(value * 100) / 100;

const runSeed = async () => {
  await connectDatabase();

  const products = await Product.find({ status: PRODUCT_STATUSES.ACTIVE }).sort({ name: 1 });

  if (products.length === 0) {
    throw new Error('No active products found. Run npm run seed:products first.');
  }

  for (const definition of priceListDefinitions) {
    const items = products.map((product) => ({
      productId: product._id,
      price: roundMoney(product.basePrice * definition.multiplier),
      currency: product.currency || 'SYP',
    }));

    const existingPriceList = await PriceList.findOne({ customerType: definition.customerType });

    if (existingPriceList) {
      existingPriceList.name = definition.name;
      existingPriceList.description = definition.description;
      existingPriceList.status = PRICE_LIST_STATUSES.ACTIVE;
      existingPriceList.items = items;
      await existingPriceList.save();
    } else {
      await PriceList.create({
        name: definition.name,
        customerType: definition.customerType,
        description: definition.description,
        status: PRICE_LIST_STATUSES.ACTIVE,
        items,
      });
    }
  }

  console.log('Seed price lists created or updated successfully.');
};

runSeed()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('Seed price lists failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  });
