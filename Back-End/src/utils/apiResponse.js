const sendSuccess = (
  res,
  {
    statusCode = 200,
    message = 'Success',
    count = undefined,
    pagination = undefined,
    data = null,
  } = {},
) => {
  const body = {
    success: true,
    message,
  };

  if (count !== undefined) {
    body.count = count;
  }

  if (pagination !== undefined) {
    body.pagination = pagination;
  }

  body.data = data;

  return res.status(statusCode).json(body);
};

const sendError = (
  res,
  {
    statusCode = 500,
    message = 'Internal server error',
    data = undefined,
    errors = undefined,
  } = {},
) => {
  const body = {
    success: false,
    message,
  };

  if (data !== undefined) {
    body.data = data;
  }

  if (errors) {
    body.errors = errors;
  }

  return res.status(statusCode).json(body);
};

module.exports = {
  sendSuccess,
  sendError,
};
