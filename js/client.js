// ===== КЛИЕНТ =====

const user = checkAuth();
if (!user || user.role !== 'client') {
    window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('clientName').innerHTML = `👤 ${user.fullName}`;
    document.getElementById('clientStoreDisplay').innerHTML = `🏪 ${user.storeName || 'Магазин'}`;
    document.getElementById('cardNumberDisplay').innerHTML = `Номер карты: ${user.cardNumber}`;
    document.getElementById('storeDisplay').innerHTML = `🏪 ${user.storeName || 'Магазин'}`;
    document.getElementById('clientBalance').innerText = user.balance || 0;
    
    // Генерируем EAN-13 из номера карты
    generateEAN13(user.cardNumber);
    
    document.getElementById('clientInfo').innerHTML = `
        <div>
            <h3>${user.fullName}</h3>
            <span class="badge">🎫 Карта: ${user.cardNumber}</span><br>
            <span style="font-size:0.8rem;">📱 ${user.phone}</span><br>
            <span style="font-size:0.8rem;color:#3e5f7e;">🏪 ${user.storeName || 'Магазин'}</span>
        </div>
    `;
    
    loadClientHistory();
});

// ===== ГЕНЕРАЦИЯ EAN-13 ШТРИХКОДА =====
function generateEAN13(cardNumber) {
    try {
        // Используем номер карты как основу для EAN-13
        // Берем первые 12 цифр (или дополняем нулями)
        var code = cardNumber.replace(/\D/g, '');
        // Берем последние 12 цифр или дополняем
        if (code.length < 12) {
            code = code.padStart(12, '0');
        } else if (code.length > 12) {
            code = code.substring(code.length - 12);
        }
        
        // Генерируем полный EAN-13
        var ean13 = EAN13.generate(code);
        
        // Отображаем на Canvas
        var canvas = document.getElementById('barcodeCanvas');
        if (canvas) {
            EAN13.draw(canvas, ean13, {
                width: 350,
                height: 160,
                fontSize: 18,
                bgColor: '#ffffff',
                fgColor: '#1a1a2e'
            });
        }
        
        // Показываем номер
        var display = document.getElementById('barcodeNumber');
        if (display) {
            display.textContent = ean13;
        }
        
        console.log('✅ EAN-13 сгенерирован:', ean13);
    } catch(e) {
        console.error('Ошибка генерации EAN-13:', e);
        // Показываем обычный штрихкод как запасной вариант
        document.getElementById('barcodeDisplay').innerHTML = cardNumber;
    }
}

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
    
    db.ref('clients/' + clientId + '/balance').on('value', snap => {
        const balance = snap.val() || 0;
        document.getElementById('clientBalance').innerText = balance;
        const saved = JSON.parse(localStorage.getItem('shop_user'));
        saved.balance = balance;
        localStorage.setItem('shop_user', JSON.stringify(saved));
    });
}
