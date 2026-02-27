const https = require('https');
const fs = require('fs');
const path = require('path');

console.log("--- DIAGNOSTIC START ---");

// 1. Load API Key
let GROQ_API_KEY = process.env.GROQ_API;
if (!GROQ_API_KEY) {
    try {
        const envPath = path.join(__dirname, '../.env');
        if (fs.existsSync(envPath)) {
            const envConfig = fs.readFileSync(envPath, 'utf8');
            const match = envConfig.match(/GROQ_API=(.*)/);
            if (match && match[1]) {
                GROQ_API_KEY = match[1].trim();
                console.log("Loaded Key from .env file");
            }
        }
    } catch (e) {
        console.error("Failed to read .env:", e.message);
    }
}

if (!GROQ_API_KEY) {
    console.error("FATAL: No API Key found.");
    process.exit(1);
} else {
    console.log("API Key Format Check: " + (GROQ_API_KEY.startsWith("gsk_") ? "OK" : "WARNING (Should start with gsk_)"));
}

// 2. Test HTTPS Connection
console.log("Testing Connection to api.groq.com...");

// Use supported model
const postData = JSON.stringify({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: "Test" }]
});

const options = {
    hostname: 'api.groq.com',
    path: '/openai/v1/chat/completions',
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    },
    timeout: 10000 // 10s timeout
};

const req = https.request(options, (res) => {
    console.log(`Response Status: ${res.statusCode}`);
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        if (res.statusCode === 200) {
            console.log("SUCCESS: AI Response received.");
            // console.log(data);
        } else {
            console.error("FAILURE: API Error.");
            console.error(data);
        }
        console.log("--- DIAGNOSTIC END ---");
    });
});

req.on('error', (e) => {
    console.error("NETWORK ERROR:", e.message);
    console.log("--- DIAGNOSTIC END ---");
});

req.on('timeout', () => {
    console.error("TIMEOUT: Connection timed out.");
    req.destroy();
});

req.write(postData);
req.end();
