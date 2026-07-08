const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');
const jwt = require('jsonwebtoken');
const request = require('supertest');

const mockUserRoles = Object.freeze({
  COMPANY_ADMIN: 'COMPANY_ADMIN',
  SALES_MANAGER: 'SALES_MANAGER',
  SALES_SUPERVISOR: 'SALES_SUPERVISOR',
  SALES_REPRESENTATIVE: 'SALES_REPRESENTATIVE',
  ACCOUNTANT: 'ACCOUNTANT',
});

const mockUserStatuses = Object.freeze({
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
});

const mockInvoiceStatuses = Object.freeze({
  DRAFT: 'DRAFT',
  CONFIRMED: 'CONFIRMED',
  ARCHIVED: 'ARCHIVED',
});

const mockPaymentStatuses = Object.freeze({
  PENDING: 'PENDING',
  SENT: 'SENT',
  PAID: 'PAID',
});

const mockPaymentMethods = Object.freeze({
  CASH: 'Cash',
});

const mockDiscountTypes = Object.freeze({
  NONE: 'NONE',
  AMOUNT: 'AMOUNT',
  PERCENTAGE: 'PERCENTAGE',
});

const mockInvoiceSources = Object.freeze({
  MANUAL: 'MANUAL',
  VOICE_TEXT: 'VOICE_TEXT',
});

jest.mock('../src/models/User', () => ({
  User: {
    findById: jest.fn(),
  },
  USER_ROLES: mockUserRoles,
  USER_STATUSES: mockUserStatuses,
}));

jest.mock('../src/modules/invoices/invoice.model', () => ({
  Invoice: {
    findById: jest.fn(),
  },
  DISCOUNT_TYPES: mockDiscountTypes,
  INVOICE_SOURCES: mockInvoiceSources,
  INVOICE_STATUSES: mockInvoiceStatuses,
  PAYMENT_METHODS: mockPaymentMethods,
  PAYMENT_STATUSES: mockPaymentStatuses,
}));

const app = require('../src/app');
const { env } = require('../src/config/env');
const { User, USER_ROLES, USER_STATUSES } = require('../src/models/User');
const { Invoice, INVOICE_STATUSES, PAYMENT_STATUSES, DISCOUNT_TYPES } = require('../src/modules/invoices/invoice.model');
const { INVOICE_PDF_DIRECTORY } = require('../src/modules/invoices/invoicePdf.service');

const ids = {
  admin: '64f000000000000000000001',
  manager: '64f000000000000000000003',
  supervisor: '64f000000000000000000004',
  rep: '64f000000000000000000002',
  repTwo: '64f000000000000000000006',
  accountant: '64f000000000000000000005',
  draftInvoice: '68f000000000000000000001',
  confirmedInvoice: '68f000000000000000000002',
  archivedInvoice: '68f000000000000000000003',
  otherRepInvoice: '68f000000000000000000004',
  unknownInvoice: '68f000000000000000000099',
};

let users;
let invoices;

const toObjectId = (id) => ({ toString: () => id });

const tokenFor = (user) => jwt.sign(
  {
    sub: user.id,
    role: user.role,
  },
  env.jwtAccessSecret,
  { expiresIn: '15m' },
);

const makeUser = ({
  id,
  name,
  email,
  role,
  status = USER_STATUSES.ACTIVE,
}) => ({
  id,
  _id: toObjectId(id),
  name,
  email,
  role,
  status,
  password: 'hashed-password',
  refreshTokenVersion: 0,
  __v: 0,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      role: this.role,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  },
});

