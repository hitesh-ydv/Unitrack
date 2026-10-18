const express = require("express");
const router = express.Router();
const db = require("../db/d1Client");

// GET /api/students
router.get("/", async (req, res, next) => {
  try {
    const students = await db.query("SELECT * FROM students ORDER BY id ASC");
    res.json(students);
  } catch (err) {
    next(err);
  }
});

// GET /api/students/:id
router.get("/:id", async (req, res, next) => {
  try {
    const student = await db.queryFirst("SELECT * FROM students WHERE id = ?", [req.params.id]);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.json(student);
  } catch (err) {
    next(err);
  }
});

// POST /api/students - Create single student
router.post("/", async (req, res, next) => {
  try {
    const data = req.body;
    const all = await db.query("SELECT id FROM students");
    const newId = data.id || `STU-2026-${String(all.length + 101).padStart(3, "0")}`;

    const newStudent = {
      id: newId,
      name: data.name || "Student Name",
      rollNumber: data.rollNumber || `CS-2026-${all.length + 100}`,
      department: data.department || "General Engineering",
      year: data.year || "1st Year",
      email: data.email || `${(data.name || "student").toLowerCase().replace(/\s+/g, ".")}@uni.edu`,
      phone: data.phone || "+91 98000 00000",
      assignedBusId: data.assignedBusId || null,
      assignedBusNumber: data.assignedBusNumber || "Bus 101",
      assignedStopId: data.assignedStopId || "STP-01",
      assignedStopName: data.assignedStopName || "Central Metro Interchange",
      rfidCode: data.rfidCode || `RFID-${Math.floor(1000 + Math.random() * 9000)}-AB`,
      qrPassCode: data.qrPassCode || `PASS-QR-${Math.floor(10000 + Math.random() * 90000)}`,
      guardianName: data.guardianName || "",
      guardianPhone: data.guardianPhone || "",
      boardingStatusToday: data.boardingStatusToday || "Pending",
      boardingTime: data.boardingTime || null,
      status: data.status || "active",
      photoUrl: data.photoUrl || null,
    };

    await db.execute(
      `INSERT INTO students (
        id, name, rollNumber, department, year, email, phone, assignedBusId, assignedBusNumber,
        assignedStopId, assignedStopName, rfidCode, qrPassCode, guardianName, guardianPhone,
        boardingStatusToday, boardingTime, status, photoUrl
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newStudent.id, newStudent.name, newStudent.rollNumber, newStudent.department, newStudent.year,
        newStudent.email, newStudent.phone, newStudent.assignedBusId, newStudent.assignedBusNumber,
        newStudent.assignedStopId, newStudent.assignedStopName, newStudent.rfidCode, newStudent.qrPassCode,
        newStudent.guardianName, newStudent.guardianPhone, newStudent.boardingStatusToday,
        newStudent.boardingTime, newStudent.status, newStudent.photoUrl
      ]
    );

    res.status(201).json(newStudent);
  } catch (err) {
    next(err);
  }
});

// POST /api/students/batch - Batch import students from CSV roster
router.post("/batch", async (req, res, next) => {
  try {
    const list = req.body;
    if (!Array.isArray(list)) {
      return res.status(400).json({ message: "Expected an array of student objects." });
    }

    const all = await db.query("SELECT id FROM students");
    let currentCount = all.length;
    const insertedStudents = [];

    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      const newId = item.id || `STU-2026-${String(currentCount + i + 101).padStart(3, "0")}`;

      const student = {
        id: newId,
        name: item.name || "Imported Student",
        rollNumber: item.rollNumber || `ROLL-${currentCount + i + 100}`,
        department: item.department || "Engineering",
        year: item.year || "1st Year",
        email: item.email || `${(item.name || `student${i}`).toLowerCase().replace(/\s+/g, ".")}@uni.edu`,
        phone: item.phone || "+91 98000 00000",
        assignedBusId: item.assignedBusId || null,
        assignedBusNumber: item.assignedBusNumber || "Bus 101",
        assignedStopId: item.assignedStopId || "STP-01",
        assignedStopName: item.assignedStopName || "Central Metro Interchange",
        rfidCode: item.rfidCode || `RFID-${Math.floor(1000 + Math.random() * 9000)}`,
        qrPassCode: item.qrPassCode || `PASS-QR-${Math.floor(10000 + Math.random() * 90000)}`,
        guardianName: item.guardianName || "",
        guardianPhone: item.guardianPhone || "",
        boardingStatusToday: "Pending",
        boardingTime: null,
        status: "active",
        photoUrl: item.photoUrl || null,
      };

      await db.execute(
        `INSERT OR REPLACE INTO students (
          id, name, rollNumber, department, year, email, phone, assignedBusId, assignedBusNumber,
          assignedStopId, assignedStopName, rfidCode, qrPassCode, guardianName, guardianPhone,
          boardingStatusToday, boardingTime, status, photoUrl
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          student.id, student.name, student.rollNumber, student.department, student.year,
          student.email, student.phone, student.assignedBusId, student.assignedBusNumber,
          student.assignedStopId, student.assignedStopName, student.rfidCode, student.qrPassCode,
          student.guardianName, student.guardianPhone, student.boardingStatusToday,
          student.boardingTime, student.status, student.photoUrl
        ]
      );

      insertedStudents.push(student);
    }

    res.status(201).json(insertedStudents);
  } catch (err) {
    next(err);
  }
});

// PUT /api/students/:id
router.put("/:id", async (req, res, next) => {
  try {
    const existing = await db.queryFirst("SELECT * FROM students WHERE id = ?", [req.params.id]);
    if (!existing) {
      return res.status(404).json({ message: "Student not found" });
    }

    const updated = { ...existing, ...req.body };

    await db.execute(
      `UPDATE students SET
        name = ?, rollNumber = ?, department = ?, year = ?, email = ?, phone = ?,
        assignedBusId = ?, assignedBusNumber = ?, assignedStopId = ?, assignedStopName = ?,
        rfidCode = ?, qrPassCode = ?, guardianName = ?, guardianPhone = ?,
        boardingStatusToday = ?, boardingTime = ?, status = ?, photoUrl = ?
       WHERE id = ?`,
      [
        updated.name, updated.rollNumber, updated.department, updated.year, updated.email, updated.phone,
        updated.assignedBusId, updated.assignedBusNumber, updated.assignedStopId, updated.assignedStopName,
        updated.rfidCode, updated.qrPassCode, updated.guardianName, updated.guardianPhone,
        updated.boardingStatusToday, updated.boardingTime, updated.status, updated.photoUrl, req.params.id
      ]
    );

    const result = await db.queryFirst("SELECT * FROM students WHERE id = ?", [req.params.id]);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/students/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const existing = await db.queryFirst("SELECT id FROM students WHERE id = ?", [req.params.id]);
    if (!existing) {
      return res.status(404).json({ message: "Student not found" });
    }

    await db.execute("DELETE FROM students WHERE id = ?", [req.params.id]);
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
