import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import { body, validationResult } from "express-validator";
import multer from "multer";
import path from "path";
import { auth } from "../middleware/auth.js";
import fs from "fs";

const router = express.Router();
const JWT_SECRET = "secret_key"; // Change this to a secure key

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/';
    // Create directory if it doesn't exist
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
  // Accept only certain file types
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
  next();
});

// **REGISTER FOR USERS**
router.post(
  "/register",
  upload.single('document'), // Add multer middleware
  [
    body("name").notEmpty(),
    body("email").isEmail(),
    body("password").isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      // Check if user already exists
      let user = await User.findOne({ email: req.body.email });
      if (user) return res.status(400).json({ msg: "User already exists" });

      // Create new user object with all fields
      const userData = {
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        role: req.body.role || "user"
      };

      // If registering as vendor, add vendor-specific fields
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
        
        // Add document URL if file was uploaded
        if (req.file) {
          userData.documentUrl = req.file.path;
        }
      }

      // Create and save the user
      user = new User(userData);
      await user.save();

      // Create JWT token
      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "1h" });
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
      if (!user) return res.status(400).json({ msg: "Invalid credentials" });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

      // Check if vendor is approved
      if (user.role === "vendor" && user.vendorStatus !== "approved") {
        return res.status(403).json({ 
          msg: user.vendorStatus === "pending" 
            ? "Your vendor account is pending approval." 
            : "Your vendor application was rejected." 
        });
      }

      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "1h" });
      res.json({ token });
    } catch (err) {
      res.status(500).json({ msg: "Server error" });
    }
  }
);

// veendor register
router.post("/register-vendor", auth, async (req, res) => {
  try {
    // Get user from auth middleware
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    
    // Update user with vendor information
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
    
    // Handle file upload if needed
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


export default router;