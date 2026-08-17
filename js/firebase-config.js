// ===== FIREBASE КОНФИГУРАЦИЯ =====
const firebaseConfig = {
    apiKey: "AIzaSyBlZ5ZtyTXgtXxSJAx1jOxwhTrzlHRJmo",
    authDomain: "bk-cashier.firebaseapp.com",
    databaseURL: "https://bk-cashier-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "bk-cashier",
    storageBucket: "bk-cashier.firebasestorage.app",
    messagingSenderId: "385000840969",
    appId: "1:385000840969:web:1ec8d09176b6551dc0fdd8"
};

// Инициализация Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Функции для работы с Firebase
function getData(path) {
    return new Promise((resolve, reject) => {
        db.ref(path).once('value', snap => resolve(snap.val()), reject);
    });
}

function setData(path, data) {
    return db.ref(path).set(data);
}

function pushData(path, data) {
    return db.ref(path).push(data);
}

function updateData(path, data) {
    return db.ref(path).update(data);
}

function removeData(path) {
    return db.ref(path).remove();
}

function listenData(path, callback) {
    const ref = db.ref(path);
    ref.on('value', snap => callback(snap.val()));
    return ref;
}

function unlisten(ref) {
    if (ref) ref.off();
}

function orderByChild(path, child) {
    return db.ref(path).orderByChild(child);
}

function showToast(msg, isError = false) {
    const toast = document.getElementById('toast');
    if (!toast) {
        const div = document.createElement('div');
        div.id = 'toast';
        div.className = 'success-toast';
        div.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#1d6f2c;color:white;padding:12px 24px;border-radius:40px;z-index:9999;animation:slideFade 3s ease forwards;max-width:90%;';
        document.body.appendChild(div);
        setTimeout(() => {
            const t = document.getElementById('toast');
            if (t) t.style.display = 'none';
        }, 3000);
    }
    const toastEl = document.getElementById('toast');
    toastEl.textContent = msg;
    toastEl.style.display = 'block';
    toastEl.style.background = isError ? '#b33a34' : '#1d6f2c';
    toastEl.style.animation = 'none';
    setTimeout(() => {
        toastEl.style.animation = 'slideFade 3s ease forwards';
    }, 10);
}

// Добавляем стили для тоста
const style = document.createElement('style');
style.textContent = `
    @keyframes slideFade {
        0% { opacity: 0; transform: translateY(20px); }
        15% { opacity: 1; transform: translateY(0); }
        85% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(20px); visibility: hidden; }
    }
`;
document.head.appendChild(style);
