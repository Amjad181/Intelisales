const fs = require('fs/promises');
const path = require('path');

const { renderInvoicePdf } = require('../../utils/pdfGenerator');
const { INVOICE_STATUSES } = require('./invoice.model');
const { getInvoiceDocumentForRead } = require('./invoice.service');

const PROJECT_ROOT = path.resolve(__dirname, '../../..');
const INVOICE_PDF_DIRECTORY = path.join(PROJECT_ROOT, 'uploads', 'invoices');
const INVOICE_PDF_RELATIVE_DIRECTORY = 'uploads/invoices';

const sanitizeFileNamePart = (value) => String(value || 'invoice')
  .replace(/[^a-zA-Z0-9._-]/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '');

const toRelativePdfPath = (fileName) => path.posix.join(INVOICE_PDF_RELATIVE_DIRECTORY, fileName);
const toAbsolutePdfPath = (fileName) => path.join(INVOICE_PDF_DIRECTORY, fileName);

const getStoredFileName = (pdfPath) => path.basename(pdfPath || '');

const fileExists = async (filePath) => {
  try {
    const stats = await fs.stat(filePath);
    return stats.isFile();
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false;
    }

    throw error;
  }
};

const ensurePdfDirectory = async () => {
  await fs.mkdir(INVOICE_PDF_DIRECTORY, { recursive: true });
};

const buildDraftFileName = (invoice) => (
  `IntelliSales-DRAFT-${sanitizeFileNamePart(invoice.id || invoice._id)}.pdf`
);

const buildOfficialFileName = (invoice) => (
  `IntelliSales-${sanitizeFileNamePart(invoice.invoiceNumber || invoice.id || invoice._id)}.pdf`
);

const generateDraftPdf = async (invoice) => {
  const buffer = await renderInvoicePdf(invoice, { isDraft: true });

  return {
    buffer,
    fileName: buildDraftFileName(invoice),
  };
};

const generateOfficialPdf = async (invoice) => {
  await ensurePdfDirectory();

  if (invoice.pdfPath) {
    const storedFileName = getStoredFileName(invoice.pdfPath);

    if (storedFileName) {
      const storedAbsolutePath = toAbsolutePdfPath(storedFileName);

      if (await fileExists(storedAbsolutePath)) {
        return {
          buffer: await fs.readFile(storedAbsolutePath),
          fileName: storedFileName,
          absolutePath: storedAbsolutePath,
        };
      }
    }
  }

  const fileName = buildOfficialFileName(invoice);
  const absolutePath = toAbsolutePdfPath(fileName);
  const relativePath = toRelativePdfPath(fileName);
  const buffer = await renderInvoicePdf(invoice, { isDraft: false });

  await fs.writeFile(absolutePath, buffer);

  invoice.pdfPath = relativePath;
  invoice.pdfGeneratedAt = new Date();
  await invoice.save();

  return {
    buffer,
    fileName,
    absolutePath,
  };
};

const getInvoicePdf = async (invoiceId, actor) => {
  const invoice = await getInvoiceDocumentForRead(invoiceId, actor);

  if (invoice.invoiceStatus === INVOICE_STATUSES.DRAFT) {
    return generateDraftPdf(invoice);
  }

  return generateOfficialPdf(invoice);
};

module.exports = {
  INVOICE_PDF_DIRECTORY,
  getInvoicePdf,
};
