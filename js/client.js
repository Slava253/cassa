// ===== КЛИЕНТ =====

const user = checkAuth();
if (!user || user.role !== 'client') {
    window.location.href = 'index.html';
}

let currentBarcodeColor = '#000000';

document.addEventListener('DOMContentLoaded', function() {
    // Информация о клиенте
    document.getElementById('clientName').innerHTML = `👤 ${user.fullName}`;
    document.getElementById('clientStoreDisplay').innerHTML = `🏪 ${user.storeName || 'Магазин'}`;
    document.getElementById('clientBalance').innerText = user.balance || 0;
    
    // Заполняем профиль
    document.getElementById('profilePhone').value = user.phone || '';
    document.getElementById('profileNickname').value = user.nickname || '';
    document.getElementById('profileCardNumber').value = user.cardNumber || '';
    
    document.getElementById('clientInfo').innerHTML = `
        <div>
            <h3>${user.nickname || user.fullName}</h3>
            <span class="badge">🎫 Карта: ${user.cardNumber}</span><br>
            <span style="font-size:0.8rem;">📱 ${user.phone}</span><br>
            <span style="font-size:0.8rem;color:#3e5f7e;">✅ Единая карта для всех магазинов</span>
        </div>
    `;
    
    generateEAN13(user.cardNumber);
    loadClientHistory();
    
    // Показываем статус никнейма
    if (user.nickname) {
        document.getElementById('nicknameStatus').innerHTML = `✅ Никнейм установлен: ${user.nickname}`;
        document.getElementById('nicknameStatus').style.color = '#1d6f2c';
    }
});

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
    db.ref('clients/' + clientId).update({
        nickname: nickname
    }).then(() => {
        // Обновляем локальные данные
        user.nickname = nickname;
        localStorage.setItem('shop_user', JSON.stringify(user));
        
        // Обновляем отображение
        document.getElementById('clientInfo').innerHTML = `
            <div>
                <h3>${nickname}</h3>
                <span class="badge">🎫 Карта: ${user.cardNumber}</span><br>
                <span style="font-size:0.8rem;">📱 ${user.phone}</span><br>
                <span style="font-size:0.8rem;color:#3e5f7e;">✅ Единая карта для всех магазинов</span>
            </div>
        `;
        document.getElementById('clientName').innerHTML = `👤 ${nickname}`;
        document.getElementById('nicknameStatus').innerHTML = `✅ Никнейм сохранён: ${nickname}`;
        document.getElementById('nicknameStatus').style.color = '#1d6f2c';
        
        showToast(`✅ Никнейм "${nickname}" сохранён!`);
    }).catch(err => {
        showToast('❌ Ошибка: ' + err.message, true);
    });
}

// ===== ГЕНЕРАЦИЯ EAN-13 ШТРИХКОДА =====
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
        
        console.log('✅ EAN-13 сгенерирован:', ean13);
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
        history.slice().reverse().forEach(item => {
            html += `
                <div class="history-item">
                    <div>
                        <span style="font-size:0.7rem;color:#7a8a9e;">${item.date}</span>
                        <div style="font-weight:500;">${item.items || 'Покупка'}</div>
                        <span style="font-size:0.6rem;color:#3e5f7e;">${item.paymentMethod || ''}</span>
                        <span style="font-size:0.6rem;color:#3e5f7e;">🏪 ${item.storeName || ''}</span>
                        ${item.discount > 0 ? `<span style="font-size:0.6rem;color:#1d6f2c;">✅ Скидка: ${item.discount} ₽</span>` : ''}
                        ${item.cashGiven ? `<span style="font-size:0.6rem;color:#3e5f7e;">💵 Сдача: ${item.change} ₽</span>` : ''}
                    </div>
                    <div style="text-align:right;">
                        <strong>${item.total} ₽</strong>
                        <span class="badge" style="display:block; margin-top:4px;">+${item.pointsEarned || 0} баллов</span>
                        ${item.pointsUsed > 0 ? `<span class="badge" style="display:block; background:#fee9e9; color:#b33a34;">-${item.pointsUsed} баллов</span>` : ''}
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    });
    
    db.ref('clients/' + clientId + '/balance').on('value', snap => {
        const balance = snap.val() || 0;
        document.getElementById('clientBalance').innerText = balance;
        const saved = JSON.parse(localStorage.getItem('shop_user'));
        saved.balance = balance;
        localStorage.setItem('shop_user', JSON.stringify(saved));
    });
}
