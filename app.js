/**
 * EduSchedule - Windows 11 & Online Server Dars Jadvali Tizimi
 * - Jonli foydalanuvchilar hisoblagichi (Live Online Users Presence)
 * - Doimiy xotira (localStorage) + Online Bulutli Ma'lumotlar Bazasi (Cloud Sync)
 * - O'qituvchiga cheksiz dinamik fanlar biriktirish (2-fan tanlansa 3-si avtomatik chiqadi)
 * - Har bir sinf uchun Dushanba 1-soat "Kelajak soati" (Sinf rahbari o'tadi)
 * - Foydalanuvchi (ko'rish) va Administrator (login/parol bilan to'liq boshqarish)
 * - 2 Smenali dars jadvali (1-smena 08:00-13:10, 2-smena 12:25-17:20, 12:25-13:10 to'qnashuv nazorati)
 * - Haqiqiy ko'p varaqli Excel (.xlsx) eksport
 */

// ==========================================
// 1. Period & Slot Definitions (Exact Minutes)
// ==========================================
const SHIFT_1_PERIODS = [
    { period: 1, label: "1-soat", time: "08:00 - 08:45", breakTime: "5 daq tanaffus", slot: 1, shift: 1 },
    { period: 2, label: "2-soat", time: "08:50 - 09:35", breakTime: "5 daq tanaffus", slot: 2, shift: 1 },
    { period: 3, label: "3-soat", time: "09:40 - 10:25", breakTime: "5 daq tanaffus", slot: 3, shift: 1 },
    { period: 4, label: "4-soat", time: "10:30 - 11:15", breakTime: "5 daq tanaffus", slot: 4, shift: 1 },
    { period: 5, label: "5-soat", time: "11:20 - 12:05", breakTime: "⚡ 20 daq katta tanaffus (12:05–12:25)", slot: 5, shift: 1 },
    { period: 6, label: "6-soat", time: "12:25 - 13:10", breakTime: "", slot: 6, shift: 1, isOverlap: true }
];

const SHIFT_2_PERIODS = [
    { period: 1, label: "1-soat", time: "12:25 - 13:10", breakTime: "5 daq tanaffus", slot: 6, shift: 2, isOverlap: true },
    { period: 2, label: "2-soat", time: "13:15 - 14:00", breakTime: "5 daq tanaffus", slot: 7, shift: 2 },
    { period: 3, label: "3-soat", time: "14:05 - 14:50", breakTime: "5 daq tanaffus", slot: 8, shift: 2 },
    { period: 4, label: "4-soat", time: "14:55 - 15:40", breakTime: "5 daq tanaffus", slot: 9, shift: 2 },
    { period: 5, label: "5-soat", time: "15:45 - 16:30", breakTime: "5 daq tanaffus", slot: 10, shift: 2 },
    { period: 6, label: "6-soat", time: "16:35 - 17:20", breakTime: "", slot: 11, shift: 2 }
];

const ALL_DAY_SLOTS = [
    { slot: 1, shift: 1, period: 1, label: "1-sm 1-soat", time: "08:00 - 08:45" },
    { slot: 2, shift: 1, period: 2, label: "1-sm 2-soat", time: "08:50 - 09:35" },
    { slot: 3, shift: 1, period: 3, label: "1-sm 3-soat", time: "09:40 - 10:25" },
    { slot: 4, shift: 1, period: 4, label: "1-sm 4-soat", time: "10:30 - 11:15" },
    { slot: 5, shift: 1, period: 5, label: "1-sm 5-soat", time: "11:20 - 12:05" },
    { slot: 6, shift: 0, period: 6, label: "1-sm 6 / 2-sm 1", time: "12:25 - 13:10", isOverlap: true },
    { slot: 7, shift: 2, period: 2, label: "2-sm 2-soat", time: "13:15 - 14:00" },
    { slot: 8, shift: 2, period: 3, label: "2-sm 3-soat", time: "14:05 - 14:50" },
    { slot: 9, shift: 2, period: 4, label: "2-sm 4-soat", time: "14:55 - 15:40" },
    { slot: 10, shift: 2, period: 5, label: "2-sm 5-soat", time: "15:45 - 16:30" },
    { slot: 11, shift: 2, period: 6, label: "2-sm 6-soat", time: "16:35 - 17:20" }
];

const DAYS = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];

// 2 Smenali namunaviy ma'lumotlar
const SAMPLE_DATA = {
    teachers: [
        {
            id: "t_jasur",
            name: "Xasanov Jasur",
            subjectIds: ["s_alg", "s_geom"],
            phone: "+998 90 777 88 99",
            color: "#3b82f6",
            weeklyHours: 30,
            offDays: [1, 3],
            assignedClasses: ["c1", "c2", "c4", "c5", "c6"]
        },
        {
            id: "t2",
            name: "Karimova Gulnoza",
            subjectIds: ["s2"],
            phone: "+998 93 234 56 78",
            color: "#ec4899",
            weeklyHours: 24,
            offDays: [5],
            assignedClasses: ["c1", "c2", "c3"]
        },
        {
            id: "t3",
            name: "Rahimov Farhod",
            subjectIds: ["s3"],
            phone: "+998 97 345 67 89",
            color: "#8b5cf6",
            weeklyHours: 18,
            offDays: [0],
            assignedClasses: ["c3", "c4", "c5"]
        },
        {
            id: "t4",
            name: "Toshmatova Nilufar",
            subjectIds: ["s4"],
            phone: "+998 91 456 78 90",
            color: "#10b981",
            weeklyHours: 20,
            offDays: [],
            assignedClasses: ["c1", "c2", "c4"]
        },
        {
            id: "t5",
            name: "Normurodov Alisher",
            subjectIds: ["s5"],
            phone: "+998 99 567 89 01",
            color: "#f59e0b",
            weeklyHours: 16,
            offDays: [2],
            assignedClasses: ["c1", "c2", "c3", "c5"]
        }
    ],
    classes: [
        { id: "c1", name: "5-A", shift: 1, roomId: "r1", supervisorId: "t_jasur" },
        { id: "c2", name: "5-B", shift: 1, roomId: "r2", supervisorId: "t2" },
        { id: "c3", name: "6-A", shift: 1, roomId: "r3", supervisorId: "t5" },
        { id: "c4", name: "7-A", shift: 2, roomId: "r1", supervisorId: "t3" },
        { id: "c5", name: "8-A", shift: 2, roomId: "r2", supervisorId: "t4" },
        { id: "c6", name: "9-A", shift: 2, roomId: "r3", supervisorId: "" }
    ],
    subjects: [
        { id: "s_kelajak", name: "Kelajak soati", code: "Kelajak", color: "#8b5cf6" },
        { id: "s_alg", name: "Algebra", code: "Alg", color: "#3b82f6" },
        { id: "s_geom", name: "Geometriya", code: "Geom", color: "#6366f1" },
        { id: "s2", name: "Ona tili va Adabiyot", code: "Ona t.", color: "#ec4899" },
        { id: "s3", name: "Fizika", code: "Fiz", color: "#8b5cf6" },
        { id: "s4", name: "Ingliz tili", code: "Ingl", color: "#10b981" },
        { id: "s5", name: "Tarix", code: "Tar", color: "#f59e0b" }
    ],
    rooms: [
        { id: "r1", name: "101-xona", capacity: 30 },
        { id: "r2", name: "102-xona", capacity: 30 },
        { id: "r3", name: "103-xona", capacity: 32 },
        { id: "r4", name: "201-xona", capacity: 30 },
        { id: "r5", name: "Fizika lab.", capacity: 25 },
        { id: "r6", name: "Matematika xonasi", capacity: 30 }
    ],
    curriculum: [
        { id: "cu1", classId: "c1", subjectId: "s_alg", teacherId: "t_jasur", roomId: "r1", hours: 4 },
        { id: "cu2", classId: "c1", subjectId: "s_geom", teacherId: "t_jasur", roomId: "r1", hours: 2 },
        { id: "cu3", classId: "c1", subjectId: "s2", teacherId: "t2", roomId: "r1", hours: 4 },
        { id: "cu4", classId: "c1", subjectId: "s4", teacherId: "t4", roomId: "r1", hours: 3 },
        { id: "cu5", classId: "c1", subjectId: "s5", teacherId: "t5", roomId: "r1", hours: 2 },

        { id: "cu6", classId: "c4", subjectId: "s_alg", teacherId: "t_jasur", roomId: "r1", hours: 4 },
        { id: "cu7", classId: "c4", subjectId: "s_geom", teacherId: "t_jasur", roomId: "r1", hours: 2 },
        { id: "cu8", classId: "c4", subjectId: "s3", teacherId: "t3", roomId: "r5", hours: 3 },
        { id: "cu9", classId: "c4", subjectId: "s4", teacherId: "t4", roomId: "r1", hours: 3 }
    ],
    lessons: []
};

// Application state
let state = {
    teachers: [],
    classes: [],
    subjects: [],
    rooms: [],
    curriculum: [],
    lessons: [],
    currentView: 'class',
    selectedFilterId: null,
    selectedShift: '1',
    theme: 'light',
    schoolKey: '48-maktab'
};

// Auth State (User vs Admin)
let authState = {
    role: 'user',
    adminUsername: 'admin',
    adminPassword: '123'
};

const MASTER_DB_KEY = 'eduschedule_master_db_v1';
const AUTH_KEY = 'eduschedule_master_auth_v1';

// Client ID for presence tracking
let clientId = localStorage.getItem('eduschedule_client_id');
if (!clientId) {
    clientId = 'u_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('eduschedule_client_id', clientId);
}

// ==========================================
// 2. Storage, Cloud Sync & Helpers
// ==========================================
function ensureKelajakSubject() {
    let kelajak = state.subjects.find(s => s.id === 's_kelajak' || (s.name && s.name.toLowerCase().includes('kelajak')));
    if (!kelajak) {
        kelajak = { id: "s_kelajak", name: "Kelajak soati", code: "Kelajak", color: "#8b5cf6" };
        state.subjects.unshift(kelajak);
    }
    return kelajak;
}

function normalizeTeacherSubjects() {
    state.teachers.forEach(t => {
        if (!t.subjectIds) {
            t.subjectIds = [];
            if (t.subjectId) t.subjectIds.push(t.subjectId);
            if (t.secondarySubjectId) t.subjectIds.push(t.secondarySubjectId);
        }
        t.subjectIds = t.subjectIds.filter(Boolean);
        if (t.subjectIds.length === 0 && state.subjects[0]) {
            t.subjectIds.push(state.subjects[0].id);
        }
    });
}

function syncKelajakSoatiLessons() {
    ensureKelajakSubject();
    const kelajakSubj = state.subjects.find(s => s.id === 's_kelajak') || state.subjects[0];

    state.classes.forEach(cls => {
        if (cls.supervisorId) {
            const existingIdx = state.lessons.findIndex(l => l.classId === cls.id && l.day === 0 && l.period === 1);
            const kelajakLesson = {
                id: 'kelajak_' + cls.id,
                day: 0,
                period: 1,
                classId: cls.id,
                subjectId: kelajakSubj.id,
                teacherId: cls.supervisorId,
                roomId: cls.roomId || '',
                isKelajakSoati: true
            };

            if (existingIdx >= 0) {
                state.lessons[existingIdx] = kelajakLesson;
            } else {
                state.lessons.push(kelajakLesson);
            }
        }
    });
}

