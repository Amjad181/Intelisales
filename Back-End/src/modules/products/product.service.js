const { AppError } = require('../../utils/AppError');
const { formatPriceListItem, formatProductResponse } = require('../../utils/formatProductResponse');
const { USER_ROLES } = require('../../models/User');
const { Product, PRODUCT_STATUSES } = require('./product.model');

const MANAGE_PRODUCT_ROLES = [
  USER_ROLES.COMPANY_ADMIN,
  USER_ROLES.SALES_MANAGER,
  USER_ROLES.SALES_SUPERVISOR,
];

const READ_ONLY_PRODUCT_ROLES = [
  USER_ROLES.SALES_REPRESENTATIVE,
  USER_ROLES.ACCOUNTANT,
];

const userPopulateSelect = 'name email role status createdAt updatedAt';

const getActorId = (actor) => {
  if (actor.id) {
    return actor.id.toString();
  }

  if (actor._id && typeof actor._id.toString === 'function') {
    return actor._id.toString();
  }

  return actor.toString();
};

const getReferenceId = (reference) => {
  if (!reference) {
    return undefined;
  }

  if (typeof reference === 'string') {
    return reference;
  }

  if (reference._id && typeof reference._id.toString === 'function') {
    return reference._id.toString();
  }

  if (
    typeof reference.toString === 'function'
    && reference.toString !== Object.prototype.toString
  ) {
    return reference.toString();
  }

  if (reference.id && typeof reference.id === 'string') {
    return reference.id;
  }

  return undefined;
};

const isManagementRole = (role) => MANAGE_PRODUCT_ROLES.includes(role);
const isReadOnlyRole = (role) => READ_ONLY_PRODUCT_ROLES.includes(role);

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const populateProductUsers = (query) => query
  .populate('createdBy', userPopulateSelect)
  .populate('updatedBy', userPopulateSelect);

const findProductById = (productId) => populateProductUsers(Product.findById(productId));

const ensureSkuIsAvailable = async (sku, excludedProductId = null) => {
  const query = { sku };

  if (excludedProductId) {
    query._id = { $ne: excludedProductId };
  }

  const existingProduct = await Product.findOne(query);

  if (existingProduct) {
    throw new AppError('SKU already exists', 409);
  }
};

const applyCommonFilters = (filters, query) => {
  if (query.category) {
    filters.category = new RegExp(escapeRegex(query.category), 'i');
  }

  if (query.brand) {
    filters.brand = new RegExp(escapeRegex(query.brand), 'i');
  }

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    filters.basePrice = {};

    if (query.minPrice !== undefined) {
      filters.basePrice.$gte = query.minPrice;
    }

    if (query.maxPrice !== undefined) {
      filters.basePrice.$lte = query.maxPrice;
    }
  }

  if (query.search) {
    const searchRegex = new RegExp(escapeRegex(query.search), 'i');
    filters.$or = [
      { name: searchRegex },
      { sku: searchRegex },
      { barcode: searchRegex },
      { category: searchRegex },
      { brand: searchRegex },
    ];
  }

  return filters;
};

const buildProductFilters = (query, actor) => {
  const filters = {};

  if (isReadOnlyRole(actor.role)) {
    filters.status = PRODUCT_STATUSES.ACTIVE;
  } else if (query.status) {
    filters.status = query.status;
  }

  return applyCommonFilters(filters, query);
};

const buildPriceListFilters = (query) => applyCommonFilters({
  status: PRODUCT_STATUSES.ACTIVE,
}, query);

const listProducts = async (query, actor) => {
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 10);
  const skip = (page - 1) * limit;
  const filters = buildProductFilters(query, actor);
  const sortDirection = query.sortOrder === 'asc' ? 1 : -1;
  const sort = { [query.sortBy || 'createdAt']: sortDirection };

  const [products, total] = await Promise.all([
    populateProductUsers(Product.find(filters))
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Product.countDocuments(filters),
  ]);

  return {
    count: products.length,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
    products: products.map(formatProductResponse),
  };
};

const listPriceItems = async (query) => {
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 50);
  const skip = (page - 1) * limit;
  const filters = buildPriceListFilters(query);
  const sort = { name: 1 };

  const [products, total] = await Promise.all([
    Product.find(filters)
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Product.countDocuments(filters),
  ]);

  return {
    count: products.length,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
    items: products.map(formatPriceListItem),
  };
};

const getProductById = async (productId, actor) => {
  const product = await findProductById(productId);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  if (isReadOnlyRole(actor.role) && product.status !== PRODUCT_STATUSES.ACTIVE) {
    throw new AppError('Product not found', 404);
  }

  return formatProductResponse(product);
};

const createProduct = async (payload, actor) => {
  const sku = payload.sku || payload.productCode;

  await ensureSkuIsAvailable(sku);

  const actorId = getActorId(actor);
  const product = await Product.create({
    name: payload.name,
    sku,
    barcode: payload.barcode,
    category: payload.category,
    brand: payload.brand,
    description: payload.description,
    unit: payload.unit,
    basePrice: payload.basePrice,
    currency: payload.currency,
    taxRate: payload.taxRate,
    status: payload.status || PRODUCT_STATUSES.ACTIVE,
    createdBy: actorId,
    updatedBy: actorId,
  });

  return getProductById(getReferenceId(product), actor);
};

const updateProduct = async (productId, payload, actor) => {
  const product = await Product.findById(productId);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  const sku = payload.sku || payload.productCode;

  if (sku && sku !== product.sku) {
    await ensureSkuIsAvailable(sku, productId);
  }

  for (const field of [
    'name',
    'barcode',
    'category',
    'brand',
    'description',
    'unit',
    'basePrice',
    'currency',
    'taxRate',
    'status',
  ]) {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      product[field] = payload[field];
    }
  }

  if (sku) {
    product.sku = sku;
  }

  product.updatedBy = getActorId(actor);
  await product.save();

  return getProductById(productId, actor);
};

const updateProductPrice = async (productId, payload, actor) => {
  const product = await Product.findById(productId);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  product.basePrice = payload.basePrice;

  if (payload.currency) {
    product.currency = payload.currency;
  }

  if (payload.taxRate !== undefined) {
    product.taxRate = payload.taxRate;
  }

  product.updatedBy = getActorId(actor);
  await product.save();

  return getProductById(productId, actor);
};

const deactivateProduct = async (productId, actor) => {
  const product = await Product.findById(productId);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  product.status = PRODUCT_STATUSES.INACTIVE;
  product.updatedBy = getActorId(actor);
  await product.save();

  return getProductById(productId, actor);
};

module.exports = {
  createProduct,
  deactivateProduct,
  getProductById,
  isManagementRole,
  listPriceItems,
  listProducts,
  updateProduct,
  updateProductPrice,
};
