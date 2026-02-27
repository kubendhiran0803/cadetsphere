const db = require('./backend/db');

const alterTable = `
  ALTER TABLE signup 
  ADD COLUMN status VARCHAR(20) DEFAULT 'active';
`;

db.query(alterTable, (err, result) => {
    if (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('Column status already exists');
        } else {
            console.error('Error adding status column:', err);
        }
    } else {
        console.log('Added status column to signup table');
    }
    process.exit();
});
