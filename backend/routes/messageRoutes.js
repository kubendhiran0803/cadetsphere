const express = require("express");
const router = express.Router();
const db = require("../db");

// Get all Cadets (for the contact list)
// Get all Cadets (for the contact list)
router.get("/cadets", (req, res) => {
    console.log("Fetching cadets list...");
    // We fetch from 'signup' because it contains the master list of registered users with Names.
    // Using case-insensitive check for role just in case.
    const query = "SELECT id, name, email FROM signup WHERE role = 'Cadet' OR role = 'cadet' ORDER BY name ASC";

    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching cadets:", err);
            return res.status(500).json({ message: "Database error" });
        }
        console.log(`Found ${results.length} cadets.`);
        res.json(results);
    });
});

// Get all Staff (for the cadet contact list)
router.get("/staff", (req, res) => {
    console.log("Fetching staff list...");
    const query = "SELECT id, name, email FROM signup WHERE role = 'Staff' OR role = 'staff' ORDER BY name ASC";

    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching staff:", err);
            return res.status(500).json({ message: "Database error" });
        }
        console.log(`Found ${results.length} staff.`);
        res.json(results);
    });
});

// Get messages between a staff and a cadet
router.get("/conversation", (req, res) => {
    const { user1, user2 } = req.query; // emails
    if (!user1 || !user2) return res.status(400).json({ message: "Missing params" });

    const query = `
    SELECT * FROM messages 
    WHERE (sender_email = ? AND receiver_email = ?) 
       OR (sender_email = ? AND receiver_email = ?)
    ORDER BY created_at ASC
  `;
    db.query(query, [user1, user2, user2, user1], (err, results) => {
        if (err) {
            console.error("Error fetching messages:", err);
            return res.status(500).json({ message: "Database error" });
        }
        res.json(results);
    });
});

// Send a message
router.post("/send", (req, res) => {
    const { sender_email, receiver_email, message } = req.body;
    if (!sender_email || !receiver_email || !message) {
        return res.status(400).json({ message: "All fields required" });
    }

    const query = "INSERT INTO messages (sender_email, receiver_email, message) VALUES (?, ?, ?)";
    db.query(query, [sender_email, receiver_email, message], (err, result) => {
        if (err) {
            console.error("Error sending message:", err);
            return res.status(500).json({ message: "Database error" });
        }
        res.json({ message: "Sent", id: result.insertId });
    });
});

// Mark messages as read
router.post("/mark-read", (req, res) => {
    const { sender_email, receiver_email } = req.body;
    // Marks messages SENT by sender_email (the other person) to receiver_email (me) as read
    if (!sender_email || !receiver_email) {
        return res.status(400).json({ message: "Missing params" });
    }

    const query = "UPDATE messages SET is_read = TRUE WHERE sender_email = ? AND receiver_email = ? AND is_read = FALSE";
    db.query(query, [sender_email, receiver_email], (err, result) => {
        if (err) {
            console.error("Error updating read status:", err);
            return res.status(500).json({ message: "Database error" });
        }
        res.json({ message: "Messages marked as read", affectedRows: result.affectedRows });
    });
});

module.exports = router;