// Universal Online Cloud Fetch (Render Server)
async function fetchOnlineScheduleData(silent = false) {
    if (!window.location.protocol.startsWith('http')) return false;

    try {
        const response = await fetch('/api/schedule', { headers: { 'Accept': 'application/json' } });
        if (response.ok) {
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                const res = await response.json();
                if (res && res.success && res.data && res.data.classes && res.data.classes.length > 0) {
                    const currentHash = JSON.stringify(state.lessons || []);
                    const newHash = JSON.stringify(res.data.lessons || []);

                    state = res.data;
                    if (res.auth) {
                        if (res.auth.adminUsername) authState.adminUsername = res.auth.adminUsername;
                        if (res.auth.adminPassword) authState.adminPassword = res.auth.adminPassword;
                        localStorage.setItem(AUTH_KEY, JSON.stringify(authState));
                    }
                    ensureKelajakSubject();
                    normalizeTeacherSubjects();
                    syncKelajakSoatiLessons();
                    localStorage.setItem(MASTER_DB_KEY, JSON.stringify(state));

                    if (currentHash !== newHash || !silent) {
                        refreshAllViews();
                    }
                    updateCloudStatusBadge("online");
                    return true;
                }
            }
        }
    } catch (e) {}

    updateCloudStatusBadge("local");
    return false;
}

// Universal Cloud Sync Post (Broadcasts changes to all devices)
async function syncWithServer() {
    if (!window.location.protocol.startsWith('http')) return;

    updateCloudStatusBadge("syncing");
    try {
        const res = await fetch('/api/schedule', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ schedule: state, auth: authState, schoolKey: state.schoolKey })
        });
        if (res.ok) {
            updateCloudStatusBadge("online");
            return;
        }
    } catch (e) {}

    updateCloudStatusBadge("local");
}

// Live Presence Heartbeat & Active Users Counter
async function pingPresence() {
    if (!window.location.protocol.startsWith('http')) {
        updateOnlineCountUI(1);
        return;
    }

    try {
        const res = await fetch('/api/presence', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientId: clientId })
        });
        if (res.ok) {
            const data = await res.json();
            if (data && data.success) {
                updateOnlineCountUI(data.count || 1);
                return;
            }
        }
    } catch (e) {}

    // Fallback: Dynamic realistic active count
    updateOnlineCountUI(1);
}

function updateOnlineCountUI(count) {
    const el = document.getElementById('online-users-count');
    if (el) {
        el.textContent = Math.max(1, count);
    }
}

function updateCloudStatusBadge(status) {
    const indicator = document.getElementById('conflict-indicator');
    if (!indicator) return;

    if (status === 'online') {
        indicator.innerHTML = `<i class="fa-solid fa-cloud text-success"></i> <span>Bulutga ulangan (Sinxron)</span>`;
    } else if (status === 'syncing') {
        indicator.innerHTML = `<i class="fa-solid fa-rotate fa-spin text-primary"></i> <span>Bulut bilan yangilanmoqda...</span>`;
    } else if (status === 'local') {
        indicator.innerHTML = `<i class="fa-solid fa-hard-drive text-primary"></i> <span>Brauzer xotirasida saqlandi</span>`;
    }
}

function loadState() {
    const saved = localStorage.getItem(MASTER_DB_KEY) || 
                  localStorage.getItem('eduschedule_data_v7') ||
                  localStorage.getItem('eduschedule_data_v6') ||
                  localStorage.getItem('eduschedule_data_v5') ||
                  localStorage.getItem('eduschedule_data_v4');

    if (saved) {
        try {
            state = JSON.parse(saved);
        } catch (e) {
            console.error("Xatolik:", e);
            state = JSON.parse(JSON.stringify(SAMPLE_DATA));
        }
    } else {
        state = JSON.parse(JSON.stringify(SAMPLE_DATA));
        localStorage.setItem(MASTER_DB_KEY, JSON.stringify(state));
    }

    ensureKelajakSubject();
    normalizeTeacherSubjects();
    syncKelajakSoatiLessons();

    const savedAuth = localStorage.getItem(AUTH_KEY) || localStorage.getItem('eduschedule_auth_v2');
    if (savedAuth) {
        try {
            const parsed = JSON.parse(savedAuth);
            authState = { ...authState, ...parsed };
        } catch (e) {}
    }

    const savedTheme = localStorage.getItem('eduschedule_theme') || 'light';
    setTheme(savedTheme);

    if (state.classes.length > 0 && !state.selectedFilterId) {
        state.selectedFilterId = state.classes[0].id;
        state.selectedShift = String(state.classes[0].shift || '1');
    }

    // Fetch live data from server/cloud
    fetchOnlineScheduleData(false);
    pingPresence();
}

function saveState() {
    localStorage.setItem(MASTER_DB_KEY, JSON.stringify(state));
    updateBadges();
    checkAllConflicts();
    syncWithServer();
}

function saveAuth() {
    localStorage.setItem(AUTH_KEY, JSON.stringify(authState));
    syncWithServer();
}

function setTheme(theme) {
    state.theme = theme;
    localStorage.setItem('eduschedule_theme', theme);
    updateAuthUI();
    const themeIcon = document.querySelector('#theme-toggle i');
    if (themeIcon) {
        themeIcon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    }
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'fa-circle-check text-success';
    if (type === 'danger') icon = 'fa-triangle-exclamation text-danger';
    if (type === 'warning') icon = 'fa-circle-info text-warning';

    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3200);
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}

function updateBadges() {
    document.getElementById('badge-teachers').textContent = state.teachers.length;
    document.getElementById('badge-classes').textContent = state.classes.length;
    document.getElementById('badge-subjects').textContent = state.subjects.length;
    document.getElementById('badge-rooms').textContent = state.rooms.length;
}

function uid() {
    return 'id_' + Math.random().toString(36).substr(2, 9);
}

function getLessonAbsoluteSlot(lesson) {
    const cls = state.classes.find(c => c.id === lesson.classId);
    const shift = cls ? parseInt(cls.shift) : 1;
    const period = parseInt(lesson.period);

    if (shift === 1) {
        return period;
    } else {
        return period + 5;
    }
}

function getOffDaysText(offDays) {
    if (!offDays || offDays.length === 0) return "Yo'q (hamma kun ish)";
    return offDays.map(d => DAYS[d]).join(', ');
}

function getTeacherSubjectsDisplay(teacher) {
    const ids = teacher.subjectIds || [teacher.subjectId].filter(Boolean);
    if (ids.length === 0) return "Fan belgilanmagan";
    return ids.map(id => {
        const s = state.subjects.find(sub => sub.id === id);
        return s ? s.name : '';
    }).filter(Boolean).join(', ');
}

// ==========================================
// 3. User & Admin Role Authentication System
// ==========================================
function updateAuthUI() {
    const isAdmin = (authState.role === 'admin');
    const baseTheme = state.theme === 'dark' ? 'dark-mode' : 'light-mode';
    document.body.className = `${baseTheme} ${isAdmin ? 'admin-role' : 'user-role'}`;

    const roleAvatar = document.getElementById('sidebar-role-avatar');
    const roleTitle = document.getElementById('sidebar-role-title');
    const roleDesc = document.getElementById('sidebar-role-desc');

    if (isAdmin) {
        roleAvatar.innerHTML = `<i class="fa-solid fa-user-shield"></i>`;
        roleTitle.textContent = "Administrator";
        roleDesc.textContent = "To'liq tahrirlash huquqi";
    } else {
        roleAvatar.innerHTML = `<i class="fa-solid fa-user"></i>`;
        roleTitle.textContent = "Foydalanuvchi";
        roleDesc.textContent = "Faqat ko'rish rejimi";
    }

    const authBox = document.getElementById('auth-box');
    if (isAdmin) {
        authBox.innerHTML = `
            <span class="role-badge badge-admin"><i class="fa-solid fa-crown"></i> Admin</span>
            <button class="btn btn-secondary" id="btn-open-change-pass" title="Parolni o'zgartirish">
                <i class="fa-solid fa-key"></i>
            </button>
            <button class="btn btn-secondary" id="btn-logout" title="Chiqish">
                <i class="fa-solid fa-arrow-right-from-bracket"></i> Chiqish
            </button>
        `;
        document.getElementById('btn-open-change-pass').addEventListener('click', () => {
            document.getElementById('form-change-password').reset();
            const userInp = document.getElementById('change-admin-username');
            if (userInp) userInp.value = authState.adminUsername || 'admin';
            const errBox = document.getElementById('change-pass-error');
            if (errBox) errBox.classList.add('hidden');
            openModal('modal-change-password');
        });
        document.getElementById('btn-logout').addEventListener('click', () => {
            authState.role = 'user';
            saveAuth();
            updateAuthUI();
            refreshAllViews();
            showToast("Foydalanuvchi (ko'rish) rejimiga o'tildi", "warning");
        });
    } else {
        authBox.innerHTML = `
            <span class="role-badge badge-user"><i class="fa-solid fa-eye"></i> Faqat ko'rish</span>
            <button class="btn btn-primary" id="btn-open-login">
                <i class="fa-solid fa-lock"></i> Admin Kirish
            </button>
        `;
        document.getElementById('btn-open-login').addEventListener('click', () => {
            document.getElementById('form-login').reset();
            document.getElementById('login-username').value = authState.adminUsername || 'admin';
            document.getElementById('login-error-alert').classList.add('hidden');
            openModal('modal-login');
        });
    }
}

// ==========================================
// 4. Conflict Detection Engine
// ==========================================
function checkConflicts(lesson, ignoreLessonId = null) {
    const conflicts = [];
    const lessonSlot = getLessonAbsoluteSlot(lesson);
    const lessonDay = parseInt(lesson.day);
    const lessonClass = state.classes.find(c => c.id === lesson.classId);
    const teacher = state.teachers.find(t => t.id === lesson.teacherId);

    if (teacher && teacher.offDays && teacher.offDays.includes(lessonDay)) {
        conflicts.push(`O'qituvchi (${teacher.name}) uchun ${DAYS[lessonDay]} bo'sh kun (dam olish kuni) deb belgilangan!`);
    }

    state.lessons.forEach(l => {
        if (l.id === (ignoreLessonId || lesson.id)) return;
        if (parseInt(l.day) === lessonDay) {
            const otherSlot = getLessonAbsoluteSlot(l);

            if (otherSlot === lessonSlot) {
                const otherClass = state.classes.find(c => c.id === l.classId);
                const isSharedOverlapSlot = (lessonSlot === 6);

                if (l.teacherId === lesson.teacherId) {
                    const t = state.teachers.find(x => x.id === lesson.teacherId);
                    if (isSharedOverlapSlot && lessonClass && otherClass && lessonClass.shift !== otherClass.shift) {
                        conflicts.push(`O'qituvchi (${t ? t.name : ''}) to'qnashuv vaqtida (1-sm 6-soat va 2-sm 1-soat: 12:25–13:10) bir vaqtda ${otherClass.name} sinfida ham band!`);
                    } else {
                        conflicts.push(`O'qituvchi (${t ? t.name : ''}) shu vaqtda ${otherClass ? otherClass.name : 'boshqa sinf'}da darsda!`);
                    }
                }

                if (lesson.roomId && l.roomId && l.roomId === lesson.roomId) {
                    const r = state.rooms.find(x => x.id === lesson.roomId);
                    if (isSharedOverlapSlot && lessonClass && otherClass && lessonClass.shift !== otherClass.shift) {
                        conflicts.push(`Xona (${r ? r.name : ''}) to'qnashuv vaqtida (1-sm 6-soat / 2-sm 1-soat: 12:25–13:10) bir vaqtda ${otherClass.name} tomonidan band!`);
                    } else {
                        conflicts.push(`Xona (${r ? r.name : ''}) shu vaqtda ${otherClass ? otherClass.name : 'boshqa sinf'} tomonidan band!`);
                    }
                }

                if (l.classId === lesson.classId) {
                    conflicts.push(`Ushbu sinfga shu soatda boshqa dars qo'yilgan!`);
                }
            }
        }
    });

    return conflicts;
}

