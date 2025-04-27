// middleware/auth.js
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import dotenv from "dotenv";

dotenv.config();

export const auth = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  //console.log(`Auth middleware: Received token: ${token ? "present" : "missing"}`);

  if (!token) {
    //console.error("Auth middleware: No token provided");
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    //console.log(`Auth middleware: Token decoded: ${JSON.stringify(decoded)}`);
    req.user = decoded;
    next();
  } catch (err) {
    //console.error("Auth middleware: Token verification failed:", err.message);
    res.status(401).json({ msg: "Token is not valid" });
  }
};

export const roleAuth = (roles) => (req, res, next) => {
  //console.log(`Role auth: User role: ${req.user.role}, Required roles: ${roles}`);
  if (!roles.includes(req.user.role)) {
   // console.error("Role auth: Access denied for role:", req.user.role);
    return res.status(403).json({ msg: "Access denied" });
  }
  next();
};