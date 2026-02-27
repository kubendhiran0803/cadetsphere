const express = require("express");
const router = express.Router();
const db = require("../db");

// Get activities for a cadet
router.get("/cadet/:name", (req, res) => {
    const { name } = req.params;
    const sql = "SELECT * FROM activities WHERE cadet_name = ? ORDER BY date DESC, created_at DESC";
    db.query(sql, [name], (err, results) => {
        if (err) {
            console.error("Error fetching activities:", err);
            return res.status(500).json({ message: "Database error" });
        }
        res.json(results);
    });
});

// Add a new activity
router.post("/", (req, res) => {
    const { cadet_name, activity_name, category, date, duration } = req.body;

    if (!cadet_name || !activity_name || !category || !date || !duration) {
        return res.status(400).json({ message: "All fields are required" });
    }

    const sql = "INSERT INTO activities (cadet_name, activity_name, category, date, duration, status) VALUES (?, ?, ?, ?, ?, 'Pending')";
    db.query(sql, [cadet_name, activity_name, category, date, duration], (err, result) => {
        if (err) {
            console.error("Error adding activity:", err);
            return res.status(500).json({ message: "Database error" });
        }
        res.status(201).json({ message: "Activity submitted successfully", id: result.insertId });
    });
});


// Get all activities (for Staff)
router.get("/", (req, res) => {
    const sql = "SELECT * FROM activities ORDER BY created_at DESC";
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching all activities:", err);
            return res.status(500).json({ message: "Database error" });
        }
        res.json(results);
    });
});

// Update activity status (Approve/Reject)
router.put("/:id", (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'Approved' or 'Rejected'

    if (!['Approved', 'Rejected'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
    }

    const sql = "UPDATE activities SET status = ? WHERE id = ?";
    db.query(sql, [status, id], (err, result) => {
        if (err) {
            console.error("Error updating activity status:", err);
            return res.status(500).json({ message: "Database error" });
        }
        res.json({ message: "Activity status updated" });
    });
});

module.exports = router;
