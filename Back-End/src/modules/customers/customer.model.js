const mongoose = require('mongoose');

const CUSTOMER_STATUSES = Object.freeze({
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
});

const CUSTOMER_TYPES = Object.freeze({
  RETAIL: 'Retail',
  WHOLESALE: 'Wholesale',
  KEY_ACCOUNT: 'KeyAccount',
});

const PAYMENT_TYPES = Object.freeze({
  CASH: 'Cash',
  CREDIT: 'Credit',
});

const addressSchema = new mongoose.Schema(
  {
    line1: {
      type: String,
      trim: true,
    },
    line2: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    postalCode: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
    },
  },
  { _id: false },
);

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    contactName: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    address: addressSchema,
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    assignedSalesRep: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    customerType: {
      type: String,
      enum: Object.values(CUSTOMER_TYPES),
      default: CUSTOMER_TYPES.RETAIL,
    },
    paymentType: {
      type: String,
      enum: Object.values(PAYMENT_TYPES),
      default: PAYMENT_TYPES.CASH,
    },
    status: {
      type: String,
      enum: Object.values(CUSTOMER_STATUSES),
      default: CUSTOMER_STATUSES.ACTIVE,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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

customerSchema.index({ status: 1 });
customerSchema.index({ customerType: 1 });
customerSchema.index({ paymentType: 1 });
customerSchema.index({ assignedSalesRep: 1 });
customerSchema.index({ name: 1 });
customerSchema.index({ email: 1 });
customerSchema.index({ phone: 1 });
customerSchema.index({ 'address.city': 1 });

const Customer = mongoose.model('Customer', customerSchema);

module.exports = {
  Customer,
  CUSTOMER_STATUSES,
  CUSTOMER_TYPES,
  PAYMENT_TYPES,
};
