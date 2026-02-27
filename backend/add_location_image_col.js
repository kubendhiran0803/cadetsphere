const db = require('./db');

const sql = "ALTER TABLE location_tracking ADD COLUMN image_url VARCHAR(255) DEFAULT NULL";

db.query(sql, (err, result) => {
    if (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log("Column already exists");
        } else {
            console.error("Error adding column:", err);
        }
    } else {
        console.log("Column added successfully");
    }
    process.exit();
});
