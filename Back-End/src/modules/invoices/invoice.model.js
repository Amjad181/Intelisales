const mongoose = require('mongoose');

const INVOICE_STATUSES = Object.freeze({
  DRAFT: 'DRAFT',
  CONFIRMED: 'CONFIRMED',
  ARCHIVED: 'ARCHIVED',
});

const PAYMENT_STATUSES = Object.freeze({
  PENDING: 'PENDING',
  SENT: 'SENT',
  PAID: 'PAID',
});

const PAYMENT_METHODS = Object.freeze({
  CASH: 'Cash',
});

const DISCOUNT_TYPES = Object.freeze({
  NONE: 'NONE',
  AMOUNT: 'AMOUNT',
  PERCENTAGE: 'PERCENTAGE',
});

const INVOICE_SOURCES = Object.freeze({
  MANUAL: 'MANUAL',
  VOICE_TEXT: 'VOICE_TEXT',
});

const normalizeUppercase = (value) => (
  typeof value === 'string' ? value.trim().toUpperCase() : value
);

const customerSnapshotSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    shopName: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
    },
    address: {
      type: mongoose.Schema.Types.Mixed,
    },
    customerType: {
      type: String,
      required: true,
    },
    paymentType: {
      type: String,
      required: true,
    },
  },
  { _id: false },
);

const invoiceItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productCode: {
      type: String,
      required: true,
      trim: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0.01,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    lineSubtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    lineDiscountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lineTaxableAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      trim: true,
      uppercase: true,
      minlength: 3,
      maxlength: 3,
      default: 'SYP',
      set: normalizeUppercase,
    },
    unit: {
      type: String,
      trim: true,
    },
  },
  { _id: false },
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    customerSnapshot: {
      type: customerSnapshotSchema,
      required: true,
    },
    items: {
      type: [invoiceItemSchema],
      required: true,
      validate: {
        validator(items) {
          return Array.isArray(items) && items.length > 0;
        },
        message: 'Invoice must include at least one item',
      },
    },
    subtotal: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    discountType: {
      type: String,
      enum: Object.values(DISCOUNT_TYPES),
      default: DISCOUNT_TYPES.NONE,
    },
    discountValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxableAmount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    taxRate: {
      type: Number,
      default: 8,
      min: 0,
      max: 100,
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    remainingAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      trim: true,
      uppercase: true,
      minlength: 3,
      maxlength: 3,
      default: 'SYP',
      set: normalizeUppercase,
    },
    invoiceStatus: {
      type: String,
      enum: Object.values(INVOICE_STATUSES),
      default: INVOICE_STATUSES.DRAFT,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUSES),
      default: PAYMENT_STATUSES.PENDING,
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PAYMENT_METHODS),
      default: PAYMENT_METHODS.CASH,
    },
    sentAt: {
      type: Date,
    },
    dueDate: {
      type: Date,
    },
    source: {
      type: String,
      enum: Object.values(INVOICE_SOURCES),
      default: INVOICE_SOURCES.MANUAL,
    },
    voiceText: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    confirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    confirmedAt: {
      type: Date,
    },
    archivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    archivedAt: {
      type: Date,
    },
    pdfPath: {
      type: String,
      trim: true,
    },
    pdfGeneratedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

invoiceSchema.index({ invoiceStatus: 1 });
invoiceSchema.index({ paymentStatus: 1 });
invoiceSchema.index({ customerId: 1 });
invoiceSchema.index({ createdBy: 1 });
invoiceSchema.index({ createdAt: -1 });
invoiceSchema.index({ confirmedAt: -1 });

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = {
  DISCOUNT_TYPES,
  INVOICE_SOURCES,
  INVOICE_STATUSES,
  Invoice,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
};
