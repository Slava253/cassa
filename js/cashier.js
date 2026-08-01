// ===== КАССИР =====

let currentCart = [];
let currentClient = null;
let cartTotal = 0;
let selectedPayment = null;

const user = checkAuth();
if (!user || user.role !== 'cashier') {
    window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('cashierName').innerHTML = `👤 ${user.fullName}`;
    loadCashierHistory();
    updateCartUI();
});

// ===== СОЗДАНИЕ КАРТЫ КЛИЕНТА =====
function cashierCreateClient() {
    const fullName = document.getElementById('cashierClientName').value.trim();
    const phone = document.getElementById('cashierClientPhone').value.trim();
    
    if (!fullName || !phone) {
        showToast('❌ Заполните ФИО и телефон', true);
        return;
    }
    
    db.ref('clients').orderByChild('phone').equalTo(phone).once('value', snap => {
        if (snap.exists()) {
            showToast('❌ Клиент с таким телефоном уже существует', true);
            return;
        }
        
        const cardNumber = '29' + Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
        const data = { 
            fullName, phone, cardNumber, balance: 0, history: [] 
        };
        
        db.ref('clients').push(data).then(() => {
            document.getElementById('cashierClientName').value = '';
            document.getElementById('cashierClientPhone').value = '';
            showToast(`✅ Карта создана! Номер: ${cardNumber}`);
        }).catch(err => showToast('❌ Ошибка: ' + err.message, true));
    });
}

// ===== ДОБАВЛЕНИЕ ТОВАРА В СИСТЕМУ =====
function addProductToSystem() {
    const barcode = document.getElementById('productBarcode').value.trim();
    const name = document.getElementById('productName').value.trim();
    const price = parseFloat(document.getElementById('productPrice').value);
    const discountPrice = parseFloat(document.getElementById('productDiscountPrice').value);
    
    if (!barcode) {
        showToast('❌ Отсканируйте или введите штрихкод товара', true);
        document.getElementById('productBarcode').focus();
        return;
    }
    if (!name) {
        showToast('❌ Введите название товара', true);
        document.getElementById('productName').focus();
        return;
    }
    if (isNaN(price) || price <= 0) {
        showToast('❌ Введите корректную цену', true);
        document.getElementById('productPrice').focus();
        return;
    }
    if (isNaN(discountPrice) || discountPrice <= 0) {
        showToast('❌ Введите цену со скидочной картой', true);
        document.getElementById('productDiscountPrice').focus();
        return;
    }
    
    // Проверяем, есть ли уже товар с таким штрихкодом
    db.ref('products').orderByChild('barcode').equalTo(barcode).once('value', snap => {
        if (snap.exists()) {
            showToast('❌ Товар с таким штрихкодом уже существует!', true);
            return;
        }
        
        const productData = {
            barcode: barcode,
            name: name,
            price: price,
            discountPrice: discountPrice,
            createdAt: new Date().toISOString()
        };
        
        db.ref('products').push(productData).then(() => {
            document.getElementById('productBarcode').value = '';
            document.getElementById('productName').value = '';
            document.getElementById('productPrice').value = '';
            document.getElementById('productDiscountPrice').value = '';
            showToast(`✅ Товар "${name}" добавлен в систему!`);
        }).catch(err => showToast('❌ Ошибка: ' + err.message, true));
    });
}

// ===== ПОИСК КЛИЕНТА =====
function scanClient() {
    const input = document.getElementById('clientScanInput').value.trim();
    if (!input) {
        showToast('❌ Введите номер карты или телефон', true);
        return;
    }
    
    db.ref('clients').once('value', snap => {
        const clients = snap.val();
        let found = null;
        let foundId = null;
        for (let key in clients) {
            const c = clients[key];
            if (c.cardNumber === input || c.phone === input) {
                found = c;
                foundId = key;
                break;
            }
        }
        if (found) {
            currentClient = { id: foundId, ...found };
            const container = document.getElementById('scannedClient');
            container.style.display = 'flex';
            container.innerHTML = `
                <div class="member-info">
                    <div>
                        <strong>${found.fullName}</strong><br>
                        <span class="badge">🎫 ${found.cardNumber}</span><br>
                        <span style="font-size:0.8rem;">⭐ ${found.balance || 0} баллов</span>
                    </div>
                </div>
                <button class="small-btn danger" onclick="clearScannedClient()">✕ Очистить</button>
            `;
            showToast(`🎫 Клиент найден: ${found.fullName}`);
        } else {
            showToast('❌ Клиент не найден. Создайте карту!', true);
        }
        document.getElementById('clientScanInput').value = '';
    });
}

