import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema({
  businessName: { type: String, required: true },
  address: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  description: { type: String, required: true },
  website: { type: String },
  taxId: { type: String, required: true },
  serviceCategories: [String],
  email: { type: String, required: true, unique: true },
  contactPerson: { type: String, required: true },
  password: { type: String, required: true },
  document: { type: String },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
}, { timestamps: true });

export default mongoose.model("Vendor", vendorSchema);