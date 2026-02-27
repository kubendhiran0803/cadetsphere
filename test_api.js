const fetch = require('node-fetch');

async function testRoutes() {
    const API_URL = "http://localhost:5000/api/activities";

    // 1. Test Fetch All (Staff View)
    console.log("Testing GET /api/activities...");
    try {
        const res = await fetch(API_URL);
        const data = await res.json();
        console.log("Status:", res.status);
        if (res.ok) {
            console.log("Success! Fetched", data.length, "activities.");
        } else {
            console.log("Failed:", data);
        }
    } catch (err) {
        console.error("GET Error:", err.message);
    }

    // 2. Test Submit Activity (Cadet View)
    console.log("\nTesting POST /api/activities...");
    try {
        const payload = {
            cadet_name: "TestBot",
            activity_name: "Bot Drill",
            category: "Drill",
            date: "2026-01-17",
            duration: "1 hr"
        };
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        console.log("Status:", res.status);
        if (res.ok) {
            console.log("Success! Created Activity ID:", data.id);
        } else {
            console.log("Failed:", data);
        }
    } catch (err) {
        console.error("POST Error:", err.message);
    }
}

testRoutes();
