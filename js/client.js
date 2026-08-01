// ===== КЛИЕНТ =====

const user = checkAuth();
if (!user || user.role !== 'client') {
    window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('clientName').innerHTML = `👤 ${user.fullName}`;
    document.getElementById('clientStoreDisplay').innerHTML = `🏪 ${user.storeName || 'Магазин'}`;
    document.getElementById('clientBalance').innerText = user.balance || 0;
    
    // Отображаем информацию
    document.getElementById('clientInfo').innerHTML = `
        <div>
            <h3>${user.fullName}</h3>
            <span class="badge">🎫 Карта: ${user.cardNumber}</span><br>
            <span style="font-size:0.8rem;">📱 ${user.phone}</span><br>
            <span style="font-size:0.8rem;color:#3e5f7e;">✅ Единая карта для всех магазинов</span>
        </div>
    `;
    
    // Генерируем EAN-13 из номера карты
    generateEAN13(user.cardNumber);
    
    loadClientHistory();
});

// ===== ГЕНЕРАЦИЯ EAN-13 ШТРИХКОДА =====
function generateEAN13(cardNumber) {
    try {
        var canvas = document.getElementById('barcodeCanvas');
        if (!canvas) return;
        
        // Используем номер карты для генерации EAN-13
        var ean13 = EAN13.generate(cardNumber);
        
        // Рисуем штрихкод
        EAN13.draw(canvas, ean13, {
            width: 350,
            height: 160,
            fontSize: 18,
            bgColor: '#ffffff',
            fgColor: '#1a1a2e'
        });
        
        // Показываем номер
        document.getElementById('barcodeNumber').textContent = ean13;
        
        console.log('✅ EAN-13 сгенерирован:', ean13);
    } catch(e) {
        console.error('Ошибка генерации EAN-13:', e);
        document.getElementById('barcodeNumber').textContent = cardNumber || 'Ошибка';
    }
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
                    </div>
                    <div style="text-align:right;">
                        <strong>${item.total} ₽</strong>
                        <span class="badge" style="display:block; margin-top:4px;">+${item.points} баллов</span>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    });
    
    // Слушаем изменения баланса
    db.ref('clients/' + clientId + '/balance').on('value', snap => {
        const balance = snap.val() || 0;
        document.getElementById('clientBalance').innerText = balance;
        const saved = JSON.parse(localStorage.getItem('shop_user'));
        saved.balance = balance;
        localStorage.setItem('shop_user', JSON.stringify(saved));
    });
}
