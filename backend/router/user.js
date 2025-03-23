import express from "express";
import { auth, roleAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/user-dashboard", auth, roleAuth(["user"]), (req, res) => {
  res.json({ msg: "Welcome User!" });
});

export default router;




