// Firebase конфигурация
const firebaseConfig = {
    apiKey: "AIzaSyBlZ5ZtyTXgtXxSJAx1jOxwhTrzlHRJmo",
    authDomain: "bk-cashier.firebaseapp.com",
    databaseURL: "https://bk-cashier-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "bk-cashier",
    storageBucket: "bk-cashier.firebasestorage.app",
    messagingSenderId: "385000840969",
    appId: "1:385000840969:web:1ec8d09176b6551dc0fdd8"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Вспомогательные функции
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

// Слушатели
function listenData(path, callback) {
    const ref = db.ref(path);
    ref.on('value', snap => callback(snap.val()));
    return ref;
}

function unlisten(ref) {
    if (ref) ref.off();
}
