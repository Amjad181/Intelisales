const { AppError } = require('../utils/AppError');

const formatZodIssues = (issues) => issues.map((issue) => ({
  path: issue.path.join('.'),
  message: issue.message,
}));

const validate = (schema) => (req, res, next) => {
  const targets = ['params', 'query', 'body'];

  for (const target of targets) {
    if (!schema[target]) {
      continue;
    }

    const result = schema[target].safeParse(req[target]);

    if (!result.success) {
      return next(new AppError('Validation failed', 400, formatZodIssues(result.error.issues)));
    }

    req[target] = result.data;
  }

  return next();
};

module.exports = { validate };
