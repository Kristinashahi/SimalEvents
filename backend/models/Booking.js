// models/Booking.js
import mongoose from "mongoose";

const selectedMenuItemSchema = new mongoose.Schema({
  menuItemId: String,
  quantity: Number,
  isOptional: Boolean,
  isSectionItem: Boolean,
});

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service",
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  periods: [{
    type: String,
    enum: ["morning", "day", "evening"],
    required: true,
  }],
  cateringPackage: {
    packageId: mongoose.Schema.Types.ObjectId,
    selectedItems: [selectedMenuItemSchema],
    guestCount: Number,
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "paid", "completed", "cancelled"],
    default: "pending",
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  specialRequests: String,
  payment: {
    paymentId: String, // eSewa product ID
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    amount: Number, // Amount in NPR
    paidAt: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  commission: {
    type: Number,
    default: function () {
      return this.totalPrice * 0.05; // 5% commission
    },
  },
});

bookingSchema.index({
  service: 1,
  date: 1,
  periods: 1,
  status: 1,
});

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;