const PDFDocument = require('pdfkit');

const formatDate = (value) => {
  if (!value) {
    return 'N/A';
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'N/A';
  }

  return date.toISOString().slice(0, 10);
};

const formatMoney = (value, currency = 'SYP') => (
  `${Number(value || 0).toFixed(2)} ${currency || 'SYP'}`
);

const getUserLabel = (user) => {
  if (!user) {
    return 'N/A';
  }

  if (typeof user === 'string') {
    return user;
  }

  return user.name || user.email || user.id || 'N/A';
};

const formatAddress = (address) => {
  if (!address) {
    return 'N/A';
  }

  if (typeof address === 'string') {
    return address;
  }

  return [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.postalCode,
    address.country,
  ].filter(Boolean).join(', ') || 'N/A';
};

const writeLabelValue = (doc, label, value, x, y, options = {}) => {
  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor('#374151')
    .text(`${label}:`, x, y, { continued: true, ...options })
    .font('Helvetica')
    .fillColor('#111827')
    .text(` ${value || 'N/A'}`);
};

const drawHorizontalRule = (doc, y) => {
  doc
    .moveTo(50, y)
    .lineTo(545, y)
    .strokeColor('#d1d5db')
    .lineWidth(1)
    .stroke();
};

const drawDraftWatermark = (doc) => {
  doc.save();
  doc
    .rotate(-35, { origin: [300, 380] })
    .font('Helvetica-Bold')
    .fontSize(72)
    .fillColor('#fca5a5')
    .fillOpacity(0.22)
    .text('DRAFT', 120, 345, { align: 'center' });
  doc.restore();
  doc.fillOpacity(1);
};

const drawHeader = (doc, invoice, { isDraft }) => {
  const status = invoice.invoiceStatus || (isDraft ? 'DRAFT' : 'CONFIRMED');

  doc
    .font('Helvetica-Bold')
    .fontSize(22)
    .fillColor('#111827')
    .text('IntelliSales', 50, 45);

  doc
    .font('Helvetica-Bold')
    .fontSize(15)
    .fillColor('#2563eb')
    .text('Invoice', 50, 72);

  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor(isDraft ? '#dc2626' : '#111827')
    .text(status, 430, 48, { align: 'right' });

  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor('#374151')
    .text(
      isDraft
        ? `Preview ID: ${invoice.id}`
        : `Invoice Number: ${invoice.invoiceNumber || 'N/A'}`,
      330,
      68,
      { align: 'right' },
    );

  drawHorizontalRule(doc, 100);
};

const drawInvoiceMeta = (doc, invoice) => {
  const startY = 118;
  writeLabelValue(doc, 'Created Date', formatDate(invoice.createdAt), 50, startY);
  writeLabelValue(doc, 'Confirmed Date', formatDate(invoice.confirmedAt), 50, startY + 16);
  writeLabelValue(doc, 'Due Date', formatDate(invoice.dueDate), 50, startY + 32);
  writeLabelValue(doc, 'Source', invoice.source, 50, startY + 48);
  writeLabelValue(doc, 'Created By', getUserLabel(invoice.createdBy), 320, startY);
  writeLabelValue(doc, 'Payment Status', invoice.paymentStatus, 320, startY + 16);
  writeLabelValue(doc, 'Currency', invoice.currency, 320, startY + 32);

  drawHorizontalRule(doc, startY + 74);
  return startY + 90;
};

const drawCustomer = (doc, invoice, y) => {
  const customer = invoice.customerSnapshot || {};

  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor('#111827')
    .text('Customer', 50, y);

  const leftY = y + 20;
  writeLabelValue(doc, 'Name', customer.name, 50, leftY);
  writeLabelValue(doc, 'Shop Name', customer.shopName, 50, leftY + 16);
  writeLabelValue(doc, 'Phone', customer.phone, 50, leftY + 32);
  writeLabelValue(doc, 'Email', customer.email, 50, leftY + 48);
  writeLabelValue(doc, 'Address', formatAddress(customer.address), 50, leftY + 64);
  writeLabelValue(doc, 'Customer Type', customer.customerType, 320, leftY);
  writeLabelValue(doc, 'Payment Type', customer.paymentType, 320, leftY + 16);

  drawHorizontalRule(doc, leftY + 92);
  return leftY + 108;
};

const ensureSpace = (doc, y, requiredHeight = 80) => {
  if (y + requiredHeight <= 760) {
    return y;
  }

  doc.addPage();
  return 50;
};

