const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db/d1Client");
const config = require("../config/config");
const { authenticate } = require("../middleware/authMiddleware");

// POST /api/auth/login
router.post("/login", async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    let user = await db.queryFirst("SELECT * FROM users WHERE email = ?", [email.toLowerCase().trim()]);

    if (!user) {
      // Auto-register demo user if logging in for the first time
      const newId = `USR-${Date.now().toString().slice(-4)}`;
      const userName = email.split("@")[0].replace(".", " ");
      const formattedName = userName.charAt(0).toUpperCase() + userName.slice(1);
      const userRole = role || "Super Admin";
      const passwordHash = bcrypt.hashSync(password || "password123", 10);

      await db.execute(
        `INSERT INTO users (id, name, email, password_hash, role, department, status, lastLogin)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [newId, formattedName, email.toLowerCase().trim(), passwordHash, userRole, "General Administration", "active", "Just now"]
      );

      user = await db.queryFirst("SELECT * FROM users WHERE id = ?", [newId]);
    } else if (password && user.password_hash) {
      const match = bcrypt.compareSync(password, user.password_hash);
      // For demo convenience, allow 'password123' as default fallback
      if (!match && password !== "password123") {
        return res.status(401).json({ message: "Invalid email or password." });
      }
    }

    // Update lastLogin
    await db.execute("UPDATE users SET lastLogin = ? WHERE id = ?", ["Just now", user.id]);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      config.jwtSecret,
      { expiresIn: "7d" }
    );

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      phone: user.phone,
      status: user.status,
      lastLogin: "Just now",
      avatarUrl: user.avatarUrl,
    };

    res.json({
      success: true,
      token,
      user: safeUser,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/register
router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password, role, department, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }

    const existing = await db.queryFirst("SELECT id FROM users WHERE email = ?", [email.toLowerCase().trim()]);
    if (existing) {
      return res.status(400).json({ message: "A user with this email already exists." });
    }

    const newId = `USR-${Date.now().toString().slice(-4)}`;
    const passwordHash = bcrypt.hashSync(password, 10);
    const userRole = role || "Viewer";

    await db.execute(
      `INSERT INTO users (id, name, email, password_hash, role, department, phone, status, lastLogin)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [newId, name, email.toLowerCase().trim(), passwordHash, userRole, department || "General Staff", phone || "", "active", "Just now"]
    );

    const token = jwt.sign(
      { id: newId, email, role: userRole, name },
      config.jwtSecret,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: newId,
        name,
        email,
        role: userRole,
        department,
        phone,
        status: "active",
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get("/me", authenticate, async (req, res, next) => {
  try {
    const user = await db.queryFirst(
      "SELECT id, name, email, role, department, phone, status, lastLogin, avatarUrl FROM users WHERE id = ?",
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
