const express = require("express");
const router = express.Router();
const db = require("../db");

// Get all Cadets (reuse logic from other routes or simple query)
// Get all Cadets (synced with messageRoutes logic)
router.get("/cadets", (req, res) => {
    console.log("Fetching cadets for badges...");
    // Check both 'Cadet' and 'cadet' to be safe, ordered by name
    const query = "SELECT id, name, email FROM signup WHERE role = 'Cadet' OR role = 'cadet' ORDER BY name ASC";
    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching cadets for badges:", err);
            return res.status(500).json({ message: "Database error" });
        }
        console.log(`Badges: Found ${results.length} cadets`);
        res.json(results);
    });
});

// Get badges for a specific cadet
router.get("/list/:email", (req, res) => {
    const { email } = req.params;
    const query = "SELECT * FROM badges WHERE cadet_email = ? ORDER BY awarded_at DESC";
    db.query(query, [email], (err, results) => {
        if (err) {
            console.error("Error fetching badges:", err);
            return res.status(500).json({ message: "Database error" });
        }
        res.json(results);
    });
});

// Award a badge
router.post("/award", (req, res) => {
    const { cadet_email, badge_name, badge_icon, awarded_by, reason } = req.body;

    if (!cadet_email || !badge_name) {
        return res.status(400).json({ message: "Cadet and Badge Name are required" });
    }

    const query = "INSERT INTO badges (cadet_email, badge_name, badge_icon, awarded_by, reason) VALUES (?, ?, ?, ?, ?)";
    db.query(query, [cadet_email, badge_name, badge_icon, awarded_by, reason], (err, result) => {
        if (err) {
            console.error("Error awarding badge:", err);
            return res.status(500).json({ message: "Database error" });
        }
        res.json({ message: "Badge awarded successfully", id: result.insertId });
    });
});

module.exports = router;
