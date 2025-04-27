import express from "express";
import User from "../models/user.js";
import Service from "../models/Services.js";
import {auth} from "../middleware/auth.js";
import Booking from "../models/Booking.js";

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

    const services = await Service.find();
    
    // Return just users and vendors without products
    res.json({
      users,
      vendors,
      pendingVendors: pendingVendors.length,
      services
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
router.get("/bookings", auth, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ msg: "Not authorized as admin" });
  }

  try {
    const bookings = await Booking.find({
      status: { $in: ["confirmed", "paid"] },
      "payment.status": "completed",
    })
      .populate("service", "name")
      .populate("vendor", "businessName")
      .select("_id date totalPrice commission service vendor status");

    res.json(bookings);
  } catch (err) {
    console.error("Error fetching bookings:", err);
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


// Approve a vendor application
router.put("/approve-vendor/:id", auth, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ msg: "Not authorized as admin" });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== "vendor") {
      return res.status(404).json({ msg: "Vendor not found" });
    }

    user.vendorStatus = "approved";
    // Do not set khaltiMerchantId; let vendor add it later
    await user.save();

    
    res.json({ msg: "Vendor approved successfully", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error: " + err.message });
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

// Get growth statistics
router.get("/growth-stats", auth, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ msg: "Not authorized as admin" });
  }

  try {
    // Get user growth
    const userGrowth = await User.aggregate([
      { 
        $match: { 
          role: "user",
          createdAt: { $exists: true } 
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } },
      { $limit: 30 } // Last 30 days
    ]);

    // Get vendor growth
    const vendorGrowth = await User.aggregate([
      { 
        $match: { 
          role: "vendor",
          createdAt: { $exists: true } 
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } },
      { $limit: 30 }
    ]);

    res.json({
      userGrowth,
      vendorGrowth
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});
router.get("/payments", auth, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ msg: "Not authorized as admin" });
  }

  try {
    const bookings = await Booking.find({ "payment.status": "completed" });
    const totalPayments = bookings.reduce((sum, b) => sum + b.totalPrice, 0);
    const totalCommissions = bookings.reduce((sum, b) => sum + (b.commission || 0), 0);

    res.json({
      totalPayments,
      totalCommissions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Get top services
router.get("/top-services", auth, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ msg: "Not authorized as admin" });
  }

  try {
    const topServices = await Service.aggregate([
      { $sort: { bookings: -1 } }, // Sort by bookings instead of popularity
      { $limit: 5 },
      {
        $lookup: {
          from: "User", // Update to match the actual collection name (likely "User")
          localField: "vendor",
          foreignField: "_id",
          as: "vendorDetails"
        }
      },
      { $unwind: "$vendorDetails" },
      {
        $project: {
          name: 1,
          price: 1,
          category: 1,
          bookings: 1,
          vendorName: "$vendorDetails.name",
          createdAt: 1
        }
      }
    ]);

    console.log("Top services:", topServices); // Log for debugging
    res.json(topServices);
  } catch (err) {
    console.error("Error in top-services:", err);
 res.status(500).json({ msg: "Server error" });
  }
});




export default router;