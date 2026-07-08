const { AppError } = require('../../utils/AppError');
const { formatCustomerResponse } = require('../../utils/formatCustomerResponse');
const { formatProductResponse } = require('../../utils/formatProductResponse');
const { USER_ROLES } = require('../../models/User');
const { Customer, CUSTOMER_STATUSES } = require('../customers/customer.model');
const { Product, PRODUCT_STATUSES } = require('../products/product.model');
const { PriceList, PRICE_LIST_STATUSES } = require('../priceLists/priceList.model');
const { INVOICE_STATUSES, Invoice } = require('../invoices/invoice.model');

const STRATEGIES = Object.freeze({
  PURCHASE_HISTORY: 'PURCHASE_HISTORY',
  CUSTOMER_TYPE_PRICE_LIST: 'CUSTOMER_TYPE_PRICE_LIST',
  NO_AVAILABLE_RECOMMENDATIONS: 'NO_AVAILABLE_RECOMMENDATIONS',
});

const ALL_CUSTOMER_RECOMMENDATION_ROLES = [
  USER_ROLES.COMPANY_ADMIN,
  USER_ROLES.SALES_MANAGER,
  USER_ROLES.SALES_SUPERVISOR,
  USER_ROLES.ACCOUNTANT,
];

const productPopulateSelect = 'name sku category brand unit basePrice currency taxRate status';

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

const isSalesRepresentative = (role) => role === USER_ROLES.SALES_REPRESENTATIVE;

const shouldIncludeHistory = (value) => {
  if (value === false) {
    return false;
  }

  if (typeof value === 'string' && value.trim().toLowerCase() === 'false') {
    return false;
  }

  return true;
};

const assertCanReadCustomerRecommendations = (customer, actor) => {
  if (isSalesRepresentative(actor.role)) {
    const assignedSalesRepId = getReferenceId(customer.assignedSalesRep);
    const actorId = getActorId(actor);

    if (!assignedSalesRepId || assignedSalesRepId !== actorId) {
      throw new AppError('Forbidden', 403);
    }

    return;
  }

  if (!ALL_CUSTOMER_RECOMMENDATION_ROLES.includes(actor.role)) {
    throw new AppError('Forbidden', 403);
  }
};

const formatCustomerSummary = (customer) => {
  const safeCustomer = formatCustomerResponse(customer);

  return {
    id: safeCustomer.id,
    name: safeCustomer.name,
    customerType: safeCustomer.customerType,
  };
};

const formatProductSummary = (product) => {
  const safeProduct = formatProductResponse(product);

  return {
    id: safeProduct.id,
    name: safeProduct.name,
    productCode: safeProduct.productCode,
    sku: safeProduct.sku,
    category: safeProduct.category,
    brand: safeProduct.brand,
    unit: safeProduct.unit,
    status: safeProduct.status,
  };
};

const buildNoAvailableResult = ({
  customer,
  limit,
  priceListId,
  source,
}) => ({
  message: 'No available product recommendations found',
  data: {
    customer: formatCustomerSummary(customer),
    strategy: STRATEGIES.NO_AVAILABLE_RECOMMENDATIONS,
    recommendations: [],
    meta: {
      limit,
      customerType: customer.customerType,
      priceListId,
      source,
    },
  },
});

const findActivePriceList = async (customerType) => PriceList.findOne({
  customerType,
  status: PRICE_LIST_STATUSES.ACTIVE,
})
  .sort({ updatedAt: -1, createdAt: -1 })
  .populate('items.productId', productPopulateSelect);

const resolvePriceListProduct = async (productReference) => {
  const productId = getReferenceId(productReference);

  if (!productId) {
    return null;
  }

  if (
    productReference
    && typeof productReference === 'object'
    && productReference.name
    && productReference.status
  ) {
    return productReference;
  }

  return Product.findById(productId);
};

const buildAvailableItems = async (priceList) => {
  const availableItems = [];
  const seenProductIds = new Set();

  for (const [index, item] of (priceList.items || []).entries()) {
    const product = await resolvePriceListProduct(item.productId);
    const productId = getReferenceId(product || item.productId);

    if (!product || !productId || seenProductIds.has(productId)) {
      continue;
    }

    if (product.status !== PRODUCT_STATUSES.ACTIVE) {
      continue;
    }

    seenProductIds.add(productId);
    availableItems.push({
      productId,
      product,
      price: Number(item.price),
      currency: item.currency || product.currency || 'SYP',
      taxRate: product.taxRate || 0,
      order: index,
    });
  }

  return availableItems;
};

const buildPriceListIndexes = (availableItems) => {
  const byProductId = new Map();
  const byProductCode = new Map();

  for (const item of availableItems) {
    byProductId.set(item.productId, item);

    const code = item.product.sku || item.product.productCode;

    if (code) {
      byProductCode.set(code.toString().trim().toUpperCase(), item);
    }
  }

  return {
    byProductId,
    byProductCode,
  };
};

const getInvoiceHistoryDate = (invoice) => (
  invoice.confirmedAt || invoice.updatedAt || invoice.createdAt || new Date(0)
);

