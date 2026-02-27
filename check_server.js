const http = require('http');

function getTasks() {
    const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/tasks',
        method: 'GET'
    };

    const req = http.request(options, (res) => {
        console.log(`GET /api/tasks Status: ${res.statusCode}`);
        if (res.statusCode === 200) console.log("Old routes are working.");
    });

    req.on('error', (e) => console.log(e));
    req.end();
}

getTasks();
