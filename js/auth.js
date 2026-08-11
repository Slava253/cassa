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
    
    if (!storeId) {
        showToast('❌ Выберите магазин', true);
        return;
    }
    if (!cardNumber) {
        showToast('❌ Введите номер карты кассира', true);
        return;
    }
    
    // Ищем кассира по номеру карты в выбранном магазине
    db.ref('stores/' + storeId + '/cashiers').orderByChild('cardNumber').equalTo(cardNumber).once('value', snap => {
        const cashiers = snap.val();
        let found = null;
        let foundKey = null;
        for (let key in cashiers) {
            found = cashiers[key];
            foundKey = key;
            break;
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
            showToast('❌ Кассир с таким номером карты не найден', true);
        }
    });
}

function clientLogin() {
    const storeId = document.getElementById('clientStoreSelect').value;
    const phone = document.getElementById('clientPhoneInput').value.trim();
    
    if (!storeId) {
        showToast('❌ Выберите магазин', true);
        return;
    }
    if (!phone) {
        showToast('❌ Введите номер телефона', true);
        return;
    }
    
    // Очищаем телефон от лишних символов для поиска
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
        showToast('❌ Введите корректный номер телефона (не менее 10 цифр)', true);
        return;
    }
    
    // Ищем клиента по телефону в любом магазине
    db.ref('clients').orderByChild('phone').equalTo(phone).once('value', snap => {
        const clients = snap.val();
        let found = null;
        let foundKey = null;
        
        for (let key in clients) {
            const c = clients[key];
            if (c.phone === phone) {
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
            showToast('❌ Клиент с таким номером не найден в этом магазине', true);
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
