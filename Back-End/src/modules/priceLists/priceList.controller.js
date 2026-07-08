const { sendSuccess } = require('../../utils/apiResponse');
const { asyncHandler } = require('../../utils/asyncHandler');
const priceListService = require('./priceList.service');

const listPriceLists = asyncHandler(async (req, res) => {
  const result = await priceListService.listPriceLists(req.query, req.user);

  return sendSuccess(res, {
    message: 'Price lists fetched successfully',
    count: result.count,
    pagination: result.pagination,
    data: result.priceLists,
  });
});

const getPriceListById = asyncHandler(async (req, res) => {
  const priceList = await priceListService.getPriceListById(req.params.id, req.user);

  return sendSuccess(res, {
    message: 'Price list retrieved successfully',
    data: { priceList },
  });
});

const getActivePriceListByCustomerType = asyncHandler(async (req, res) => {
  const priceList = await priceListService.getActivePriceListByCustomerType(req.params.customerType);

  return sendSuccess(res, {
    message: 'Price list retrieved successfully',
    data: { priceList },
  });
});

const createPriceList = asyncHandler(async (req, res) => {
  const priceList = await priceListService.createPriceList(req.body, req.user);

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Price list created successfully',
    data: { priceList },
  });
});

const updatePriceList = asyncHandler(async (req, res) => {
  const priceList = await priceListService.updatePriceList(req.params.id, req.body, req.user);

  return sendSuccess(res, {
    message: 'Price list updated successfully',
    data: { priceList },
  });
});

const deactivatePriceList = asyncHandler(async (req, res) => {
  const priceList = await priceListService.deactivatePriceList(req.params.id, req.user);

  return sendSuccess(res, {
    message: 'Price list deactivated successfully',
    data: { priceList },
  });
});

module.exports = {
  createPriceList,
  deactivatePriceList,
  getActivePriceListByCustomerType,
  getPriceListById,
  listPriceLists,
  updatePriceList,
};
