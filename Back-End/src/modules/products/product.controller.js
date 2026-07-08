const { sendSuccess } = require('../../utils/apiResponse');
const { asyncHandler } = require('../../utils/asyncHandler');
const productService = require('./product.service');

const listProducts = asyncHandler(async (req, res) => {
  const result = await productService.listProducts(req.query, req.user);

  return sendSuccess(res, {
    message: 'Products fetched successfully',
    count: result.count,
    pagination: result.pagination,
    data: result.products,
  });
});

const listPriceItems = asyncHandler(async (req, res) => {
  const result = await productService.listPriceItems(req.query);

  return sendSuccess(res, {
    message: 'Product price list fetched successfully',
    count: result.count,
    pagination: result.pagination,
    data: result.items,
  });
});

const getProductById = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.params.id, req.user);

  return sendSuccess(res, {
    message: 'Product retrieved successfully',
    data: { product },
  });
});

const createProduct = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.body, req.user);

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Product created successfully',
    data: { product },
  });
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body, req.user);

  return sendSuccess(res, {
    message: 'Product updated successfully',
    data: { product },
  });
});

const updateProductPrice = asyncHandler(async (req, res) => {
  const product = await productService.updateProductPrice(req.params.id, req.body, req.user);

  return sendSuccess(res, {
    message: 'Product price updated successfully',
    data: { product },
  });
});

const deactivateProduct = asyncHandler(async (req, res) => {
  const product = await productService.deactivateProduct(req.params.id, req.user);

  return sendSuccess(res, {
    message: 'Product deactivated successfully',
    data: { product },
  });
});

module.exports = {
  createProduct,
  deactivateProduct,
  getProductById,
  listPriceItems,
  listProducts,
  updateProduct,
  updateProductPrice,
};
