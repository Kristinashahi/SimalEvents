import express from "express";
import { auth, roleAuth } from "../middleware/auth.js";
import User from "../models/user.js"; 

const router = express.Router();

router.get("/user-dashboard", auth, roleAuth(["user"]), (req, res) => {
  res.json({ msg: "Welcome User!" });
});

router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.post("/batch", async (req, res) => {
  try {
    const { ids } = req.body;
    
    // Validate input
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ msg: "Invalid vendor IDs" });
    }

    // Only fetch vendors (not all users)
    const vendors = await User.find({ 
      _id: { $in: ids },
      role: "vendor"  
    }).select("_id name businessName email");  

    res.json(vendors);
  } catch (err) {
    console.error("Batch fetch error:", err);
    res.status(500).json({ msg: "Failed to load vendors" });
  }
});
export default router;




