// ===== АВТОРИЗАЦИЯ =====

function adminLogin() {
    const login = document.getElementById('adminLoginInput').value;
    const password = document.getElementById('adminPasswordInput').value;
    
    if (login === '2347' && password === '2203') {
        const user = { role: 'admin', fullName: 'Администратор', login: '2347' };
        localStorage.setItem('gusc_user', JSON.stringify(user));
        window.location.href = 'admin.html';
    } else {
        showToast('❌ Неверный логин или пароль админа', true);
    }
}

function cashierLogin() {
    const login = document.getElementById('cashierLoginInput').value.trim();
    const password = document.getElementById('cashierPasswordInput').value.trim();
    
    if (!login || !password) {
        showToast('❌ Введите логин и пароль', true);
        return;
    }
    
    db.ref('cashiers').once('value', snap => {
        const cashiers = snap.val();
        let found = null;
        for (let key in cashiers) {
            if (cashiers[key].login === login && cashiers[key].password === password) {
                found = { id: key, ...cashiers[key] };
                break;
            }
        }
        if (found) {
            const user = { ...found, role: 'cashier' };
            localStorage.setItem('gusc_user', JSON.stringify(user));
            window.location.href = 'cashier.html';
        } else {
            showToast('❌ Неверный логин или пароль кассира', true);
        }
    });
}

function clientLogin() {
    const phone = document.getElementById('clientPhoneInput').value.trim();
    if (!phone) {
        showToast('❌ Введите номер телефона', true);
        return;
    }
    
    db.ref('clients').orderByChild('phone').equalTo(phone).once('value', snap => {
        const clients = snap.val();
        let found = null;
        for (let key in clients) {
            found = { id: key, ...clients[key] };
            break;
        }
        if (found) {
            const user = { ...found, role: 'client' };
            localStorage.setItem('gusc_user', JSON.stringify(user));
            window.location.href = 'client.html';
        } else {
            showToast('❌ Клиент с таким номером не найден', true);
        }
    });
}

function logout() {
    localStorage.removeItem('gusc_user');
    window.location.href = 'index.html';
}

// Проверка авторизации
function checkAuth() {
    const saved = localStorage.getItem('gusc_user');
    if (!saved) {
        window.location.href = 'index.html';
        return null;
    }
    try {
        return JSON.parse(saved);
    } catch(e) {
        localStorage.removeItem('gusc_user');
        window.location.href = 'index.html';
        return null;
    }
}

// Получить текущего пользователя
function getCurrentUser() {
    const saved = localStorage.getItem('gusc_user');
    return saved ? JSON.parse(saved) : null;
}

// Показать toast
function showToast(msg, isError = false) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.style.display = 'block';
    toast.style.background = isError ? '#b33a34' : '#1d6f2c';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.style.display = 'none', 3000);
}
