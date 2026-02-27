const express = require("express");
const db = require("../db");
const router = express.Router();

// Get attendance for a specific date
router.get("/:date", (req, res) => {
    const { date } = req.params;
    const sql = "SELECT * FROM attendance WHERE date = ?";
    db.query(sql, [date], (err, results) => {
        if (err) {
            console.error("DB error fetching attendance:", err);
            // If table doesn't exist, we might return empty or error.
            // For now, let's assume it might error if table is missing, but handling it is hard without migration.
            return res.status(500).json({ message: "DB error" });
        }
        res.json(results);
    });
});

// Submit attendance
router.post("/", (req, res) => {
    const { records, date } = req.body; // records is array of { cadetId, name, status }

    if (!records || !Array.isArray(records) || records.length === 0) {
        return res.status(400).json({ message: "No attendance records provided" });
    }

    // We'll insert multiple rows. 
    // First, let's delete existing records for this date to avoid duplication (or use ON DUPLICATE KEY UPDATE)
    // Simple approach: Delete records for this date then Insert new ones.

    const deleteSql = "DELETE FROM attendance WHERE date = ?";
    db.query(deleteSql, [date], (delErr) => {
        if (delErr) {
            // If table doesn't exist, this fails. 
            // We'll create table if not exists first? No, that's usually done in setup.
            console.error("DB error clearing old attendance:", delErr);
            return res.status(500).json({ message: "DB error clearing old attendance" });
        }

        const insertSql = "INSERT INTO attendance (cadet_id, cadet_name, status, date) VALUES ?";
        const values = records.map(r => [r.cadetId, r.name, r.status, date]);

        db.query(insertSql, [values], (err, result) => {
            if (err) {
                console.error("DB error inserting attendance:", err);
                return res.status(500).json({ message: "DB error saving attendance" });
            }
            res.json({ message: "Attendance submitted successfully" });
        });
    });
});

// Get attendance for a specific cadet
router.get("/cadet/:cadetId", (req, res) => {
    const { cadetId } = req.params;
    const sql = "SELECT * FROM attendance WHERE cadet_id = ? ORDER BY date DESC";
    db.query(sql, [cadetId], (err, results) => {
        if (err) {
            console.error("DB error fetching cadet attendance:", err);
            return res.status(500).json({ message: "DB error" });
        }
        res.json(results);
    });
});

module.exports = router;
