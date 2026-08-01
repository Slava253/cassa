// ===== КАССИР =====

let currentCart = [];
let currentClient = null;
let cartTotal = 0;
let selectedPayment = null;
let discountAmount = 0;

const user = checkAuth();
if (!user || user.role !== 'cashier') {
    window.location.href = 'index.html';
}

const storeId = user.storeId;
const storeName = user.storeName || 'Магазин';

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('cashierName').innerHTML = `👤 ${user.fullName}`;
    document.getElementById('cashierStoreDisplay').innerHTML = `🏪 ${storeName}`;
    loadCashierHistory();
    updateCartUI();
});

// ===== ПОИСК КЛИЕНТА =====
function scanClient() {
    const input = document.getElementById('clientScanInput').value.trim();
    if (!input) {
        showToast('❌ Введите номер карты или отсканируйте штрихкод', true);
        return;
    }
    
    const cleanInput = input.replace(/\D/g, '');
    
    db.ref('clients').once('value', snap => {
        const clients = snap.val();
        let found = null;
        let foundId = null;
        
        for (let key in clients) {
            const c = clients[key];
            if (c.cardNumber === cleanInput || c.phone === input || c.phone === cleanInput) {
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
            
            // Показываем секцию списания баллов
            document.getElementById('discountSection').style.display = 'block';
            document.getElementById('clientPointsDisplay').innerText = found.balance || 0;
            document.getElementById('discountInfo').innerHTML = '';
            discountAmount = 0;
            updateCartUI();
            
            showToast(`🎫 Клиент найден: ${found.fullName}`);
        } else {
            showToast('❌ Клиент не найден', true);
            document.getElementById('discountSection').style.display = 'none';
        }
        document.getElementById('clientScanInput').value = '';
    });
}

function clearScannedClient() {
    currentClient = null;
    discountAmount = 0;
    document.getElementById('scannedClient').style.display = 'none';
    document.getElementById('scannedClient').innerHTML = '';
    document.getElementById('discountSection').style.display = 'none';
    document.getElementById('discountInfo').innerHTML = '';
    updateCartUI();
}

// ===== СПИСАНИЕ БАЛЛОВ =====
function applyDiscount() {
    if (!currentClient) {
        showToast('❌ Сначала найдите клиента!', true);
        return;
    }
    
    const total = cartTotal;
    if (total <= 0) {
        showToast('❌ Корзина пуста!', true);
        return;
    }
    
    const availablePoints = currentClient.balance || 0;
    const maxDiscount = Math.floor(availablePoints / 10);
    
    if (maxDiscount <= 0) {
        showToast('❌ Недостаточно баллов для списания!', true);
        return;
    }
    
    // Списание баллов: 10 баллов = 1 ₽
    const useAmount = Math.min(total, maxDiscount);
    discountAmount = useAmount;
    
    // Обновляем отображение
    document.getElementById('discountInfo').innerHTML = `✅ Списано ${useAmount * 10} баллов = ${useAmount.toFixed(2)} ₽ скидки`;
    document.getElementById('discountInfo').style.color = '#1d6f2c';
    document.getElementById('clientPointsDisplay').innerText = currentClient.balance - (useAmount * 10);
    
    updateCartUI();
    showToast(`✨ Списано ${useAmount * 10} баллов (${useAmount.toFixed(2)} ₽)`);
}

function removeDiscount() {
    if (discountAmount > 0) {
        discountAmount = 0;
        document.getElementById('discountInfo').innerHTML = '❌ Скидка отменена';
        document.getElementById('discountInfo').style.color = '#b33a34';
        document.getElementById('clientPointsDisplay').innerText = currentClient ? currentClient.balance : 0;
        updateCartUI();
        showToast('❌ Скидка убрана');
    }
}

// ===== ДОБАВЛЕНИЕ ТОВАРА В СИСТЕМУ =====
function addProductToSystem() {
    const barcode = document.getElementById('productBarcode').value.trim();
    const name = document.getElementById('productName').value.trim();
    const price = parseFloat(document.getElementById('productPrice').value);
    const discountPrice = parseFloat(document.getElementById('productDiscountPrice').value);
    
    if (!barcode || !name || isNaN(price) || price <= 0 || isNaN(discountPrice) || discountPrice <= 0) {
        showToast('❌ Заполните все поля!', true);
        return;
    }
    
    db.ref('stores/' + storeId + '/products').orderByChild('barcode').equalTo(barcode).once('value', snap => {
        if (snap.exists()) {
            showToast('❌ Товар с таким штрихкодом уже есть!', true);
            return;
        }
        
        const productData = {
            barcode: barcode,
            name: name,
            price: price,
            discountPrice: discountPrice,
            createdAt: new Date().toISOString()
        };
        
        db.ref('stores/' + storeId + '/products').push(productData).then(() => {
            document.getElementById('productBarcode').value = '';
            document.getElementById('productName').value = '';
            document.getElementById('productPrice').value = '';
            document.getElementById('productDiscountPrice').value = '';
            showToast(`✅ Товар "${name}" добавлен!`);
        }).catch(err => showToast('❌ Ошибка: ' + err.message, true));
    });
}

// ===== ДОБАВЛЕНИЕ В КОРЗИНУ =====
function addToCart() {
    const barcode = document.getElementById('cartBarcodeInput').value.trim();
    const quantity = parseInt(document.getElementById('cartQuantity').value) || 1;
    
    if (!barcode) {
        showToast('❌ Отсканируйте штрихкод товара', true);
        return;
    }
    
    db.ref('stores/' + storeId + '/products').orderByChild('barcode').equalTo(barcode).once('value', snap => {
        let product = null;
        snap.forEach(child => {
            product = child.val();
        });
        
        if (!product) {
            showToast(`❌ Товар не найден!`, true);
            document.getElementById('cartBarcodeInput').value = '';
            return;
        }
        
        const price = currentClient ? product.discountPrice : product.price;
        
        const existing = currentCart.find(item => item.barcode === barcode);
        if (existing) {
            existing.quantity += quantity;
            showToast(`➕ ${product.name} +${quantity}`);
        } else {
            currentCart.push({
                barcode: barcode,
                name: product.name,
                price: price,
                quantity: quantity
            });
            showToast(`✅ ${product.name} добавлен`);
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
    const finalTotal = Math.max(0, cartTotal - discountAmount);
    document.getElementById('cartTotal').innerText = finalTotal.toFixed(2);
    
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
    
    if (discountAmount > 0) {
        document.getElementById('discountInfo').innerHTML = `✅ Скидка: ${discountAmount.toFixed(2)} ₽ (${discountAmount * 10} баллов)`;
    }
}

function removeFromCart(idx) {
    currentCart.splice(idx, 1);
    updateCartUI();
    showToast('🗑 Товар удалён');
}

function clearCart() {
    if (currentCart.length === 0) return;
    if (!confirm('Очистить корзину?')) return;
    currentCart = [];
    discountAmount = 0;
    selectedPayment = null;
    document.querySelectorAll('.payment-btn').forEach(b => b.style.background = '#eef2f8');
    document.getElementById('cashInputArea').style.display = 'none';
    document.getElementById('changeDisplay').style.display = 'none';
    document.getElementById('discountInfo').innerHTML = '';
    updateCartUI();
    showToast('🗑 Корзина очищена');
}

// ===== ВЫБОР ОПЛАТЫ =====
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
    const total = Math.max(0, cartTotal - discountAmount);
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
    
    const total = Math.max(0, cartTotal - discountAmount);
    const pointsEarned = Math.floor(total / 100) * 5;
    
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
        originalTotal: cartTotal,
        discount: discountAmount,
        pointsEarned: pointsEarned,
        pointsUsed: discountAmount * 10,
        items: currentCart.map(i => `${i.name} x${i.quantity}`).join(', '),
        cashier: user.fullName,
        storeId: storeId,
        storeName: storeName,
        paymentMethod: selectedPayment === 'cash' ? 'Наличные' : 'Карта'
    };
    
    try {
        if (currentClient) {
            const clientRef = db.ref('clients/' + currentClient.id);
            const snap = await clientRef.once('value');
            const data = snap.val() || {};
            const history = data.history || [];
            history.push(purchase);
            await clientRef.update({
                balance: (data.balance || 0) + pointsEarned - (discountAmount * 10),
                history: history
            });
            showToast(`🎉 Начислено ${pointsEarned} баллов! Списано ${discountAmount * 10} баллов`);
        }
        
        const cashierPurchase = {
            ...purchase,
            clientName: currentClient ? currentClient.fullName : 'Без карты'
        };
        await db.ref('cashier_history').push(cashierPurchase);
        await db.ref('stores/' + storeId + '/history').push(cashierPurchase);
        
        currentCart = [];
        discountAmount = 0;
        selectedPayment = null;
        clearScannedClient();
        document.querySelectorAll('.payment-btn').forEach(b => b.style.background = '#eef2f8');
        document.getElementById('cashInputArea').style.display = 'none';
        document.getElementById('changeDisplay').style.display = 'none';
        document.getElementById('cashGiven').value = '';
        document.getElementById('discountInfo').innerHTML = '';
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
    
    db.ref('stores/' + storeId + '/history').orderByChild('date').limitToLast(50).on('value', snap => {
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
                        ${item.discount > 0 ? `<span style="font-size:0.7rem; color:#1d6f2c;">Скидка: ${item.discount} ₽</span>` : ''}
                    </div>
                    <div style="text-align:right;">
                        <strong>${item.total} ₽</strong>
                        <span class="badge" style="display:block; margin-top:4px;">+${item.pointsEarned || 0} баллов</span>
                        ${item.pointsUsed > 0 ? `<span class="badge" style="display:block; background:#fee9e9; color:#b33a34;">-${item.pointsUsed} баллов</span>` : ''}
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
