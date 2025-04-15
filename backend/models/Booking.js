import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      service: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
        required: true
      },
      date: Date,
      periods: [{
        type: String,
        enum: ['morning', 'day', 'evening'],
        required: true
      }],
      status: {
        type: String,
        enum: ["pending", "confirmed", "completed", "cancelled"],
        default: "pending"
      },
      totalPrice: {
        type: Number,
        required: true
      },
      paymentStatus: {
        type: String,
        enum: ["pending", "paid", "refunded"],
        default: "pending"
      },
      specialRequests: {
        type: String
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    });

    // Optimize availability checks
bookingSchema.index({ 
    service: 1, 
    date: 1, 
    periods: 1,
    status: 1 
});

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;