function checkAllConflicts() {
    let totalConflicts = 0;
    state.lessons.forEach(l => {
        const c = checkConflicts(l, l.id);
        if (c.length > 0) totalConflicts++;
    });

    const indicator = document.getElementById('conflict-indicator');
    if (totalConflicts > 0) {
        indicator.className = 'stats-pill has-conflict';
        indicator.innerHTML = `<i class="fa-solid fa-triangle-exclamation text-danger"></i> <span>${totalConflicts} ta darsda ziddiyat bor!</span>`;
    }
}

// ==========================================
// 5. Rendering Functions
// ==========================================
function getDisplayedPeriods() {
    if (state.currentView === 'class') {
        const cls = state.classes.find(c => c.id === state.selectedFilterId);
        const shift = cls ? cls.shift : parseInt(state.selectedShift || 1);
        return shift === 2 ? SHIFT_2_PERIODS : SHIFT_1_PERIODS;
    }

    if (state.selectedShift === '1') return SHIFT_1_PERIODS;
    if (state.selectedShift === '2') return SHIFT_2_PERIODS;
    return ALL_DAY_SLOTS;
}

function renderSchedule() {
    const tbody = document.getElementById('schedule-body');
    tbody.innerHTML = '';

    const isAdmin = (authState.role === 'admin');
    const view = state.currentView;
    const filterId = state.selectedFilterId;
    const periodsToDisplay = getDisplayedPeriods();

    const printViewTitle = document.getElementById('print-view-title');
    let selectedTeacher = null;

    if (view === 'class') {
        const cls = state.classes.find(c => c.id === filterId);
        const supervisor = cls && cls.supervisorId ? state.teachers.find(t => t.id === cls.supervisorId) : null;
        const supervisorText = supervisor ? ` | 🎓 Sinf rahbari: ${supervisor.name}` : ' | Sinf rahbari: Belgilanmagan';
        printViewTitle.textContent = cls ? `Sinf: ${cls.name} (${cls.shift}-smena)${supervisorText}` : 'Sinf tanlanmagan';
    } else if (view === 'teacher') {
        selectedTeacher = state.teachers.find(x => x.id === filterId);
        const offText = selectedTeacher ? getOffDaysText(selectedTeacher.offDays) : '';
        const supervisedClass = state.classes.find(c => c.supervisorId === filterId);
        const supInfo = supervisedClass ? ` [${supervisedClass.name} rahbari]` : '';
        printViewTitle.textContent = selectedTeacher ? `O'qituvchi: ${selectedTeacher.name}${supInfo} (Bo'sh kunlari: ${offText})` : 'O\'qituvchi tanlanmagan';
    } else if (view === 'room') {
        const r = state.rooms.find(x => x.id === filterId);
        printViewTitle.textContent = r ? `Xona: ${r.name}` : 'Xona tanlanmagan';
    } else {
        printViewTitle.textContent = 'Umumiy maktab dars jadvali (Barcha smenalar)';
    }

    periodsToDisplay.forEach(p => {
        const tr = document.createElement('tr');

        const tdPeriod = document.createElement('td');
        tdPeriod.className = 'period-label';

        let shiftBadge = '';
        if (p.isOverlap) {
            shiftBadge = `<span class="shift-tag tag-overlap">1-sm 6 / 2-sm 1</span>`;
        } else if (p.shift === 1) {
            shiftBadge = `<span class="shift-tag tag-s1">1-smena</span>`;
        } else if (p.shift === 2) {
            shiftBadge = `<span class="shift-tag tag-s2">2-smena</span>`;
        }

        tdPeriod.innerHTML = `
            ${shiftBadge}
            <div><strong>${p.label}</strong></div>
            <span class="time-subtext">${p.time}</span>
            ${p.breakTime ? `<span style="font-size: 0.65rem; color: #8b5cf6; display: block; margin-top: 2px;">${p.breakTime}</span>` : ''}
        `;
        tr.appendChild(tdPeriod);

        for (let day = 0; day < 6; day++) {
            const td = document.createElement('td');
            const cellDiv = document.createElement('div');
            cellDiv.className = 'schedule-cell';
            cellDiv.dataset.day = day;

            if (view === 'teacher' && selectedTeacher && selectedTeacher.offDays && selectedTeacher.offDays.includes(day)) {
                cellDiv.className = 'schedule-cell off-day-cell';
                cellDiv.innerHTML = `<i class="fa-solid fa-umbrella-beach"></i> <span>BO'SH KUN</span>`;
                td.appendChild(cellDiv);
                tr.appendChild(td);
                continue;
            }

            const targetSlot = p.slot;
            let matchingLessons = [];

            if (view === 'class') {
                matchingLessons = state.lessons.filter(l => l.day === day && l.classId === filterId && getLessonAbsoluteSlot(l) === targetSlot);
            } else if (view === 'teacher') {
                matchingLessons = state.lessons.filter(l => l.day === day && l.teacherId === filterId && getLessonAbsoluteSlot(l) === targetSlot);
            } else if (view === 'room') {
                matchingLessons = state.lessons.filter(l => l.day === day && l.roomId === filterId && getLessonAbsoluteSlot(l) === targetSlot);
            } else if (view === 'master') {
                matchingLessons = state.lessons.filter(l => l.day === day && getLessonAbsoluteSlot(l) === targetSlot);
            }

            if (matchingLessons.length > 0) {
                matchingLessons.forEach(l => {
                    const subj = state.subjects.find(s => s.id === l.subjectId);
                    const teacher = state.teachers.find(t => t.id === l.teacherId);
                    const cls = state.classes.find(c => c.id === l.classId);
                    const room = state.rooms.find(r => r.id === l.roomId);

                    const isKelajak = (subj && subj.name.toLowerCase().includes('kelajak')) || (l.day === 0 && l.period === 1 && cls && cls.supervisorId === l.teacherId);

                    const conflicts = checkConflicts(l, l.id);
                    const isConflict = conflicts.length > 0;

                    const card = document.createElement('div');
                    card.className = `lesson-card ${isKelajak ? 'kelajak-soati-card' : ''} ${isConflict ? 'conflict-card' : ''}`;
                    if (subj && !isKelajak) card.style.borderLeftColor = subj.color;

                    let secondaryText = '';
                    if (view === 'class') {
                        secondaryText = `<div class="teacher-name"><i class="fa-solid fa-chalkboard-user"></i> ${teacher ? teacher.name : '-'} ${isKelajak ? ' <span class="badge-kelajak" style="padding:1px 4px; border-radius:3px; font-size:0.68rem;">(Sinf rahbari)</span>' : ''}</div>`;
                    } else if (view === 'teacher') {
                        secondaryText = `<div class="teacher-name"><i class="fa-solid fa-users"></i> ${cls ? `${cls.name} (${cls.shift}-sm)` : '-'} ${isKelajak ? ' <span class="badge-kelajak" style="padding:1px 4px; border-radius:3px; font-size:0.68rem;">(Rahbarlik darsi)</span>' : ''}</div>`;
                    } else {
                        secondaryText = `<div class="teacher-name"><i class="fa-solid fa-users"></i> ${cls ? `${cls.name} (${cls.shift}-sm)` : '-'} | <i class="fa-solid fa-chalkboard-user"></i> ${teacher ? teacher.name : '-'}</div>`;
                    }

                    card.innerHTML = `
                        <div class="subject-title">
                            <span>${isKelajak ? '<i class="fa-solid fa-star text-warning"></i> Kelajak soati' : (subj ? subj.name : 'Noma\'lum fan')}</span>
                        </div>
                        ${secondaryText}
                        ${room ? `<div class="room-badge"><i class="fa-solid fa-door-open"></i> ${room.name}</div>` : ''}
                        ${isConflict ? `<div class="conflict-tag"><i class="fa-solid fa-triangle-exclamation"></i> ${conflicts[0]}</div>` : ''}
                    `;

                    if (isAdmin) {
                        card.addEventListener('click', (e) => {
                            e.stopPropagation();
                            openEditLessonModal(l);
                        });
                    }

                    cellDiv.appendChild(card);
                });
            } else {
                if (isAdmin) {
                    cellDiv.innerHTML = `<span class="cell-add-btn"><i class="fa-solid fa-plus"></i> Qo'shish</span>`;
                    cellDiv.addEventListener('click', () => {
                        openAddLessonModal(day, p.period || 1, p.shift || 1);
                    });
                }
            }

            td.appendChild(cellDiv);
            tr.appendChild(td);
        }

        tbody.appendChild(tr);
    });
}

function populateFilters() {
    const classSelect = document.getElementById('select-class-filter');
    const teacherSelect = document.getElementById('select-teacher-filter');
    const roomSelect = document.getElementById('select-room-filter');

    classSelect.innerHTML = state.classes.map(c => `<option value="${c.id}">${c.name} (${c.shift}-smena)</option>`).join('');
    teacherSelect.innerHTML = state.teachers.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
    roomSelect.innerHTML = state.rooms.map(r => `<option value="${r.id}">${r.name}</option>`).join('');

    if (state.selectedFilterId) {
        if (state.currentView === 'class') classSelect.value = state.selectedFilterId;
        if (state.currentView === 'teacher') teacherSelect.value = state.selectedFilterId;
        if (state.currentView === 'room') roomSelect.value = state.selectedFilterId;
    }
}

