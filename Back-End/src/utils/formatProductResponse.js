const { formatUserResponse } = require('./formatUserResponse');

const isUserLike = (value) => Boolean(
  value
    && typeof value === 'object'
    && (
      Object.prototype.hasOwnProperty.call(value, 'email')
      || Object.prototype.hasOwnProperty.call(value, 'role')
      || Object.prototype.hasOwnProperty.call(value, 'name')
    ),
);

const formatReference = (value) => {
  if (!value) {
    return value;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (isUserLike(value)) {
    return formatUserResponse(value);
  }

  if (value._id && typeof value._id.toString === 'function') {
    return value._id.toString();
  }

  if (
    typeof value.toString === 'function'
    && value.toString !== Object.prototype.toString
  ) {
    return value.toString();
  }

  if (value.id && typeof value.id === 'string') {
    return value.id;
  }

  return value;
};

const formatProductResponse = (product) => {
  if (!product) {
    return product;
  }

  const plainProduct = typeof product.toJSON === 'function'
    ? product.toJSON()
    : { ...product };
  const id = plainProduct.id || (
    plainProduct._id && typeof plainProduct._id.toString === 'function'
      ? plainProduct._id.toString()
      : undefined
  );

  return {
    id,
    name: plainProduct.name,
    sku: plainProduct.sku,
    productCode: plainProduct.sku,
    barcode: plainProduct.barcode,
    category: plainProduct.category,
    brand: plainProduct.brand,
    description: plainProduct.description,
    unit: plainProduct.unit,
    basePrice: plainProduct.basePrice,
    currency: plainProduct.currency,
    taxRate: plainProduct.taxRate,
    status: plainProduct.status,
    createdBy: formatReference(plainProduct.createdBy),
    updatedBy: formatReference(plainProduct.updatedBy),
    createdAt: plainProduct.createdAt,
    updatedAt: plainProduct.updatedAt,
  };
};

const formatPriceListItem = (product) => {
  const safeProduct = formatProductResponse(product);

  return {
    id: safeProduct.id,
    name: safeProduct.name,
    sku: safeProduct.sku,
    productCode: safeProduct.productCode,
    category: safeProduct.category,
    unit: safeProduct.unit,
    price: safeProduct.basePrice,
    currency: safeProduct.currency,
    taxRate: safeProduct.taxRate,
    status: safeProduct.status,
  };
};

module.exports = {
  formatPriceListItem,
  formatProductResponse,
};