const addHistoryItem = ({
  historyByProductId,
  invoice,
  invoiceItem,
  availableItem,
}) => {
  const productId = availableItem.productId;
  const current = historyByProductId.get(productId) || {
    availableItem,
    timesPurchased: 0,
    totalQuantityPurchased: 0,
    totalRevenuePurchased: 0,
    lastPurchasedAt: undefined,
  };
  const invoiceDate = getInvoiceHistoryDate(invoice);

  current.timesPurchased += 1;
  current.totalQuantityPurchased += Number(invoiceItem.quantity || 0);
  current.totalRevenuePurchased += Number(invoiceItem.lineTotal || invoiceItem.lineSubtotal || 0);

  if (
    !current.lastPurchasedAt
    || new Date(invoiceDate).getTime() > new Date(current.lastPurchasedAt).getTime()
  ) {
    current.lastPurchasedAt = invoiceDate;
  }

  historyByProductId.set(productId, current);
};

const buildPurchaseHistoryRecommendations = async ({
  customerId,
  availableItems,
}) => {
  const { byProductId, byProductCode } = buildPriceListIndexes(availableItems);
  const invoices = await Invoice.find({
    customerId,
    invoiceStatus: INVOICE_STATUSES.CONFIRMED,
  }).sort({ confirmedAt: -1, updatedAt: -1, createdAt: -1 });
  const historyByProductId = new Map();

  for (const invoice of invoices) {
    for (const invoiceItem of invoice.items || []) {
      const productId = getReferenceId(invoiceItem.productId);
      const productCode = invoiceItem.productCode || invoiceItem.sku;
      const availableItem = productId && byProductId.get(productId)
        ? byProductId.get(productId)
        : byProductCode.get(productCode?.toString().trim().toUpperCase());

      if (!availableItem) {
        continue;
      }

      addHistoryItem({
        historyByProductId,
        invoice,
        invoiceItem,
        availableItem,
      });
    }
  }

  return Array.from(historyByProductId.values())
    .map((history) => ({
      product: formatProductSummary(history.availableItem.product),
      price: history.availableItem.price,
      currency: history.availableItem.currency,
      taxRate: history.availableItem.taxRate,
      score: Math.round(
        history.timesPurchased * 40
          + history.totalQuantityPurchased * 5,
      ),
      reason: 'Previously purchased by this customer',
      history: {
        timesPurchased: history.timesPurchased,
        totalQuantityPurchased: history.totalQuantityPurchased,
        lastPurchasedAt: history.lastPurchasedAt,
      },
    }))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      const leftDate = new Date(left.history.lastPurchasedAt || 0).getTime();
      const rightDate = new Date(right.history.lastPurchasedAt || 0).getTime();

      if (rightDate !== leftDate) {
        return rightDate - leftDate;
      }

      return left.product.name.localeCompare(right.product.name);
    });
};

const buildFallbackRecommendations = (availableItems, customerType) => [...availableItems]
  .sort((left, right) => {
    if (left.order !== right.order) {
      return left.order - right.order;
    }

    return left.product.name.localeCompare(right.product.name);
  })
  .map((item, index) => ({
    product: formatProductSummary(item.product),
    price: item.price,
    currency: item.currency,
    taxRate: item.taxRate,
    score: Math.max(100 - index * 5, 1),
    reason: `Recommended from ${customerType} price list`,
  }));

const buildRecommendationResult = ({
  customer,
  limit,
  priceList,
  strategy,
  recommendations,
  source,
}) => ({
  message: 'Product recommendations fetched successfully',
  data: {
    customer: formatCustomerSummary(customer),
    strategy,
    recommendations: recommendations.slice(0, limit),
    meta: {
      limit,
      customerType: customer.customerType,
      priceListId: getReferenceId(priceList),
      source,
    },
  },
});

const getCustomerProductRecommendations = async ({
  customerId,
  query,
  actor,
}) => {
  const limit = Number(query.limit || 5);
  const includeHistory = shouldIncludeHistory(query.includeHistory);
  const customer = await Customer.findById(customerId);

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  if (customer.status !== CUSTOMER_STATUSES.ACTIVE) {
    throw new AppError('Customer is inactive', 400);
  }

  assertCanReadCustomerRecommendations(customer, actor);

  const priceList = await findActivePriceList(customer.customerType);

  if (!priceList) {
    return buildNoAvailableResult({
      customer,
      limit,
      source: 'no active price list',
    });
  }

  const availableItems = await buildAvailableItems(priceList);
  const priceListId = getReferenceId(priceList);

  if (availableItems.length === 0) {
    return buildNoAvailableResult({
      customer,
      limit,
      priceListId,
      source: 'active price list has no active products',
    });
  }

  if (includeHistory) {
    const historyRecommendations = await buildPurchaseHistoryRecommendations({
      customerId,
      availableItems,
    });

    if (historyRecommendations.length > 0) {
      return buildRecommendationResult({
        customer,
        limit,
        priceList,
        strategy: STRATEGIES.PURCHASE_HISTORY,
        recommendations: historyRecommendations,
        source: 'confirmed invoices + active price list',
      });
    }
  }

  return buildRecommendationResult({
    customer,
    limit,
    priceList,
    strategy: STRATEGIES.CUSTOMER_TYPE_PRICE_LIST,
    recommendations: buildFallbackRecommendations(availableItems, customer.customerType),
    source: 'active customer type price list',
  });
};

module.exports = {
  STRATEGIES,
  getCustomerProductRecommendations,
};
