const { AppError } = require('../../utils/AppError');
const { formatUserResponse } = require('../../utils/formatUserResponse');
const { USER_ROLES } = require('../../models/User');
const { Product, PRODUCT_STATUSES } = require('../products/product.model');
const { PriceList, PRICE_LIST_STATUSES } = require('./priceList.model');

const MANAGE_PRICE_LIST_ROLES = [
  USER_ROLES.COMPANY_ADMIN,
  USER_ROLES.SALES_MANAGER,
  USER_ROLES.SALES_SUPERVISOR,
];

const READ_ONLY_PRICE_LIST_ROLES = [
  USER_ROLES.SALES_REPRESENTATIVE,
  USER_ROLES.ACCOUNTANT,
];

const userPopulateSelect = 'name email role status createdAt updatedAt';
const productPopulateSelect = 'name sku category unit basePrice currency taxRate status';

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

const isReadOnlyRole = (role) => READ_ONLY_PRICE_LIST_ROLES.includes(role);

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const formatReference = (value) => {
  if (!value) {
    return value;
  }

  if (value.email || value.role || value.name) {
    return formatUserResponse(value);
  }

  return getReferenceId(value);
};

const formatPriceListItem = (item) => {
  const product = item.productId;
  const productId = getReferenceId(product);
  const productCode = product && typeof product === 'object' ? product.sku : undefined;

  return {
    productId,
    productCode,
    productName: product && typeof product === 'object' ? product.name : undefined,
    price: item.price,
    currency: item.currency,
    basePrice: product && typeof product === 'object' ? product.basePrice : undefined,
    unit: product && typeof product === 'object' ? product.unit : undefined,
  };
};

const formatPriceListResponse = (priceList, { activeProductsOnly = false } = {}) => {
  if (!priceList) {
    return priceList;
  }

  const plainPriceList = typeof priceList.toJSON === 'function'
    ? priceList.toJSON()
    : { ...priceList };
  const id = plainPriceList.id || getReferenceId(plainPriceList._id);
  const items = (plainPriceList.items || []).filter((item) => {
    if (!activeProductsOnly) {
      return true;
    }

    const product = item.productId;

    if (product && typeof product === 'object' && product.status) {
      return product.status === PRODUCT_STATUSES.ACTIVE;
    }

    return true;
  });

  return {
    id,
    name: plainPriceList.name,
    customerType: plainPriceList.customerType,
    description: plainPriceList.description,
    status: plainPriceList.status,
    items: items.map(formatPriceListItem),
    createdBy: formatReference(plainPriceList.createdBy),
    updatedBy: formatReference(plainPriceList.updatedBy),
    createdAt: plainPriceList.createdAt,
    updatedAt: plainPriceList.updatedAt,
  };
};

const populatePriceList = (query) => query
  .populate('items.productId', productPopulateSelect)
  .populate('createdBy', userPopulateSelect)
  .populate('updatedBy', userPopulateSelect);

const ensureProductsExist = async (items = []) => {
  const uniqueIds = [...new Set(items.map((item) => item.productId))];

  for (const productId of uniqueIds) {
    const product = await Product.findById(productId);

    if (!product) {
      throw new AppError('Price list product not found', 404);
    }
  }
};

const buildFilters = (query, actor) => {
  const filters = {};

  if (isReadOnlyRole(actor.role)) {
    filters.status = PRICE_LIST_STATUSES.ACTIVE;
  } else if (query.status) {
    filters.status = query.status;
  }

  if (query.customerType) {
    filters.customerType = query.customerType;
  }

  if (query.search) {
    const searchRegex = new RegExp(escapeRegex(query.search), 'i');
    filters.$or = [
      { name: searchRegex },
      { description: searchRegex },
    ];
  }

  return filters;
};

const listPriceLists = async (query, actor) => {
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 10);
  const skip = (page - 1) * limit;
  const filters = buildFilters(query, actor);
  const sortDirection = query.sortOrder === 'asc' ? 1 : -1;
  const sort = { [query.sortBy || 'createdAt']: sortDirection };

  const [priceLists, total] = await Promise.all([
    populatePriceList(PriceList.find(filters))
      .sort(sort)
      .skip(skip)
      .limit(limit),
    PriceList.countDocuments(filters),
  ]);

  return {
    count: priceLists.length,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
    priceLists: priceLists.map((priceList) => formatPriceListResponse(priceList, {
      activeProductsOnly: isReadOnlyRole(actor.role),
    })),
  };
};

const getPriceListById = async (priceListId, actor) => {
  const priceList = await populatePriceList(PriceList.findById(priceListId));

  if (!priceList) {
    throw new AppError('Price list not found', 404);
  }

  if (isReadOnlyRole(actor.role) && priceList.status !== PRICE_LIST_STATUSES.ACTIVE) {
    throw new AppError('Price list not found', 404);
  }

  return formatPriceListResponse(priceList, {
    activeProductsOnly: isReadOnlyRole(actor.role),
  });
};

const getActivePriceListByCustomerType = async (customerType) => {
  const priceList = await populatePriceList(PriceList.findOne({
    customerType,
    status: PRICE_LIST_STATUSES.ACTIVE,
  }).sort({ updatedAt: -1, createdAt: -1 }));

  if (!priceList) {
    throw new AppError('Price list not found', 404);
  }

  return formatPriceListResponse(priceList, { activeProductsOnly: true });
};

const createPriceList = async (payload, actor) => {
  await ensureProductsExist(payload.items);

  const actorId = getActorId(actor);
  const priceList = await PriceList.create({
    name: payload.name,
    customerType: payload.customerType,
    description: payload.description,
    status: payload.status || PRICE_LIST_STATUSES.ACTIVE,
    items: payload.items || [],
    createdBy: actorId,
    updatedBy: actorId,
  });

  return getPriceListById(getReferenceId(priceList), actor);
};

const updatePriceList = async (priceListId, payload, actor) => {
  const priceList = await PriceList.findById(priceListId);

  if (!priceList) {
    throw new AppError('Price list not found', 404);
  }

  if (payload.items) {
    await ensureProductsExist(payload.items);
  }

  for (const field of ['name', 'customerType', 'description', 'status']) {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      priceList[field] = payload[field];
    }
  }

  if (payload.items) {
    priceList.items = payload.items;
  }

  priceList.updatedBy = getActorId(actor);
  await priceList.save();

  return getPriceListById(priceListId, actor);
};

const deactivatePriceList = async (priceListId, actor) => {
  const priceList = await PriceList.findById(priceListId);

  if (!priceList) {
    throw new AppError('Price list not found', 404);
  }

  priceList.status = PRICE_LIST_STATUSES.INACTIVE;
  priceList.updatedBy = getActorId(actor);
  await priceList.save();

  return getPriceListById(priceListId, actor);
};

module.exports = {
  createPriceList,
  deactivatePriceList,
  getActivePriceListByCustomerType,
  getPriceListById,
  listPriceLists,
  updatePriceList,
};