const drawTableHeader = (doc, y) => {
  doc
    .rect(50, y, 495, 20)
    .fill('#eff6ff')
    .fillColor('#111827')
    .font('Helvetica-Bold')
    .fontSize(7);

  const columns = [
    ['Code', 54, 58],
    ['Product', 112, 105],
    ['Qty', 220, 32],
    ['Unit', 255, 50],
    ['Subtotal', 308, 55],
    ['Disc.', 366, 42],
    ['Tax', 411, 40],
    ['Total', 454, 65],
    ['Curr.', 520, 24],
  ];

  columns.forEach(([label, x, width]) => {
    doc.text(label, x, y + 7, { width });
  });

  return y + 22;
};

const drawItems = (doc, invoice, y) => {
  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor('#111827')
    .text('Items', 50, y);

  let currentY = drawTableHeader(doc, y + 20);

  (invoice.items || []).forEach((item, index) => {
    currentY = ensureSpace(doc, currentY, 36);

    if (index % 2 === 0) {
      doc.rect(50, currentY - 2, 495, 25).fill('#f9fafb');
    }

    doc
      .font('Helvetica')
      .fontSize(7)
      .fillColor('#111827');

    doc.text(item.productCode || '', 54, currentY, { width: 56 });
    doc.text(item.productName || '', 112, currentY, { width: 105 });
    doc.text(String(item.quantity || 0), 220, currentY, { width: 32 });
    doc.text(formatMoney(item.unitPrice, ''), 255, currentY, { width: 50 });
    doc.text(formatMoney(item.lineSubtotal, ''), 308, currentY, { width: 55 });
    doc.text(formatMoney(item.lineDiscountAmount, ''), 366, currentY, { width: 42 });
    doc.text(formatMoney(item.taxAmount, ''), 411, currentY, { width: 40 });
    doc.text(formatMoney(item.lineTotal, ''), 454, currentY, { width: 65 });
    doc.text(item.currency || invoice.currency || 'SYP', 520, currentY, { width: 24 });

    currentY += 26;
  });

  drawHorizontalRule(doc, currentY + 6);
  return currentY + 22;
};

const drawTotals = (doc, invoice, y) => {
  const currency = invoice.currency || 'SYP';
  let currentY = ensureSpace(doc, y, 180);

  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor('#111827')
    .text('Totals', 340, currentY);

  currentY += 22;

  const totals = [
    ['Subtotal', formatMoney(invoice.subtotal, currency)],
    ['Discount Type', invoice.discountType],
    ['Discount Value', String(invoice.discountValue || 0)],
    ['Discount Amount', formatMoney(invoice.discountAmount, currency)],
    ['Taxable Amount', formatMoney(invoice.taxableAmount, currency)],
    ['Tax Amount', formatMoney(invoice.taxAmount, currency)],
    ['Total Amount', formatMoney(invoice.totalAmount, currency)],
    ['Paid Amount', formatMoney(invoice.paidAmount, currency)],
    ['Remaining Amount', formatMoney(invoice.remainingAmount, currency)],
  ];

  totals.forEach(([label, value]) => {
    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor('#374151')
      .text(label, 340, currentY, { width: 105 })
      .font('Helvetica')
      .fillColor('#111827')
      .text(value || 'N/A', 450, currentY, { width: 95, align: 'right' });
    currentY += 16;
  });

  return currentY + 10;
};

const drawNotes = (doc, invoice, y) => {
  let currentY = ensureSpace(doc, y, 100);

  if (invoice.notes) {
    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#111827')
      .text('Notes', 50, currentY)
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#374151')
      .text(invoice.notes, 50, currentY + 16, { width: 495 });
    currentY += 54;
  }

  if (invoice.voiceText) {
    currentY = ensureSpace(doc, currentY, 80);
    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#111827')
      .text('Voice Text', 50, currentY)
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#374151')
      .text(invoice.voiceText, 50, currentY + 16, { width: 495 });
    currentY += 54;
  }

  return currentY;
};

const renderInvoicePdf = (invoice, { isDraft = false } = {}) => new Promise((resolve, reject) => {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50,
    compress: false,
    info: {
      Title: `IntelliSales ${isDraft ? 'Draft Invoice' : 'Invoice'}`,
      Author: 'IntelliSales',
      Subject: 'Invoice PDF',
    },
  });
  const chunks = [];

  doc.on('data', (chunk) => chunks.push(chunk));
  doc.on('error', reject);
  doc.on('end', () => resolve(Buffer.concat(chunks)));

  if (isDraft) {
    drawDraftWatermark(doc);
  }

  drawHeader(doc, invoice, { isDraft });
  let y = drawInvoiceMeta(doc, invoice);
  y = drawCustomer(doc, invoice, y);
  y = drawItems(doc, invoice, y);
  y = drawTotals(doc, invoice, y);
  drawNotes(doc, invoice, y);

  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor('#6b7280')
    .text('Generated by IntelliSales Backend', 50, 760, { align: 'center', width: 495 });

  doc.end();
});

module.exports = {
  renderInvoicePdf,
};
