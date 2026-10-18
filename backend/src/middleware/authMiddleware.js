const jwt = require("jsonwebtoken");
const config = require("../config/config");
const db = require("../db/d1Client");

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required. No token provided." });
  }

  const token = authHeader.split(" ")[1];

  // Demo token support for initial frontend exploration
  if (token === "demo-jwt-token-xyz") {
    req.user = {
      id: "USR-001",
      email: "arvind.chawla@apex.edu",
      name: "Dr. Arvind Chawla",
      role: "Super Admin",
    };
    return next();
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await db.queryFirst("SELECT id, name, email, role, department FROM users WHERE id = ?", [decoded.id]);

    if (!user) {
      return res.status(401).json({ message: "User not found or session expired." });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token.", error: err.message });
  }
};

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    if (req.user.role === "Super Admin" || allowedRoles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({ message: "Forbidden. Insufficient permissions." });
  };
};

module.exports = {
  authenticate,
  requireRole,
};
