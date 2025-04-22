import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import { body, validationResult } from "express-validator";
import multer from "multer";
import path from "path";
import { auth } from "../middleware/auth.js";
import fs from "fs";
import Booking from "../models/Booking.js";
import Service from "../models/Services.js";


const router = express.Router();

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedFileTypes = ['.pdf', '.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedFileTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, JPG, and PNG are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

router.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", process.env.FRONTEND_URL || "http://localhost:5173");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

// **REGISTER FOR USERS**
router.post(
  "/register",
  upload.single('document'),
  [
    body("name").notEmpty(),
    body("email").isEmail(),
    body("password").isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      let user = await User.findOne({ email: req.body.email });
      if (user) return res.status(400).json({ msg: "User already exists" });

      const userData = {
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        role: req.body.role || "user"
      };

      if (req.body.role === "vendor") {
        userData.businessName = req.body.businessName;
        userData.address = req.body.address;
        userData.phoneNumber = req.body.phoneNumber;
        userData.description = req.body.description;
        userData.website = req.body.website;
        userData.taxId = req.body.taxId;
        userData.serviceCategories = req.body.serviceCategories;
        userData.contactPerson = req.body.contactPerson;
        userData.vendorStatus = "pending";
        
        if (req.file) {
          userData.documentUrl = req.file.path;
        }
      }

      user = new User(userData);
      await user.save();

      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );
      res.json({ token });
    } catch (err) {
      console.error("Registration error:", err);
      res.status(500).json({ msg: "Server error" });
    }
  }
);

// **LOGIN**
router.post(
  "/login",
  [body("email").isEmail(), body("password").exists()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ msg: "No user found with this email id!" });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

      if (user.role === "vendor" && user.vendorStatus !== "approved") {
        return res.status(403).json({ 
          msg: user.vendorStatus === "pending" 
            ? "Your vendor account is pending approval." 
            : "Your vendor application was rejected." 
        });
      }

      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );
      res.json({ token });
    } catch (err) {
      res.status(500).json({ msg: "Server error" });
    }
  }
);

// Vendor register
router.post("/register-vendor", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    
    user.role = "vendor";
    user.businessName = req.body.businessName;
    user.address = req.body.address;
    user.phoneNumber = req.body.phoneNumber;
    user.description = req.body.description;
    user.website = req.body.website;
    user.taxId = req.body.taxId;
    user.serviceCategories = req.body.serviceCategories;
    user.contactPerson = req.body.contactPerson;
    user.vendorStatus = "pending";
    
    if (req.file) {
      user.documentUrl = req.file.path;
    }
    
    await user.save();
    
    res.json({ msg: "Vendor registration submitted for approval", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

router.put("/vendor/profile", auth, async (req, res) => {
  if (req.user.role !== "vendor") {
    return res.status(403).json({ msg: "Only vendors can update profile" });
  }
  try {
    const { khaltiMerchantId } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { khaltiMerchantId },
      { new: true }
    ).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// Get user profile
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

router.put("/profile", auth, async (req, res) => {
  try {
    const { khaltiMerchantId } = req.body;
    if (!khaltiMerchantId) {
      return res.status(400).json({ msg: "Khalti Merchant ID is required" });
    }
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { khaltiMerchantId },
      { new: true }
    ).select("-password");
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    res.json({
      msg: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error" });
  }
});

// Get user bookings
router.get("/bookings", auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate("service", "name price images")
      .populate("vendor", "businessName")
      .sort({ date: -1 });
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Change password
router.post("/change-password", auth, async (req, res) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;

  try {
    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ msg: "New passwords don't match" });
    }

    const user = await User.findById(req.user.id).select('+password');
    
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Current password is incorrect" });
    }
    
    user.password = newPassword;
    await user.save({ validateModifiedOnly: true });
    
    res.json({ msg: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});
/*
// Forgot Password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  // Basic validation
  if (!email || !email.includes('@')) {
    return res.status(400).json({ msg: "Valid email is required" });
  }

  try {
    const user = await User.findOne({ email });
    
    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ msg: "If this email exists, a reset link has been sent" });
    }

    // Generate JWT token
    const resetToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Save to database
    user.resetToken = resetToken;
    await user.save();

    // Send email
    await sendPasswordResetEmail(email, resetToken);
    
    res.json({ msg: "Password reset link sent to your email!" });
  } catch (error) {
    console.error('Password reset error:', error);
    
    // Specific error for email failures
    if (error.message.includes('Failed to send email')) {
      return res.status(500).json({ 
        msg: "Failed to send email. Please try again later.",
        error: error.message 
      });
    }
    
    res.status(500).json({ msg: "Server error" });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    if (!token || !newPassword) {
      return res.status(400).json({ msg: "Token and new password are required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user || user.resetToken !== token) {
      return res.status(400).json({ msg: "Invalid or expired token" });
    }

    user.password = newPassword;
    user.resetToken = undefined;
    await user.save();

    res.json({ msg: "Password updated successfully!" });
  } catch (error) {
    console.error("Reset password error:", error);
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ msg: "Token expired" });
    }
    res.status(500).json({ msg: "Server error" });
  }
});*/

export default router;