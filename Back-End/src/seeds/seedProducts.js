const mongoose = require('mongoose');

const { connectDatabase } = require('../config/database');
const { Product, PRODUCT_STATUSES, PRODUCT_UNITS } = require('../modules/products/product.model');

const seedProducts = [
  {
    name: 'Office Printer Paper',
    sku: 'PAPER-A4-001',
    barcode: '100000000001',
    category: 'Office Supplies',
    brand: 'IntelliOffice',
    description: 'A4 white printer paper pack for office use.',
    unit: PRODUCT_UNITS.PACK,
    basePrice: 6.5,
    currency: 'SYP',
    taxRate: 0,
  },
  {
    name: 'Wireless Barcode Scanner',
    sku: 'SCANNER-WL-001',
    barcode: '100000000002',
    category: 'Hardware',
    brand: 'ScanPro',
    description: 'Wireless handheld barcode scanner for sales and inventory workflows.',
    unit: PRODUCT_UNITS.PIECE,
    basePrice: 85,
    currency: 'SYP',
    taxRate: 0,
  },
  {
    name: 'POS Receipt Roll',
    sku: 'ROLL-POS-001',
    barcode: '100000000003',
    category: 'POS Supplies',
    brand: 'ThermoLine',
    description: 'Thermal receipt paper roll for POS printers.',
    unit: PRODUCT_UNITS.BOX,
    basePrice: 18,
    currency: 'SYP',
    taxRate: 0,
  },
  {
    name: 'Thermal Label Roll',
    sku: 'ROLL-LABEL-001',
    barcode: '100000000004',
    category: 'POS Supplies',
    brand: 'ThermoLine',
    description: 'Thermal label roll for product labels and shelf tags.',
    unit: PRODUCT_UNITS.BOX,
    basePrice: 22,
    currency: 'SYP',
    taxRate: 0,
  },
  {
    name: 'Packing Tape',
    sku: 'TAPE-PACK-001',
    barcode: '100000000005',
    category: 'Packaging',
    brand: 'PackRight',
    description: 'Clear packing tape for delivery and storage boxes.',
    unit: PRODUCT_UNITS.PACK,
    basePrice: 9.75,
    currency: 'SYP',
    taxRate: 0,
  },
  {
    name: 'Tablet Stand',
    sku: 'STAND-TAB-001',
    barcode: '100000000006',
    category: 'Hardware',
    brand: 'DeskFlex',
    description: 'Adjustable tablet stand for sales counters.',
    unit: PRODUCT_UNITS.PIECE,
    basePrice: 28,
    currency: 'SYP',
    taxRate: 0,
  },
  {
    name: 'USB-C Charging Cable',
    sku: 'CABLE-USBC-001',
    barcode: '100000000007',
    category: 'Accessories',
    brand: 'ChargeLink',
    description: 'Durable USB-C charging cable for tablets and scanners.',
    unit: PRODUCT_UNITS.PIECE,
    basePrice: 7.25,
    currency: 'SYP',
    taxRate: 0,
  },
  {
    name: 'Inventory Scanner Battery',
    sku: 'BATTERY-SCAN-001',
    barcode: '100000000008',
    category: 'Hardware',
    brand: 'ScanPro',
    description: 'Replacement battery for handheld inventory scanners.',
    unit: PRODUCT_UNITS.PIECE,
    basePrice: 32,
    currency: 'SYP',
    taxRate: 0,
  },
  {
    name: 'Delivery Box Small',
    sku: 'BOX-DEL-S-001',
    barcode: '100000000009',
    category: 'Packaging',
    brand: 'PackRight',
    description: 'Small cardboard delivery box for packaged orders.',
    unit: PRODUCT_UNITS.BOX,
    basePrice: 14,
    currency: 'SYP',
    taxRate: 0,
  },
  {
    name: 'Delivery Box Large',
    sku: 'BOX-DEL-L-001',
    barcode: '100000000010',
    category: 'Packaging',
    brand: 'PackRight',
    description: 'Large cardboard delivery box for packaged orders.',
    unit: PRODUCT_UNITS.BOX,
    basePrice: 20,
    currency: 'SYP',
    taxRate: 0,
  },
];

const runSeed = async () => {
  await connectDatabase();

  for (const seedProduct of seedProducts) {
    const sku = seedProduct.sku.trim().toUpperCase();
    const existingProduct = await Product.findOne({ sku });

    if (existingProduct) {
      for (const [field, value] of Object.entries(seedProduct)) {
        existingProduct[field] = value;
      }

      existingProduct.sku = sku;
      existingProduct.status = PRODUCT_STATUSES.ACTIVE;
      await existingProduct.save();
    } else {
      await Product.create({
        ...seedProduct,
        sku,
        status: PRODUCT_STATUSES.ACTIVE,
      });
    }
  }

  console.log('Seed products created or updated successfully.');
};

runSeed()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('Seed products failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  });
