// ===== СОТРУДНИК =====

const user = checkAuth();
if (!user || user.role !== 'employee') {
    window.location.href = 'index.html';
}

let currentClient = null;
let currentOrders = [];

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('employeeName').innerHTML = `👤 ${user.fullName}`;
    
    document.getElementById('receiveBarcode').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') findOrdersByProduct();
    });
    document.getElementById('returnBarcode').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') processReturn();
    });
});

// ===== ПОИСК КЛИЕНТА ПО QR =====
function findClientByQR() {
    const qr = document.getElementById('clientQRInput').value.trim();
    if (!qr) {
        showToast('❌ Введите или отсканируйте QR-код', true);
        return;
    }
    
    // QR формат: 250633891_02872_160998_1
    const parts = qr.split('_');
    if (parts.length < 4) {
        showToast('❌ Неверный формат QR-кода', true);
        return;
    }
    
    const orderId = parts[0] + '_' + parts[1];
    const clientId = parts[2];
    
    // Ищем клиента по ID
    db.ref('clients/' + clientId).once('value', snap => {
        const client = snap.val();
        if (!client) {
            showToast('❌ Клиент не найден', true);
            return;
        }
        
        currentClient = { id: clientId, ...client };
        const container = document.getElementById('foundClient');
        container.style.display = 'flex';
        container.innerHTML = `
            <div class="member-info">
                <div>
                    <strong>${client.fullName || 'Клиент'}</strong><br>
                    <span class="badge">📱 ${client.phone}</span>
                    <span class="badge">⭐ ${client.balance || 0} баллов</span>
                    <span style="font-size:0.7rem; color:#3e5f7e; display:block;">Заказ: ${orderId}</span>
                </div>
            </div>
            <button class="small-btn danger" onclick="clearClient()">✕</button>
        `;
        showToast(`✅ Клиент найден: ${client.fullName || 'Клиент'}`);
    });
}

function clearClient() {
    currentClient = null;
    document.getElementById('foundClient').style.display = 'none';
    document.getElementById('foundClient').innerHTML = '';
    document.getElementById('clientQRInput').value = '';
}

// ===== ПРИЕМ ТОВАРА =====
function findOrdersByProduct() {
    const barcode = document.getElementById('receiveBarcode').value.trim();
    if (!barcode) {
        showToast('❌ Отсканируйте штрихкод товара', true);
        return;
    }
    
    const container = document.getElementById('foundOrders');
    container.innerHTML = '<div class="loading-spinner">Поиск заказов...</div>';
    
    // Ищем товар по штрихкоду
    db.ref('products').orderByChild('barcode').equalTo(barcode).once('value', snap => {
        let product = null;
        let productId = null;
        snap.forEach(child => {
            product = child.val();
            productId = child.key;
        });
        
        if (!product) {
            container.innerHTML = '<div class="empty-state">❌ Товар не найден</div>';
            return;
        }
        
        // Ищем заказы с этим товаром
        db.ref('orders').orderByChild('status').equalTo('Ожидает').once('value', snap2 => {
            const orders = snap2.val();
            if (!orders) {
                container.innerHTML = '<div class="empty-state">Нет заказов с этим товаром</div>';
                return;
            }
            
            let html = `<div style="margin-bottom:8px; font-weight:bold;">📦 Товар: ${product.name}</div>`;
            let found = false;
            
            for (let key in orders) {
                const order = orders[key];
                if (order.items && order.items.includes(product.name)) {
                    found = true;
                    const size = product.size === 'large' ? '🚚 Большой' : '📦 Маленький';
                    html += `
                        <div class="member-item">
                            <div>
                                <strong>👤 ${order.clientName || 'Клиент'}</strong>
                                <span style="font-size:0.7rem; color:#7a8a9e; display:block;">📱 ${order.clientPhone || ''}</span>
                                <span style="font-size:0.7rem; color:#3e5f7e;">${order.items}</span>
                                <span style="font-size:0.7rem; color:#7a8a9e;">${order.date}</span>
                                <span class="badge">${size}</span>
                            </div>
                            <button onclick="markOrderReady('${key}', '${barcode}')" class="btn-success">✅ Готов к выдаче</button>
                        </div>
                    `;
                }
            }
            
            container.innerHTML = found ? html : '<div class="empty-state">Нет заказов с этим товаром</div>';
            currentOrders = [];
        });
    });
}

function markOrderReady(orderId, barcode) {
    if (!confirm('Отметить заказ как готовый к выдаче?')) return;
    
    db.ref('orders/' + orderId).update({
        status: 'Готов к выдаче',
        readyAt: new Date().toLocaleString('ru-RU'),
        employeeId: user.id,
        employeeName: user.fullName
    }).then(() => {
        showToast('✅ Заказ отмечен как готовый к выдаче');
        document.getElementById('receiveBarcode').value = '';
        document.getElementById('foundOrders').innerHTML = '';
    });
}

// ===== ВЫДАЧА/ВОЗВРАТ =====
function processReturn() {
    const barcode = document.getElementById('returnBarcode').value.trim();
    const quantity = parseInt(document.getElementById('returnQuantity').value) || 1;
    const resultDiv = document.getElementById('returnResult');
    
    if (!barcode) {
        showToast('❌ Отсканируйте штрихкод товара', true);
        return;
    }
    
    if (!currentClient) {
        showToast('❌ Сначала найдите клиента по QR-коду', true);
        return;
    }
    
    // Ищем товар
    db.ref('products').orderByChild('barcode').equalTo(barcode).once('value', snap => {
        let product = null;
        snap.forEach(child => {
            product = child.val();
        });
        
        if (!product) {
            resultDiv.innerHTML = '<div style="color:#b33a34;">❌ Товар не найден</div>';
            return;
        }
        
        // Ищем заказы клиента
        db.ref('orders').orderByChild('clientId').equalTo(currentClient.id).once('value', snap2 => {
            const orders = snap2.val();
            if (!orders) {
                resultDiv.innerHTML = '<div style="color:#b33a34;">❌ У клиента нет заказов</div>';
                return;
            }
            
            let foundOrder = null;
            let foundKey = null;
            for (let key in orders) {
                const order = orders[key];
                if (order.status === 'Готов к выдаче' && order.items && order.items.includes(product.name)) {
                    foundOrder = order;
                    foundKey = key;
                    break;
                }
            }
            
            if (!foundOrder) {
                resultDiv.innerHTML = '<div style="color:#b33a34;">❌ Нет готовых заказов с этим товаром</div>';
                return;
            }
            
            // Отмечаем товар как выданный
            db.ref('orders/' + foundKey).update({
                status: 'Выдан',
                issuedAt: new Date().toLocaleString('ru-RU'),
                issuedBy: user.fullName
            }).then(() => {
                resultDiv.innerHTML = `
                    <div style="color:#1d6f2c; padding:12px; background:#f0f9f0; border-radius:16px;">
                        ✅ Товар "${product.name}" выдан клиенту ${currentClient.fullName || 'Клиент'}
                        <br>Количество: ${quantity} шт.
                    </div>
                `;
                document.getElementById('returnBarcode').value = '';
                document.getElementById('returnQuantity').value = '1';
                showToast('✅ Товар выдан');
            });
        });
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
