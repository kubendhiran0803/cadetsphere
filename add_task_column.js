const db = require('./backend/db');

const sql = `
  ALTER TABLE tasks
  ADD COLUMN scheduled_at VARCHAR(255) DEFAULT NULL;
`;

db.query(sql, (err, result) => {
    if (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log("Column 'scheduled_at' already exists.");
        } else {
            console.error("Error adding column:", err);
        }
    } else {
        console.log("Column 'scheduled_at' added successfully.");
    }
    process.exit(0);
});
