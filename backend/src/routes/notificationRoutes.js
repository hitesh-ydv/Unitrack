const express = require("express");
const router = express.Router();
const db = require("../db/d1Client");

function formatNotification(n) {
  if (!n) return null;
  return {
    ...n,
    unread: Boolean(n.unread),
  };
}

// GET /api/notifications
router.get("/", async (req, res, next) => {
  try {
    const raw = await db.query("SELECT * FROM notifications ORDER BY id DESC");
    res.json(raw.map(formatNotification));
  } catch (err) {
    next(err);
  }
});

// POST /api/notifications
router.post("/", async (req, res, next) => {
  try {
    const data = req.body;
    const newId = data.id || `NOTIF-${Date.now()}`;

    const newNotif = {
      id: newId,
      title: data.title || "Transit Notification",
      message: data.message || "",
      time: data.time || "Just now",
      category: data.category || "info",
      target: data.target || "all",
      unread: 1,
    };

    await db.execute(
      `INSERT INTO notifications (id, title, message, time, category, target, unread)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [newNotif.id, newNotif.title, newNotif.message, newNotif.time, newNotif.category, newNotif.target, newNotif.unread]
    );

    res.status(201).json(formatNotification(newNotif));
  } catch (err) {
    next(err);
  }
});

// PATCH /api/notifications/:id/read - Toggle read/unread
router.patch("/:id/read", async (req, res, next) => {
  try {
    const existing = await db.queryFirst("SELECT * FROM notifications WHERE id = ?", [req.params.id]);
    if (!existing) {
      return res.status(404).json({ message: "Notification not found" });
    }

    const newUnread = existing.unread ? 0 : 1;
    await db.execute("UPDATE notifications SET unread = ? WHERE id = ?", [newUnread, req.params.id]);

    const updated = await db.queryFirst("SELECT * FROM notifications WHERE id = ?", [req.params.id]);
    res.json(formatNotification(updated));
  } catch (err) {
    next(err);
  }
});

// POST /api/notifications/mark-all-read
router.post("/mark-all-read", async (req, res, next) => {
  try {
    await db.execute("UPDATE notifications SET unread = 0");
    res.json({ success: true, message: "All notifications marked as read." });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
