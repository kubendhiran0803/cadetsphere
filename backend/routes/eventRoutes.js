const express = require("express");
const router = express.Router();
const db = require("../db");

// Create an event (POST /api/events)
router.post("/", (req, res) => {
    const { title, date, description } = req.body;

    if (!title || !date || !description) {
        return res.status(400).json({ message: "All fields are required" });
    }

    const query = "INSERT INTO calendar (title, date, description) VALUES (?, ?, ?)";
    db.query(query, [title, date, description], (err, result) => {
        if (err) {
            console.error("Error creating event:", err);
            return res.status(500).json({ message: "Database error" });
        }
        res.status(201).json({ message: "Event created successfully", eventId: result.insertId });
    });
});

// Get all events (GET /api/events)
router.get("/", (req, res) => {
    const query = "SELECT * FROM calendar ORDER BY date ASC";
    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching events:", err);
            return res.status(500).json({ message: "Database error" });
        }
        res.status(200).json(results);
    });
});

module.exports = router;
