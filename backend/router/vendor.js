import express from "express";
import { auth, roleAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/vendor-dashboard", auth, roleAuth(["vendor"]), (req, res) => {
  res.json({ msg: "Welcome Vendor!" });
});

export default router;