function clearScannedClient() {
    currentClient = null;
    document.getElementById('scannedClient').style.display = 'none';
    document.getElementById('scannedClient').innerHTML = '';
}

// ===== ДОБАВЛЕНИЕ В КОРЗИНУ ПО ШТРИХКОДУ =====
function addToCart() {
    const barcode = document.getElementById('cartBarcodeInput').value.trim();
    const quantity = parseInt(document.getElementById('cartQuantity').value) || 1;
    
    if (!barcode) {
        showToast('❌ Отсканируйте штрихкод товара', true);
        document.getElementById('cartBarcodeInput').focus();
        return;
    }
    
    // Ищем товар в базе по штрихкоду
    db.ref('products').orderByChild('barcode').equalTo(barcode).once('value', snap => {
        let product = null;
        let productId = null;
        snap.forEach(child => {
            product = child.val();
            productId = child.key;
        });
        
        if (!product) {
            showToast(`❌ Товар с штрихкодом ${barcode} не найден в системе!`, true);
            document.getElementById('cartBarcodeInput').value = '';
            document.getElementById('cartBarcodeInput').focus();
            return;
        }
        
        // Определяем цену (со скидкой или без)
        const price = currentClient ? product.discountPrice : product.price;
        
        // Проверяем, есть ли уже такой товар в корзине
        const existing = currentCart.find(item => item.barcode === barcode);
        if (existing) {
            existing.quantity += quantity;
            showToast(`➕ ${product.name} +${quantity} (всего ${existing.quantity})`);
        } else {
            currentCart.push({
                barcode: barcode,
                name: product.name,
                price: price,
                quantity: quantity,
                productId: productId
            });
            showToast(`✅ ${product.name} добавлен (${quantity} шт.) по ${price.toFixed(2)} ₽`);
        }
        
        document.getElementById('cartBarcodeInput').value = '';
        document.getElementById('cartQuantity').value = '1';
        updateCartUI();
    });
}

