const express = require("express");
const router = express.Router();
const db = require("../db");

// Get all Cadets (Reuse logic from badgeRoutes)
router.get("/cadets", (req, res) => {
    // Check both 'Cadet' and 'cadet'
    const query = "SELECT id, name, email FROM signup WHERE role = 'Cadet' OR role = 'cadet' ORDER BY name ASC";
    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching cadets for achievements:", err);
            return res.status(500).json({ message: "Database error" });
        }
        res.json(results);
    });
});

// Get achievements for a specific cadet
router.get("/list/:email", (req, res) => {
    const { email } = req.params;
    const query = "SELECT * FROM achievements WHERE cadet_email = ? ORDER BY date_of_achievement DESC";
    db.query(query, [email], (err, results) => {
        if (err) {
            console.error("Error fetching achievements:", err);
            return res.status(500).json({ message: "Database error" });
        }
        res.json(results);
    });
});

// Add an achievement
router.post("/add", (req, res) => {
    const {
        cadet_email,
        title,
        category,
        level,
        date_of_achievement,
        description,
        proof_url,
        status
    } = req.body;

    if (!cadet_email || !title || !category) {
        return res.status(400).json({ message: "Required fields missing" });
    }

    const query = `
        INSERT INTO achievements 
        (cadet_email, title, category, level, date_of_achievement, description, proof_url, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Default status to 'Approved' since Staff is adding it, or use provided status
    const finalStatus = status || 'Approved';

    db.query(query, [cadet_email, title, category, level, date_of_achievement, description, proof_url, finalStatus], (err, result) => {
        if (err) {
            console.error("Error adding achievement:", err);
            return res.status(500).json({ message: "Database error" });
        }
        res.json({ message: "Achievement added successfully", id: result.insertId });
    });
});

module.exports = router;
