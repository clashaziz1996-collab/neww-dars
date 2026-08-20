const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Render & Railway uchun 0.0.0.0 talab qilinadi
const DB_FILE = path.join(__dirname, 'database.json');

app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.static(__dirname));

// Read database or initialize default
function getDatabase() {
    if (fs.existsSync(DB_FILE)) {
        try {
            return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        } catch (e) {
            console.error("DB o'qishda xatolik:", e);
        }
    }
    return null;
}

function saveDatabase(data) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
        console.error("DB yozishda xatolik:", e);
    }
}

// Presence Tracker Map (Live Online Users)
const onlineClients = new Map();

// 1. API: Get online schedule data
app.get(['/api/schedule', '/.netlify/functions/schedule'], (req, res) => {
    const data = getDatabase();
    if (data && data.schedule) {
        res.json({ success: true, data: data.schedule, auth: data.auth, updatedAt: data.updatedAt });
    } else {
        res.json({ success: false, message: "Hali ma'lumotlar saqlanmagan" });
    }
});

// 2. API: Save online schedule data (Admin only)
app.post(['/api/schedule', '/.netlify/functions/schedule'], (req, res) => {
    const { schedule, auth } = req.body;
    if (!schedule) {
        return res.status(400).json({ success: false, message: "Ma'lumotlar to'liq emas" });
    }

    const currentDb = getDatabase() || {};
    currentDb.schedule = schedule;
    if (auth) currentDb.auth = auth;
    currentDb.updatedAt = new Date().toISOString();

    saveDatabase(currentDb);
    res.json({ success: true, message: "Ma'lumotlar serverda muvaffaqiyatli saqlandi!" });
});

// 3. API: Presence Heartbeat & Online Users Counter
app.all(['/api/presence', '/.netlify/functions/presence'], (req, res) => {
    const now = Date.now();
    const clientId = req.body?.clientId || req.query?.clientId || req.ip;

    if (clientId) {
        onlineClients.set(clientId, now);
    }

    // Clean inactive clients (> 45 sec)
    for (const [id, seen] of onlineClients.entries()) {
        if (now - seen > 45000) {
            onlineClients.delete(id);
        }
    }

    const count = Math.max(1, onlineClients.size);
    res.json({ success: true, count: count, timestamp: now });
});

// 4. Root fallback for Single Page Application
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
    console.log(`====================================================`);
    console.log(`EduSchedule Server (Render & Railway) ishga tushdi!`);
    console.log(`Manzil: http://${HOST}:${PORT}`);
    console.log(`====================================================`);
});
