const db = require("./db");

const createTableQuery = `
CREATE TABLE IF NOT EXISTS location_tracking (
    id INT AUTO_INCREMENT PRIMARY KEY,
    staff_id INT NOT NULL,
    cadet_id INT NOT NULL,
    status ENUM('pending', 'active', 'rejected', 'ended') DEFAULT 'pending',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cadet_id) REFERENCES signup(id) ON DELETE CASCADE
)`;

db.query(createTableQuery, (err, result) => {
    if (err) {
        console.error("Error creating location_tracking table:", err);
    } else {
        console.log("location_tracking table created or already exists.");
    }
    process.exit();
});
