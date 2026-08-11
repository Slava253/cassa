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
    const cardNumber = document.getElementById('cashierCardInput').value.trim();
    const password = document.getElementById('cashierPasswordInput').value.trim();
    
    if (!storeId) {
        showToast('❌ Выберите магазин', true);
        return;
    }
    if (!cardNumber) {
        showToast('❌ Введите номер карты кассира', true);
        return;
    }
    if (!password) {
        showToast('❌ Введите пароль', true);
        return;
    }
    
    // Ищем кассира по номеру карты и паролю в выбранном магазине
    db.ref('stores/' + storeId + '/cashiers').orderByChild('cardNumber').equalTo(cardNumber).once('value', snap => {
        const cashiers = snap.val();
        let found = null;
        let foundKey = null;
        for (let key in cashiers) {
            const c = cashiers[key];
            if (c.cardNumber === cardNumber && c.password === password) {
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
            showToast('❌ Неверный номер карты или пароль', true);
        }
    }).catch(err => {
        console.error('Ошибка входа кассира:', err);
        showToast('❌ Ошибка входа', true);
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
    
    // Удаляем +7 если есть
    let cleanPhone = phone.replace(/^\+7/, '').replace(/\D/g, '');
    if (cleanPhone.length < 10) {
        showToast('❌ Введите корректный номер телефона (10 цифр)', true);
        return;
    }
    
    // Формируем полный номер
    const fullPhone = '+7' + cleanPhone;
    
    // Ищем клиента по телефону
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
    }).catch(err => {
        console.error('Ошибка входа клиента:', err);
        showToast('❌ Ошибка входа', true);
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
