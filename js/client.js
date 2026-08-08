// ===== КЛИЕНТ =====

const user = checkAuth();
if (!user || user.role !== 'client') {
    window.location.href = 'index.html';
}

let currentBarcodeColor = '#000000';
let selectedStoreId = null;
let selectedStoreName = null;

document.addEventListener('DOMContentLoaded', function() {
    // Информация о клиенте
    document.getElementById('clientName').innerHTML = `👤 ${user.nickname || user.fullName}`;
    document.getElementById('clientStoreDisplay').innerHTML = `🏪 ${user.storeName || 'Магазин'}`;
    document.getElementById('clientBalance').innerText = user.balance || 0;
    
    // Заполняем профиль
    document.getElementById('profilePhone').value = user.phone || '';
    document.getElementById('profileNickname').value = user.nickname || '';
    document.getElementById('profileCardNumber').value = user.cardNumber || '';
    
    // Обновляем информацию в карточке
    updateClientInfo();
    
    // Генерируем штрихкод
    generateEAN13(user.cardNumber);
    
    // Загружаем историю
    loadClientHistory();
    
    // Показываем статус никнейма
    if (user.nickname) {
        document.getElementById('nicknameStatus').innerHTML = `✅ Никнейм установлен: ${user.nickname}`;
        document.getElementById('nicknameStatus').style.color = '#1d6f2c';
    }
    
    // Загружаем магазины для выбора
    loadClientStores();
});

// ===== ОБНОВЛЕНИЕ ИНФОРМАЦИИ О КЛИЕНТЕ =====
function updateClientInfo() {
    const displayName = user.nickname || user.fullName;
    document.getElementById('clientInfo').innerHTML = `
        <div>
            <h3>${displayName}</h3>
            ${user.nickname ? `<span style="font-size:0.8rem; color:#7a8a9e;">(${user.fullName})</span><br>` : ''}
            <span class="badge">🎫 Карта: ${user.cardNumber}</span><br>
            <span style="font-size:0.8rem;">📱 ${user.phone}</span><br>
            <span style="font-size:0.8rem;color:#3e5f7e;">✅ Единая карта для всех магазинов</span>
            ${selectedStoreName ? `<br><span style="font-size:0.8rem;color:#1d6f2c;">🏪 Выбран магазин: ${selectedStoreName}</span>` : ''}
        </div>
    `;
    document.getElementById('clientName').innerHTML = `👤 ${displayName}`;
}

// ===== ВЫБОР МАГАЗИНА =====
function loadClientStores() {
    const select = document.getElementById('clientStoreSelector');
    select.innerHTML = '<option value="">Загрузка магазинов...</option>';
    
    db.ref('stores').once('value', snap => {
        const stores = snap.val();
        select.innerHTML = '<option value="">Выберите магазин</option>';
        if (stores) {
            for (let key in stores) {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = stores[key].name;
                if (key === user.storeId) {
                    option.selected = true;
                    selectedStoreId = key;
                    selectedStoreName = stores[key].name;
                    document.getElementById('selectedStoreDisplay').innerHTML = `✅ Текущий магазин: ${selectedStoreName}`;
                }
                select.appendChild(option);
            }
        }
        updateClientInfo();
    });
}

function changeClientStore() {
    const select = document.getElementById('clientStoreSelector');
    const storeId = select.value;
    if (!storeId) {
        document.getElementById('selectedStoreDisplay').innerHTML = '';
        selectedStoreId = null;
        selectedStoreName = null;
        updateClientInfo();
        return;
    }
    
    db.ref('stores/' + storeId).once('value', snap => {
        const store = snap.val();
        if (store) {
            selectedStoreId = storeId;
            selectedStoreName = store.name;
            document.getElementById('selectedStoreDisplay').innerHTML = `✅ Выбран магазин: ${selectedStoreName}`;
            updateClientInfo();
            showToast(`🏪 Выбран магазин: ${selectedStoreName}`);
            
            // Очищаем результат сканера
            document.getElementById('priceResult').style.display = 'none';
        }
    });
}

