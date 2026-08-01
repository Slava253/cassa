// ===== КЛИЕНТ =====

// Проверка авторизации
const user = checkAuth();
if (!user || user.role !== 'client') {
    window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('clientName').innerHTML = `👤 ${user.fullName}`;
    document.getElementById('cardNumberDisplay').innerHTML = `Штрихкод: ${user.cardNumber}`;
    document.getElementById('clientBalance').innerText = user.balance || 0;
    
    // Информация о клиенте
    document.getElementById('clientInfo').innerHTML = `
        <div>
            <h3>${user.fullName}</h3>
            <span class="badge">🎫 Карта: ${user.cardNumber}</span><br>
            <span style="font-size:0.8rem;">📱 ${user.phone}</span>
        </div>
    `;
    
    // Генерация QR-кода
    generateQR(user.cardNumber || user.id);
    
    // Загрузка истории
    loadClientHistory();
});

// ===== QR-КОД =====
function generateQR(data) {
    try {
        const canvas = document.getElementById('qrCanvas');
        if (canvas) {
            new QRious({
                element: canvas,
                value: data,
                size: 200
            });
        }
    } catch(e) {
        console.error('QR error:', e);
        document.getElementById('qrContainer').innerHTML = `
            <p style="color:#7a8a9e;">⚠️ Не удалось сгенерировать QR-код</p>
            <p style="font-size:0.8rem;">Ваш номер карты: <strong>${data}</strong></p>
        `;
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
                    </div>
                    <div>
                        <strong>${item.total} ₽</strong> 
                        <span class="badge">+${item.points} баллов</span>
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
        // Обновляем локального пользователя
        const saved = JSON.parse(localStorage.getItem('gusc_user'));
        saved.balance = balance;
        localStorage.setItem('gusc_user', JSON.stringify(saved));
    });
}
