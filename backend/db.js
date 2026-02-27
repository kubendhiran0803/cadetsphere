const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",      // or your PC IP
  user: "root",           // your MySQL user
  password: "",
  database: "cadetsphere",
  port: 3306              // your MySQL port
});

db.connect(err => {
  if (err) {
    console.error("MySQL Connection Error:", err);
  } else {
    console.log("Connected to cadetsphere DB on port 3306");
  }
});

module.exports = db;
