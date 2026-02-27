const fetch = require('http');

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/profile/Risswanth%20', // URL encoded space
    method: 'GET'
};

const req = fetch.request(options, (res) => {
    let body = '';
    res.on('data', (d) => body += d);
    res.on('end', () => console.log(body));
});

req.on('error', (e) => console.error(e));
req.end();
