const { sendSuccess } = require('../../utils/apiResponse');
const { asyncHandler } = require('../../utils/asyncHandler');
const invoicePdfService = require('./invoicePdf.service');
const invoiceService = require('./invoice.service');

const listInvoices = asyncHandler(async (req, res) => {
  const result = await invoiceService.listInvoices(req.query, req.user);

  return sendSuccess(res, {
    message: 'Invoices fetched successfully',
    count: result.count,
    pagination: result.pagination,
    data: result.invoices,
  });
});

const createInvoice = asyncHandler(async (req, res) => {
  const invoice = await invoiceService.createInvoice(req.body, req.user);

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Invoice created successfully',
    data: { invoice },
  });
});

const getInvoiceById = asyncHandler(async (req, res) => {
  const invoice = await invoiceService.getInvoiceById(req.params.id, req.user);

  return sendSuccess(res, {
    message: 'Invoice retrieved successfully',
    data: { invoice },
  });
});

const updateInvoice = asyncHandler(async (req, res) => {
  const invoice = await invoiceService.updateInvoice(req.params.id, req.body, req.user);

  return sendSuccess(res, {
    message: 'Invoice updated successfully',
    data: { invoice },
  });
});

const confirmInvoice = asyncHandler(async (req, res) => {
  const invoice = await invoiceService.confirmInvoice(req.params.id, req.user);

  return sendSuccess(res, {
    message: 'Invoice confirmed successfully',
    data: { invoice },
  });
});

const archiveInvoice = asyncHandler(async (req, res) => {
  const invoice = await invoiceService.archiveInvoice(req.params.id, req.user);

  return sendSuccess(res, {
    message: 'Invoice archived successfully',
    data: { invoice },
  });
});

const updateInvoicePayment = asyncHandler(async (req, res) => {
  const invoice = await invoiceService.updateInvoicePayment(req.params.id, req.body, req.user);

  return sendSuccess(res, {
    message: 'Invoice payment updated successfully',
    data: { invoice },
  });
});

const markInvoiceSent = asyncHandler(async (req, res) => {
  const invoice = await invoiceService.markInvoiceSent(req.params.id, req.user);

  return sendSuccess(res, {
    message: 'Invoice marked as sent successfully',
    data: { invoice },
  });
});

const getInvoicePdf = asyncHandler(async (req, res) => {
  const pdf = await invoicePdfService.getInvoicePdf(req.params.id, req.user);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${pdf.fileName}"`);
  res.setHeader('Content-Length', pdf.buffer.length);

  return res.status(200).send(pdf.buffer);
});

const listCustomerInvoices = asyncHandler(async (req, res) => {
  const result = await invoiceService.listCustomerInvoices(req.params.id, req.query, req.user);

  return sendSuccess(res, {
    message: 'Customer invoices fetched successfully',
    count: result.count,
    pagination: result.pagination,
    data: result.invoices,
  });
});

module.exports = {
  archiveInvoice,
  confirmInvoice,
  createInvoice,
  getInvoiceById,
  getInvoicePdf,
  listCustomerInvoices,
  listInvoices,
  markInvoiceSent,
  updateInvoice,
  updateInvoicePayment,
};
