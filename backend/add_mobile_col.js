
const mysql = require("mysql2");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "cadetsphere",
    port: 4306
});

db.connect(err => {
    if (err) {
        console.error("Connection failed:", err);
        return;
    }
    console.log("Connected to DB");

    const sql1 = "ALTER TABLE signup ADD COLUMN mobile_number VARCHAR(20) DEFAULT NULL";
    const sql2 = "ALTER TABLE signup ADD COLUMN mobile_req BOOLEAN DEFAULT FALSE";

    db.query(sql1, (err, res) => {
        if (err) console.log("mobile_number column might already exist or error:", err.message);
        else console.log("Added mobile_number column");

        db.query(sql2, (err, res) => {
            if (err) console.log("mobile_req column might already exist or error:", err.message);
            else console.log("Added mobile_req column");

            db.end();
        });
    });
});
