import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["user", "vendor", "admin"],
    default: "user",
  },
  // Vendor specific fields
  businessName: {
    type: String,
  },
  address: {
    type: String,
  },
  phoneNumber: {
    type: String,
  },
  description: {
    type: String,
  },
  website: {
    type: String,
  },
  taxId: {
    type: String,
  },
  serviceCategories: {
    type: [String], // Changed to array
    enum: ["Venue", "Catering", "Decoration", "Photography", "Videography", 
      "Sound System", "Lighting", "Entertainment", "Transportation", "Other"],
    required: function() { return this.role === "vendor"; },
  },
  contactPerson: {
    type: String,
  },
  documentUrl: {
    type: String,
  },
  vendorStatus: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  khaltiMerchantId: {
    type: String, // Optional for vendors
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  services: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Service" 
  }],
});

// Hash password before saving
userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;