// ===== КОРЗИНА =====
function updateCartUI() {
    const container = document.getElementById('cartList');
    cartTotal = currentCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    document.getElementById('cartTotal').innerText = cartTotal.toFixed(2);
    
    if (currentCart.length === 0) {
        container.innerHTML = '<div class="empty-state">Корзина пуста</div>';
        return;
    }
    
    let html = '';
    currentCart.forEach((item, idx) => {
        html += `
            <div class="history-item">
                <div>
                    <strong>${item.name}</strong>
                    <span style="font-size:0.7rem; color:#7a8a9e; display:block;">Штрихкод: ${item.barcode}</span>
                </div>
                <div style="text-align:right;">
                    ${item.quantity} шт. × ${item.price.toFixed(2)} ₽ = ${(item.price * item.quantity).toFixed(2)} ₽
                    <button class="small-btn danger" onclick="removeFromCart(${idx})" style="display:block; margin-top:4px;">✕ Удалить</button>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function removeFromCart(idx) {
    currentCart.splice(idx, 1);
    updateCartUI();
    showToast('🗑 Товар удалён из корзины');
}

function clearCart() {
    if (currentCart.length === 0) return;
    if (!confirm('Очистить корзину?')) return;
    currentCart = [];
    selectedPayment = null;
    document.querySelectorAll('.payment-btn').forEach(b => b.style.background = '#eef2f8');
    document.getElementById('cashInputArea').style.display = 'none';
    document.getElementById('changeDisplay').style.display = 'none';
    updateCartUI();
    showToast('🗑 Корзина очищена');
}

// ===== ВЫБОР СПОСОБА ОПЛАТЫ =====
function selectPayment(method) {
    selectedPayment = method;
    document.querySelectorAll('.payment-btn').forEach(b => b.style.background = '#eef2f8');
    document.getElementById('payCash').style.background = method === 'cash' ? '#1d6f2c' : '#eef2f8';
    document.getElementById('payCash').style.color = method === 'cash' ? 'white' : '#1a1a2e';
    document.getElementById('payCard').style.background = method === 'card' ? '#1a1a2e' : '#eef2f8';
    document.getElementById('payCard').style.color = method === 'card' ? 'white' : '#1a1a2e';
    
    document.getElementById('cashInputArea').style.display = method === 'cash' ? 'block' : 'none';
    if (method === 'cash') {
        document.getElementById('cashGiven').focus();
        document.getElementById('cashGiven').addEventListener('input', calculateChange);
    }
}

function calculateChange() {
    const total = cartTotal;
    const given = parseFloat(document.getElementById('cashGiven').value);
    if (!isNaN(given) && given >= total) {
        document.getElementById('changeAmount').innerText = (given - total).toFixed(2) + ' ₽';
        document.getElementById('changeDisplay').style.display = 'block';
    } else {
        document.getElementById('changeDisplay').style.display = 'none';
    }
}

// ===== ОПЛАТА =====
async function processPayment() {
    if (currentCart.length === 0) {
        showToast('❌ Корзина пуста!', true);
        return;
    }
    
    if (!selectedPayment) {
        showToast('❌ Выберите способ оплаты!', true);
        return;
    }
    
    const total = cartTotal;
    const points = Math.floor(total / 100) * 5;
    
    // Проверка для наличных
    if (selectedPayment === 'cash') {
        const given = parseFloat(document.getElementById('cashGiven').value);
        if (isNaN(given) || given < total) {
            showToast('❌ Недостаточно средств!', true);
            return;
        }
        const change = given - total;
        showToast(`💰 Оплачено наличными: ${total.toFixed(2)} ₽, сдача: ${change.toFixed(2)} ₽`);
    } else {
        showToast(`💳 Оплачено картой: ${total.toFixed(2)} ₽`);
    }
    
    const purchase = {
        date: new Date().toLocaleString('ru-RU'),
        total: total,
        points: points,
        items: currentCart.map(i => `${i.name} x${i.quantity}`).join(', '),
        cashier: user.fullName,
        paymentMethod: selectedPayment === 'cash' ? 'Наличные' : 'Карта'
    };
    
    try {
        // Если есть клиент - начисляем баллы
        if (currentClient) {
            const clientRef = db.ref('clients/' + currentClient.id);
            const snap = await clientRef.once('value');
            const data = snap.val() || {};
            const history = data.history || [];
            history.push(purchase);
            await clientRef.update({
                balance: (data.balance || 0) + points,
                history: history
            });
            showToast(`🎉 Начислено ${points} баллов!`);
        }
        
        // Сохраняем в историю кассира
        const cashierPurchase = {
            ...purchase,
            clientName: currentClient ? currentClient.fullName : 'Без карты'
        };
        await db.ref('cashier_history').push(cashierPurchase);
        
        // Очищаем корзину
        currentCart = [];
        selectedPayment = null;
        clearScannedClient();
        document.querySelectorAll('.payment-btn').forEach(b => b.style.background = '#eef2f8');
        document.getElementById('cashInputArea').style.display = 'none';
        document.getElementById('changeDisplay').style.display = 'none';
        document.getElementById('cashGiven').value = '';
        updateCartUI();
        loadCashierHistory();
        
    } catch(err) {
        showToast('❌ Ошибка: ' + err.message, true);
    }
}

// ===== ИСТОРИЯ =====
function loadCashierHistory() {
    const container = document.getElementById('cashierHistory');
    container.innerHTML = '<div class="loading-spinner">Загрузка...</div>';
    
    db.ref('cashier_history').orderByChild('date').limitToLast(50).on('value', snap => {
        const data = snap.val();
        if (!data) {
            container.innerHTML = '<div class="empty-state">Нет покупок</div>';
            return;
        }
        let html = '';
        const items = Object.values(data).reverse();
        items.forEach(item => {
            html += `
                <div class="history-item">
                    <div>
                        <strong>${item.clientName || 'Без карты'}</strong>
                        <span style="font-size:0.7rem; color:#7a8a9e; display:block;">${item.date}</span>
                        <span style="font-size:0.7rem; color:#3e5f7e;">${item.paymentMethod || 'Не указан'}</span>
                    </div>
                    <div style="text-align:right;">
                        <strong>${item.total} ₽</strong>
                        <span class="badge" style="display:block; margin-top:4px;">+${item.points} баллов</span>
                        <span style="font-size:0.6rem; color:#7a8a9e;">${item.items || ''}</span>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    });
}

// ===== TOAST =====
function showToast(msg, isError = false) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.style.display = 'block';
    toast.style.background = isError ? '#b33a34' : '#1d6f2c';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.style.display = 'none', 3000);
}
