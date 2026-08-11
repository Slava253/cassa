// ===== АДМИНИСТРАТОР =====

const user = checkAuth();
if (!user || user.role !== 'admin') {
    window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', function() {
    loadStores();
    loadCashiers();
    loadClients();
    loadStoreSelects();
    loadPromotions();
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
        loadStores();
        loadCashiers();
    });
}

function loadStoreSelects() {
    const select = document.getElementById('cashierStoreSelect');
    if (!select) return;
    
    select.innerHTML = '<option value="">Загрузка...</option>';
    
    db.ref('stores').once('value', snap => {
        const stores = snap.val();
        select.innerHTML = '<option value="">Выберите магазин</option>';
        if (stores) {
            for (let key in stores) {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = stores[key].name;
                select.appendChild(option);
            }
        } else {
            select.innerHTML = '<option value="">Нет магазинов</option>';
        }
    });
}

// ===== КАССИРЫ =====
function addCashier() {
    const storeId = document.getElementById('cashierStoreSelect').value;
    const fullName = document.getElementById('cashierFullName').value.trim();
    const cardNumber = document.getElementById('cashierCardNumber').value.trim();
    const password = document.getElementById('cashierPassword').value.trim();
    
    if (!storeId) {
        showToast('❌ Выберите магазин!', true);
        document.getElementById('cashierStoreSelect').focus();
        return;
    }
    if (!fullName) {
        showToast('❌ Введите ФИО кассира', true);
        document.getElementById('cashierFullName').focus();
        return;
    }
    if (!cardNumber) {
        showToast('❌ Введите номер карты кассира', true);
        document.getElementById('cashierCardNumber').focus();
        return;
    }
    if (!password) {
        showToast('❌ Введите пароль кассира', true);
        document.getElementById('cashierPassword').focus();
        return;
    }
    
    db.ref('stores/' + storeId).once('value', snap => {
        if (!snap.exists()) {
            showToast('❌ Магазин не найден!', true);
            return;
        }
        
        db.ref('stores/' + storeId + '/cashiers').orderByChild('cardNumber').equalTo(cardNumber).once('value', snap2 => {
            if (snap2.exists()) {
                showToast('❌ Кассир с таким номером карты уже есть в этом магазине!', true);
                return;
            }
            
            const data = { 
                fullName: fullName, 
                cardNumber: cardNumber, 
                password: password, 
                createdAt: new Date().toISOString() 
            };
            
            db.ref('stores/' + storeId + '/cashiers').push(data).then(() => {
                document.getElementById('cashierFullName').value = '';
                document.getElementById('cashierCardNumber').value = '';
                document.getElementById('cashierPassword').value = '';
                showToast(`✅ Кассир ${fullName} добавлен! Номер карты: ${cardNumber}`);
                loadCashiers();
                loadStores();
            }).catch(err => showToast('❌ Ошибка: ' + err.message, true));
        });
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
        let hasCashiers = false;
        
        for (let storeKey in stores) {
            const store = stores[storeKey];
            const cashiers = store.cashiers || {};
            const cashierKeys = Object.keys(cashiers);
            if (cashierKeys.length === 0) continue;
            
            hasCashiers = true;
            html += `<div style="margin-top:12px; padding:12px; background:#f8faff; border-radius:16px;">
                <strong style="color:#1a1a2e;">🏪 ${store.name}</strong>`;
            
            cashierKeys.forEach(key => {
                const c = cashiers[key];
                html += `
                    <div class="member-item" style="margin-top:8px;">
                        <div class="member-info">
                            <div>
                                <strong>${c.fullName}</strong><br>
                                <span class="badge">🎫 ${c.cardNumber}</span>
                                <span style="font-size:0.7rem;color:#3e5f7e;">🔒 ${c.password}</span>
                            </div>
                        </div>
                        <button class="small-btn danger" onclick="removeCashier('${storeKey}','${key}')">🗑 Удалить</button>
                    </div>
                `;
            });
            html += `</div>`;
        }
        
        container.innerHTML = hasCashiers ? html : '<div class="empty-state">Нет кассиров</div>';
    });
}

