const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db");
const router = express.Router();

/* ================= ADMIN REGISTRATION ================= */
router.post("/admin", async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const sql = "INSERT INTO admin (name, email, password, role, unique_id) VALUES (?, ?, ?, ?, ?)";

  db.query(sql, [name, email, hashedPassword, role || "Cadet", req.body.unique_id || null], (err) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY")
        return res.status(400).json({ message: "Email already exists" });

      console.error("Database error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    res.json({ message: "Admin registered successfully" });
  });
});

/* ================= SIGNUP ================= */
router.post("/signup", async (req, res) => {
  const { name, email, password, role } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  const sql = "INSERT INTO signup (name, email, password, role, unique_id) VALUES (?, ?, ?, ?, ?)";

  db.query(sql, [name, email, hashedPassword, role || "Cadet", req.body.unique_id || null], (err) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY")
        return res.status(400).json({ message: "Email already exists" });

      return res.status(500).json({ message: "Database error" });
    }

    res.json({ message: "Signup successful" });
  });
});

/* ================= GET ALL CADETS ================= */
router.get("/cadets", (req, res) => {
  const sql = "SELECT id, name, email, role, unique_id, mobile_number, mobile_req FROM signup WHERE role IN ('Cadet', 'Staff', 'cadet', 'staff')";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("DB error fetching cadets:", err);
      return res.status(500).json({ message: "DB error" });
    }
    res.json(results);
  });
});

/* ================= GET PROFILE BY NAME ================= */
router.get("/profile/:name", (req, res) => {
  const { name } = req.params;
  const sql = `
      SELECT s.id, s.name, s.email, s.role, s.unique_id,
      (SELECT MIN(login_time) FROM login l WHERE l.email = s.email) as joined_at 
      FROM signup s WHERE s.name = ?
  `;
  db.query(sql, [name], (err, results) => {
    if (err) {
      console.error("Error fetching profile:", err);
      return res.status(500).json({ message: "Database error" });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(results[0]);
  });
});



/* ================= LOGIN CHECK STATUS ================= */
// Updated Login Logic to check for status
router.post("/login", (req, res) => {
  const { email, password, role } = req.body;

  const sql = "SELECT * FROM signup WHERE email=? AND role=?";
  db.query(sql, [email, role], async (err, result) => {
    if (err) return res.status(500).json({ message: "DB error" });

    if (result.length === 0)
      return res.status(401).json({ message: "User not found" });

    const user = result[0];

    // Check Status
    if (user.status === 'banned') {
      return res.status(403).json({ message: "This account has been permanently removed." });
    }
    if (user.status === 'removed') { // 'suspended' or 'removed'
      return res.status(403).json({ message: "This account is currently inactive." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid password" });

    // Log successful login
    const loginSql = "INSERT INTO login (email, password, role) VALUES (?, ?, ?)";
    db.query(loginSql, [email, password, role], (loginErr) => {
      if (loginErr) console.log("Login log error:", loginErr);
    });

    res.json({
      message: "Login success",
      user: { id: user.id, email: user.email, role: user.role, name: user.name },
    });
  });
});

/* ================= FORGOT PASSWORD ================= */
router.post("/forgot", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: "All fields required" });

  const newHash = await bcrypt.hash(password, 10);

  // Update password in signup table
  const updateSql = "UPDATE signup SET password=? WHERE email=?";
  db.query(updateSql, [newHash, email], (err, result) => {
    if (err) return res.status(500).json({ message: "DB error" });

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Email not registered" });

    // Log the password change in forgot table
    const logSql = "INSERT INTO forgot (email, password) VALUES (?, ?)";
    db.query(logSql, [email, newHash], (logErr) => {
      if (logErr) console.log("Forgot log error:", logErr);
    });

    res.json({ message: "Password updated successfully" });
  });
});

/* ================= MANAGE USERS ================= */
// Get all users with status and last login
router.get("/manage/users", (req, res) => {
  const sql = `
        SELECT s.id, s.name, s.email, s.role, s.unique_id, s.status, 
        (SELECT MAX(login_time) FROM login l WHERE l.email = s.email) as last_login
        FROM signup s 
        WHERE s.role IN ('Cadet', 'Staff')
        ORDER BY s.id DESC
    `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching users:", err);
      return res.status(500).json({ message: "DB error" });
    }
    res.json(results);
  });
});

// Update User Status
router.put("/manage/status/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'active', 'removed', 'banned'

  const sql = "UPDATE signup SET status = ? WHERE id = ?";
  db.query(sql, [status, id], (err, result) => {
    if (err) {
      console.error("Error updating status:", err);
      return res.status(500).json({ message: "DB error" });
    }
    res.json({ message: "Status updated" });
  });
});


/* ================= UPDATE USER UNIQUE ID ================= */
router.put("/update/:id", (req, res) => {
  const { id } = req.params;
  const { unique_id, role } = req.body;

  let table = "signup";
  // If we had separate tables we'd check role, but for now assuming signup contains all users

  const sql = `UPDATE ${table} SET unique_id = ? WHERE id = ?`;
  db.query(sql, [unique_id, id], (err, result) => {
    if (err) {
      console.error("Error updating user:", err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json({ message: "User updated successfully" });
  });
});

/* ================= LOGIN RECORDS (manage) ================= */
// Get all login records
router.get("/logins", (req, res) => {
  console.log("GET /api/auth/logins called from", req.ip);
  const sql = "SELECT id, email, password, role, login_time FROM login ORDER BY id DESC";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("DB error fetching logins:", err);
      return res.status(500).json({ message: "DB error" });
    }
    console.log(`Returning ${results.length} login records`);
    res.json(results);
  });
});

// Delete a login record by id
router.delete("/logins/:id", (req, res) => {
  const { id } = req.params;
  console.log(`DELETE /api/auth/logins/${id} called from ${req.ip}`);
  const sql = "DELETE FROM login WHERE id=?";
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("DB error deleting login:", err);
      return res.status(500).json({ message: "DB error", error: err.message });
    }
    console.log(`Delete result for id ${id} affectedRows=${result.affectedRows}`);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted", id: id, affectedRows: result.affectedRows });
  });
});

// Simple ping to verify server reachability from devices
router.get('/ping', (req, res) => {
  console.log('PING received from', req.ip);
  res.json({ ok: true, time: Date.now() });
});

module.exports = router;
