// ===== КЛИЕНТ =====

const user = checkAuth();
if (!user || user.role !== 'client') {
    window.location.href = 'index.html';
}

let cart = [];
let currentBarcodeColor = '#000000';

document.addEventListener('DOMContentLoaded', function() {
    // Заполняем информацию
    document.getElementById('clientName').innerHTML = `👤 ${user.nickname || user.fullName || 'Клиент'}`;
    document.getElementById('clientStoreDisplay').innerHTML = 'Личный кабинет';
    document.getElementById('profilePhone').value = user.phone || '';
    document.getElementById('profileNickname').value = user.nickname || '';
    document.getElementById('profileCardNumber').value = user.cardNumber || '';
    document.getElementById('profileBalance').value = (user.balance || 0) + ' баллов';
    
    // Обновляем информацию
    updateClientInfo();
    
    // Генерируем QR
    generateQR(user.cardNumber || user.id);
    
    // Загружаем данные
    loadProducts();
    loadOrders();
    updateCart();
    
    if (user.nickname) {
        document.getElementById('nicknameStatus').innerHTML = `✅ Никнейм установлен: ${user.nickname}`;
        document.getElementById('nicknameStatus').style.color = '#1d6f2c';
    }
    
    // Обработчики для Enter
    document.getElementById('profileNickname').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') saveNickname();
    });
});

// ===== ОБНОВЛЕНИЕ ИНФОРМАЦИИ =====
function updateClientInfo() {
    const displayName = user.nickname || user.fullName || 'Клиент';
    document.getElementById('clientInfo').innerHTML = `
        <div>
            <h3>${displayName}</h3>
            ${user.nickname ? `<span style="font-size:0.8rem; color:#7a8a9e;">(${user.fullName || 'Клиент'})</span><br>` : ''}
            <span class="badge">🎫 Карта: ${user.cardNumber}</span><br>
            <span style="font-size:0.8rem;">📱 ${user.phone || 'Не указан'}</span><br>
            <span class="badge">⭐ ${user.balance || 0} баллов</span>
        </div>
    `;
    document.getElementById('clientName').innerHTML = `👤 ${displayName}`;
}

// ===== ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК =====
function switchClientTab(tab) {
    document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    const target = document.getElementById('client-' + tab);
    if (target) target.style.display = 'block';
    document.querySelector(`.tab-btn[data-tab="client-${tab}"]`)?.classList.add('active');
}

// ===== ТОВАРЫ =====
function loadProducts() {
    const container = document.getElementById('productsList');
    container.innerHTML = '<div class="loading-spinner">Загрузка...</div>';
    
    db.ref('products').on('value', snap => {
        const data = snap.val();
        if (!data) {
            container.innerHTML = '<div class="empty-state">Нет товаров</div>';
            return;
        }
        let html = '';
        for (let key in data) {
            const p = data[key];
            const inCart = cart.find(item => item.id === key);
            const sizeLabel = p.size === 'large' ? '🚚 Только доставка' : '📦 ПВЗ';
            html += `
                <div class="history-item">
                    <div>
                        <strong>${p.name}</strong>
                        <span style="font-size:0.7rem; color:#7a8a9e; display:block;">${p.barcode}</span>
                        <span class="badge">💰 ${p.price} ₽</span>
                        <span class="badge">${sizeLabel}</span>
                    </div>
                    <div>
                        ${inCart ? 
                            `<span class="badge" style="background:#1d6f2c; color:white;">✅ В корзине</span>` :
                            `<button onclick="addToCart('${key}', '${p.name}', ${p.price}, '${p.size}')" class="small-btn">➕ В корзину</button>`
                        }
                    </div>
                </div>
            `;
        }
        container.innerHTML = html;
    });
}

function addToCart(id, name, price, size) {
    if (cart.find(item => item.id === id)) {
        showToast('❌ Товар уже в корзине', true);
        return;
    }
    cart.push({ id, name, price, size, quantity: 1 });
    loadProducts();
    updateCart();
    showToast(`✅ "${name}" добавлен в корзину`);
}

// ===== КОРЗИНА =====
function updateCart() {
    const container = document.getElementById('cartList');
    if (cart.length === 0) {
        container.innerHTML = '<div class="empty-state">Корзина пуста</div>';
        return;
    }
    let html = '';
    let total = 0;
    cart.forEach((item, idx) => {
        total += item.price;
        html += `
            <div class="history-item">
                <div>${item.name}</div>
                <div>${item.price} ₽ <button onclick="removeFromCart(${idx})" class="small-btn danger">✕</button></div>
            </div>
        `;
    });
    html += `<div style="margin-top:8px; font-weight:bold;">Итого: ${total} ₽</div>`;
    container.innerHTML = html;
}

function removeFromCart(idx) {
    cart.splice(idx, 1);
    updateCart();
    loadProducts();
    showToast('🗑 Товар удалён из корзины');
}

