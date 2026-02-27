// Use dynamic import for node-fetch which is ESM only or use built-in fetch if node 18+
// But to be safe in this environment, I'll use axios or http, or just assume node 18+
// However, 'node-fetch' v3 is ESM only. Let's try native fetch if node is new enough, or require('http').
// Actually, I can just use a simple http request using 'http' module to avoid dependency issues.

const http = require('http');

function postRequest() {
    const data = JSON.stringify({
        cadet_name: "TestBot",
        activity_name: "Bot Drill",
        category: "Drill",
        date: "2026-01-17",
        duration: "1 hr"
    });

    const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/activities',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    const req = http.request(options, (res) => {
        console.log(`POST Status: ${res.statusCode}`);
        let body = '';
        res.on('data', (d) => body += d);
        res.on('end', () => console.log('POST Response:', body));
    });

    req.on('error', (error) => {
        console.error('POST Error:', error);
    });

    req.write(data);
    req.end();
}

function getRequest() {
    const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/activities',
        method: 'GET'
    };

    const req = http.request(options, (res) => {
        console.log(`GET Status: ${res.statusCode}`);
        let body = '';
        res.on('data', (d) => body += d);
        res.on('end', () => console.log('GET Response Length:', JSON.parse(body).length));
    });

    req.on('error', (error) => {
        console.error('GET Error:', error);
    });

    req.end();
}

// Run Test
console.log("Starting API Test...");
getRequest();
setTimeout(postRequest, 1000);
