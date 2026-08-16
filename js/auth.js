// ===== АВТОРИЗАЦИЯ =====

function adminLogin() {
    const login = document.getElementById('adminLoginInput').value;
    const password = document.getElementById('adminPasswordInput').value;
    
    if (login === '2347' && password === '2203') {
        const user = { role: 'admin', fullName: 'Администратор', login: '2347' };
        localStorage.setItem('shop_user', JSON.stringify(user));
        window.location.href = 'admin.html';
    } else {
        showToast('❌ Неверный логин или пароль', true);
    }
}

function cashierLogin() {
    const storeId = document.getElementById('cashierStoreSelect').value;
    const login = document.getElementById('cashierLoginInput').value.trim();
    const password = document.getElementById('cashierPasswordInput').value.trim();
    
    if (!storeId) {
        showToast('❌ Выберите магазин', true);
        return;
    }
    if (!login) {
        showToast('❌ Введите логин кассира', true);
        return;
    }
    if (!password) {
        showToast('❌ Введите пароль', true);
        return;
    }
    
    db.ref('stores/' + storeId + '/cashiers').orderByChild('login').equalTo(login).once('value', snap => {
        const cashiers = snap.val();
        let found = null;
        let foundKey = null;
        for (let key in cashiers) {
            const c = cashiers[key];
            if (c.login === login && c.password === password) {
                found = c;
                foundKey = key;
                break;
            }
        }
        
        if (found) {
            db.ref('stores/' + storeId).once('value', snap2 => {
                const store = snap2.val();
                const user = { 
                    ...found, 
                    id: foundKey,
                    role: 'cashier', 
                    storeId: storeId,
                    storeName: store ? store.name : 'Неизвестный магазин'
                };
                localStorage.setItem('shop_user', JSON.stringify(user));
                window.location.href = 'cashier.html';
            });
        } else {
            showToast('❌ Неверный логин или пароль', true);
        }
    });
}

function clientLogin() {
    const storeId = document.getElementById('clientStoreSelect').value;
    let phone = document.getElementById('clientPhoneInput').value.trim();
    
    if (!storeId) {
        showToast('❌ Выберите магазин', true);
        return;
    }
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
            db.ref('stores/' + storeId).once('value', snap2 => {
                const store = snap2.val();
                const user = { 
                    ...found, 
                    id: foundKey,
                    role: 'client', 
                    storeId: storeId,
                    storeName: store ? store.name : 'Неизвестный магазин'
                };
                localStorage.setItem('shop_user', JSON.stringify(user));
                window.location.href = 'client.html';
            });
        } else {
            showToast('❌ Клиент с таким номером не найден', true);
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
            localStorage.setItem('shop_user', JSON.stringify(user));
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
            localStorage.setItem('shop_user', JSON.stringify(user));
            window.location.href = 'support.html';
        } else {
            showToast('❌ Неверный логин или пароль', true);
        }
    });
}

function logout() {
    localStorage.removeItem('shop_user');
    window.location.href = 'index.html';
}

function checkAuth() {
    const saved = localStorage.getItem('shop_user');
    if (!saved) {
        window.location.href = 'index.html';
        return null;
    }
    try {
        return JSON.parse(saved);
    } catch(e) {
        localStorage.removeItem('shop_user');
        window.location.href = 'index.html';
        return null;
    }
}

function getCurrentUser() {
    const saved = localStorage.getItem('shop_user');
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
