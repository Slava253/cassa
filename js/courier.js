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
    const container = document.getElementById('courierOrders');
    container.innerHTML = '<div class="loading-spinner">Загрузка...</div>';
    
    db.ref('orders').orderByChild('deliveryMethod').equalTo('Курьер').on('value', snap => {
        const data = snap.val();
        if (!data) {
            container.innerHTML = '<div class="empty-state">Нет заказов для доставки</div>';
            return;
        }
        let html = '';
        for (let key in data) {
            const o = data[key];
            if (o.status === 'Выдан' || o.status === 'Доставлен') continue;
            html += `
                <div class="member-item">
                    <div>
                        <strong>👤 ${o.clientName || 'Клиент'}</strong>
                        <span style="font-size:0.7rem; color:#7a8a9e; display:block;">📱 ${o.clientPhone || ''}</span>
                        <span style="font-size:0.8rem;">📦 ${o.items}</span>
                        <span style="font-size:0.7rem; color:#3e5f7e;">💰 ${o.total} ₽</span>
                        <span style="font-size:0.7rem; color:#7a8a9e;">${o.date}</span>
                        <span class="badge" style="background:${o.status === 'Готов к выдаче' ? '#1d6f2c' : '#f6b83d'};">${o.status}</span>
                    </div>
                    <button onclick="deliverOrder('${key}')" class="btn-success">✅ Доставить</button>
                </div>
            `;
        }
        container.innerHTML = html || '<div class="empty-state">Нет заказов для доставки</div>';
    });
}

function deliverOrder(orderId) {
    if (!confirm('Отметить заказ как доставленный?')) return;
    
    db.ref('orders/' + orderId).update({
        status: 'Доставлен',
        deliveredAt: new Date().toLocaleString('ru-RU'),
        courierId: user.id,
        courierName: user.fullName
    }).then(() => {
        showToast('✅ Заказ доставлен!');
        loadCourierOrders();
    });
}

function showToast(msg, isError = false) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.style.display = 'block';
    toast.style.background = isError ? '#b33a34' : '#1d6f2c';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.style.display = 'none', 2500);
}