// ===== СКАНЕР ЦЕН =====
function scanPrice() {
    const barcode = document.getElementById('priceScannerInput').value.trim();
    if (!barcode) {
        showToast('❌ Введите или отсканируйте штрихкод', true);
        return;
    }
    
    if (!selectedStoreId) {
        showToast('❌ Сначала выберите магазин', true);
        return;
    }
    
    const resultDiv = document.getElementById('priceResult');
    const contentDiv = document.getElementById('priceResultContent');
    
    resultDiv.style.display = 'block';
    contentDiv.innerHTML = '<div class="loading-spinner">Поиск товара...</div>';
    
    db.ref('stores/' + selectedStoreId + '/products').orderByChild('barcode').equalTo(barcode).once('value', snap => {
        let product = null;
        snap.forEach(child => {
            product = child.val();
        });
        
        if (product) {
            contentDiv.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
                    <div>
                        <div style="font-size:1.2rem; font-weight:bold;">${product.name}</div>
                        <div style="font-size:0.8rem; color:#7a8a9e;">Штрихкод: ${product.barcode}</div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:1.5rem; font-weight:bold; color:#1a1a2e;">${product.price.toFixed(2)} ₽</div>
                        <div style="font-size:0.8rem; color:#1d6f2c;">💎 По карте: ${product.discountPrice.toFixed(2)} ₽</div>
                        <div style="font-size:0.7rem; color:#7a8a9e;">🏪 ${selectedStoreName}</div>
                    </div>
                </div>
                <div style="margin-top:12px; padding-top:12px; border-top:1px solid #eef2f8; font-size:0.8rem; color:#3e5f7e;">
                    💡 При предъявлении карты цена будет ${product.discountPrice.toFixed(2)} ₽
                </div>
            `;
            showToast(`✅ Товар найден: ${product.name}`);
        } else {
            contentDiv.innerHTML = `
                <div style="text-align:center; color:#b33a34; padding:12px;">
                    <div style="font-size:2rem;">❌</div>
                    <div style="font-weight:bold; margin-top:8px;">Товар не найден</div>
                    <div style="font-size:0.8rem; color:#7a8a9e;">В магазине "${selectedStoreName}" нет товара с штрихкодом ${barcode}</div>
                </div>
            `;
            showToast(`❌ Товар не найден`, true);
        }
        
        document.getElementById('priceScannerInput').value = '';
    });
}

// ===== ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК КЛИЕНТА =====
function switchClientTab(tab) {
    document.querySelectorAll('#client-profile, #client-card, #client-history').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.tab-btn[data-tab^="client-"]').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById('client-' + tab).style.display = 'block';
    document.querySelector(`.tab-btn[data-tab="client-${tab}"]`).classList.add('active');
}

// ===== СОХРАНЕНИЕ НИКНЕЙМА =====
function saveNickname() {
    const nickname = document.getElementById('profileNickname').value.trim();
    if (!nickname) {
        showToast('❌ Введите никнейм', true);
        return;
    }
    
    const clientId = user.id;
    const oldNickname = user.nickname || user.fullName;
    
    db.ref('clients/' + clientId).update({
        nickname: nickname
    }).then(() => {
        user.nickname = nickname;
        localStorage.setItem('shop_user', JSON.stringify(user));
        
        updateClientInfo();
        document.getElementById('nicknameStatus').innerHTML = `✅ Никнейм сохранён: ${nickname}`;
        document.getElementById('nicknameStatus').style.color = '#1d6f2c';
        
        updateCashierHistoryNickname(clientId, oldNickname, nickname);
        
        showToast(`✅ Никнейм "${nickname}" сохранён!`);
    }).catch(err => {
        showToast('❌ Ошибка: ' + err.message, true);
    });
}

// ===== ОБНОВЛЕНИЕ НИКНЕЙМА В ИСТОРИИ =====
function updateCashierHistoryNickname(clientId, oldNickname, newNickname) {
    db.ref('cashier_history').once('value', snap => {
        const history = snap.val();
        if (!history) return;
        
        const updates = {};
        for (let key in history) {
            const item = history[key];
            if (item.clientPhone === user.phone || item.clientName === oldNickname || 
                (item.clientId && item.clientId === clientId)) {
                updates['cashier_history/' + key + '/clientName'] = newNickname;
                if (!item.clientId) updates['cashier_history/' + key + '/clientId'] = clientId;
                if (!item.clientPhone) updates['cashier_history/' + key + '/clientPhone'] = user.phone;
            }
        }
        
        db.ref('stores/' + user.storeId + '/history').once('value', snap2 => {
            const storeHistory = snap2.val();
            if (!storeHistory) return;
            
            const storeUpdates = {};
            for (let key in storeHistory) {
                const item = storeHistory[key];
                if (item.clientPhone === user.phone || item.clientName === oldNickname || 
                    (item.clientId && item.clientId === clientId)) {
                    storeUpdates['stores/' + user.storeId + '/history/' + key + '/clientName'] = newNickname;
                    if (!item.clientId) storeUpdates['stores/' + user.storeId + '/history/' + key + '/clientId'] = clientId;
                    if (!item.clientPhone) storeUpdates['stores/' + user.storeId + '/history/' + key + '/clientPhone'] = user.phone;
                }
            }
            
            const allUpdates = { ...updates, ...storeUpdates };
            if (Object.keys(allUpdates).length > 0) {
                db.ref().update(allUpdates);
            }
        });
    });
}

// ===== ГЕНЕРАЦИЯ EAN-13 =====
function generateEAN13(cardNumber, color) {
    try {
        var canvas = document.getElementById('barcodeCanvas');
        if (!canvas) return;
        
        var fgColor = color || currentBarcodeColor || '#000000';
        var ean13 = EAN13.generate(cardNumber);
        
        EAN13.draw(canvas, ean13, {
            width: 420,
            height: 190,
            fontSize: 22,
            bgColor: '#ffffff',
            fgColor: fgColor
        });
        
        document.getElementById('barcodeNumber').textContent = ean13;
        document.getElementById('barcodeNumber').style.color = fgColor;
    } catch(e) {
        console.error('Ошибка генерации EAN-13:', e);
        document.getElementById('barcodeNumber').textContent = cardNumber || 'Ошибка';
    }
}

// ===== СМЕНА ЦВЕТА =====
function changeBarcodeColor(color) {
    currentBarcodeColor = color;
    generateEAN13(user.cardNumber, color);
    showToast('🎨 Цвет штрихкода изменён');
}

// ===== СКАЧАТЬ ШТРИХКОД =====
function downloadBarcode() {
    var canvas = document.getElementById('barcodeCanvas');
    if (!canvas) return;
    
    var link = document.createElement('a');
    link.download = 'barcode-' + user.cardNumber + '.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('💾 Штрихкод сохранён');
}

// ===== ИСТОРИЯ =====
function loadClientHistory() {
    const container = document.getElementById('clientHistory');
    container.innerHTML = '<div class="loading-spinner">Загрузка...</div>';
    
    const clientId = user.id;
    
    db.ref('clients/' + clientId + '/history').on('value', snap => {
        const history = snap.val() || [];
        if (history.length === 0) {
            container.innerHTML = '<div class="empty-state">Нет покупок</div>';
            return;
        }
        let html = '';
        const reversed = history.slice().reverse();
        const displayHistory = reversed.slice(0, 20);
        
        displayHistory.forEach(item => {
            html += `
                <div class="history-item">
                    <div>
                        <span style="font-size:0.7rem;color:#7a8a9e;">${item.date || 'Дата неизвестна'}</span>
                        <div style="font-weight:500;">${item.items || 'Покупка'}</div>
                        <span style="font-size:0.6rem;color:#3e5f7e;">${item.paymentMethod || ''}</span>
                        <span style="font-size:0.6rem;color:#3e5f7e;">🏪 ${item.storeName || ''}</span>
                        ${item.discount > 0 ? `<span style="font-size:0.6rem;color:#1d6f2c;">✅ Скидка: ${item.discount} ₽</span>` : ''}
                        ${item.cashGiven ? `<span style="font-size:0.6rem;color:#3e5f7e;">💵 Сдача: ${item.change} ₽</span>` : ''}
                    </div>
                    <div style="text-align:right;">
                        <strong>${item.total || 0} ₽</strong>
                        <span class="badge" style="display:block; margin-top:4px;">+${item.pointsEarned || 0} баллов</span>
                        ${item.pointsUsed > 0 ? `<span class="badge" style="display:block; background:#fee9e9; color:#b33a34;">-${item.pointsUsed} баллов</span>` : ''}
                    </div>
                </div>
            `;
        });
        
        if (history.length > 20) {
            html += `<div style="text-align:center; padding:12px; color:#7a8a9e; font-size:0.8rem;">Показаны последние 20 покупок из ${history.length}</div>`;
        }
        
        container.innerHTML = html;
    }, error => {
        console.error('Ошибка загрузки истории:', error);
        container.innerHTML = '<div class="empty-state">❌ Ошибка загрузки истории</div>';
    });
    
    db.ref('clients/' + clientId + '/balance').on('value', snap => {
        const balance = snap.val() || 0;
        document.getElementById('clientBalance').innerText = balance;
        const saved = JSON.parse(localStorage.getItem('shop_user'));
        saved.balance = balance;
        localStorage.setItem('shop_user', JSON.stringify(saved));
    }, error => {
        console.error('Ошибка загрузки баланса:', error);
    });
}
