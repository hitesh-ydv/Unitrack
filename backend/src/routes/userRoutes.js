const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const db = require("../db/d1Client");

function formatRole(r) {
  if (!r) return null;
  return {
    ...r,
    permissions: typeof r.permissions === "string" ? JSON.parse(r.permissions || "[]") : r.permissions || [],
  };
}

// GET /api/users - Get all users
router.get("/", async (req, res, next) => {
  try {
    const users = await db.query(
      "SELECT id, name, email, role, department, phone, status, lastLogin, avatarUrl, createdAt FROM users ORDER BY id ASC"
    );
    res.json(users);
  } catch (err) {
    next(err);
  }
});

// GET /api/users/roles - Get roles and their permission matrices
router.get("/roles", async (req, res, next) => {
  try {
    const roles = await db.query("SELECT * FROM roles_permissions");
    res.json(roles.map(formatRole));
  } catch (err) {
    next(err);
  }
});

// POST /api/users - Create user
router.post("/", async (req, res, next) => {
  try {
    const data = req.body;
    const all = await db.query("SELECT id FROM users");
    const newId = data.id || `USR-${String(all.length + 1).padStart(3, "0")}`;
    const passwordHash = bcrypt.hashSync(data.password || "password123", 10);

    const newUser = {
      id: newId,
      name: data.name || "New Staff Member",
      email: (data.email || `user${all.length + 1}@apex.edu`).toLowerCase().trim(),
      role: data.role || "Viewer",
      department: data.department || "Operations",
      phone: data.phone || "+91 98000 00000",
      status: data.status || "active",
      lastLogin: "Never",
      avatarUrl: data.avatarUrl || null,
    };

    await db.execute(
      `INSERT INTO users (id, name, email, password_hash, role, department, phone, status, lastLogin, avatarUrl)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newUser.id, newUser.name, newUser.email, passwordHash,
        newUser.role, newUser.department, newUser.phone,
        newUser.status, newUser.lastLogin, newUser.avatarUrl
      ]
    );

    res.status(201).json(newUser);
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/:id - Update user
router.put("/:id", async (req, res, next) => {
  try {
    const existing = await db.queryFirst("SELECT * FROM users WHERE id = ?", [req.params.id]);
    if (!existing) {
      return res.status(404).json({ message: "User not found" });
    }

    const updated = { ...existing, ...req.body };

    await db.execute(
      `UPDATE users SET name = ?, email = ?, role = ?, department = ?, phone = ?, status = ?, avatarUrl = ?
       WHERE id = ?`,
      [
        updated.name, updated.email.toLowerCase().trim(), updated.role,
        updated.department, updated.phone, updated.status, updated.avatarUrl,
        req.params.id
      ]
    );

    const safe = {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      department: updated.department,
      phone: updated.phone,
      status: updated.status,
      lastLogin: updated.lastLogin,
      avatarUrl: updated.avatarUrl,
    };

    res.json(safe);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/users/:id - Delete user
router.delete("/:id", async (req, res, next) => {
  try {
    const existing = await db.queryFirst("SELECT id FROM users WHERE id = ?", [req.params.id]);
    if (!existing) {
      return res.status(404).json({ message: "User not found" });
    }

    await db.execute("DELETE FROM users WHERE id = ?", [req.params.id]);
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
