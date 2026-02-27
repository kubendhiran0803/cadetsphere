const express = require('express');
const router = express.Router();
const db = require('../db');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Load env explicitly if needed
let GROQ_API_KEY = process.env.GROQ_API;
if (!GROQ_API_KEY) {
    try {
        const envPath = path.join(__dirname, '../../.env');
        if (fs.existsSync(envPath)) {
            const envConfig = fs.readFileSync(envPath, 'utf8');
            const match = envConfig.match(/GROQ_API=(.*)/);
            if (match && match[1]) {
                GROQ_API_KEY = match[1].trim();
            }
        }
    } catch (e) {
        console.error("Error reading .env:", e);
    }
}

// Log status of API Key (Safe version)
if (GROQ_API_KEY) {
    console.log("AI Route: GROQ_API_KEY loaded successfully. Starts with: " + GROQ_API_KEY.substring(0, 8) + "...");
} else {
    console.error("AI Route: GROQ_API_KEY is MISSING.");
}

// Helper: Fetch User Data
const getUserStats = async (email) => {
    // 1. Get Cadet ID & Profile
    const idQuery = "SELECT id, name, role, unique_id, email, DATE_FORMAT((SELECT MIN(login_time) FROM login l WHERE l.email = signup.email), '%Y-%m-%d') as joined_date FROM signup WHERE email = ?";
    const user = await new Promise((resolve, reject) => {
        db.query(idQuery, [email], (err, results) => {
            if (err) reject(err);
            else resolve(results[0]);
        });
    });

    if (!user) return null;

    // 2. Attendance Stats
    const attQuery = "SELECT status FROM attendance WHERE cadet_id = ?";
    const attendance = await new Promise((resolve, reject) => {
        db.query(attQuery, [user.id], (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });

    const totalAtt = attendance.length;
    const presentAtt = attendance.filter(a => a.status.toLowerCase() === 'present').length;
    const absentAtt = attendance.filter(a => a.status.toLowerCase() === 'absent').length;
    const attendancePercentage = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 0;

    // 3. Activity Stats (Recent 5)
    const actQuery = "SELECT activity_name, date, status FROM activities WHERE cadet_name = ? ORDER BY date DESC LIMIT 5";
    const activities = await new Promise((resolve, reject) => {
        db.query(actQuery, [user.name], (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });

    // 4. Reports Stats (Recent 5)
    const repQuery = "SELECT event_name, activity_type, status, created_at FROM reports WHERE cadet_email = ? ORDER BY created_at DESC LIMIT 5";
    const reports = await new Promise((resolve, reject) => {
        db.query(repQuery, [email], (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });

    // 5. Tasks (Pending)
    const taskQuery = "SELECT task_description, date FROM tasks WHERE cadet_name = ? AND status = 'Pending'";
    const pendingTasks = await new Promise((resolve, reject) => {
        db.query(taskQuery, [user.name], (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });

    // 6. Badges
    const badgeQuery = "SELECT badge_name FROM badges WHERE cadet_email = ?";
    const badges = await new Promise((resolve, reject) => {
        db.query(badgeQuery, [email], (err, results) => {
            if (err) reject(err);
            else resolve(results.map(b => b.badge_name));
        });
    });

    // 7. Staff Details
    const staffQuery = "SELECT name, email, unique_id, role, status FROM signup WHERE role = 'Staff'";
    const staffList = await new Promise((resolve, reject) => {
        db.query(staffQuery, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });

    // 7.5. Achievements (Full List)
    const achievementQuery = "SELECT title, category, level, description, date_of_achievement, status FROM achievements WHERE cadet_email = ?";
    const achievementList = await new Promise((resolve, reject) => {
        db.query(achievementQuery, [email], (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });

    // 8. Admin Details
    const adminQuery = "SELECT name, email FROM signup WHERE role = 'Admin' LIMIT 1";
    const adminDetails = await new Promise((resolve, reject) => {
        db.query(adminQuery, (err, results) => {
            if (err) resolve(null);
            else resolve(results.length > 0 ? results[0] : null);
        });
    });

    // 9. Total Cadet Count
    const cadetCountQuery = "SELECT COUNT(*) as count FROM signup WHERE role = 'Cadet'";
    const cadetCount = await new Promise((resolve, reject) => {
        db.query(cadetCountQuery, (err, results) => {
            if (err) reject(err);
            else resolve(results[0].count);
        });
    });

    // 10. Upcoming Events
    const eventQuery = "SELECT title, date, description FROM calendar WHERE date >= CURDATE() ORDER BY date ASC LIMIT 5";
    const events = await new Promise((resolve, reject) => {
        db.query(eventQuery, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });

    return {
        user: {
            name: user.name,
            email: user.email,
            id: user.unique_id || user.id,
            joined: user.joined_date
        },
        attendance: {
            total: totalAtt,
            present: presentAtt,
            absent: absentAtt,
            percentage: attendancePercentage
        },
        activities: activities,
        reports: reports,
        tasks: pendingTasks,
        badges: badges,
        staff: staffList,
        admin: adminDetails,
        totalCadets: cadetCount,
        events: events,
        achievementsList: achievementList
    };
};

// Helper: Call Groq API using HTTPS module (No 'fetch' dependency)
const callGroqAPI = (systemPrompt, userMessage) => {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            model: "llama-3.3-70b-versatile", // Updated to Llama 3.3
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage }
            ],
            temperature: 0.7,
            max_tokens: 450
        });

        const options = {
            hostname: 'api.groq.com',
            path: '/openai/v1/chat/completions',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        const parsed = JSON.parse(data);
                        resolve(parsed);
                    } catch (e) {
                        reject(new Error("Failed to parse Groq response JSON"));
                    }
                } else {
                    // Return the detailed error from Groq
                    reject(new Error(`Groq API Error (${res.statusCode}): ${data}`));
                }
            });
        });

        req.on('error', (e) => {
            reject(new Error(`Network Request Failed: ${e.message}`));
        });

        req.write(postData);
        req.end();
    });
};

// Route: Get Stats (Legacy / Frontend Context)
router.get('/stats/:email', async (req, res) => {
    try {
        const stats = await getUserStats(req.params.email);
        if (!stats) return res.status(404).json({ message: "User not found" });
        res.json(stats);
    } catch (error) {
        console.error("AI Stats Error:", error);
        res.status(500).json({ message: "Error fetching AI stats" });
    }
});

// Route: Chat with AI (Groq Integration)
router.post('/chat', async (req, res) => {
    const { email, message } = req.body;

    if (!GROQ_API_KEY) {
        console.error("Groq API Key missing in backend");
        return res.status(503).json({ message: "AI Service Unavailable: API Key Missing" });
    }

    try {
        const stats = await getUserStats(email);
        if (!stats) return res.status(404).json({ message: "User not found in system" });

        const systemPrompt = `
You are the CadetSphere Admin AI Assistant, a helpful and strict military-style administrator for the NCC unit.
Your goal is to assist Cadet ${stats.user.name} with their inquiries using the provided real-time data.

### CADET DATA:
- **Profile**: Name: ${stats.user.name}, ID: ${stats.user.id}, Joined: ${stats.user.joined}
- **Attendance**: ${stats.attendance.percentage}% (${stats.attendance.present} Present / ${stats.attendance.total} Total)
- **Pending Tasks**: ${(stats.tasks || []).map(t => t.task_description + " (Due: " + new Date(t.date).toDateString() + ")").join(", ") || "None"}
- **Recent Reports**: ${(stats.reports || []).map(r => r.event_name + " (" + r.status + ")").join(", ") || "None"}
- **Badges**: ${(stats.badges || []).join(", ") || "None"}
- **Upcoming Events**: ${(stats.events || []).map(e => e.title + " on " + new Date(e.date).toDateString()).join(", ") || "None"}
- **Staff**: ${(stats.staff || []).map(s => s.name + " (" + s.role + ")").join(", ")}
- **Unit Strength**: ${stats.totalCadets} Cadets

### GUIDELINES:
1. **Accuracy**: Use the data above to answer specific questions (e.g., "What is my attendance?", "Do I have tasks?").
2. **Context**: If the user says "hi" or "help", greet them by name and summarize their status (e.g., "Hello Cadet [Name], your attendance is [X]%. How can I help?").
3. **Tone**: Professional, encouraging, authority but helpful.
4. **Scope**: Only answer questions about CadetSphere, NCC, attendance, tasks, and unit activities. Refuse general questions by saying "I can only discuss CadetSphere matters."
5. **Formatting**: Use Markdown (bold, lists) for readability.
        `.trim();

        const groqResponse = await callGroqAPI(systemPrompt, message);

        if (groqResponse.choices && groqResponse.choices[0] && groqResponse.choices[0].message) {
            res.json({ response: groqResponse.choices[0].message.content });
        } else {
            console.error("Groq Invalid Response:", JSON.stringify(groqResponse));
            res.status(502).json({ message: "Invalid response format from AI provider." });
        }

    } catch (error) {
        console.error("AI Chat Error during processing:", error.message);
        // Return the actual error message to the frontend for debugging
        res.status(500).json({ message: `System Error: ${error.message}` });
    }
});

module.exports = router;
