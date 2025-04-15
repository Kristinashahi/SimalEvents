import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  name: {
    type: String,
    required: true
  },
  address :{
    type: String,
    required:true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  images: [{
    type: String // URLs to images
  }],
  isAvailable: {
    type: Boolean,
    default: true
  },
  availability: {
    type: [{
      day: { type: String, enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] },
      slots: [{
        start: String,
        end: String,
        available: Boolean
      }]
    }],
    default: []
  },
  packages: [{
    period: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    items: [String],
    minGuests: { type: Number, required: true },
    maxGuests: { type: Number, required: true },
    description: String
  }],
  hasCatering: { type: Boolean, default: false },
  features: [{
    name: { type: String, required: true },
  icon: { type: String }
  }],
  status: {
    type: String,
    enum: ["active", "inactive", "pending"],
    default: "active"
  },

  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  capacity: Number,
  area: Number,
  
  // Packages for venue services
  packages: [{
    name: {
      type: String,
      required: true
    },
    description: String,
    price: {
      type: Number,
      required: true
    },
    includes: [String],
    type: {
      type: String,
      enum: ["veg", "non-veg", "both", "other"],
      default: "other"
    }
  }],
  // Availability management
  availableDates: [Date],
  blockedDates: [Date],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Service = mongoose.model("Service", serviceSchema);

export default Service;