
const mysql = require("mysql2");
const db = mysql.createConnection({
    host: "localhost", user: "root", password: "", database: "cadetsphere", port: 4306
});

db.connect(err => {
    if (err) return console.error(err);
    console.log("Connected");

    const sql = "ALTER TABLE tasks ADD COLUMN scheduled_at DATETIME DEFAULT NULL";
    db.query(sql, (err, res) => {
        if (err) console.log("Column likely exists:", err.message);
        else console.log("Added scheduled_at");
        db.end();
    });
});
