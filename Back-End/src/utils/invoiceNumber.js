const buildInvoiceNumber = (year, sequence) => (
  `INV-${year}-${String(sequence).padStart(5, '0')}`
);

const generateInvoiceNumber = async (InvoiceModel, date = new Date()) => {
  const year = date.getFullYear();
  const prefix = `INV-${year}-`;
  const latestInvoice = await InvoiceModel.findOne({
    invoiceNumber: new RegExp(`^${prefix}\\d{5}$`),
  })
    .sort({ invoiceNumber: -1 })
    .select('invoiceNumber');

  const latestSequence = latestInvoice && latestInvoice.invoiceNumber
    ? Number(latestInvoice.invoiceNumber.replace(prefix, ''))
    : 0;

  return buildInvoiceNumber(year, latestSequence + 1);
};

module.exports = {
  buildInvoiceNumber,
  generateInvoiceNumber,
};
