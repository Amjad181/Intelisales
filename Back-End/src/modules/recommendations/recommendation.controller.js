const { sendSuccess } = require('../../utils/apiResponse');
const { asyncHandler } = require('../../utils/asyncHandler');
const recommendationService = require('./recommendation.service');

const getCustomerProductRecommendations = asyncHandler(async (req, res) => {
  const result = await recommendationService.getCustomerProductRecommendations({
    customerId: req.params.customerId,
    query: req.query,
    actor: req.user,
  });

  return sendSuccess(res, {
    message: result.message,
    data: result.data,
  });
});

module.exports = {
  getCustomerProductRecommendations,
};
