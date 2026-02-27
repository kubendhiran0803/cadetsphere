const express = require('express');
const router = express.Router();
const db = require('../db');

// Staff sends a location request
router.post('/request', (req, res) => {
    const { staff_id, cadet_id } = req.body;
    // Check if already exists active or pending
    const checkSql = "SELECT * FROM location_tracking WHERE staff_id = ? AND cadet_id = ? AND status IN ('pending', 'active')";
    db.query(checkSql, [staff_id, cadet_id], (err, results) => {
        if (err) return res.status(500).json({ message: "DB error" });
        if (results.length > 0) return res.status(400).json({ message: "Request already pending or active." });

        const sql = "INSERT INTO location_tracking (staff_id, cadet_id, status) VALUES (?, ?, 'pending')";
        db.query(sql, [staff_id, cadet_id], (err, result) => {
            if (err) return res.status(500).json({ message: "DB error" });
            res.json({ message: "Request sent successfully", id: result.insertId });
        });
    });
});

// Cadet fetches pending requests
router.get('/pending/:cadet_id', (req, res) => {
    const sql = `
        SELECT lt.id, lt.created_at, s.name as staff_name 
        FROM location_tracking lt
        JOIN signup s ON lt.staff_id = s.id
        WHERE lt.cadet_id = ? AND lt.status = 'pending'
    `;
    db.query(sql, [req.params.cadet_id], (err, results) => {
        if (err) return res.status(500).json({ message: "DB error" });
        res.json(results);
    });
});

// Cadet responds to request
router.post('/respond', (req, res) => {
    const { request_id, status, image_url } = req.body; // status: 'active' or 'rejected'
    const sql = "UPDATE location_tracking SET status = ?, image_url = ? WHERE id = ?";
    db.query(sql, [status, image_url || null, request_id], (err, result) => {
        if (err) return res.status(500).json({ message: "DB error" });
        res.json({ message: `Request ${status}` });
    });
});

// Cadet updates location
router.post('/update', (req, res) => {
    const { request_id, latitude, longitude } = req.body;
    const sql = "UPDATE location_tracking SET latitude = ?, longitude = ? WHERE id = ? AND status = 'active'";
    db.query(sql, [latitude, longitude, request_id], (err, result) => {
        if (err) return res.status(500).json({ message: "DB error" });
        res.json({ message: "Location updated" });
    });
});

// Staff gets active tracking list
router.get('/tracking/:staff_id', (req, res) => {
    const sql = `
        SELECT lt.*, s.name as cadet_name 
        FROM location_tracking lt
        JOIN signup s ON lt.cadet_id = s.id
        WHERE lt.staff_id = ? AND lt.status IN ('active', 'pending')
    `;
    db.query(sql, [req.params.staff_id], (err, results) => {
        if (err) return res.status(500).json({ message: "DB error" });
        res.json(results);
    });
});

// End tracking
router.post('/end', (req, res) => {
    const { request_id } = req.body;
    const sql = "UPDATE location_tracking SET status = 'ended' WHERE id = ?";
    db.query(sql, [request_id], (err, result) => {
        if (err) return res.status(500).json({ message: "DB error" });
        res.json({ message: "Tracking ended" });
    });
});

// Cadet checks for active tracking to start sending location
router.get('/active/:cadet_id', (req, res) => {
    const sql = `
        SELECT id FROM location_tracking 
        WHERE cadet_id = ? AND status = 'active'
    `;
    db.query(sql, [req.params.cadet_id], (err, results) => {
        if (err) return res.status(500).json({ message: "DB error" });
        res.json(results);
    });
});

module.exports = router;
