const express = require("express");
const router = express.Router();
const db = require("../db");

// Admin: Request mobile number update
router.post("/request", (req, res) => {
    const { target, id } = req.body; // target: 'all' or 'single'

    if (target === 'all') {
        const sql = "UPDATE signup SET mobile_req = 1 WHERE role IN ('Cadet', 'cadet')";
        db.query(sql, (err, result) => {
            if (err) {
                console.error("Error updating all:", err);
                return res.status(500).json({ message: "Database request failed: " + err.message });
            }
            res.json({ message: "Requested mobile numbers from all cadets" });
        });
    } else if (target === 'single' && id) {
        const sql = "UPDATE signup SET mobile_req = 1 WHERE id = ?";
        db.query(sql, [id], (err, result) => {
            if (err) {
                console.error("Error updating single:", err);
                return res.status(500).json({ message: "Database error" });
            }
            res.json({ message: "Requested mobile number from cadet" });
        });
    } else {
        res.status(400).json({ message: "Invalid request" });
    }
});

// Cadet: Check status (and get current number)
router.get("/status", (req, res) => {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: "Email required" });

    const sql = "SELECT mobile_req, mobile_number FROM signup WHERE email = ?";
    db.query(sql, [email], (err, results) => {
        if (err) return res.status(500).json({ message: "DB Error" });
        if (results.length === 0) return res.status(404).json({ message: "User not found" });

        res.json(results[0]);
    });
});

// Cadet: Submit mobile number
router.post("/submit", (req, res) => {
    const { email, mobile_number } = req.body;
    if (!email || !mobile_number) return res.status(400).json({ message: "Fields required" });

    const sql = "UPDATE signup SET mobile_number = ?, mobile_req = FALSE WHERE email = ?";
    db.query(sql, [mobile_number, email], (err, result) => {
        if (err) return res.status(500).json({ message: "DB Error" });
        res.json({ message: "Mobile number updated successfully" });
    });
});

// Admin: Get all mobile numbers
router.get("/list", (req, res) => {
    const sql = "SELECT id, name, email, role, mobile_number, mobile_req FROM signup WHERE role = 'Cadet'";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: "DB Error" });
        res.json(results);
    });
});

module.exports = router;
