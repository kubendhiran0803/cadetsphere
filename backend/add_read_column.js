const db = require('./db');

const alterTableQuery = `
  ALTER TABLE messages
  ADD COLUMN is_read BOOLEAN DEFAULT FALSE;
`;

db.query(alterTableQuery, (err, result) => {
    if (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log("Column 'is_read' already exists.");
        } else {
            console.error("Error adding column:", err);
        }
    } else {
        console.log("Successfully added 'is_read' column to messages table.");
    }
    db.end();
});
