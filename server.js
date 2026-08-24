const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
let pg = null;
try {
    pg = require('pg');
} catch (e) {}

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';
const DB_FILE = path.join(__dirname, 'database.json');

app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.static(__dirname));

// Persistent in-memory cache
let memoryDb = {
    schedule: null,
    auth: { adminUsername: 'admin', adminPassword: '123' },
    updatedAt: new Date().toISOString()
};

// PostgreSQL Connection (Agar DATABASE_URL kiritilgan bo'lsa - 100% o'chmas doimiy bulut bazasi)
let pgPool = null;
const DATABASE_URL = process.env.DATABASE_URL;

if (DATABASE_URL && pg) {
    try {
        pgPool = new pg.Pool({
            connectionString: DATABASE_URL,
            ssl: DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
        });

        // Initialize table
        pgPool.query(`
            CREATE TABLE IF NOT EXISTS school_schedule_store (
                key VARCHAR(50) PRIMARY KEY,
                schedule_data JSONB,
                auth_data JSONB,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `).then(() => {
            console.log("PostgreSQL Doimiy Bulut Bazasi muvaffaqiyatli ulandi va jadval yaratildi!");
            // Load initial from PG
            loadFromPostgres();
        }).catch(err => {
            console.error("PostgreSQL jadval yaratishda xatolik:", err);
        });
    } catch (e) {
        console.error("PostgreSQL ulanishida xatolik:", e);
    }
}

async function loadFromPostgres() {
    if (!pgPool) return;
    try {
        const res = await pgPool.query('SELECT * FROM school_schedule_store WHERE key = $1', ['main_schedule']);
        if (res.rows && res.rows.length > 0) {
            const row = res.rows[0];
            if (row.schedule_data) {
                memoryDb.schedule = row.schedule_data;
                memoryDb.auth = row.auth_data || memoryDb.auth;
                memoryDb.updatedAt = row.updated_at ? row.updated_at.toISOString() : new Date().toISOString();
                console.log("PostgreSQL bazasidan ma'lumotlar xotiraga yuklandi!");
            }
        }
    } catch (e) {
        console.error("PostgreSQLdan yuklashda xatolik:", e);
    }
}

async function saveToPostgres(schedule, auth, updatedAt) {
    if (!pgPool) return;
    try {
        await pgPool.query(`
            INSERT INTO school_schedule_store (key, schedule_data, auth_data, updated_at)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (key) 
            DO UPDATE SET schedule_data = $2, auth_data = $3, updated_at = $4;
        `, ['main_schedule', schedule, auth, updatedAt || new Date()]);
        console.log("PostgreSQL bazasiga muvaffaqiyatli saqlandi!");
    } catch (e) {
        console.error("PostgreSQLga saqlashda xatolik:", e);
    }
}

// Read database or initialize default
function getDatabase() {
    if (memoryDb && memoryDb.schedule) {
        return memoryDb;
    }
    if (fs.existsSync(DB_FILE)) {
        try {
            const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
            if (parsed && parsed.schedule) {
                memoryDb = parsed;
                return memoryDb;
            }
        } catch (e) {
            console.error("DB o'qishda xatolik:", e);
        }
    }
    return memoryDb;
}

function saveDatabase(data) {
    memoryDb = data;
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
        console.error("DB yozishda xatolik:", e);
    }
    // Agar PostgreSQL ulangan bo'lsa, unga ham yozamiz
    saveToPostgres(data.schedule, data.auth, data.updatedAt);
}

// Presence Tracker Map (Live Online Users)
const onlineClients = new Map();

// 1. API: Get online schedule & auth status
app.get('/api/schedule', async (req, res) => {
    if (pgPool && !memoryDb.schedule) {
        await loadFromPostgres();
    }
    const data = getDatabase();
    res.json({ 
        success: true, 
        data: data.schedule, 
        auth: data.auth || { adminUsername: 'admin', adminPassword: '123' }, 
        updatedAt: data.updatedAt,
        storage: pgPool ? 'postgresql' : 'file'
    });
});

// 2. API: Save online schedule data & auth
app.post('/api/schedule', (req, res) => {
    const { schedule, auth, updatedAt } = req.body;
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
    currentDb.updatedAt = updatedAt || new Date().toISOString();

    saveDatabase(currentDb);
    res.json({ 
        success: true, 
        message: "Ma'lumotlar va login/parol serverda muvaffaqiyatli saqlandi!",
        auth: currentDb.auth,
        updatedAt: currentDb.updatedAt
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
    console.log(`EduSchedule Server ishga tushdi! (Port: ${PORT})`);
    console.log(`Baza turi: ${pgPool ? 'PostgreSQL (Doimiy Bulut Bazasi)' : 'File / Xotira'}`);
    console.log(`Manzil: http://${HOST}:${PORT}`);
    console.log(`====================================================`);
});
