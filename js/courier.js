// ===== КУРЬЕР =====

const user = checkAuth();
if (!user || user.role !== 'courier') {
    window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('courierName').innerHTML = `🚚 ${user.fullName}`;
    loadCourierOrders();
});

function loadCourierOrders() {
    const container = document.getElementById('courierOrdersList');
    container.innerHTML = '<div class="loading-spinner">Загрузка...</div>';
    
    db.ref('courier_orders').orderByChild('status').equalTo('Новый').on('value', snap => {
        const data = snap.val();
        if (!data) {
            container.innerHTML = '<div class="empty-state">Нет новых заказов</div>';
            return;
        }
        let html = '';
        for (let key in data) {
            const o = data[key];
            html += `
                <div class="member-item">
                    <div>
                        <strong>${o.clientName || 'Клиент'}</strong>
                        <span style="font-size:0.7rem; color:#7a8a9e; display:block;">📱 ${o.clientPhone || 'Не указан'}</span>
                        <span style="font-size:0.8rem; display:block;">📦 ${o.items}</span>
                        <span style="font-size:0.7rem; color:#3e5f7e;">📍 ${o.address}</span>
                        <span style="font-size:0.7rem; color:#3e5f7e;">🏪 ${o.storeName || ''}</span>
                        <span style="font-size:0.7rem; color:#7a8a9e;">📅 ${o.date}</span>
                        <span class="badge" style="background:#f6b83d;">💰 ${o.total} ₽</span>
                    </div>
                    <div style="display:flex; gap:8px; flex-wrap:wrap;">
                        <button onclick="acceptOrder('${key}')" class="btn-success">✅ Взять заказ</button>
                    </div>
                </div>
            `;
        }
        container.innerHTML = html;
    });
}

function acceptOrder(orderId) {
    if (!confirm('Взять заказ на доставку?')) return;
    
    db.ref('courier_orders/' + orderId).update({
        status: 'В пути',
        courierId: user.id,
        courierName: user.fullName,
        acceptedAt: new Date().toLocaleString('ru-RU')
    }).then(() => {
        showToast('✅ Заказ принят!');
        loadCourierOrders();
        loadMyOrders();
    });
}

function loadMyOrders() {
    // Этот код будет выполняться в фоновом режиме
}
