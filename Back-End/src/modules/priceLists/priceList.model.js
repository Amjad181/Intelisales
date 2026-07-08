const mongoose = require('mongoose');

const PRICE_LIST_STATUSES = Object.freeze({
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
});

const PRICE_LIST_CUSTOMER_TYPES = Object.freeze({
  RETAIL: 'Retail',
  WHOLESALE: 'Wholesale',
  KEY_ACCOUNT: 'KeyAccount',
});

const normalizeUppercase = (value) => (
  typeof value === 'string' ? value.trim().toUpperCase() : value
);

const priceListItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    price: {
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
  },
  { _id: false },
);

const priceListSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    customerType: {
      type: String,
      enum: Object.values(PRICE_LIST_CUSTOMER_TYPES),
      required: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: Object.values(PRICE_LIST_STATUSES),
      default: PRICE_LIST_STATUSES.ACTIVE,
    },
    items: {
      type: [priceListItemSchema],
      default: [],
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

priceListSchema.index({ customerType: 1, status: 1 });
priceListSchema.index({ status: 1 });
priceListSchema.index({ name: 1 });

const PriceList = mongoose.model('PriceList', priceListSchema);

module.exports = {
  PriceList,
  PRICE_LIST_CUSTOMER_TYPES,
  PRICE_LIST_STATUSES,
};
