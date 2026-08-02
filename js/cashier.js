// ===== КАССИР =====

let currentCart = [];
let currentClient = null;
let cartTotal = 0;
let selectedPayment = null;
let discountAmount = 0;
let originalTotal = 0;

const user = checkAuth();
if (!user || user.role !== 'cashier') {
    window.location.href = 'index.html';
}

const storeId = user.storeId;
const storeName = user.storeName || 'Магазин';

// Данные для весовых товаров
const weightProducts = {
    'Выпечка': ['Хлеб белый', 'Хлеб черный', 'Батон', 'Булочка', 'Круассан', 'Пирожок', 'Кекс', 'Печенье'],
    'Морепродукты': ['Креветки', 'Мидии', 'Осьминог', 'Кальмар', 'Рыба', 'Краб', 'Лангустины', 'Устрицы'],
    'Овощи': ['Помидоры', 'Огурцы', 'Картофель', 'Морковь', 'Лук', 'Капуста', 'Перец', 'Чеснок', 'Свекла', 'Кабачки'],
    'Фрукты': ['Яблоки', 'Бананы', 'Апельсины', 'Груши', 'Виноград', 'Киви', 'Манго', 'Авокадо', 'Лимон', 'Грейпфрут']
};

const weightPrices = {
    'Хлеб белый': 45, 'Хлеб черный': 40, 'Батон': 35, 'Булочка': 25, 'Круассан': 55,
    'Пирожок': 40, 'Кекс': 60, 'Печенье': 80,
    'Креветки': 450, 'Мидии': 350, 'Осьминог': 400, 'Кальмар': 300, 'Рыба': 500,
    'Краб': 600, 'Лангустины': 550, 'Устрицы': 700,
    'Помидоры': 150, 'Огурцы': 80, 'Картофель': 50, 'Морковь': 40, 'Лук': 30,
    'Капуста': 45, 'Перец': 120, 'Чеснок': 200, 'Свекла': 35, 'Кабачки': 60,
    'Яблоки': 120, 'Бананы': 90, 'Апельсины': 110, 'Груши': 150, 'Виноград': 200,
    'Киви': 80, 'Манго': 250, 'Авокадо': 180, 'Лимон': 60, 'Грейпфрут': 70
};

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('cashierName').innerHTML = `👤 ${user.fullName}`;
    document.getElementById('cashierStoreDisplay').innerHTML = `🏪 ${storeName}`;
    loadCashierHistory();
    updateCartUI();
    updateWeightProducts();
});

// ===== ВЕСОВЫЕ ТОВАРЫ =====
function updateWeightProducts() {
    const category = document.getElementById('weightCategory').value;
    const products = weightProducts[category] || [];
    const select = document.getElementById('weightProduct');
    select.innerHTML = '';
    products.forEach(p => {
        const option = document.createElement('option');
        option.value = p;
        const price = weightPrices[p] || 0;
        const unit = category === 'Выпечка' ? 'шт' : 'кг';
        option.textContent = `${p} (${price} ₽/${unit})`;
        select.appendChild(option);
    });
    
    // Обновляем цену
    updateWeightPrice();
}

function updateWeightPrice() {
    const product = document.getElementById('weightProduct').value;
    const price = weightPrices[product] || 0;
    document.getElementById('weightPrice').value = price;
}

function addWeightProduct() {
    const category = document.getElementById('weightCategory').value;
    const product = document.getElementById('weightProduct').value;
    const quantity = parseFloat(document.getElementById('weightQuantity').value) || 1;
    const price = parseFloat(document.getElementById('weightPrice').value) || 0;
    
    if (!product || price <= 0) {
        showToast('❌ Выберите товар и укажите цену', true);
        return;
    }
    
    const unit = category === 'Выпечка' ? 'шт' : 'кг';
    const displayName = `${product} (${unit})`;
    const finalPrice = currentClient ? price * 0.9 : price; // Скидка для клиентов с картой
    
    const existing = currentCart.find(item => item.name === displayName && item.isWeight);
    if (existing) {
        existing.quantity += quantity;
        showToast(`➕ ${product} +${quantity} ${unit}`);
    } else {
        currentCart.push({
            id: Date.now(),
            name: displayName,
            barcode: 'WEIGHT_' + product,
            price: finalPrice,
            quantity: quantity,
            isWeight: true,
            unit: unit,
            originalName: product,
            category: category
        });
        showToast(`✅ ${product} добавлен (${quantity} ${unit})`);
    }
    
    document.getElementById('weightQuantity').value = 1;
    updateCartUI();
}