const makeInvoice = ({
  id,
  invoiceStatus = INVOICE_STATUSES.DRAFT,
  invoiceNumber,
  createdBy = users[3],
  pdfPath,
  pdfGeneratedAt,
}) => ({
  id,
  _id: toObjectId(id),
  invoiceNumber,
  customerId: '65f000000000000000000001',
  customerSnapshot: {
    customerId: '65f000000000000000000001',
    name: 'Retail Market',
    shopName: 'Retail Market Branch',
    phone: '+963900000000',
    email: 'retail@example.com',
    address: {
      line1: 'Main Street',
      city: 'Damascus',
      country: 'Syria',
    },
    customerType: 'Retail',
    paymentType: 'Cash',
  },
  items: [
    {
      productId: '66f000000000000000000001',
      productCode: 'PAPER-A4-001',
      productName: 'Office Printer Paper',
      quantity: 2,
      unitPrice: 100,
      lineSubtotal: 200,
      lineDiscountAmount: 0,
      lineTaxableAmount: 200,
      taxRate: 8,
      taxAmount: 16,
      lineTotal: 216,
      currency: 'SYP',
      unit: 'PACK',
    },
  ],
  subtotal: 200,
  discountType: DISCOUNT_TYPES.NONE,
  discountValue: 0,
  discountAmount: 0,
  taxableAmount: 200,
  taxRate: 8,
  taxAmount: 16,
  totalAmount: 216,
  paidAmount: 0,
  remainingAmount: 216,
  currency: 'SYP',
  invoiceStatus,
  paymentStatus: PAYMENT_STATUSES.PENDING,
  paymentMethod: mockPaymentMethods.CASH,
  sentAt: undefined,
  dueDate: new Date('2026-07-30T00:00:00.000Z'),
  source: mockInvoiceSources.MANUAL,
  voiceText: 'Customer asked for delivery tomorrow',
  notes: 'Demo invoice notes',
  createdBy,
  updatedBy: createdBy,
  confirmedBy: invoiceStatus === INVOICE_STATUSES.DRAFT ? undefined : users[0],
  confirmedAt: invoiceStatus === INVOICE_STATUSES.DRAFT ? undefined : new Date('2026-06-27T10:00:00.000Z'),
  archivedBy: invoiceStatus === INVOICE_STATUSES.ARCHIVED ? users[2] : undefined,
  archivedAt: invoiceStatus === INVOICE_STATUSES.ARCHIVED ? new Date('2026-06-28T10:00:00.000Z') : undefined,
  createdAt: new Date('2026-06-27T09:00:00.000Z'),
  updatedAt: new Date('2026-06-27T09:00:00.000Z'),
  pdfPath,
  pdfGeneratedAt,
  saveCount: 0,
  async save() {
    this.saveCount += 1;
    return this;
  },
});

const makeDocumentQuery = (result) => {
  const query = {
    populate: jest.fn(() => query),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
    catch: (reject) => Promise.resolve(result).catch(reject),
  };

  return query;
};

const binaryParser = (res, callback) => {
  const chunks = [];

  res.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
  res.on('end', () => callback(null, Buffer.concat(chunks)));
};

const hexOf = (value) => Buffer.from(value, 'utf8').toString('hex');

const getPdf = (invoiceId, token) => request(app)
  .get(`/api/v1/invoices/${invoiceId}/pdf`)
  .set('Authorization', `Bearer ${token}`)
  .buffer(true)
  .parse(binaryParser);

const cleanupGeneratedPdfs = async () => {
  await fsPromises.mkdir(INVOICE_PDF_DIRECTORY, { recursive: true });
  const files = await fsPromises.readdir(INVOICE_PDF_DIRECTORY);

  await Promise.all(files
    .filter((file) => file.endsWith('.pdf'))
    .map((file) => fsPromises.unlink(path.join(INVOICE_PDF_DIRECTORY, file))));
};

