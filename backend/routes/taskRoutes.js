const express = require("express");
const router = express.Router();
const db = require("../db");

// Assign a task (POST /api/tasks/assign)
router.post("/assign", async (req, res) => {
    const { date, cadet_name, task_description, scheduled_at } = req.body;

    if (!date || !cadet_name || !task_description) {
        return res.status(400).json({ message: "All fields are required" });
    }

    if (cadet_name === 'All') {
        // Fetch all cadets
        const cadetSql = "SELECT name FROM signup WHERE role = 'Cadet'";
        db.query(cadetSql, (err, cadets) => {
            if (err) {
                console.error("Error fetching cadets for bulk assign:", err);
                return res.status(500).json({ message: "Database error" });
            }

            if (cadets.length === 0) {
                return res.status(400).json({ message: "No cadets found to assign task to." });
            }

            const values = cadets.map(c => [date, c.name, task_description, 'Pending', 'All']); // Added 'All' as a type/group marker if needed, or just rely on description
            // Actually the table only has 4 columns mentioned before. Let's stick to known columns: date, cadet_name, task_description, status.
            // We will batch insert.
            const insertSql = "INSERT INTO tasks (date, cadet_name, task_description, status, scheduled_at) VALUES ?";
            const insertValues = cadets.map(c => [date, c.name, task_description, 'Pending', scheduled_at || null]);

            db.query(insertSql, [insertValues], (insertErr) => {
                if (insertErr) {
                    console.error("Error bulk inserting tasks:", insertErr);
                    return res.status(500).json({ message: "Database error during bulk assign" });
                }
                res.status(201).json({ message: `Task assigned to all ${cadets.length} cadets` });
            });
        });
    } else {
        const query = "INSERT INTO tasks (date, cadet_name, task_description, status, scheduled_at) VALUES (?, ?, ?, 'Pending', ?)";
        db.query(query, [date, cadet_name, task_description, scheduled_at || null], (err, result) => {
            if (err) {
                console.error("Error inserting task:", err);
                return res.status(500).json({ message: "Database error" });
            }
            res.status(201).json({ message: "Task assigned successfully", taskId: result.insertId });
        });
    }
});

// Update task status (PUT /api/tasks/:id/status)
router.put("/:id/status", (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'Completed'

    const sql = "UPDATE tasks SET status = ? WHERE id = ?";
    db.query(sql, [status, id], (err, result) => {
        if (err) {
            console.error("Error updating task status:", err);
            return res.status(500).json({ message: "Database error" });
        }
        res.json({ message: "Task status updated" });
    });
});

// Get all tasks (GET /api/tasks)
router.get("/", (req, res) => {
    // Join with signup to get mobile_number for "Call if overdue" feature
    const query = `
        SELECT t.*, s.mobile_number 
        FROM tasks t
        LEFT JOIN signup s ON t.cadet_name = s.name
        ORDER BY t.created_at DESC
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching tasks:", err);
            return res.status(500).json({ message: "Database error" });
        }
        res.status(200).json({ tasks: results });
    });
});

// Get tasks for a specific cadet (GET /api/tasks/cadet/:name)
router.get("/cadet/:name", (req, res) => {
    const { name } = req.params;
    const query = "SELECT * FROM tasks WHERE cadet_name = ? ORDER BY date DESC, created_at DESC";
    db.query(query, [name], (err, results) => {
        if (err) {
            console.error("Error fetching cadet tasks:", err);
            return res.status(500).json({ message: "Database error" });
        }
        res.status(200).json(results);
    });
});

module.exports = router;
