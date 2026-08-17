// ===== АВТОРИЗАЦИЯ =====

function adminLogin() {
    const login = document.getElementById('adminLoginInput').value;
    const password = document.getElementById('adminPasswordInput').value;
    
    if (login === '2347' && password === '2203') {
        const user = { role: 'admin', fullName: 'Администратор', login: '2347' };
        localStorage.setItem('marka_user', JSON.stringify(user));
        window.location.href = 'admin.html';
    } else {
        showToast('❌ Неверный логин или пароль', true);
    }
}

function sellerLogin() {
    const login = document.getElementById('sellerLoginInput').value.trim();
    const password = document.getElementById('sellerPasswordInput').value.trim();
    
    if (!login || !password) {
        showToast('❌ Введите логин и пароль', true);
        return;
    }
    
    db.ref('sellers').orderByChild('login').equalTo(login).once('value', snap => {
        const sellers = snap.val();
        let found = null;
        for (let key in sellers) {
            const s = sellers[key];
            if (s.login === login && s.password === password) {
                found = { id: key, ...s };
                break;
            }
        }
        
        if (found) {
            const user = { ...found, role: 'seller' };
            localStorage.setItem('marka_user', JSON.stringify(user));
            window.location.href = 'seller.html';
        } else {
            showToast('❌ Неверный логин или пароль', true);
        }
    });
}

function employeeLogin() {
    const login = document.getElementById('employeeLoginInput').value.trim();
    const password = document.getElementById('employeePasswordInput').value.trim();
    
    if (!login || !password) {
        showToast('❌ Введите логин и пароль', true);
        return;
    }
    
    db.ref('employees').orderByChild('login').equalTo(login).once('value', snap => {
        const employees = snap.val();
        let found = null;
        for (let key in employees) {
            const e = employees[key];
            if (e.login === login && e.password === password) {
                found = { id: key, ...e };
                break;
            }
        }
        
        if (found) {
            const user = { ...found, role: 'employee' };
            localStorage.setItem('marka_user', JSON.stringify(user));
            window.location.href = 'employee.html';
        } else {
            showToast('❌ Неверный логин или пароль', true);
        }
    });
}

function clientLogin() {
    const phone = document.getElementById('clientPhoneInput').value.trim();
    
    if (!phone || phone === '+7') {
        showToast('❌ Введите номер телефона', true);
        return;
    }
    
    let cleanPhone = phone.replace(/^\+7/, '').replace(/\D/g, '');
    if (cleanPhone.length < 10) {
        showToast('❌ Введите корректный номер телефона (10 цифр)', true);
        return;
    }
    
    const fullPhone = '+7' + cleanPhone;
    
    db.ref('clients').orderByChild('phone').equalTo(fullPhone).once('value', snap => {
        const clients = snap.val();
        let found = null;
        let foundKey = null;
        
        for (let key in clients) {
            const c = clients[key];
            if (c.phone === fullPhone) {
                found = c;
                foundKey = key;
                break;
            }
        }
        
        if (found) {
            const user = { ...found, id: foundKey, role: 'client' };
            localStorage.setItem('marka_user', JSON.stringify(user));
            window.location.href = 'client.html';
        } else {
            // Автоматическое создание клиента
            const cardNumber = '29' + Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
            const newClient = {
                fullName: 'Клиент',
                phone: fullPhone,
                cardNumber: cardNumber,
                balance: 0,
                history: [],
                createdAt: new Date().toISOString()
            };
            
            db.ref('clients').push(newClient).then(ref => {
                const user = { ...newClient, id: ref.key, role: 'client' };
                localStorage.setItem('marka_user', JSON.stringify(user));
                window.location.href = 'client.html';
            }).catch(err => showToast('❌ Ошибка создания клиента', true));
        }
    });
}

function courierLogin() {
    const login = document.getElementById('courierLoginInput').value.trim();
    const password = document.getElementById('courierPasswordInput').value.trim();
    
    if (!login || !password) {
        showToast('❌ Введите логин и пароль', true);
        return;
    }
    
    db.ref('couriers').orderByChild('login').equalTo(login).once('value', snap => {
        const couriers = snap.val();
        let found = null;
        for (let key in couriers) {
            const c = couriers[key];
            if (c.login === login && c.password === password) {
                found = { id: key, ...c };
                break;
            }
        }
        
        if (found) {
            const user = { ...found, role: 'courier' };
            localStorage.setItem('marka_user', JSON.stringify(user));
            window.location.href = 'courier.html';
        } else {
            showToast('❌ Неверный логин или пароль', true);
        }
    });
}

function supportLogin() {
    const login = document.getElementById('supportLoginInput').value.trim();
    const password = document.getElementById('supportPasswordInput').value.trim();
    
    if (!login || !password) {
        showToast('❌ Введите логин и пароль', true);
        return;
    }
    
    db.ref('support').orderByChild('login').equalTo(login).once('value', snap => {
        const support = snap.val();
        let found = null;
        for (let key in support) {
            const s = support[key];
            if (s.login === login && s.password === password) {
                found = { id: key, ...s };
                break;
            }
        }
        
        if (found) {
            const user = { ...found, role: 'support' };
            localStorage.setItem('marka_user', JSON.stringify(user));
            window.location.href = 'support.html';
        } else {
            showToast('❌ Неверный логин или пароль', true);
        }
    });
}

function logout() {
    localStorage.removeItem('marka_user');
    window.location.href = 'index.html';
}

function checkAuth() {
    const saved = localStorage.getItem('marka_user');
    if (!saved) {
        window.location.href = 'index.html';
        return null;
    }
    try {
        return JSON.parse(saved);
    } catch(e) {
        localStorage.removeItem('marka_user');
        window.location.href = 'index.html';
        return null;
    }
}

function getCurrentUser() {
    const saved = localStorage.getItem('marka_user');
    return saved ? JSON.parse(saved) : null;
}

function showToast(msg, isError = false) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.style.display = 'block';
    toast.style.background = isError ? '#b33a34' : '#1d6f2c';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.style.display = 'none', 3000);
}
