import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema({
  name: String,
  category: String,
  type: String,
  price: Number,
  description: String
});

const menuSectionSchema = new mongoose.Schema({
  name: String,
  items: [{
    title: String,
    items: [String] // Changed to store just the names as strings
  }]
});

const cateringPackageSchema = new mongoose.Schema({
  packageType: String,
  period: String,
  name: String,
  basePrice: Number,
  description: String,
  minGuests: Number,
  maxGuests: Number,
  menuSections: [menuSectionSchema],
  includedItems: [{ menuItemId: String, maxSelection: Number }],
  optionalItems: [{ menuItemId: String, maxSelection: Number }]
});

const featureSchema = new mongoose.Schema({
  name: String,
  icon: String
});

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['venue', 'photography', 'decoration'],
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  capacity: Number,
  area: Number,
  isAvailable: {
    type: Boolean,
    default: true
  },
  features: [featureSchema],
  cateringMenu: [menuItemSchema],
  cateringPackages: [cateringPackageSchema],
  hasCatering: Boolean,
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  images: [String],
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  
  availability: [{
    date: Date,
    periods: [String]
  }],
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Service', serviceSchema);