beforeEach(async () => {
  await cleanupGeneratedPdfs();

  users = [
    makeUser({
      id: ids.admin,
      name: 'Company Admin',
      email: 'admin@intellisales.com',
      role: USER_ROLES.COMPANY_ADMIN,
    }),
    makeUser({
      id: ids.manager,
      name: 'Sales Manager',
      email: 'manager@intellisales.com',
      role: USER_ROLES.SALES_MANAGER,
    }),
    makeUser({
      id: ids.supervisor,
      name: 'Sales Supervisor',
      email: 'supervisor@intellisales.com',
      role: USER_ROLES.SALES_SUPERVISOR,
    }),
    makeUser({
      id: ids.rep,
      name: 'Sales Representative',
      email: 'rep@intellisales.com',
      role: USER_ROLES.SALES_REPRESENTATIVE,
    }),
    makeUser({
      id: ids.accountant,
      name: 'Accountant',
      email: 'accountant@intellisales.com',
      role: USER_ROLES.ACCOUNTANT,
    }),
    makeUser({
      id: ids.repTwo,
      name: 'Second Sales Representative',
      email: 'rep2@intellisales.com',
      role: USER_ROLES.SALES_REPRESENTATIVE,
    }),
  ];

  invoices = [
    makeInvoice({
      id: ids.draftInvoice,
      invoiceStatus: INVOICE_STATUSES.DRAFT,
      createdBy: users[3],
    }),
    makeInvoice({
      id: ids.confirmedInvoice,
      invoiceStatus: INVOICE_STATUSES.CONFIRMED,
      invoiceNumber: 'INV-2026-00001',
      createdBy: users[3],
    }),
    makeInvoice({
      id: ids.archivedInvoice,
      invoiceStatus: INVOICE_STATUSES.ARCHIVED,
      invoiceNumber: 'INV-2026-00002',
      createdBy: users[3],
    }),
    makeInvoice({
      id: ids.otherRepInvoice,
      invoiceStatus: INVOICE_STATUSES.CONFIRMED,
      invoiceNumber: 'INV-2026-00003',
      createdBy: users[5],
    }),
  ];

  jest.clearAllMocks();
  User.findById.mockImplementation(async (id) => users.find((user) => user.id === id) || null);
  Invoice.findById.mockImplementation((id) => makeDocumentQuery(
    invoices.find((invoice) => invoice.id === id) || null,
  ));
});

afterAll(async () => {
  await cleanupGeneratedPdfs();
});

