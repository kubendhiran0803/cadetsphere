const db = require('./backend/db');

const sql = "DESCRIBE tasks";
db.query(sql, (err, results) => {
    if (err) {
        if (err.code === 'ER_NO_SUCH_TABLE') {
            console.log("Table 'tasks' does not exist.");
            // Create table if it doesn't exist
            const createSql = `
        CREATE TABLE tasks (
          id INT AUTO_INCREMENT PRIMARY KEY,
          date DATE,
          cadet_name VARCHAR(255),
          task_description TEXT,
          status VARCHAR(50) DEFAULT 'Pending',
          scheduled_at VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
            db.query(createSql, (createErr) => {
                if (createErr) {
                    console.error("Error creating table:", createErr);
                } else {
                    console.log("Table 'tasks' created successfully.");
                }
                process.exit(0);
            });
            return;
        }
        console.error("Error describing table:", err);
        process.exit(1);
    } else {
        console.log("Table schema:", results);
        process.exit(0);
    }
});