// ===== ПОИСК КЛИЕНТА (по номеру карты, телефону или никнейму) =====
function scanClient() {
    const input = document.getElementById('clientScanInput').value.trim();
    if (!input) {
        showToast('❌ Введите номер карты, телефон или никнейм', true);
        return;
    }
    
    const cleanInput = input.replace(/\D/g, '');
    
    db.ref('clients').once('value', snap => {
        const clients = snap.val();
        let found = null;
        let foundId = null;
        
        for (let key in clients) {
            const c = clients[key];
            // Поиск по карте, телефону или никнейму
            if (c.cardNumber === cleanInput || 
                c.phone === input || 
                c.phone === cleanInput ||
                (c.nickname && c.nickname.toLowerCase() === input.toLowerCase())) {
                found = c;
                foundId = key;
                break;
            }
        }
        
        if (found) {
            currentClient = { id: foundId, ...found };
            const displayName = found.nickname || found.fullName;
            const container = document.getElementById('scannedClient');
            container.style.display = 'flex';
            container.innerHTML = `
                <div class="member-info">
                    <div>
                        <strong>${displayName}</strong>
                        ${found.nickname ? `<span style="font-size:0.7rem; color:#7a8a9e;">(${found.fullName})</span>` : ''}
                        <br>
                        <span class="badge">🎫 ${found.cardNumber}</span><br>
                        <span style="font-size:0.8rem;">⭐ ${found.balance || 0} баллов</span>
                    </div>
                </div>
                <button class="small-btn danger" onclick="clearScannedClient()">✕ Очистить</button>
            `;
            
            document.getElementById('discountSection').style.display = 'block';
            document.getElementById('clientPointsDisplay').innerText = found.balance || 0;
            document.getElementById('discountInfo').innerHTML = '';
            discountAmount = 0;
            
            updateCartPricesWithDiscount();
            
            showToast(`🎫 Карта найдена: ${displayName}`);
        } else {
            showToast('❌ Клиент не найден', true);
            document.getElementById('discountSection').style.display = 'none';
            currentClient = null;
            updateCartPricesWithoutDiscount();
        }
        document.getElementById('clientScanInput').value = '';
    });
}

// ===== ОБНОВЛЕНИЕ ЦЕН В КОРЗИНЕ =====
function updateCartPricesWithDiscount() {
    if (!currentClient) return;
    
    for (let item of currentCart) {
        if (item.isWeight) {
            // Весовые товары: скидка 10%
            const basePrice = weightPrices[item.originalName] || item.price;
            item.price = basePrice * 0.9;
        } else {
            // Товары со штрихкодом
            db.ref('stores/' + storeId + '/products').orderByChild('barcode').equalTo(item.barcode).once('value', snap => {
                let product = null;
                snap.forEach(child => {
                    product = child.val();
                });
                if (product) {
                    item.price = product.discountPrice;
                    updateCartUI();
                }
            });
        }
    }
    updateCartUI();
}

function updateCartPricesWithoutDiscount() {
    for (let item of currentCart) {
        if (item.isWeight) {
            const basePrice = weightPrices[item.originalName] || 0;
            item.price = basePrice;
        } else {
            db.ref('stores/' + storeId + '/products').orderByChild('barcode').equalTo(item.barcode).once('value', snap => {
                let product = null;
                snap.forEach(child => {
                    product = child.val();
                });
                if (product) {
                    item.price = product.price;
                    updateCartUI();
                }
            });
        }
    }
    updateCartUI();
}