describe('invoice PDF route', () => {
  it('returns 401 unified JSON error without token', async () => {
    const response = await request(app).get(`/api/v1/invoices/${ids.draftInvoice}/pdf`);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: 'Authentication required',
    });
  });

  it('returns 400 unified JSON error for invalid invoice id', async () => {
    const response = await request(app)
      .get('/api/v1/invoices/not-valid/pdf')
      .set('Authorization', `Bearer ${tokenFor(users[0])}`);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Validation failed');
    expect(Array.isArray(response.body.errors)).toBe(true);
  });

  it('returns 404 unified JSON error for unknown invoice id', async () => {
    const response = await request(app)
      .get(`/api/v1/invoices/${ids.unknownInvoice}/pdf`)
      .set('Authorization', `Bearer ${tokenFor(users[0])}`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: 'Invoice not found',
    });
  });

  it('prevents sales representative from accessing another representative invoice PDF', async () => {
    const response = await request(app)
      .get(`/api/v1/invoices/${ids.otherRepInvoice}/pdf`)
      .set('Authorization', `Bearer ${tokenFor(users[3])}`);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      message: 'Forbidden',
    });
  });

  it('generates draft invoice PDF without setting official pdfPath', async () => {
    const invoice = invoices.find((candidate) => candidate.id === ids.draftInvoice);
    const response = await getPdf(ids.draftInvoice, tokenFor(users[0]));

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/^application\/pdf/);
    expect(response.headers['content-disposition']).toContain('IntelliSales-DRAFT');
    expect(response.body.slice(0, 4).toString()).toBe('%PDF');
    expect(response.body.length).toBeGreaterThan(1000);
    expect(response.body.toString('latin1')).toContain(hexOf('DRAFT'));
    expect(invoice.pdfPath).toBeUndefined();
    expect(invoice.pdfGeneratedAt).toBeUndefined();
    expect(invoice.saveCount).toBe(0);
  });

  it('generates confirmed invoice PDF, stores pdfPath, and writes file locally', async () => {
    const invoice = invoices.find((candidate) => candidate.id === ids.confirmedInvoice);
    const response = await getPdf(ids.confirmedInvoice, tokenFor(users[0]));

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/^application\/pdf/);
    expect(response.headers['content-disposition']).toContain('IntelliSales-INV-2026-00001.pdf');
    expect(response.body.slice(0, 4).toString()).toBe('%PDF');
    expect(invoice.pdfPath).toBe('uploads/invoices/IntelliSales-INV-2026-00001.pdf');
    expect(invoice.pdfGeneratedAt).toBeInstanceOf(Date);
    expect(invoice.saveCount).toBe(1);
    expect(fs.existsSync(path.join(process.cwd(), invoice.pdfPath))).toBe(true);
  });

  it('reuses existing official pdfPath when the file exists', async () => {
    const invoice = invoices.find((candidate) => candidate.id === ids.confirmedInvoice);

    await getPdf(ids.confirmedInvoice, tokenFor(users[0]));
    const firstGeneratedAt = invoice.pdfGeneratedAt;
    const firstSaveCount = invoice.saveCount;

    const response = await getPdf(ids.confirmedInvoice, tokenFor(users[0]));

    expect(response.status).toBe(200);
    expect(invoice.saveCount).toBe(firstSaveCount);
    expect(invoice.pdfGeneratedAt).toBe(firstGeneratedAt);
    expect(response.body.slice(0, 4).toString()).toBe('%PDF');
  });

  it('regenerates official PDF safely when stored pdfPath file is missing', async () => {
    const invoice = invoices.find((candidate) => candidate.id === ids.confirmedInvoice);
    invoice.pdfPath = 'uploads/invoices/IntelliSales-INV-2026-00001.pdf';
    invoice.pdfGeneratedAt = new Date('2026-06-27T00:00:00.000Z');

    const response = await getPdf(ids.confirmedInvoice, tokenFor(users[0]));

    expect(response.status).toBe(200);
    expect(invoice.saveCount).toBe(1);
    expect(invoice.pdfGeneratedAt).not.toEqual(new Date('2026-06-27T00:00:00.000Z'));
    expect(fs.existsSync(path.join(process.cwd(), invoice.pdfPath))).toBe(true);
  });

  it('allows archived invoice PDF download', async () => {
    const response = await getPdf(ids.archivedInvoice, tokenFor(users[0]));

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/^application\/pdf/);
    expect(response.body.slice(0, 4).toString()).toBe('%PDF');
    expect(response.body.toString('latin1')).toContain(hexOf('ARCHIVED'));
  });

  it.each([
    ['COMPANY_ADMIN', 0],
    ['SALES_MANAGER', 1],
    ['SALES_SUPERVISOR', 2],
    ['ACCOUNTANT', 4],
  ])('allows %s to access any invoice PDF', async (roleName, userIndex) => {
    const response = await getPdf(ids.otherRepInvoice, tokenFor(users[userIndex]));

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/^application\/pdf/);
    expect(response.body.slice(0, 4).toString()).toBe('%PDF');
  });

  it('allows sales representative to access own invoice PDF', async () => {
    const response = await getPdf(ids.confirmedInvoice, tokenFor(users[3]));

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/^application\/pdf/);
    expect(response.body.slice(0, 4).toString()).toBe('%PDF');
  });

  it('uses invoice snapshots and does not expose sensitive user fields in PDF content', async () => {
    const response = await getPdf(ids.confirmedInvoice, tokenFor(users[0]));
    const pdfText = response.body.toString('latin1');

    expect(response.status).toBe(200);
    expect(pdfText).toContain(hexOf('Retail'));
    expect(pdfText).toContain(hexOf('Office'));
    expect(pdfText).not.toContain('hashed-password');
    expect(pdfText).not.toContain(hexOf('hashed-password'));
    expect(pdfText).not.toContain('refreshTokenVersion');
    expect(pdfText).not.toContain(hexOf('refreshTokenVersion'));
    expect(pdfText).not.toContain('__v');
    expect(pdfText).not.toContain(hexOf('__v'));
  });
});
