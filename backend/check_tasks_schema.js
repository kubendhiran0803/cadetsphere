
const mysql = require("mysql2");
const db = mysql.createConnection({
    host: "localhost", user: "root", password: "", database: "cadetsphere", port: 4306
});
db.connect(err => {
    if (err) return console.error(err);
    db.query("DESCRIBE tasks", (err, res) => {
        console.log(res);
        db.end();
    });
});
