// ===== КЛИЕНТ =====

const user = checkAuth();
if (!user || user.role !== 'client') {
    window.location.href = 'index.html';
}

let currentBarcodeColor = '#000000';

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('clientName').innerHTML = `👤 ${user.fullName}`;
    document.getElementById('clientStoreDisplay').innerHTML = `🏪 ${user.storeName || 'Магазин'}`;
    document.getElementById('clientBalance').innerText = user.balance || 0;
    
    document.getElementById('clientInfo').innerHTML = `
        <div>
            <h3>${user.fullName}</h3>
            <span class="badge">🎫 Карта: ${user.cardNumber}</span><br>
            <span style="font-size:0.8rem;">📱 ${user.phone}</span><br>
            <span style="font-size:0.8rem;color:#3e5f7e;">✅ Единая карта для всех магазинов</span>
        </div>
    `;
    
    generateEAN13(user.cardNumber);
    loadClientHistory();
});

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

// ===== СМЕНА ЦВЕТА ШТРИХКОДА =====
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