// ===== ЗАКАЗ =====
function placeOrder() {
    if (cart.length === 0) {
        showToast('❌ Корзина пуста', true);
        return;
    }
    
    const hasLarge = cart.some(item => item.size === 'large');
    const deliveryMethod = hasLarge ? 'Курьер' : 'ПВЗ';
    
    const paymentMethod = confirm('Оплатить сразу? Нажмите OK - Сразу, Отмена - При получении');
    const payment = paymentMethod ? 'Сразу' : 'При получении';
    
    const orderData = {
        clientId: user.id,
        clientName: user.nickname || user.fullName || 'Клиент',
        clientPhone: user.phone,
        items: cart.map(i => i.name).join(', '),
        total: cart.reduce((sum, i) => sum + i.price, 0),
        deliveryMethod: deliveryMethod,
        paymentMethod: payment,
        status: 'Ожидает',
        date: new Date().toLocaleString('ru-RU'),
        cart: cart
    };
    
    db.ref('orders').push(orderData).then(ref => {
        const orderId = ref.key;
        // Генерируем QR только из цифр
        const cleanOrderId = orderId.replace(/\D/g, '');
        const cleanClientId = user.id.replace(/\D/g, '');
        const timestamp = Date.now().toString();
        const qrData = cleanOrderId + '_' + cleanClientId + '_' + timestamp;
        generateQR(qrData);
        
        cart = [];
        updateCart();
        loadProducts();
        loadOrders();
        showToast(`✅ Заказ оформлен! QR-код сгенерирован. Доставка: ${deliveryMethod}, Оплата: ${payment}`);
    });
}

function loadOrders() {
    const container = document.getElementById('ordersList');
    container.innerHTML = '<div class="loading-spinner">Загрузка...</div>';
    
    db.ref('orders').orderByChild('clientId').equalTo(user.id).on('value', snap => {
        const data = snap.val();
        if (!data) {
            container.innerHTML = '<div class="empty-state">Нет заказов</div>';
            return;
        }
        let html = '';
        for (let key in data) {
            const o = data[key];
            const statusColors = {
                'Ожидает': '#f6b83d',
                'Готов к выдаче': '#1d6f2c',
                'Выдан': '#7a8a9e',
                'Доставлен': '#7a8a9e'
            };
            const cleanOrderId = key.replace(/\D/g, '').slice(0, 8);
            html += `
                <div class="history-item">
                    <div>
                        <strong>📦 Заказ #${cleanOrderId || key.slice(0,8)}</strong>
                        <span style="font-size:0.7rem; color:#7a8a9e; display:block;">${o.date}</span>
                        <span style="font-size:0.7rem; color:#3e5f7e;">${o.items}</span>
                        <span style="font-size:0.7rem; color:#3e5f7e;">🚚 ${o.deliveryMethod} | 💳 ${o.paymentMethod}</span>
                    </div>
                    <div style="text-align:right;">
                        <div><strong>${o.total} ₽</strong></div>
                        <span class="badge" style="background:${statusColors[o.status] || '#7a8a9e'}; color:white;">${o.status}</span>
                        ${o.status === 'Готов к выдаче' ? '<div style="font-size:0.6rem; color:#1d6f2c;">✅ Готов к выдаче</div>' : ''}
                    </div>
                </div>
            `;
        }
        container.innerHTML = html;
    });
}

// ===== QR-КОД =====
function generateQR(data) {
    const canvas = document.getElementById('qrCanvas');
    if (!canvas) return;
    
    const cleanData = data.replace(/[^0-9_]/g, '');
    const qrData = cleanData || user.cardNumber || user.id;
    
    try {
        if (typeof QRCode !== 'undefined') {
            const qr = new QRCode({
                element: canvas,
                value: qrData,
                size: 200,
                bgColor: '#ffffff',
                fgColor: currentBarcodeColor || '#1a1a2e'
            });
            document.getElementById('qrDataDisplay').textContent = `QR: ${qrData}`;
        } else {
            document.getElementById('qrDataDisplay').textContent = `QR: ${qrData}`;
            canvas.style.display = 'none';
        }
    } catch(e) {
        console.error('QR error:', e);
        document.getElementById('qrDataDisplay').textContent = `QR: ${qrData}`;
    }
}

function changeBarcodeColor(color) {
    currentBarcodeColor = color;
    const qrData = document.getElementById('qrDataDisplay').textContent.replace('QR: ', '');
    generateQR(qrData || user.cardNumber || user.id);
    showToast('🎨 Цвет QR-кода изменён');
}

// ===== СОХРАНЕНИЕ НИКНЕЙМА =====
function saveNickname() {
    const nickname = document.getElementById('profileNickname').value.trim();
    if (!nickname) {
        showToast('❌ Введите никнейм', true);
        return;
    }
    
    const clientId = user.id;
    db.ref('clients/' + clientId).update({ nickname: nickname }).then(() => {
        user.nickname = nickname;
        localStorage.setItem('marka_user', JSON.stringify(user));
        updateClientInfo();
        document.getElementById('nicknameStatus').innerHTML = `✅ Никнейм сохранён: ${nickname}`;
        document.getElementById('nicknameStatus').style.color = '#1d6f2c';
        showToast(`✅ Никнейм "${nickname}" сохранён!`);
    }).catch(err => showToast('❌ Ошибка: ' + err.message, true));
}

// ===== TOAST =====
function showToast(msg, isError = false) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.style.display = 'block';
    toast.style.background = isError ? '#b33a34' : '#1d6f2c';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.style.display = 'none', 2500);
}
