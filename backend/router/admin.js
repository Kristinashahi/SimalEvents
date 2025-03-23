import express from "express";
import User from "../models/user.js";
import {auth} from "../middleware/auth.js";

const router = express.Router();

// Admin Dashboard Data
router.get("/admin-dashboard", auth, async (req, res) => {
  // Check if user is admin
  if (req.user.role !== "admin") {
    return res.status(403).json({ msg: "Not authorized as admin" });
  }

  try {
    // Get users by role
    const users = await User.find({ role: "user" });
    const vendors = await User.find({ role: "vendor" });
    const pendingVendors = await User.find({ 
      role: "vendor", 
      vendorStatus: "pending" 
    });
    
    // Return just users and vendors without products
    res.json({
      users,
      vendors,
      pendingVendors: pendingVendors.length,
      products: [] // Empty array for products since you don't have this model
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Manage users 
router.get("/users", auth, async (req, res) => {
  // Check if user is admin
  if (req.user.role !== "admin") {
    return res.status(403).json({ msg: "Not authorized as admin" });
  }

  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Route to delete a user
router.delete("/users/:id", auth, async (req, res) => {
  // Check if user is admin
  if (req.user.role !== "admin") {
    return res.status(403).json({ msg: "Not authorized as admin" });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ msg: "User removed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Get all pending vendor applications
router.get("/pending-vendors", auth, async (req, res) => {
  // Check if user is admin
  if (req.user.role !== "admin") {
    return res.status(403).json({ msg: "Not authorized as admin" });
  }

  try {
    const pendingVendors = await User.find({ 
      role: "vendor", 
      vendorStatus: "pending" 
    }).select("-password");
    
    res.json(pendingVendors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Get all vendors (for management)
router.get("/vendors", auth, async (req, res) => {
  // Check if user is admin
  if (req.user.role !== "admin") {
    return res.status(403).json({ msg: "Not authorized as admin" });
  }

  try {
    const vendors = await User.find({ 
      role: "vendor"
    }).select("-password");
    
    res.json(vendors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Approve a vendor application
router.put("/approve-vendor/:id", auth, async (req, res) => {
  // Check if user is admin
  if (req.user.role !== "admin") {
    return res.status(403).json({ msg: "Not authorized as admin" });
  }

  try {
    // Find and update the vendor status
    const vendor = await User.findById(req.params.id);
    
    if (!vendor) {
      return res.status(404).json({ msg: "Vendor not found" });
    }
    
    vendor.vendorStatus = "approved";
    await vendor.save();
    
    res.json({ msg: "Vendor approved successfully", vendor });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Reject a vendor application
router.put("/reject-vendor/:id", auth, async (req, res) => {
  // Check if user is admin
  if (req.user.role !== "admin") {
    return res.status(403).json({ msg: "Not authorized as admin" });
  }

  try {
    // Find and update the vendor status
    const vendor = await User.findById(req.params.id);
    
    if (!vendor) {
      return res.status(404).json({ msg: "Vendor not found" });
    }
    
    vendor.vendorStatus = "rejected";
    await vendor.save();
    
    res.json({ msg: "Vendor application rejected", vendor });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

export default router;