// ===== ДОБАВЛЕНИЕ ТОВАРА СО ШТРИХКОДОМ =====
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
        
        const existing = currentCart.find(item => item.barcode === barcode && !item.isWeight);
        if (existing) {
            existing.quantity += quantity;
            showToast(`➕ ${product.name} +${quantity}`);
        } else {
            currentCart.push({
                id: Date.now(),
                barcode: barcode,
                name: product.name,
                price: price,
                quantity: quantity,
                isWeight: false
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
    originalTotal = currentCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const finalTotal = Math.max(0, cartTotal - discountAmount);
    document.getElementById('cartTotal').innerText = finalTotal.toFixed(2);
    
    if (currentCart.length === 0) {
        container.innerHTML = '<div class="empty-state">Корзина пуста</div>';
        return;
    }
    
    let html = '';
    currentCart.forEach((item, idx) => {
        const unit = item.isWeight ? (item.unit || 'кг') : 'шт';
        const displayQty = item.isWeight ? item.quantity.toFixed(2) : item.quantity;
        html += `
            <div class="history-item">
                <div>
                    <strong>${item.name}</strong>
                    ${item.isWeight ? `<span style="font-size:0.7rem; color:#7a8a9e; display:block;">⚖️ Весовой (${unit})</span>` : `<span style="font-size:0.7rem; color:#7a8a9e; display:block;">Штрихкод: ${item.barcode}</span>`}
                    ${currentClient ? '<span style="font-size:0.7rem; color:#1d6f2c;">✅ Со скидкой</span>' : ''}
                </div>
                <div style="text-align:right;">
                    ${displayQty} ${unit} × ${item.price.toFixed(2)} ₽ = ${(item.price * item.quantity).toFixed(2)} ₽
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

// ===== ОСТАЛЬНЫЕ ФУНКЦИИ (ОПЛАТА, ИСТОРИЯ, ТОСТ) =====
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
    
    const useAmount = Math.min(total, maxDiscount);
    discountAmount = useAmount;
    
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
    let cashGiven = null;
    let change = 0;
    
    if (selectedPayment === 'cash') {
        cashGiven = parseFloat(document.getElementById('cashGiven').value);
        if (isNaN(cashGiven) || cashGiven < total) {
            showToast('❌ Недостаточно средств!', true);
            return;
        }
        change = cashGiven - total;
        showToast(`💰 Оплачено наличными: ${total.toFixed(2)} ₽, сдача: ${change.toFixed(2)} ₽`);
    } else {
        showToast(`💳 Оплачено картой: ${total.toFixed(2)} ₽`);
    }
    
    const purchase = {
        date: new Date().toLocaleString('ru-RU'),
        total: total,
        originalTotal: originalTotal,
        discount: discountAmount,
        pointsEarned: pointsEarned,
        pointsUsed: discountAmount * 10,
        items: currentCart.map(i => {
            const unit = i.isWeight ? (i.unit || 'кг') : 'шт';
            const qty = i.isWeight ? i.quantity.toFixed(2) : i.quantity;
            return `${i.name} ${qty}${unit}`;
        }).join(', '),
        cashier: user.fullName,
        storeId: storeId,
        storeName: storeName,
        paymentMethod: selectedPayment === 'cash' ? 'Наличные' : 'Карта',
        cashGiven: selectedPayment === 'cash' ? cashGiven : null,
        change: selectedPayment === 'cash' ? change : null
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
            clientName: currentClient ? (currentClient.nickname || currentClient.fullName) : 'Без карты'
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

function clearScannedClient() {
    currentClient = null;
    discountAmount = 0;
    document.getElementById('scannedClient').style.display = 'none';
    document.getElementById('scannedClient').innerHTML = '';
    document.getElementById('discountSection').style.display = 'none';
    document.getElementById('discountInfo').innerHTML = '';
    updateCartPricesWithoutDiscount();
    updateCartUI();
}

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
                        ${item.cashGiven ? `<span style="font-size:0.7rem; color:#3e5f7e;">💵 Дано: ${item.cashGiven} ₽ | Сдача: ${item.change} ₽</span>` : ''}
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

function showToast(msg, isError = false) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.style.display = 'block';
    toast.style.background = isError ? '#b33a34' : '#1d6f2c';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.style.display = 'none', 3000);
}

// Инициализация весовых товаров
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('weightProduct').addEventListener('change', updateWeightPrice);
});
