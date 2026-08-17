// ===== СОТРУДНИК =====

const user = checkAuth();
if (!user || user.role !== 'employee') {
    window.location.href = 'index.html';
}

let currentClient = null;
let foundProduct = null;

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('employeeName').innerHTML = `👤 ${user.fullName}`;
    
    // Обработчики Enter
    document.getElementById('receiveBarcode').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') findOrdersByProduct();
    });
    document.getElementById('returnBarcode').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') processReturn();
    });
    document.getElementById('clientQRInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') findClientByQR();
    });
});

// ===== ПОИСК КЛИЕНТА ПО QR =====
function findClientByQR() {
    const qr = document.getElementById('clientQRInput').value.trim();
    if (!qr) {
        showToast('❌ Введите или отсканируйте QR-код', true);
        return;
    }
    
    // Очищаем от лишних символов
    const cleanQR = qr.replace(/[^0-9_]/g, '');
    const parts = cleanQR.split('_');
    
    if (parts.length < 2) {
        showToast('❌ Неверный формат QR-кода', true);
        return;
    }
    
    const orderId = parts[0];
    const clientId = parts[1];
    
    if (!clientId) {
        showToast('❌ ID клиента не найден в QR-коде', true);
        return;
    }
    
    // Ищем клиента по ID
    db.ref('clients').once('value', snap => {
        const clients = snap.val();
        if (!clients) {
            showToast('❌ Клиенты не найдены', true);
            return;
        }
        
        let foundClient = null;
        let foundKey = null;
        
        // Ищем клиента по ID
        for (let key in clients) {
            if (key === clientId || key.includes(clientId) || clientId.includes(key)) {
                foundClient = clients[key];
                foundKey = key;
                break;
            }
        }
        
        if (!foundClient) {
            showToast('❌ Клиент с ID ' + clientId + ' не найден', true);
            return;
        }
        
        currentClient = { id: foundKey, ...foundClient };
        const container = document.getElementById('foundClient');
        container.style.display = 'flex';
        container.innerHTML = `
            <div class="member-info">
                <div>
                    <strong>${foundClient.fullName || 'Клиент'}</strong>
                    <br><span class="badge">📱 ${foundClient.phone || 'Не указан'}</span>
                    <span class="badge">⭐ ${foundClient.balance || 0} баллов</span>
                    <span style="font-size:0.7rem; color:#3e5f7e; display:block;">ID: ${foundKey}</span>
                    ${orderId ? `<span style="font-size:0.7rem; color:#3e5f7e; display:block;">Заказ: ${orderId}</span>` : ''}
                </div>
            </div>
            <button class="small-btn danger" onclick="clearClient()">✕</button>
        `;
        showToast(`✅ Клиент найден: ${foundClient.fullName || 'Клиент'}`);
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
    container.innerHTML = '<div class="loading-spinner">Поиск...</div>';
    
    // Сначала ищем товар по штрихкоду
    db.ref('products').orderByChild('barcode').equalTo(barcode).once('value', snap => {
        let product = null;
        let productId = null;
        snap.forEach(child => {
            product = child.val();
            productId = child.key;
        });
        
        if (!product) {
            container.innerHTML = `
                <div class="empty-state" style="color:#b33a34; border:1px solid #b33a34;">
                    ❌ Товар с штрихкодом ${barcode} не найден в базе
                </div>
            `;
            showToast('❌ Товар не найден', true);
            return;
        }
        
        foundProduct = { id: productId, ...product };
        showToast(`✅ Товар найден: ${product.name}`);
        
        // Теперь ищем заказы с этим товаром
        db.ref('orders').once('value', snap2 => {
            const orders = snap2.val();
            if (!orders) {
                container.innerHTML = '<div class="empty-state">Нет заказов</div>';
                return;
            }
            
            let html = `
                <div style="margin-bottom:12px; padding:12px; background:#f0f9f0; border-radius:16px; border:1px solid #1d6f2c;">
                    <strong>📦 Найден товар:</strong> ${product.name}
                    <br><span style="font-size:0.8rem; color:#3e5f7e;">Штрихкод: ${product.barcode} | Цена: ${product.price} ₽</span>
                </div>
            `;
            
            let found = false;
            let orderCount = 0;
            
            for (let key in orders) {
                const order = orders[key];
                // Проверяем, содержит ли заказ этот товар
                if (order.items && order.items.includes(product.name)) {
                    found = true;
                    orderCount++;
                    const statusColors = {
                        'Ожидает': '#f6b83d',
                        'Готов к выдаче': '#1d6f2c',
                        'Выдан': '#7a8a9e',
                        'Доставлен': '#7a8a9e'
                    };
                    
                    html += `
                        <div class="member-item" style="margin-top:8px; ${order.status === 'Готов к выдаче' ? 'border:2px solid #1d6f2c;' : ''}">
                            <div>
                                <strong>👤 ${order.clientName || 'Клиент'}</strong>
                                <span style="font-size:0.7rem; color:#7a8a9e; display:block;">📱 ${order.clientPhone || ''}</span>
                                <span style="font-size:0.7rem; color:#3e5f7e;">📦 ${order.items}</span>
                                <span style="font-size:0.7rem; color:#7a8a9e;">📅 ${order.date}</span>
                                <span style="font-size:0.7rem; color:#3e5f7e;">💳 ${order.paymentMethod || 'Не указан'}</span>
                                <span class="badge" style="background:${statusColors[order.status] || '#7a8a9e'}; color:white;">${order.status}</span>
                            </div>
                            ${order.status === 'Ожидает' ? 
                                `<button onclick="markOrderReady('${key}')" class="btn-success">✅ Готов к выдаче</button>` :
                                order.status === 'Готов к выдаче' ?
                                `<span class="badge" style="background:#1d6f2c; color:white;">✅ Готов</span>` :
                                `<span class="badge" style="background:#7a8a9e; color:white;">${order.status}</span>`
                            }
                        </div>
                    `;
                }
            }
            
            if (!found) {
                html += `<div class="empty-state">Нет заказов с товаром "${product.name}"</div>`;
            } else {
                html += `<div style="margin-top:8px; font-size:0.8rem; color:#7a8a9e;">Найдено заказов: ${orderCount}</div>`;
            }
            
            container.innerHTML = html;
        });
    });
}

function markOrderReady(orderId) {
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
        findOrdersByProduct();
    }).catch(err => showToast('❌ Ошибка: ' + err.message, true));
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
    
    // Ищем товар по штрихкоду
    db.ref('products').orderByChild('barcode').equalTo(barcode).once('value', snap => {
        let product = null;
        snap.forEach(child => {
            product = child.val();
        });
        
        if (!product) {
            resultDiv.innerHTML = `
                <div style="color:#b33a34; padding:12px; background:#fee9e9; border-radius:16px;">
                    ❌ Товар с штрихкодом ${barcode} не найден
                </div>
            `;
            return;
        }
        
        // Ищем заказы клиента с этим товаром
        db.ref('orders').orderByChild('clientId').equalTo(currentClient.id).once('value', snap2 => {
            const orders = snap2.val();
            if (!orders) {
                resultDiv.innerHTML = `
                    <div style="color:#b33a34; padding:12px; background:#fee9e9; border-radius:16px;">
                        ❌ У клиента нет заказов
                    </div>
                `;
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
                resultDiv.innerHTML = `
                    <div style="color:#b33a34; padding:12px; background:#fee9e9; border-radius:16px;">
                        ❌ Нет готовых заказов с товаром "${product.name}"
                    </div>
                `;
                return;
            }
            
            // Отмечаем товар как выданный
            db.ref('orders/' + foundKey).update({
                status: 'Выдан',
                issuedAt: new Date().toLocaleString('ru-RU'),
                issuedBy: user.fullName,
                issuedQuantity: quantity
            }).then(() => {
                resultDiv.innerHTML = `
                    <div style="color:#1d6f2c; padding:12px; background:#f0f9f0; border-radius:16px; border:1px solid #1d6f2c;">
                        <strong>✅ Товар выдан!</strong>
                        <br>📦 ${product.name}
                        <br>👤 Клиент: ${currentClient.fullName || 'Клиент'}
                        <br>🔢 Количество: ${quantity} шт.
                        <br>📅 ${new Date().toLocaleString('ru-RU')}
                    </div>
                `;
                document.getElementById('returnBarcode').value = '';
                document.getElementById('returnQuantity').value = '1';
                showToast('✅ Товар выдан клиенту');
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
