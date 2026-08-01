// ===== АДМИНИСТРАТОР =====

const user = checkAuth();
if (!user || user.role !== 'admin') {
    window.location.href = 'index.html';
}

let currentStoreId = null;

document.addEventListener('DOMContentLoaded', function() {
    loadStores();
    loadCashiers();
    loadClients();
    loadStoreSelects();
});

// ===== МАГАЗИНЫ =====
function createStore() {
    const name = document.getElementById('storeName').value.trim();
    const address = document.getElementById('storeAddress').value.trim();
    
    if (!name) {
        showToast('❌ Введите название магазина', true);
        document.getElementById('storeName').focus();
        return;
    }
    
    const data = {
        name: name,
        address: address || 'Не указан',
        createdAt: new Date().toISOString(),
        cashiers: {},
        products: {},
        clients: {}
    };
    
    db.ref('stores').push(data).then(() => {
        document.getElementById('storeName').value = '';
        document.getElementById('storeAddress').value = '';
        showToast(`✅ Магазин "${name}" создан!`);
        loadStores();
        loadStoreSelects();
    }).catch(err => showToast('❌ Ошибка: ' + err.message, true));
}

function loadStores() {
    const container = document.getElementById('storesList');
    container.innerHTML = '<div class="loading-spinner">Загрузка...</div>';
    
    db.ref('stores').on('value', snap => {
        const data = snap.val();
        if (!data) {
            container.innerHTML = '<div class="empty-state">Нет магазинов. Создайте первый!</div>';
            return;
        }
        let html = '';
        for (let key in data) {
            const s = data[key];
            const cashierCount = s.cashiers ? Object.keys(s.cashiers).length : 0;
            const productCount = s.products ? Object.keys(s.products).length : 0;
            html += `
                <div class="member-item">
                    <div>
                        <strong>🏪 ${s.name}</strong><br>
                        <span style="font-size:0.8rem; color:#7a8a9e;">📍 ${s.address || 'Адрес не указан'}</span><br>
                        <span class="badge">👤 Кассиров: ${cashierCount}</span>
                        <span class="badge">📦 Товаров: ${productCount}</span>
                    </div>
                    <button class="small-btn danger" onclick="deleteStore('${key}')">🗑 Удалить</button>
                </div>
            `;
        }
        container.innerHTML = html;
    });
}

function deleteStore(id) {
    if (!confirm('Удалить магазин со всеми данными?')) return;
    db.ref('stores/' + id).remove().then(() => {
        showToast('🗑 Магазин удалён');
        loadStoreSelects();
    });
}

function loadStoreSelects() {
    db.ref('stores').once('value', snap => {
        const stores = snap.val();
        const selects = ['cashierStoreSelect', 'cashierStoreSelect2'];
        selects.forEach(id => {
            const select = document.getElementById(id);
            if (!select) return;
            select.innerHTML = '<option value="">Выберите магазин</option>';
            if (stores) {
                for (let key in stores) {
                    const option = document.createElement('option');
                    option.value = key;
                    option.textContent = stores[key].name;
                    select.appendChild(option);
                }
            }
        });
    });
}

// ===== КАССИРЫ =====
function addCashier() {
    const storeId = document.getElementById('cashierStoreSelect').value;
    const fullName = document.getElementById('cashierFullName').value.trim();
    const login = document.getElementById('cashierLogin').value.trim();
    const password = document.getElementById('cashierPassword').value.trim();
    
    if (!storeId) {
        showToast('❌ Выберите магазин', true);
        return;
    }
    if (!fullName || !login || !password) {
        showToast('❌ Заполните все поля!', true);
        return;
    }
    
    // Проверяем уникальность логина в магазине
    db.ref('stores/' + storeId + '/cashiers').orderByChild('login').equalTo(login).once('value', snap => {
        if (snap.exists()) {
            showToast('❌ Кассир с таким логином уже есть в этом магазине!', true);
            return;
        }
        
        const data = { fullName, login, password, createdAt: new Date().toISOString() };
        db.ref('stores/' + storeId + '/cashiers').push(data).then(() => {
            document.getElementById('cashierFullName').value = '';
            document.getElementById('cashierLogin').value = '';
            document.getElementById('cashierPassword').value = '';
            showToast(`✅ Кассир ${fullName} добавлен в магазин!`);
            loadCashiers();
        }).catch(err => showToast('❌ Ошибка: ' + err.message, true));
    });
}

function loadCashiers() {
    const container = document.getElementById('cashiersList');
    container.innerHTML = '<div class="loading-spinner">Загрузка...</div>';
    
    db.ref('stores').on('value', snap => {
        const stores = snap.val();
        if (!stores) {
            container.innerHTML = '<div class="empty-state">Нет кассиров</div>';
            return;
        }
        let html = '';
        for (let storeKey in stores) {
            const store = stores[storeKey];
            const cashiers = store.cashiers || {};
            const cashierKeys = Object.keys(cashiers);
            if (cashierKeys.length === 0) continue;
            
            html += `<div style="margin-top:12px; padding:12px; background:#f8faff; border-radius:16px;">
                <strong style="color:#1a1a2e;">🏪 ${store.name}</strong>`;
            
            cashierKeys.forEach(key => {
                const c = cashiers[key];
                html += `
                    <div class="member-item" style="margin-top:8px;">
                        <div class="member-info">
                            <div>
                                <strong>${c.fullName}</strong><br>
                                <span class="badge">🔑 ${c.login}</span>
                                <span style="font-size:0.7rem;color:#3e5f7e;">🔒 ${c.password}</span>
                            </div>
                        </div>
                        <button class="small-btn danger" onclick="removeCashier('${storeKey}','${key}')">🗑 Удалить</button>
                    </div>
                `;
            });
            html += `</div>`;
        }
        container.innerHTML = html || '<div class="empty-state">Нет кассиров</div>';
    });
}

function removeCashier(storeId, cashierId) {
    if (!confirm('Удалить кассира?')) return;
    db.ref('stores/' + storeId + '/cashiers/' + cashierId).remove().then(() => {
        showToast('🗑 Кассир удалён');
    });
}

// ===== КЛИЕНТЫ =====
function loadClients() {
    const container = document.getElementById('clientsList');
    container.innerHTML = '<div class="loading-spinner">Загрузка...</div>';
    
    db.ref('clients').on('value', snap => {
        const data = snap.val();
        if (!data) {
            container.innerHTML = '<div class="empty-state">Нет клиентов</div>';
            return;
        }
        let html = '';
        for (let key in data) {
            const c = data[key];
            html += `
                <div class="member-item">
                    <div class="member-info">
                        <div>
                            <strong>${c.fullName}</strong><br>
                            <span class="badge">🎫 ${c.cardNumber || key.slice(0,8)}</span><br>
                            <span style="font-size:0.7rem;">📱 ${c.phone}</span>
                            <span style="font-size:0.7rem;color:#3e5f7e;">🏪 ${c.storeName || 'Не указан'}</span>
                        </div>
                    </div>
                    <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
                        <span class="badge">⭐ ${c.balance || 0} баллов</span>
                        <button class="small-btn danger" onclick="removeClient('${key}')">🗑</button>
                    </div>
                </div>
            `;
        }
        container.innerHTML = html;
    });
}

function removeClient(id) {
    if (!confirm('Удалить клиента?')) return;
    db.ref('clients/' + id).remove().then(() => {
        showToast('🗑 Клиент удалён');
    });
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
