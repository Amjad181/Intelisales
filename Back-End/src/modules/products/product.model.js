const mongoose = require('mongoose');

const PRODUCT_STATUSES = Object.freeze({
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
});

const PRODUCT_UNITS = Object.freeze({
  PIECE: 'PIECE',
  BOX: 'BOX',
  KG: 'KG',
  LITER: 'LITER',
  METER: 'METER',
  PACK: 'PACK',
});

const normalizeUppercase = (value) => (
  typeof value === 'string' ? value.trim().toUpperCase() : value
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: 80,
      set: normalizeUppercase,
    },
    barcode: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    brand: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    unit: {
      type: String,
      enum: Object.values(PRODUCT_UNITS),
      required: true,
      default: PRODUCT_UNITS.PIECE,
    },
    basePrice: {
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
    taxRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: Object.values(PRODUCT_STATUSES),
      default: PRODUCT_STATUSES.ACTIVE,
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

productSchema.index({ status: 1 });
productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ basePrice: 1 });
productSchema.index({ name: 1 });

const Product = mongoose.model('Product', productSchema);

module.exports = {
  Product,
  PRODUCT_STATUSES,
  PRODUCT_UNITS,
};
