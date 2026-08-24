const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';
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
    return {
        schedule: null,
        auth: { adminUsername: 'admin', adminPassword: '123' },
        updatedAt: new Date().toISOString()
    };
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

// 1. API: Get online schedule & auth status
app.get('/api/schedule', (req, res) => {
    const data = getDatabase();
    res.json({ 
        success: true, 
        data: data.schedule, 
        auth: data.auth || { adminUsername: 'admin', adminPassword: '123' }, 
        updatedAt: data.updatedAt 
    });
});

// 2. API: Save online schedule data & auth
app.post('/api/schedule', (req, res) => {
    const { schedule, auth } = req.body;
    const currentDb = getDatabase();

    if (schedule) {
        currentDb.schedule = schedule;
    }
    if (auth) {
        currentDb.auth = {
            adminUsername: auth.adminUsername || (currentDb.auth && currentDb.auth.adminUsername) || 'admin',
            adminPassword: auth.adminPassword || (currentDb.auth && currentDb.auth.adminPassword) || '123'
        };
    }
    currentDb.updatedAt = new Date().toISOString();

    saveDatabase(currentDb);
    res.json({ 
        success: true, 
        message: "Ma'lumotlar va login/parol serverda muvaffaqiyatli saqlandi!",
        auth: currentDb.auth
    });
});

// 3. API: Dedicated Password Change Endpoint
app.post('/api/change-password', (req, res) => {
    const { oldPassword, newPassword, newUsername } = req.body;
    const currentDb = getDatabase();
    const currentAuth = currentDb.auth || { adminUsername: 'admin', adminPassword: '123' };

    if (oldPassword !== currentAuth.adminPassword) {
        return res.status(400).json({ success: false, message: "Amaldagi eski parol noto'g'ri!" });
    }

    if (!newPassword || newPassword.length < 3) {
        return res.status(400).json({ success: false, message: "Yangi parol kamida 3 ta belgidan iborat bo'lishi kerak!" });
    }

    currentDb.auth = {
        adminUsername: newUsername ? newUsername.trim() : (currentAuth.adminUsername || 'admin'),
        adminPassword: newPassword
    };
    currentDb.updatedAt = new Date().toISOString();

    saveDatabase(currentDb);
    res.json({ 
        success: true, 
        message: "Login va yangi parol serverda muvaffaqiyatli saqlandi!", 
        auth: currentDb.auth 
    });
});

// 4. API: Presence Heartbeat & Online Users Counter
app.all('/api/presence', (req, res) => {
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

// 5. Root fallback for Single Page Application
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
    console.log(`====================================================`);
    console.log(`EduSchedule Render Serveri ishga tushdi!`);
    console.log(`Manzil: http://${HOST}:${PORT}`);
    console.log(`====================================================`);
});
