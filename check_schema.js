const db = require('./backend/db');

db.query("DESCRIBE signup", (err, res) => {
    if (err) console.error(err);
    else console.log("Signup Table:", res);

    db.query("DESCRIBE login", (err2, res2) => {
        if (err2) console.error(err2);
        else console.log("Login Table:", res2);
        process.exit();
    });
});
