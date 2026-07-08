const mongoose = require('mongoose');

const VISIT_STATUSES = Object.freeze({
  PLANNED: 'PLANNED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
});

const VISIT_OUTCOMES = Object.freeze({
  NONE: 'NONE',
  ORDER_PLACED: 'ORDER_PLACED',
  PAYMENT_COLLECTED: 'PAYMENT_COLLECTED',
  FOLLOW_UP_NEEDED: 'FOLLOW_UP_NEEDED',
  NO_INTEREST: 'NO_INTEREST',
  CUSTOMER_UNAVAILABLE: 'CUSTOMER_UNAVAILABLE',
  OTHER: 'OTHER',
});

const locationSchema = new mongoose.Schema(
  {
    address: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    city: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    latitude: {
      type: Number,
      min: -90,
      max: 90,
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180,
    },
  },
  { _id: false },
);

const visitSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    salesRep: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    visitDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(VISIT_STATUSES),
      default: VISIT_STATUSES.PLANNED,
    },
    purpose: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    outcome: {
      type: String,
      enum: Object.values(VISIT_OUTCOMES),
      default: VISIT_OUTCOMES.NONE,
    },
    nextAction: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    nextVisitDate: {
      type: Date,
    },
    location: locationSchema,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    completedAt: {
      type: Date,
    },
    cancelledAt: {
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

visitSchema.index({ customer: 1 });
visitSchema.index({ salesRep: 1 });
visitSchema.index({ status: 1 });
visitSchema.index({ outcome: 1 });
visitSchema.index({ visitDate: -1 });
visitSchema.index({ createdAt: -1 });

const Visit = mongoose.model('Visit', visitSchema);

module.exports = {
  Visit,
  VISIT_OUTCOMES,
  VISIT_STATUSES,
};
