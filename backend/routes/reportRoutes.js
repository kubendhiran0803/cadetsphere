const express = require('express');
const router = express.Router();
const db = require('../db');

// Submit a new report
router.post('/submit', (req, res) => {
    const {
        cadet_email,
        staff_email,
        activity_type,
        event_name,
        organized_by,
        start_date,
        end_date,
        duration_days,
        location,
        evidence_url,
        photos
    } = req.body;

    // Basic validation
    if (!cadet_email || !staff_email || !activity_type || !event_name) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    const query = `
        INSERT INTO reports 
        (cadet_email, staff_email, activity_type, event_name, organized_by, start_date, end_date, duration_days, location, evidence_url, photos)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(query, [
        cadet_email,
        staff_email,
        activity_type,
        event_name,
        organized_by,
        start_date,
        end_date,
        duration_days,
        location,
        evidence_url,
        JSON.stringify(photos)
    ], (err, result) => {
        if (err) {
            console.error("Error submitting report:", err);
            return res.status(500).json({ message: "Database error" });
        }
        res.json({ message: "Report submitted successfully", id: result.insertId });
    });
});

// Get reports for a specific staff member
router.get('/staff/:email', (req, res) => {
    const { email } = req.params;
    const query = `
        SELECT r.id, r.cadet_email, r.activity_type, r.event_name, r.organized_by, 
               r.start_date, r.end_date, r.duration_days, r.location, r.evidence_url, 
               r.photos, r.status, r.created_at, s.name as cadet_name 
        FROM reports r
        JOIN signup s ON r.cadet_email = s.email
        WHERE r.staff_email = ? 
        ORDER BY r.created_at DESC
    `;
    db.query(query, [email], (err, results) => {
        if (err) {
            console.error("Error fetching reports:", err);
            return res.status(500).json({ message: "Database error" });
        }
        res.json(results);
    });
});

// Update report status (Approve/Reject)
router.post('/status', (req, res) => {
    const { id, status } = req.body;
    const query = "UPDATE reports SET status = ? WHERE id = ?";
    db.query(query, [status, id], (err, result) => {
        if (err) {
            console.error("Error updating report status:", err);
            return res.status(500).json({ message: "Database error" });
        }
        res.json({ message: "Status updated" });
    });
});

module.exports = router;