function renderTeachers(filter = '') {
    const grid = document.getElementById('teachers-grid');
    grid.innerHTML = '';

    const filtered = state.teachers.filter(t => t.name.toLowerCase().includes(filter.toLowerCase()));

    if (filtered.length === 0) {
        grid.innerHTML = `<p class="text-muted" style="grid-column: 1/-1; text-align: center;">O'qituvchilar topilmadi.</p>`;
        return;
    }

    filtered.forEach(t => {
        const lessonCount = state.lessons.filter(l => l.teacherId === t.id).length;
        const supervisedClass = state.classes.find(c => c.supervisorId === t.id);
        const subjectDisplay = getTeacherSubjectsDisplay(t);
        const offDaysText = getOffDaysText(t.offDays);

        const card = document.createElement('div');
        card.className = 'info-card';
        card.innerHTML = `
            <div class="info-card-header">
                <div class="avatar-circle" style="background: ${t.color || '#3b82f6'};">
                    ${t.name.charAt(0).toUpperCase()}
                </div>
                <div class="info-card-body">
                    <h4>${t.name}</h4>
                    <p><i class="fa-solid fa-book-open"></i> Fanlari: <strong>${subjectDisplay}</strong></p>
                    ${supervisedClass ? `<p><span class="supervisor-pill"><i class="fa-solid fa-user-tie"></i> ${supervisedClass.name} sinf rahbari</span></p>` : ''}
                    <p><i class="fa-solid fa-calendar-xmark"></i> Bo'sh kunlari: <span class="off-day-pill">${offDaysText}</span></p>
                    <p><i class="fa-solid fa-phone"></i> ${t.phone || 'Telefon yo\'q'}</p>
                </div>
            </div>
            <div class="info-card-footer">
                <span class="badge"><i class="fa-solid fa-clock"></i> ${lessonCount} / ${t.weeklyHours || 30} soat</span>
                <div class="info-card-actions">
                    <button class="action-btn" title="Tahrirlash" onclick="editTeacher('${t.id}')"><i class="fa-solid fa-pen"></i></button>
                    <button class="action-btn btn-delete" title="O'chirish" onclick="deleteTeacher('${t.id}')"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function renderClasses(filter = '') {
    const grid = document.getElementById('classes-grid');
    grid.innerHTML = '';

    const filtered = state.classes.filter(c => c.name.toLowerCase().includes(filter.toLowerCase()));

    if (filtered.length === 0) {
        grid.innerHTML = `<p class="text-muted" style="grid-column: 1/-1; text-align: center;">Sinflar topilmadi.</p>`;
        return;
    }

    filtered.forEach(c => {
        const room = state.rooms.find(r => r.id === c.roomId);
        const supervisor = c.supervisorId ? state.teachers.find(t => t.id === c.supervisorId) : null;
        const lessonCount = state.lessons.filter(l => l.classId === c.id).length;

        const card = document.createElement('div');
        card.className = 'info-card';
        card.innerHTML = `
            <div class="info-card-header">
                <div class="avatar-circle" style="background: ${c.shift == 1 ? 'linear-gradient(135deg, #3b82f6, #06b6d4)' : 'linear-gradient(135deg, #f59e0b, #ec4899)'};">
                    ${c.name}
                </div>
                <div class="info-card-body">
                    <h4>${c.name} sinfi</h4>
                    <p><i class="fa-solid fa-user-tie"></i> Sinf rahbari: <strong>${supervisor ? supervisor.name : '<span class="text-muted">Tayinlanmagan</span>'}</strong></p>
                    <p style="font-size: 0.75rem; color: #8b5cf6;"><i class="fa-solid fa-star"></i> Dushanba 1-soat: Kelajak soati (${supervisor ? supervisor.name : 'Rahbar'})</p>
                    <p><i class="fa-solid fa-clock"></i> ${c.shift == 1 ? '1-smena (08:00 - 13:10)' : '2-smena (12:25 - 17:20)'}</p>
                    <p><i class="fa-solid fa-door-open"></i> ${room ? room.name : 'Xona belgilanmagan'}</p>
                </div>
            </div>
            <div class="info-card-footer">
                <span class="badge ${c.shift == 1 ? 'tag-s1' : 'tag-s2'}">${lessonCount} soat / haftasiga</span>
                <div class="info-card-actions">
                    <button class="action-btn" title="Rahbar va ma'lumotlarni tahrirlash" onclick="editClass('${c.id}')"><i class="fa-solid fa-pen"></i></button>
                    <button class="action-btn btn-delete" title="O'chirish" onclick="deleteClass('${c.id}')"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function renderSubjects(filter = '') {
    const grid = document.getElementById('subjects-grid');
    grid.innerHTML = '';

    const filtered = state.subjects.filter(s => s.name.toLowerCase().includes(filter.toLowerCase()));

    if (filtered.length === 0) {
        grid.innerHTML = `<p class="text-muted" style="grid-column: 1/-1; text-align: center;">Fanlar topilmadi.</p>`;
        return;
    }

    filtered.forEach(s => {
        const teachersCount = state.teachers.filter(t => {
            const ids = t.subjectIds || [t.subjectId].filter(Boolean);
            return ids.includes(s.id);
        }).length;

        const isKelajak = s.id === 's_kelajak';

        const card = document.createElement('div');
        card.className = 'info-card';
        card.innerHTML = `
            <div class="info-card-header">
                <div class="avatar-circle" style="background: ${s.color || '#10b981'};">
                    ${s.code ? s.code.slice(0, 3) : s.name.slice(0, 2)}
                </div>
                <div class="info-card-body">
                    <h4>${s.name} ${isKelajak ? '<span class="badge-kelajak" style="font-size: 0.65rem; padding: 2px 4px; border-radius: 3px;">Majburiy</span>' : ''}</h4>
                    <p><i class="fa-solid fa-tag"></i> Qisqartma: <strong>${s.code || '-'}</strong></p>
                    <p><i class="fa-solid fa-chalkboard-user"></i> ${teachersCount} ta o'qituvchi</p>
                </div>
            </div>
            <div class="info-card-footer">
                <div class="color-preview" style="width: 20px; height: 20px; border-radius: 4px; background: ${s.color};"></div>
                <div class="info-card-actions">
                    ${!isKelajak ? `
                        <button class="action-btn" title="Tahrirlash" onclick="editSubject('${s.id}')"><i class="fa-solid fa-pen"></i></button>
                        <button class="action-btn btn-delete" title="O'chirish" onclick="deleteSubject('${s.id}')"><i class="fa-solid fa-trash"></i></button>
                    ` : '<span class="text-muted" style="font-size:0.75rem;">Standart fan</span>'}
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function renderRooms(filter = '') {
    const grid = document.getElementById('rooms-grid');
    grid.innerHTML = '';

    const filtered = state.rooms.filter(r => r.name.toLowerCase().includes(filter.toLowerCase()));

    if (filtered.length === 0) {
        grid.innerHTML = `<p class="text-muted" style="grid-column: 1/-1; text-align: center;">Xonalar topilmadi.</p>`;
        return;
    }

    filtered.forEach(r => {
        const card = document.createElement('div');
        card.className = 'info-card';
        card.innerHTML = `
            <div class="info-card-header">
                <div class="avatar-circle" style="background: #64748b;">
                    <i class="fa-solid fa-door-open"></i>
                </div>
                <div class="info-card-body">
                    <h4>${r.name}</h4>
                    <p><i class="fa-solid fa-users"></i> Sig'imi: ${r.capacity || 30} o'quvchi</p>
                </div>
            </div>
            <div class="info-card-footer">
                <span class="badge">Sinf xonasi</span>
                <div class="info-card-actions">
                    <button class="action-btn" title="Tahrirlash" onclick="editRoom('${r.id}')"><i class="fa-solid fa-pen"></i></button>
                    <button class="action-btn btn-delete" title="O'chirish" onclick="deleteRoom('${r.id}')"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function renderCurriculum() {
    const classSelect = document.getElementById('curriculum-class-select');
    classSelect.innerHTML = state.classes.map(c => `<option value="${c.id}">${c.name} (${c.shift}-smena)</option>`).join('');

    const currentClassId = classSelect.value || (state.classes[0] ? state.classes[0].id : null);
    if (!currentClassId) return;

    classSelect.value = currentClassId;

    const tbody = document.getElementById('curriculum-table-body');
    tbody.innerHTML = '';

    const items = state.curriculum.filter(cu => cu.classId === currentClassId);

    if (items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">Bu sinf uchun yuklama belgilanmagan. 'Yuklama qo'shish' tugmasini bosing.</td></tr>`;
        return;
    }

    items.forEach(cu => {
        const subj = state.subjects.find(s => s.id === cu.subjectId);
        const teacher = state.teachers.find(t => t.id === cu.teacherId);
        const room = state.rooms.find(r => r.id === cu.roomId);
        
        const placedCount = state.lessons.filter(l => l.classId === currentClassId && l.subjectId === cu.subjectId).length;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${subj ? subj.name : '-'}</strong></td>
            <td>${teacher ? teacher.name : '-'}</td>
            <td>${room ? room.name : 'Doimiy xona'}</td>
            <td><span class="badge">${cu.hours} soat</span></td>
            <td>
                <span class="badge ${placedCount >= cu.hours ? 'text-success' : 'text-danger'}">
                    ${placedCount} / ${cu.hours} soat
                </span>
            </td>
            <td>
                <button class="action-btn btn-delete" onclick="deleteCurriculumItem('${cu.id}')" title="O'chirish">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// ==========================================
// 6. Dynamic Teacher Subjects Management
// ==========================================
function renderTeacherSubjectsDynamic(selectedSubjectIds = []) {
    const container = document.getElementById('teacher-subjects-dynamic-container');
    container.innerHTML = '';

    let ids = [...selectedSubjectIds];
    if (ids.length === 0) ids = [''];

    ids.forEach((subjId, index) => {
        addTeacherSubjectRow(subjId, index === 0);
    });
}

function addTeacherSubjectRow(selectedId = '', isPrimary = false) {
    const container = document.getElementById('teacher-subjects-dynamic-container');
    const row = document.createElement('div');
    row.className = 'subject-dynamic-row';

    const select = document.createElement('select');
    select.className = 'form-control teacher-subject-select';
    select.required = isPrimary;

    const availableSubjects = state.subjects.filter(s => s.id !== 's_kelajak');
    select.innerHTML = `<option value="">${isPrimary ? 'Asosiy fanni tanlang *' : 'Qo\'shimcha fanni tanlang'}</option>` +
        availableSubjects.map(s => `<option value="${s.id}" ${s.id === selectedId ? 'selected' : ''}>${s.name}</option>`).join('');

    select.addEventListener('change', () => {
        const allSelects = container.querySelectorAll('.teacher-subject-select');
        const lastSelect = allSelects[allSelects.length - 1];
        if (lastSelect.value !== '') {
            addTeacherSubjectRow('', false);
        }
    });

    row.appendChild(select);

    if (!isPrimary) {
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'btn-remove-subject-row';
        removeBtn.title = "Fanni o'chirish";
        removeBtn.innerHTML = `<i class="fa-solid fa-trash"></i>`;
        removeBtn.addEventListener('click', () => {
            row.remove();
        });
        row.appendChild(removeBtn);
    }

    container.appendChild(row);
}

function populateTeacherFormOptions(selectedTeacher = null) {
    const assigned = selectedTeacher ? (selectedTeacher.assignedClasses || []) : [];
    const classesContainer = document.getElementById('teacher-classes-checkboxes');

    classesContainer.innerHTML = state.classes.map(c => `
        <label class="class-checkbox-item">
            <input type="checkbox" name="teacher-assigned-class" value="${c.id}" ${assigned.includes(c.id) ? 'checked' : ''}>
            <span>${c.name} (${c.shift}-sm)</span>
        </label>
    `).join('');

    const teacherSubjIds = selectedTeacher ? (selectedTeacher.subjectIds || [selectedTeacher.subjectId].filter(Boolean)) : [''];
    renderTeacherSubjectsDynamic(teacherSubjIds);
}

function updateLessonPeriodOptions(classId) {
    const periodSelect = document.getElementById('lesson-period');
    const cls = state.classes.find(c => c.id === classId);
    const shift = cls ? cls.shift : 1;
    const periods = shift === 2 ? SHIFT_2_PERIODS : SHIFT_1_PERIODS;

    periodSelect.innerHTML = periods.map(p => {
        const overlapNote = p.isOverlap ? ' (⚡ 1-sm 6-soat / 2-sm 1-soat)' : '';
        return `<option value="${p.period}">${p.label} (${p.time})${overlapNote}</option>`;
    }).join('');
}

function populateLessonFormOptions() {
    const classSelect = document.getElementById('lesson-class');
    const subjSelect = document.getElementById('lesson-subject');
    const teacherSelect = document.getElementById('lesson-teacher');
    const roomSelect = document.getElementById('lesson-room');

    classSelect.innerHTML = state.classes.map(c => `<option value="${c.id}">${c.name} (${c.shift}-smena)</option>`).join('');
    subjSelect.innerHTML = state.subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    teacherSelect.innerHTML = state.teachers.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
    roomSelect.innerHTML = `<option value="">Tanlanmagan</option>` + state.rooms.map(r => `<option value="${r.id}">${r.name}</option>`).join('');

    if (state.classes.length > 0) {
        updateLessonPeriodOptions(state.classes[0].id);
    }
}

function populateClassModalOptions(selectedClass = null) {
    const supervisorSelect = document.getElementById('class-supervisor');
    const roomSelect = document.getElementById('class-room');

    supervisorSelect.innerHTML = `<option value="">Tanlanmagan</option>` + state.teachers.map(t => {
        const subjStr = getTeacherSubjectsDisplay(t);
        return `<option value="${t.id}">${t.name} (${subjStr})</option>`;
    }).join('');

    roomSelect.innerHTML = `<option value="">Tanlanmagan</option>` + state.rooms.map(r => `<option value="${r.id}">${r.name}</option>`).join('');

    if (selectedClass) {
        supervisorSelect.value = selectedClass.supervisorId || '';
        roomSelect.value = selectedClass.roomId || '';
    }
}

function openAddLessonModal(day = 0, period = 1, shift = 1) {
    if (authState.role !== 'admin') return;
    populateLessonFormOptions();
    document.getElementById('form-lesson').reset();
    document.getElementById('lesson-id').value = '';
    document.getElementById('lesson-day').value = day;

    if (state.currentView === 'class' && state.selectedFilterId) {
        document.getElementById('lesson-class').value = state.selectedFilterId;
    } else {
        const matchingClass = state.classes.find(c => c.shift == shift);
        if (matchingClass) document.getElementById('lesson-class').value = matchingClass.id;
    }

    const curClassId = document.getElementById('lesson-class').value;
    updateLessonPeriodOptions(curClassId);
    document.getElementById('lesson-period').value = period;

    if (state.currentView === 'teacher' && state.selectedFilterId) {
        document.getElementById('lesson-teacher').value = state.selectedFilterId;
    } else if (state.currentView === 'room' && state.selectedFilterId) {
        document.getElementById('lesson-room').value = state.selectedFilterId;
    }

    document.getElementById('modal-lesson-title').innerHTML = `<i class="fa-solid fa-calendar-plus"></i> Yangi dars qo'shish`;
    document.getElementById('btn-delete-lesson').classList.add('hidden');
    document.getElementById('lesson-conflict-alert').classList.add('hidden');

    openModal('modal-lesson');
}

function openEditLessonModal(lesson) {
    if (authState.role !== 'admin') return;
    populateLessonFormOptions();
    document.getElementById('lesson-id').value = lesson.id;
    document.getElementById('lesson-class').value = lesson.classId;
    updateLessonPeriodOptions(lesson.classId);

    document.getElementById('lesson-day').value = lesson.day;
    document.getElementById('lesson-period').value = lesson.period;
    document.getElementById('lesson-subject').value = lesson.subjectId;
    document.getElementById('lesson-teacher').value = lesson.teacherId;
    document.getElementById('lesson-room').value = lesson.roomId || '';

    document.getElementById('modal-lesson-title').innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Darsni tahrirlash`;
    document.getElementById('btn-delete-lesson').classList.remove('hidden');

    const conflicts = checkConflicts(lesson, lesson.id);
    const alertBox = document.getElementById('lesson-conflict-alert');
    if (conflicts.length > 0) {
        alertBox.classList.remove('hidden');
        document.getElementById('lesson-conflict-text').textContent = conflicts.join(' | ');
    } else {
        alertBox.classList.add('hidden');
    }

    openModal('modal-lesson');
}

// Teacher CRUD
window.editTeacher = function(id) {
    if (authState.role !== 'admin') return;
    const t = state.teachers.find(x => x.id === id);
    if (!t) return;

    populateTeacherFormOptions(t);

    document.getElementById('teacher-id').value = t.id;
    document.getElementById('teacher-name').value = t.name;
    document.getElementById('teacher-weekly-hours').value = t.weeklyHours || 30;
    document.getElementById('teacher-phone').value = t.phone || '';
    document.getElementById('teacher-color').value = t.color || '#3b82f6';

    document.querySelectorAll('input[name="teacher-off-day"]').forEach(cb => {
        cb.checked = t.offDays && t.offDays.includes(parseInt(cb.value));
    });

    document.getElementById('modal-teacher-title').textContent = "O'qituvchini tahrirlash";
    openModal('modal-teacher');
};

window.deleteTeacher = function(id) {
    if (authState.role !== 'admin') return;
    if (confirm("Ushbu o'qituvchini o'chirmoqchimisiz?")) {
        state.teachers = state.teachers.filter(t => t.id !== id);
        state.lessons = state.lessons.filter(l => l.teacherId !== id);
        state.curriculum = state.curriculum.filter(cu => cu.teacherId !== id);
        state.classes.forEach(c => {
            if (c.supervisorId === id) c.supervisorId = '';
        });
        saveState();
        refreshAllViews();
        showToast("O'qituvchi muvaffaqiyatli o'chirildi");
    }
};

// Class CRUD
window.editClass = function(id) {
    if (authState.role !== 'admin') return;
    const c = state.classes.find(x => x.id === id);
    if (!c) return;

    populateClassModalOptions(c);

    document.getElementById('class-id').value = c.id;
    document.getElementById('class-name').value = c.name;
    document.getElementById('class-shift').value = c.shift || 1;
    document.getElementById('modal-class-title').textContent = "Sinf ma'lumotlari va Rahbarini tahrirlash";
    openModal('modal-class');
};

window.deleteClass = function(id) {
    if (authState.role !== 'admin') return;
    if (confirm("Ushbu sinfni o'chirmoqchimisiz?")) {
        state.classes = state.classes.filter(c => c.id !== id);
        state.lessons = state.lessons.filter(l => l.classId !== id);
        state.curriculum = state.curriculum.filter(cu => cu.classId !== id);
        if (state.selectedFilterId === id && state.classes.length > 0) {
            state.selectedFilterId = state.classes[0].id;
        }
        saveState();
        refreshAllViews();
        showToast("Sinf o'chirildi");
    }
};

// Bulk Class Supervisors Modal
function openBulkSupervisorsModal() {
    if (authState.role !== 'admin') return;
    const tbody = document.getElementById('bulk-supervisors-tbody');
    tbody.innerHTML = '';

    state.classes.forEach(c => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${c.name} sinfi</strong></td>
            <td>${c.shift}-smena</td>
            <td>
                <select class="form-control bulk-supervisor-select" data-class-id="${c.id}">
                    <option value="">Rahbar tayinlanmagan</option>
                    ${state.teachers.map(t => {
                        const subjStr = getTeacherSubjectsDisplay(t);
                        const isSelected = c.supervisorId === t.id ? 'selected' : '';
                        return `<option value="${t.id}" ${isSelected}>${t.name} (${subjStr})</option>`;
                    }).join('')}
                </select>
            </td>
        `;
        tbody.appendChild(tr);
    });

    openModal('modal-bulk-supervisors');
}

function saveBulkSupervisors() {
    if (authState.role !== 'admin') return;
    document.querySelectorAll('.bulk-supervisor-select').forEach(select => {
        const classId = select.dataset.classId;
        const teacherId = select.value;
        const cls = state.classes.find(c => c.id === classId);
        if (cls) {
            cls.supervisorId = teacherId;
        }
    });

    syncKelajakSoatiLessons();
    saveState();
    refreshAllViews();
    closeModal('modal-bulk-supervisors');
    showToast("Sinf rahbarlari va Dushanba 1-soat 'Kelajak soati' saqlandi!");
}

// Subject CRUD
window.editSubject = function(id) {
    if (authState.role !== 'admin') return;
    const s = state.subjects.find(x => x.id === id);
    if (!s) return;
    document.getElementById('subject-id').value = s.id;
    document.getElementById('subject-name').value = s.name;
    document.getElementById('subject-code').value = s.code || '';
    document.getElementById('subject-color').value = s.color || '#10b981';
    document.getElementById('modal-subject-title').textContent = "Fanni tahrirlash";
    openModal('modal-subject');
};

window.deleteSubject = function(id) {
    if (authState.role !== 'admin') return;
    if (id === 's_kelajak') {
        alert("'Kelajak soati' majburiy fan bo'lgani uchun o'chirilmaydi!");
        return;
    }
    if (confirm("Ushbu fanni o'chirmoqchimisiz?")) {
        state.subjects = state.subjects.filter(s => s.id !== id);
        state.lessons = state.lessons.filter(l => l.subjectId !== id);
        saveState();
        renderSubjects();
        renderSchedule();
        showToast("Fan o'chirildi");
    }
};

// Room CRUD
window.editRoom = function(id) {
    if (authState.role !== 'admin') return;
    const r = state.rooms.find(x => x.id === id);
    if (!r) return;
    document.getElementById('room-id').value = r.id;
    document.getElementById('room-name').value = r.name;
    document.getElementById('room-capacity').value = r.capacity || 30;
    document.getElementById('modal-room-title').textContent = "Xonani tahrirlash";
    openModal('modal-room');
};

window.deleteRoom = function(id) {
    if (authState.role !== 'admin') return;
    if (confirm("Ushbu xonani o'chirmoqchimisiz?")) {
        state.rooms = state.rooms.filter(r => r.id !== id);
        saveState();
        renderRooms();
        populateFilters();
        renderSchedule();
        showToast("Xona o'chirildi");
    }
};

window.deleteCurriculumItem = function(id) {
    if (authState.role !== 'admin') return;
    state.curriculum = state.curriculum.filter(c => c.id !== id);
    saveState();
    renderCurriculum();
    showToast("Dars yuklamasi o'chirildi");
};

// ==========================================
// 7. Auto-Scheduler Engine (Kelajak Soati + Multi-Subjects + Shifts)
// ==========================================
function runAutoScheduler() {
    if (authState.role !== 'admin') return;
    const clearExisting = document.getElementById('opt-clear-existing').checked;
    const spreadSubjects = document.getElementById('opt-spread-subjects').checked;

    state.teachers.forEach(t => {
        const subIds = t.subjectIds || [t.subjectId].filter(Boolean);
        if (t.assignedClasses && t.assignedClasses.length > 0 && t.weeklyHours > 0 && subIds.length > 0) {
            const totalTasks = t.assignedClasses.length * subIds.length;
            const hoursPerItem = Math.max(1, Math.floor(t.weeklyHours / totalTasks));
            
            t.assignedClasses.forEach(classId => {
                subIds.forEach(sId => {
                    const existing = state.curriculum.find(cu => cu.classId === classId && cu.subjectId === sId);
                    if (!existing) {
                        state.curriculum.push({
                            id: uid(),
                            classId: classId,
                            subjectId: sId,
                            teacherId: t.id,
                            roomId: (state.classes.find(c => c.id === classId) || {}).roomId || '',
                            hours: hoursPerItem
                        });
                    }
                });
            });
        }
    });

    if (state.curriculum.length === 0) {
        showToast("Avto-jadval tuzish uchun avval 'Dars yuklamasi' yoki o'qituvchilarga sinflarni biriktiring!", "warning");
        return;
    }

    let generatedLessons = [];

    // MANDATORY "Kelajak soati" on Monday Period 1 for each class with supervisor
    ensureKelajakSubject();
    const kelajakSubj = state.subjects.find(s => s.id === 's_kelajak') || state.subjects[0];

    state.classes.forEach(cls => {
        if (cls.supervisorId) {
            generatedLessons.push({
                id: 'kelajak_' + cls.id,
                day: 0,
                period: 1,
                classId: cls.id,
                subjectId: kelajakSubj.id,
                teacherId: cls.supervisorId,
                roomId: cls.roomId || '',
                isKelajakSoati: true
            });
        }
    });

    let taskList = [];
    state.curriculum.forEach(cu => {
        const alreadyPlaced = generatedLessons.filter(l => l.classId === cu.classId && l.subjectId === cu.subjectId).length;
        const remaining = cu.hours - alreadyPlaced;
        for (let i = 0; i < remaining; i++) {
            taskList.push({
                classId: cu.classId,
                subjectId: cu.subjectId,
                teacherId: cu.teacherId,
                roomId: cu.roomId
            });
        }
    });

    taskList = taskList.sort(() => Math.random() - 0.5);

    let placedCount = generatedLessons.length;
    let failedCount = 0;

    taskList.forEach(task => {
        let placed = false;
        const cls = state.classes.find(c => c.id === task.classId);
        const teacher = state.teachers.find(t => t.id === task.teacherId);
        const offDays = (teacher && teacher.offDays) ? teacher.offDays : [];

        for (let day = 0; day < 6; day++) {
            if (placed) break;

            if (offDays.includes(day)) {
                continue;
            }

            if (spreadSubjects) {
                const countToday = generatedLessons.filter(l => l.classId === task.classId && l.subjectId === task.subjectId && l.day === day).length;
                if (countToday >= 2) continue;
            }

            for (let period = 1; period <= 6; period++) {
                if (day === 0 && period === 1) continue;

                const proposedLesson = {
                    id: 'temp',
                    day: day,
                    period: period,
                    classId: task.classId,
                    subjectId: task.subjectId,
                    teacherId: task.teacherId,
                    roomId: task.roomId || (cls ? cls.roomId : '') || ''
                };

                const proposedSlot = getLessonAbsoluteSlot(proposedLesson);

                const classBusy = generatedLessons.some(l => l.classId === task.classId && l.day === day && l.period === period);
                if (classBusy) continue;

                const teacherBusy = generatedLessons.some(l => {
                    return l.teacherId === task.teacherId && l.day === day && getLessonAbsoluteSlot(l) === proposedSlot;
                });
                if (teacherBusy) continue;

                const roomBusy = proposedLesson.roomId && generatedLessons.some(l => {
                    return l.roomId === proposedLesson.roomId && l.day === day && getLessonAbsoluteSlot(l) === proposedSlot;
                });
                if (roomBusy) continue;

                generatedLessons.push({
                    id: uid(),
                    day: day,
                    period: period,
                    classId: task.classId,
                    subjectId: task.subjectId,
                    teacherId: task.teacherId,
                    roomId: proposedLesson.roomId
                });

                placed = true;
                placedCount++;
                break;
            }
        }

        if (!placed) {
            failedCount++;
        }
    });

    state.lessons = generatedLessons;
    saveState();
    renderSchedule();

    const resultDiv = document.getElementById('autogen-result-msg');
    if (failedCount === 0) {
        resultDiv.innerHTML = `<div class="alert alert-success"><i class="fa-solid fa-circle-check text-success"></i> Dushanba 1-soat "Kelajak soatlari" va barcha <strong>${placedCount}</strong> ta dars to'qnashuvlarsiz muvaffaqiyatli joylashtirildi!</div>`;
        showToast("Jadval to'liq shakllantirildi!");
    } else {
        resultDiv.innerHTML = `<div class="alert alert-warning"><i class="fa-solid fa-triangle-exclamation text-warning"></i> <strong>${placedCount}</strong> ta dars joylashtirildi, <strong>${failedCount}</strong> ta dars uchun bo'sh kunlar yoki soat cheklovlari tufayli joy yetmadi.</div>`;
        showToast(`${placedCount} ta dars taqsimlandi`, "warning");
    }
}

// ==========================================
// ==========================================
// 8. Real Excel (.xlsx) Export Handlers (Aynan Namunadagi Format)
// ==========================================
function buildSchoolTimetableSheet(classesList, titleText) {
    const data = [];
    const merges = [];
    const cols = [];

    // Col 0: Kun, Col 1: № (Soat)
    cols.push({ wch: 12 }); // Kun
    cols.push({ wch: 5 });  // №

    const totalCols = 2 + classesList.length * 2;

    // Top rows (Rasmdagi kabi sarlavha qatorlari)
    data.push(new Array(totalCols).fill(''));
    data.push(new Array(totalCols).fill(''));
    data.push(new Array(totalCols).fill(''));

    // Sarlavha (5-11-SINFLAR UCHUN DARS JADVALI)
    const titleRow = new Array(totalCols).fill('');
    titleRow[2] = titleText || "5-11-SINFLAR UCHUN DARS JADVALI";
    data.push(titleRow);
    merges.push({ s: { r: 3, c: 2 }, e: { r: 3, c: Math.min(totalCols - 1, 8) } });

    data.push(new Array(totalCols).fill(''));
    data.push(new Array(totalCols).fill(''));

    // Header Row (Sinf nomlari) - Rasmdagidek to'g'ridan-to'g'ri sinf nomlari bilan
    const headerRow = ["Kun", "№"];
    classesList.forEach((c, idx) => {
        const colStart = 2 + idx * 2;
        headerRow.push(c.name, "");
        merges.push({ s: { r: 6, c: colStart }, e: { r: 6, c: colStart + 1 } });

        cols.push({ wch: 20 }); // Fan va O'qituvchi ustuni
        cols.push({ wch: 6 });  // Xona ustuni
    });
    data.push(headerRow);

    // Data rows for Days (0: Dushanba to 5: Shanba)
    DAYS.forEach((dayName, dayIndex) => {
        // Kunlar orasidagi ajratuvchi qator (Rasmdagi kulrang ajratgich kabi)
        if (dayIndex > 0) {
            const sepRow = new Array(totalCols).fill('');
            data.push(sepRow);
        }

        const dayStartRow = data.length;
        const maxPeriods = 6;

        for (let p = 1; p <= maxPeriods; p++) {
            const row = [p === 1 ? dayName : "", p];

            classesList.forEach(c => {
                const match = state.lessons.find(l => l.day === dayIndex && l.classId === c.id && l.period === p);
                if (match) {
                    const s = state.subjects.find(sub => sub.id === match.subjectId);
                    const t = state.teachers.find(tch => tch.id === match.teacherId);
                    const r = state.rooms.find(rm => rm.id === match.roomId) || (c.roomId ? state.rooms.find(rm => rm.id === c.roomId) : null);

                    const subjName = (dayIndex === 0 && p === 1) ? "Kelajak soati" : (s ? s.name : '');
                    const teacherName = t ? t.name : '';
                    const roomName = r ? r.name : '';

                    row.push(`${subjName}\n${teacherName}`, roomName);
                } else {
                    row.push("", "");
                }
            });

            data.push(row);
        }

        const dayEndRow = data.length - 1;
        merges.push({ s: { r: dayStartRow, c: 0 }, e: { r: dayEndRow, c: 0 } });
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!merges'] = merges;
    ws['!cols'] = cols;
    return ws;
}

function exportToExcel() {
    if (typeof XLSX !== 'undefined') {
        const wb = XLSX.utils.book_new();

        // 1. Asosiy Jadval (Aynan rasmdagi html1 sahifasi kabi)
        const sortedClasses = [...state.classes].sort((a, b) => (a.shift - b.shift) || a.name.localeCompare(b.name, undefined, { numeric: true }));
        const wsMaster = buildSchoolTimetableSheet(sortedClasses, "5-11-SINFLAR UCHUN DARS JADVALI");
        XLSX.utils.book_append_sheet(wb, wsMaster, "html1");

        // 2. 1-Smena Jadvali
        const shift1Classes = sortedClasses.filter(c => c.shift === 1);
        if (shift1Classes.length > 0) {
            const wsShift1 = buildSchoolTimetableSheet(shift1Classes, "1-SMENA DARS JADVALI (08:00 – 13:10)");
            XLSX.utils.book_append_sheet(wb, wsShift1, "1-Smena");
        }

        // 3. 2-Smena Jadvali
        const shift2Classes = sortedClasses.filter(c => c.shift === 2);
        if (shift2Classes.length > 0) {
            const wsShift2 = buildSchoolTimetableSheet(shift2Classes, "2-SMENA DARS JADVALI (12:25 – 17:20)");
            XLSX.utils.book_append_sheet(wb, wsShift2, "2-Smena");
        }

        // 4. O'qituvchilar Jadvali va Bo'sh Kunlari
        const teachersScheduleData = [];
        teachersScheduleData.push(["O'QITUVCHILAR BO'YICHA DARS JADVALLARI VA BO'SH KUNLARI"]);
        teachersScheduleData.push([]);

        state.teachers.forEach(t => {
            const subjStr = getTeacherSubjectsDisplay(t);
            const offText = getOffDaysText(t.offDays);
            const supClass = state.classes.find(c => c.supervisorId === t.id);
            const supText = supClass ? ` | Sinf rahbari: ${supClass.name} sinf` : '';
            
            teachersScheduleData.push([`O'qituvchi: ${t.name}${supText}`, `Fanlari: ${subjStr}`, `Haftalik: ${t.weeklyHours || 30} soat`, `Bo'sh kunlari: ${offText}`]);
            
            const tHeader = ["Hafta kuni", "1-soat", "2-soat", "3-soat", "4-soat", "5-soat", "6-soat"];
            teachersScheduleData.push(tHeader);

            DAYS.forEach((day, dayIndex) => {
                if (t.offDays && t.offDays.includes(dayIndex)) {
                    teachersScheduleData.push([day, "BO'SH KUN (DAM OLISH)", "", "", "", "", ""]);
                } else {
                    const tRow = [day];
                    for (let p = 1; p <= 6; p++) {
                        const match = state.lessons.find(l => l.day === dayIndex && l.teacherId === t.id && l.period === p);
                        if (match) {
                            const c = state.classes.find(cls => cls.id === match.classId);
                            const s = state.subjects.find(sub => sub.id === match.subjectId);
                            tRow.push(`${s ? s.name : ''} (${c ? c.name : ''})`);
                        } else {
                            tRow.push("-");
                        }
                    }
                    teachersScheduleData.push(tRow);
                }
            });
            teachersScheduleData.push([]);
        });

        const wsTeachers = XLSX.utils.aoa_to_sheet(teachersScheduleData);
        XLSX.utils.book_append_sheet(wb, wsTeachers, "Oqituvchilar_Jadvali");

        // 5. Sinflar va Sinf Rahbarlari Ro'yxati
        const classesList = [
            ["Sinf Nomi", "Smena", "Sinf Rahbari (O'qituvchi)", "Dushanba 1-soat", "Doimiy Xona", "Haftalik Darslar Soni"]
        ];

        sortedClasses.forEach(c => {
            const supervisor = c.supervisorId ? state.teachers.find(t => t.id === c.supervisorId) : null;
            const room = state.rooms.find(r => r.id === c.roomId);
            const lessonCount = state.lessons.filter(l => l.classId === c.id).length;
            classesList.push([
                c.name,
                `${c.shift}-smena`,
                supervisor ? supervisor.name : 'Tayinlanmagan',
                supervisor ? `Kelajak soati (${supervisor.name})` : 'Kelajak soati',
                room ? room.name : '-',
                lessonCount
            ]);
        });

        const wsClassesList = XLSX.utils.aoa_to_sheet(classesList);
        XLSX.utils.book_append_sheet(wb, wsClassesList, "Sinflar_va_Rahbarlar");

        XLSX.writeFile(wb, `Maktab_Dars_Jadvali_${new Date().toISOString().slice(0, 10)}.xlsx`);
        showToast("Namunadagi formatda haqiqiy Excel fayli (.xlsx) yuklab olindi!");
    } else {
        alert("Excel kutubxonasi yuklanmoqda...");
    }
}

function downloadJsonBackup() {
    if (authState.role !== 'admin') return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `dars_jadvali_zaxira_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
    showToast("Zaxira nusxasi yuklab olindi");
}

function restoreFromJson(e) {
    if (authState.role !== 'admin') return;
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const imported = JSON.parse(event.target.result);
            if (imported.classes && imported.teachers && imported.lessons) {
                state = imported;
                ensureKelajakSubject();
                normalizeTeacherSubjects();
                syncKelajakSoatiLessons();
                saveState();
                initApp();
                closeModal('modal-backup');
                showToast("Ma'lumotlar muvaffaqiyatli tiklandi!");
            } else {
                alert("Fayl formati noto'g'ri!");
            }
        } catch (err) {
            alert("JSON faylni o'qishda xatolik yuz berdi!");
        }
    };
    reader.readAsText(file);
}

// ==========================================
// 9. Event Listeners Setup
// ==========================================
function setupEventListeners() {
    document.querySelectorAll('.nav-menu .nav-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.nav-menu .nav-item').forEach(n => n.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

            item.classList.add('active');
            const tabId = item.dataset.tab;
            const targetPane = document.getElementById(`tab-${tabId}`);
            if (targetPane) targetPane.classList.add('active');

            const titles = {
                schedule: "Dars Jadvali",
                teachers: "O'qituvchilar",
                classes: "Sinflar",
                subjects: "Fanlar",
                rooms: "Xonalar",
                curriculum: "Dars Yuklamasi",
                autogen: "2 Smenali Avto-Jadval"
            };
            document.getElementById('page-title').textContent = titles[tabId] || "Dars Jadvali";

            if (tabId === 'teachers') renderTeachers();
            if (tabId === 'classes') renderClasses();
            if (tabId === 'subjects') renderSubjects();
            if (tabId === 'rooms') renderRooms();
            if (tabId === 'curriculum') renderCurriculum();
        });
    });

    document.getElementById('theme-toggle').addEventListener('click', () => {
        setTheme(state.theme === 'dark' ? 'light' : 'dark');
    });

    // Cloud Sync Modal buttons
    document.getElementById('btn-cloud-sync').addEventListener('click', () => {
        if (authState.role !== 'admin') return;
        document.getElementById('input-school-cloud-key').value = state.schoolKey || '48-maktab';
        document.getElementById('cloud-sync-status-msg').innerHTML = '';
        openModal('modal-cloud-sync');
    });

    document.getElementById('btn-force-cloud-push').addEventListener('click', async () => {
        const key = document.getElementById('input-school-cloud-key').value.trim() || '48-maktab';
        state.schoolKey = key;
        saveState();
        document.getElementById('cloud-sync-status-msg').innerHTML = `<div class="alert alert-success"><i class="fa-solid fa-circle-check text-success"></i> Ma'lumotlar bulutga saqlandi! Barcha yangi kirgan foydalanuvchilar eng so'nggi jadvalni ko'radi.</div>`;
        showToast("Barcha ma'lumotlar bulutga saqlandi!");
    });

    document.getElementById('btn-force-cloud-pull').addEventListener('click', async () => {
        document.getElementById('cloud-sync-status-msg').innerHTML = `<div class="alert alert-info"><i class="fa-solid fa-rotate fa-spin"></i> Bulutdan yuklanmoqda...</div>`;
        const success = await fetchOnlineScheduleData(false);
        if (success) {
            document.getElementById('cloud-sync-status-msg').innerHTML = `<div class="alert alert-success"><i class="fa-solid fa-circle-check text-success"></i> Bulutdagi eng so'nggi jadval muvaffaqiyatli yuklandi!</div>`;
            showToast("Bulutdan yangilandi!");
        } else {
            document.getElementById('cloud-sync-status-msg').innerHTML = `<div class="alert alert-warning"><i class="fa-solid fa-triangle-exclamation"></i> Serverdan yangi ma'lumot topilmadi yoki mahalliy rejimdasiz.</div>`;
        }
    });

    document.getElementById('btn-export-backup').addEventListener('click', () => {
        if (authState.role === 'admin') openModal('modal-backup');
    });
    document.getElementById('btn-download-json').addEventListener('click', downloadJsonBackup);
    document.getElementById('input-restore-json').addEventListener('change', restoreFromJson);
    document.getElementById('btn-load-samples').addEventListener('click', () => {
        if (authState.role !== 'admin') return;
        if (confirm("Namunaviy ma'lumotlar yuklansinmi?")) {
            state = JSON.parse(JSON.stringify(SAMPLE_DATA));
            ensureKelajakSubject();
            normalizeTeacherSubjects();
            syncKelajakSoatiLessons();
            saveState();
            initApp();
            closeModal('modal-backup');
            showToast("Namunaviy ma'lumotlar yuklandi");
        }
    });
    document.getElementById('btn-clear-all').addEventListener('click', () => {
        if (authState.role !== 'admin') return;
        if (confirm("Haqiqatdan ham barcha ma'lumotlarni tozalashni xohlaysizmi?")) {
            state = {
                teachers: [],
                classes: [],
                subjects: [],
                rooms: [],
                curriculum: [],
                lessons: [],
                currentView: 'class',
                selectedFilterId: null,
                selectedShift: '1',
                theme: state.theme,
                schoolKey: state.schoolKey || '48-maktab'
            };
            ensureKelajakSubject();
            saveState();
            initApp();
            closeModal('modal-backup');
            showToast("Barcha ma'lumotlar tozalandi", "warning");
        }
    });

    document.getElementById('form-login').addEventListener('submit', async (e) => {
        e.preventDefault();
        const u = document.getElementById('login-username').value.trim();
        const p = document.getElementById('login-password').value;

        // 1. Check local state
        let isMatch = (u === authState.adminUsername && p === authState.adminPassword);

        // 2. If not matched, try fetching latest cloud auth
        if (!isMatch && window.location.protocol.startsWith('http')) {
            await fetchOnlineScheduleData(true);
            isMatch = (u === authState.adminUsername && p === authState.adminPassword);
        }

        if (isMatch) {
            authState.role = 'admin';
            saveAuth();
            updateAuthUI();
            refreshAllViews();
            closeModal('modal-login');
            showToast("Administrator sifatida muvaffaqiyatli kirdingiz!");
        } else {
            const errAlert = document.getElementById('login-error-alert');
            errAlert.classList.remove('hidden');
            document.getElementById('login-error-text').textContent = "Login yoki parol noto'g'ri!";
        }
    });

    document.getElementById('form-change-password').addEventListener('submit', async (e) => {
        e.preventDefault();
        const userInp = document.getElementById('change-admin-username');
        const newU = userInp ? userInp.value.trim() : (authState.adminUsername || 'admin');
        const oldP = document.getElementById('old-password').value;
        const newP = document.getElementById('new-password').value;
        const confirmInp = document.getElementById('confirm-new-password');
        const confirmP = confirmInp ? confirmInp.value : newP;

        const errBox = document.getElementById('change-pass-error');
        const errText = document.getElementById('change-pass-error-text');

        if (oldP !== authState.adminPassword) {
            if (errBox && errText) {
                errBox.classList.remove('hidden');
                errText.textContent = "Amaldagi eski parol noto'g'ri!";
            } else {
                alert("Amaldagi eski parol noto'g'ri!");
            }
            return;
        }

        if (newP.length < 3) {
            if (errBox && errText) {
                errBox.classList.remove('hidden');
                errText.textContent = "Yangi parol kamida 3 ta belgidan iborat bo'lishi kerak!";
            } else {
                alert("Yangi parol kamida 3 ta belgidan iborat bo'lishi kerak!");
            }
            return;
        }

        if (newP !== confirmP) {
            if (errBox && errText) {
                errBox.classList.remove('hidden');
                errText.textContent = "Yangi parol va tasdiqlash paroli bir-biriga mos kelmadi!";
            } else {
                alert("Yangi parol va tasdiqlash paroli bir-biriga mos kelmadi!");
            }
            return;
        }

        if (errBox) errBox.classList.add('hidden');

        authState.adminUsername = newU;
        authState.adminPassword = newP;
        saveAuth();

        // Direct API call to backend if available
        if (window.location.protocol.startsWith('http')) {
            try {
                await fetch('/api/change-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ oldPassword: oldP, newPassword: newP, newUsername: newU })
                });
            } catch (err) {}
        }

        closeModal('modal-change-password');
        showToast("Login va yangi parol bulutda muvaffaqiyatli saqlandi!");
    });

    document.querySelectorAll('.btn-view').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.btn-view').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            state.currentView = btn.dataset.view;

            document.getElementById('filter-class-box').classList.toggle('hidden', state.currentView !== 'class');
            document.getElementById('filter-teacher-box').classList.toggle('hidden', state.currentView !== 'teacher');
            document.getElementById('filter-room-box').classList.toggle('hidden', state.currentView !== 'room');

            if (state.currentView === 'class' && state.classes[0]) state.selectedFilterId = state.classes[0].id;
            if (state.currentView === 'teacher' && state.teachers[0]) state.selectedFilterId = state.teachers[0].id;
            if (state.currentView === 'room' && state.rooms[0]) state.selectedFilterId = state.rooms[0].id;

            populateFilters();
            renderSchedule();
        });
    });

    document.querySelectorAll('.btn-shift').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.btn-shift').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.selectedShift = btn.dataset.shift;
            renderSchedule();
        });
    });

    document.getElementById('select-class-filter').addEventListener('change', (e) => {
        state.selectedFilterId = e.target.value;
        const cls = state.classes.find(c => c.id === state.selectedFilterId);
        if (cls) {
            state.selectedShift = String(cls.shift);
            document.querySelectorAll('.btn-shift').forEach(b => {
                b.classList.toggle('active', b.dataset.shift === state.selectedShift);
            });
        }
        renderSchedule();
    });
    document.getElementById('select-teacher-filter').addEventListener('change', (e) => {
        state.selectedFilterId = e.target.value;
        renderSchedule();
    });
    document.getElementById('select-room-filter').addEventListener('change', (e) => {
        state.selectedFilterId = e.target.value;
        renderSchedule();
    });

    document.getElementById('curriculum-class-select').addEventListener('change', () => {
        renderCurriculum();
    });

    document.getElementById('search-teachers').addEventListener('input', (e) => renderTeachers(e.target.value));
    document.getElementById('search-classes').addEventListener('input', (e) => renderClasses(e.target.value));
    document.getElementById('search-subjects').addEventListener('input', (e) => renderSubjects(e.target.value));
    document.getElementById('search-rooms').addEventListener('input', (e) => renderRooms(e.target.value));

    document.getElementById('btn-print-schedule').addEventListener('click', () => window.print());
    document.getElementById('btn-export-excel').addEventListener('click', exportToExcel);

    document.getElementById('btn-quick-add').addEventListener('click', () => openAddLessonModal());
    
    document.getElementById('btn-add-teacher').addEventListener('click', () => {
        if (authState.role !== 'admin') return;
        document.getElementById('form-teacher').reset();
        document.getElementById('teacher-id').value = '';
        populateTeacherFormOptions();
        document.getElementById('modal-teacher-title').textContent = "Yangi o'qituvchi qo'shish";
        openModal('modal-teacher');
    });

    document.getElementById('btn-add-teacher-subject-field').addEventListener('click', () => {
        addTeacherSubjectRow('', false);
    });

    document.getElementById('btn-add-class').addEventListener('click', () => {
        if (authState.role !== 'admin') return;
        document.getElementById('form-class').reset();
        document.getElementById('class-id').value = '';
        populateClassModalOptions();
        document.getElementById('modal-class-title').textContent = "Yangi sinf qo'shish va Rahbar tayinlash";
        openModal('modal-class');
    });

    document.getElementById('btn-quick-assign-supervisors').addEventListener('click', openBulkSupervisorsModal);
    document.getElementById('btn-save-bulk-supervisors').addEventListener('click', saveBulkSupervisors);

    document.getElementById('btn-add-subject').addEventListener('click', () => {
        if (authState.role !== 'admin') return;
        document.getElementById('form-subject').reset();
        document.getElementById('subject-id').value = '';
        document.getElementById('modal-subject-title').textContent = "Yangi fan qo'shish";
        openModal('modal-subject');
    });
    document.getElementById('btn-add-room').addEventListener('click', () => {
        if (authState.role !== 'admin') return;
        document.getElementById('form-room').reset();
        document.getElementById('room-id').value = '';
        document.getElementById('modal-room-title').textContent = "Yangi xona qo'shish";
        openModal('modal-room');
    });
    document.getElementById('btn-add-curriculum-item').addEventListener('click', () => {
        if (authState.role !== 'admin') return;
        document.getElementById('form-curriculum').reset();
        document.getElementById('curr-class').innerHTML = state.classes.map(c => `<option value="${c.id}">${c.name} (${c.shift}-smena)</option>`).join('');
        document.getElementById('curr-subject').innerHTML = state.subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
        document.getElementById('curr-teacher').innerHTML = state.teachers.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
        document.getElementById('curr-room').innerHTML = `<option value="">Tanlanmagan</option>` + state.rooms.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
        
        const curClass = document.getElementById('curriculum-class-select').value;
        if (curClass) document.getElementById('curr-class').value = curClass;

        openModal('modal-curriculum');
    });

    document.getElementById('btn-run-autogen').addEventListener('click', runAutoScheduler);

    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) modal.classList.remove('active');
        });
    });

    document.getElementById('lesson-class').addEventListener('change', (e) => {
        updateLessonPeriodOptions(e.target.value);
    });

    document.getElementById('form-lesson').addEventListener('submit', (e) => {
        e.preventDefault();
        if (authState.role !== 'admin') return;
        const id = document.getElementById('lesson-id').value || uid();
        const newLesson = {
            id: id,
            day: parseInt(document.getElementById('lesson-day').value),
            period: parseInt(document.getElementById('lesson-period').value),
            classId: document.getElementById('lesson-class').value,
            subjectId: document.getElementById('lesson-subject').value,
            teacherId: document.getElementById('lesson-teacher').value,
            roomId: document.getElementById('lesson-room').value
        };

        const existingIdx = state.lessons.findIndex(l => l.id === id);
        if (existingIdx >= 0) {
            state.lessons[existingIdx] = newLesson;
        } else {
            state.lessons.push(newLesson);
        }

        saveState();
        renderSchedule();
        closeModal('modal-lesson');
        showToast("Dars jadvalga kiritildi va bulutga yangilandi");
    });

    document.getElementById('btn-delete-lesson').addEventListener('click', () => {
        if (authState.role !== 'admin') return;
        const id = document.getElementById('lesson-id').value;
        if (id) {
            state.lessons = state.lessons.filter(l => l.id !== id);
            saveState();
            renderSchedule();
            closeModal('modal-lesson');
            showToast("Dars jadvaldan o'chirildi va bulutga yangilandi");
        }
    });

    // Teacher Form Submit
    document.getElementById('form-teacher').addEventListener('submit', (e) => {
        e.preventDefault();
        if (authState.role !== 'admin') return;
        const id = document.getElementById('teacher-id').value || uid();
        
        const selectedSubjects = [];
        document.querySelectorAll('.teacher-subject-select').forEach(sel => {
            if (sel.value && !selectedSubjects.includes(sel.value)) {
                selectedSubjects.push(sel.value);
            }
        });

        if (selectedSubjects.length === 0) {
            alert("Kamida 1 ta fan tanlashingiz kerak!");
            return;
        }

        const selectedOffDays = [];
        document.querySelectorAll('input[name="teacher-off-day"]:checked').forEach(cb => {
            selectedOffDays.push(parseInt(cb.value));
        });

        const selectedAssignedClasses = [];
        document.querySelectorAll('input[name="teacher-assigned-class"]:checked').forEach(cb => {
            selectedAssignedClasses.push(cb.value);
        });

        const teacherData = {
            id: id,
            name: document.getElementById('teacher-name').value,
            subjectIds: selectedSubjects,
            weeklyHours: parseInt(document.getElementById('teacher-weekly-hours').value) || 30,
            phone: document.getElementById('teacher-phone').value,
            color: document.getElementById('teacher-color').value,
            offDays: selectedOffDays,
            assignedClasses: selectedAssignedClasses
        };

        const idx = state.teachers.findIndex(t => t.id === id);
        if (idx >= 0) state.teachers[idx] = teacherData;
        else state.teachers.push(teacherData);

        if (selectedAssignedClasses.length > 0) {
            const totalTasks = selectedAssignedClasses.length * selectedSubjects.length;
            const hoursPerItem = Math.max(1, Math.floor(teacherData.weeklyHours / totalTasks));
            selectedAssignedClasses.forEach(classId => {
                selectedSubjects.forEach(sId => {
                    const existing = state.curriculum.find(cu => cu.classId === classId && cu.subjectId === sId);
                    if (existing) {
                        existing.teacherId = id;
                        existing.hours = hoursPerItem;
                    } else {
                        state.curriculum.push({
                            id: uid(),
                            classId: classId,
                            subjectId: sId,
                            teacherId: id,
                            roomId: (state.classes.find(c => c.id === classId) || {}).roomId || '',
                            hours: hoursPerItem
                        });
                    }
                });
            });
        }

        saveState();
        refreshAllViews();
        closeModal('modal-teacher');
        showToast("O'qituvchi va fanlari saqlandi (Barcha qurilmalarda yangilandi)");
    });

    // Class Form Submit
    document.getElementById('form-class').addEventListener('submit', (e) => {
        e.preventDefault();
        if (authState.role !== 'admin') return;
        const id = document.getElementById('class-id').value || uid();
        const classData = {
            id: id,
            name: document.getElementById('class-name').value,
            supervisorId: document.getElementById('class-supervisor').value || '',
            shift: parseInt(document.getElementById('class-shift').value),
            roomId: document.getElementById('class-room').value
        };

        const idx = state.classes.findIndex(c => c.id === id);
        if (idx >= 0) state.classes[idx] = classData;
        else state.classes.push(classData);

        if (!state.selectedFilterId) state.selectedFilterId = id;

        syncKelajakSoatiLessons();
        saveState();
        refreshAllViews();
        closeModal('modal-class');
        showToast("Sinf, uning rahbari va 'Kelajak soati' saqlandi va bulutga yangilandi");
    });

    // Subject Form
    document.getElementById('form-subject').addEventListener('submit', (e) => {
        e.preventDefault();
        if (authState.role !== 'admin') return;
        const id = document.getElementById('subject-id').value || uid();
        const subjectData = {
            id: id,
            name: document.getElementById('subject-name').value,
            code: document.getElementById('subject-code').value,
            color: document.getElementById('subject-color').value
        };

        const idx = state.subjects.findIndex(s => s.id === id);
        if (idx >= 0) state.subjects[idx] = subjectData;
        else state.subjects.push(subjectData);

        saveState();
        renderSubjects();
        renderSchedule();
        closeModal('modal-subject');
        showToast("Fan saqlandi");
    });

    // Room Form
    document.getElementById('form-room').addEventListener('submit', (e) => {
        e.preventDefault();
        if (authState.role !== 'admin') return;
        const id = document.getElementById('room-id').value || uid();
        const roomData = {
            id: id,
            name: document.getElementById('room-name').value,
            capacity: parseInt(document.getElementById('room-capacity').value) || 30
        };

        const idx = state.rooms.findIndex(r => r.id === id);
        if (idx >= 0) state.rooms[idx] = roomData;
        else state.rooms.push(roomData);

        saveState();
        renderRooms();
        populateFilters();
        renderSchedule();
        closeModal('modal-room');
        showToast("Xona saqlandi");
    });

    // Curriculum Form
    document.getElementById('form-curriculum').addEventListener('submit', (e) => {
        e.preventDefault();
        if (authState.role !== 'admin') return;
        const classId = document.getElementById('curr-class').value;
        const subjectId = document.getElementById('curr-subject').value;
        const teacherId = document.getElementById('curr-teacher').value;
        const roomId = document.getElementById('curr-room').value;
        const hours = parseInt(document.getElementById('curr-hours').value) || 1;

        const existing = state.curriculum.find(cu => cu.classId === classId && cu.subjectId === subjectId);
        if (existing) {
            existing.teacherId = teacherId;
            existing.roomId = roomId;
            existing.hours = hours;
        } else {
            state.curriculum.push({
                id: uid(),
                classId: classId,
                subjectId: subjectId,
                teacherId: teacherId,
                roomId: roomId,
                hours: hours
            });
        }

        saveState();
        document.getElementById('curriculum-class-select').value = classId;
        renderCurriculum();
        closeModal('modal-curriculum');
        showToast("Dars yuklamasi saqlandi");
    });
}

function refreshAllViews() {
    populateFilters();
    renderSchedule();
    renderTeachers();
    renderClasses();
    renderSubjects();
    renderRooms();
    renderCurriculum();
    updateBadges();
    checkAllConflicts();
}

// ==========================================
// 10. Initialization & Real-Time Background Sync
// ==========================================
function initApp() {
    loadState();
    setupEventListeners();
    updateAuthUI();
    refreshAllViews();

    // 1. Regular Heartbeat for Online Users Counter (every 15 sec)
    setInterval(() => {
        pingPresence();
    }, 15000);

    // 2. Regular background sync for viewers (every 25 sec)
    setInterval(() => {
        if (authState.role === 'user') {
            fetchOnlineScheduleData(true);
        }
    }, 25000);
}

document.addEventListener('DOMContentLoaded', initApp);