function removeCashier(storeId, cashierId) {
    if (!confirm('Удалить кассира?')) return;
    db.ref('stores/' + storeId + '/cashiers/' + cashierId).remove().then(() => {
        showToast('🗑 Кассир удалён');
        loadCashiers();
        loadStores();
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

// ===== АКЦИИ =====
function createPromotion() {
    const title = document.getElementById('promotionTitle').value.trim();
    const startDate = document.getElementById('promotionStart').value;
    const endDate = document.getElementById('promotionEnd').value;
    const description = document.getElementById('promotionDescription').value.trim();
    const prize = document.getElementById('promotionPrize').value.trim();
    const conditions = document.getElementById('promotionConditions').value.trim();
    const currency = document.getElementById('promotionCurrency').value;
    const amount = parseFloat(document.getElementById('promotionAmount').value);
    
    if (!title) {
        showToast('❌ Введите название акции', true);
        document.getElementById('promotionTitle').focus();
        return;
    }
    if (!startDate || !endDate) {
        showToast('❌ Укажите даты начала и окончания', true);
        return;
    }
    if (!description) {
        showToast('❌ Введите описание акции', true);
        document.getElementById('promotionDescription').focus();
        return;
    }
    if (isNaN(amount) || amount <= 0) {
        showToast('❌ Введите сумму для накопления', true);
        document.getElementById('promotionAmount').focus();
        return;
    }
    
    const data = {
        title: title,
        startDate: startDate,
        endDate: endDate,
        description: description,
        prize: prize || 'Не указан',
        conditions: conditions || 'Не указаны',
        currency: currency,
        amount: amount,
        createdAt: new Date().toISOString(),
        active: true
    };
    
    db.ref('promotions').push(data).then(() => {
        document.getElementById('promotionTitle').value = '';
        document.getElementById('promotionStart').value = '';
        document.getElementById('promotionEnd').value = '';
        document.getElementById('promotionDescription').value = '';
        document.getElementById('promotionPrize').value = '';
        document.getElementById('promotionConditions').value = '';
        document.getElementById('promotionCurrency').value = 'Бонусы';
        document.getElementById('promotionAmount').value = '';
        showToast(`✅ Акция "${title}" создана!`);
        loadPromotions();
    }).catch(err => showToast('❌ Ошибка: ' + err.message, true));
}

function loadPromotions() {
    const container = document.getElementById('promotionsList');
    container.innerHTML = '<div class="loading-spinner">Загрузка...</div>';
    
    db.ref('promotions').on('value', snap => {
        const data = snap.val();
        if (!data) {
            container.innerHTML = '<div class="empty-state">Нет акций</div>';
            return;
        }
        let html = '';
        for (let key in data) {
            const p = data[key];
            const status = p.active ? '✅ Активна' : '❌ Завершена';
            const currencyIcon = p.currency === 'Наклейки' ? '🏷️' : '⭐';
            html += `
                <div class="member-item">
                    <div>
                        <strong>${p.title}</strong><br>
                        <span style="font-size:0.8rem; color:#7a8a9e;">📅 ${p.startDate} — ${p.endDate}</span><br>
                        <span style="font-size:0.8rem; color:#3e5f7e;">${p.description}</span><br>
                        <span class="badge">🎁 ${p.prize}</span>
                        <span class="badge">📋 ${p.conditions}</span>
                        <span class="badge" style="background:#1a1a2e; color:white;">${currencyIcon} ${p.currency}: ${p.amount} ₽</span>
                        <span style="font-size:0.7rem; color:#1d6f2c; margin-left:8px;">${status}</span>
                    </div>
                    <div style="display:flex; gap:8px; flex-wrap:wrap;">
                        <button class="small-btn" onclick="togglePromotion('${key}', ${!p.active})">${p.active ? '❌ Завершить' : '✅ Активировать'}</button>
                        <button class="small-btn danger" onclick="deletePromotion('${key}')">🗑</button>
                    </div>
                </div>
            `;
        }
        container.innerHTML = html;
    });
}

function togglePromotion(id, active) {
    db.ref('promotions/' + id).update({ active: active }).then(() => {
        showToast(active ? '✅ Акция активирована' : '❌ Акция завершена');
    });
}

function deletePromotion(id) {
    if (!confirm('Удалить акцию?')) return;
    db.ref('promotions/' + id).remove().then(() => {
        showToast('🗑 Акция удалена');
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
