// ===== КАССИР =====

let currentCart = [];
let currentClient = null;
let cartTotal = 0;
let selectedPayment = null;
let discountAmount = 0;
let originalTotal = 0;
let editingProductKey = null;
let historyCache = [];
let productsCache = {};

const user = checkAuth();
if (!user || user.role !== 'cashier') {
    window.location.href = 'index.html';
}

const storeId = user.storeId;
const storeName = user.storeName || 'Магазин';

// Весовые товары
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
    loadCashierHistoryLite();
    updateCartUI();
    updateWeightProducts();
    cleanOldHistory();
    
    // Обработчики Enter для добавления товара
    document.getElementById('newProductBarcode').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            document.getElementById('newProductName').focus();
        }
    });
    document.getElementById('newProductName').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            document.getElementById('newProductPrice').focus();
        }
    });
    document.getElementById('newProductPrice').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            document.getElementById('newProductDiscountPrice').focus();
        }
    });
    document.getElementById('newProductDiscountPrice').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addNewProduct();
        }
    });
});

// ===== ДОБАВЛЕНИЕ ТОВАРА В СИСТЕМУ =====
function addNewProduct() {
    const barcode = document.getElementById('newProductBarcode').value.trim();
    const name = document.getElementById('newProductName').value.trim();
    const price = parseFloat(document.getElementById('newProductPrice').value);
    const discountPrice = parseFloat(document.getElementById('newProductDiscountPrice').value);
    const statusDiv = document.getElementById('addProductStatus');
    
    // Проверка полей
    if (!barcode) {
        statusDiv.innerHTML = '❌ Введите штрихкод товара';
        statusDiv.style.color = '#b33a34';
        document.getElementById('newProductBarcode').focus();
        showToast('❌ Введите штрихкод', true);
        return;
    }
    if (!name) {
        statusDiv.innerHTML = '❌ Введите название товара';
        statusDiv.style.color = '#b33a34';
        document.getElementById('newProductName').focus();
        showToast('❌ Введите название', true);
        return;
    }
    if (isNaN(price) || price <= 0) {
        statusDiv.innerHTML = '❌ Введите корректную обычную цену';
        statusDiv.style.color = '#b33a34';
        document.getElementById('newProductPrice').focus();
        showToast('❌ Введите цену', true);
        return;
    }
    if (isNaN(discountPrice) || discountPrice <= 0) {
        statusDiv.innerHTML = '❌ Введите корректную цену со скидкой';
        statusDiv.style.color = '#b33a34';
        document.getElementById('newProductDiscountPrice').focus();
        showToast('❌ Введите цену со скидкой', true);
        return;
    }
    
    statusDiv.innerHTML = '⏳ Проверка...';
    statusDiv.style.color = '#7a8a9e';
    
    // Проверяем, есть ли уже товар с таким штрихкодом в магазине
    db.ref('stores/' + storeId + '/products').orderByChild('barcode').equalTo(barcode).once('value')
    .then(snap => {
        if (snap.exists()) {
            statusDiv.innerHTML = '❌ Товар с таким штрихкодом уже есть в магазине!';
            statusDiv.style.color = '#b33a34';
            showToast('❌ Товар уже существует', true);
            return;
        }
        
        // Сохраняем товар
        const productData = {
            barcode: barcode,
            name: name,
            price: price,
            discountPrice: discountPrice,
            createdAt: new Date().toISOString()
        };
        
        return db.ref('stores/' + storeId + '/products').push(productData);
    })
    .then(() => {
        statusDiv.innerHTML = `✅ Товар "${name}" успешно добавлен в магазин!`;
        statusDiv.style.color = '#1d6f2c';
        
        // Очищаем поля
        document.getElementById('newProductBarcode').value = '';
        document.getElementById('newProductName').value = '';
        document.getElementById('newProductPrice').value = '';
        document.getElementById('newProductDiscountPrice').value = '';
        
        showToast(`✅ Товар "${name}" добавлен!`);
        
        // Очищаем статус через 5 секунд
        setTimeout(() => {
            statusDiv.innerHTML = '';
        }, 5000);
    })
    .catch(err => {
        console.error('Ошибка добавления товара:', err);
        statusDiv.innerHTML = '❌ Ошибка: ' + err.message;
        statusDiv.style.color = '#b33a34';
        showToast('❌ Ошибка добавления товара', true);
    });
}

// ===== ОЧИСТКА СТАРОЙ ИСТОРИИ =====
function cleanOldHistory() {
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const cutoffDate = new Date(now - sevenDays);
    
    db.ref('cashier_history').once('value', snap => {
        const history = snap.val();
        if (!history) return;
        const updates = {};
        for (let key in history) {
            const item = history[key];
            if (item.date) {
                const itemDate = new Date(item.date);
                if (itemDate < cutoffDate) {
                    updates['cashier_history/' + key] = null;
                }
            }
        }
        if (Object.keys(updates).length > 0) {
            db.ref().update(updates);
        }
    });
    
    db.ref('stores/' + storeId + '/history').once('value', snap => {
        const history = snap.val();
        if (!history) return;
        const updates = {};
        for (let key in history) {
            const item = history[key];
            if (item.date) {
                const itemDate = new Date(item.date);
                if (itemDate < cutoffDate) {
                    updates['stores/' + storeId + '/history/' + key] = null;
                }
            }
        }
        if (Object.keys(updates).length > 0) {
            db.ref().update(updates);
        }
    });
}

// ===== ИСТОРИЯ (ОПТИМИЗИРОВАННАЯ) =====
function loadCashierHistoryLite() {
    const container = document.getElementById('cashierHistory');
    
    if (historyCache.length > 0) {
        renderCashierHistory(historyCache);
        return;
    }
    
    container.innerHTML = '<div class="loading-spinner">Загрузка...</div>';
    
    db.ref('stores/' + storeId + '/history').limitToLast(30).once('value', snap => {
        const data = snap.val();
        historyCache = data || {};
        renderCashierHistory(historyCache);
    }).catch(() => {
        container.innerHTML = '<div class="empty-state">Ошибка загрузки</div>';
    });
}

function renderCashierHistory(data) {
    const container = document.getElementById('cashierHistory');
    
    if (!data || Object.keys(data).length === 0) {
        container.innerHTML = '<div class="empty-state">Нет покупок</div>';
        return;
    }
    
    let html = '';
    const items = Object.values(data).reverse().slice(0, 30);
    
    items.forEach(item => {
        html += `
            <div class="history-item">
                <div>
                    <strong>${item.clientName || 'Без карты'}</strong>
                    ${item.clientPhone ? `<span style="font-size:0.6rem; color:#7a8a9e; display:block;">📱 ${item.clientPhone}</span>` : ''}
                    <span style="font-size:0.7rem; color:#7a8a9e; display:block;">${item.date || ''}</span>
                    <span style="font-size:0.7rem; color:#3e5f7e;">${item.paymentMethod || ''}</span>
                    ${item.discount > 0 ? `<span style="font-size:0.7rem; color:#1d6f2c;">Скидка: ${item.discount} ₽</span>` : ''}
                    ${item.cashGiven ? `<span style="font-size:0.7rem; color:#3e5f7e;">💵 Сдача: ${item.change} ₽</span>` : ''}
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
}

// ===== ПОИСК ТОВАРА =====
function searchProduct() {
    const barcode = document.getElementById('searchProductBarcode').value.trim();
    if (!barcode) {
        showToast('❌ Введите штрихкод', true);
        return;
    }
    
    const resultDiv = document.getElementById('productEditResult');
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = '<div class="loading-spinner">Поиск...</div>';
    
    db.ref('stores/' + storeId + '/products').orderByChild('barcode').equalTo(barcode).once('value', snap => {
        let product = null;
        let key = null;
        snap.forEach(child => {
            product = child.val();
            key = child.key;
        });
        
        if (product) {
            editingProductKey = key;
            document.getElementById('editBarcode').value = product.barcode;
            document.getElementById('editName').value = product.name;
            document.getElementById('editPrice').value = product.price;
            document.getElementById('editDiscountPrice').value = product.discountPrice;
            
            resultDiv.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
                    <div>
                        <div style="font-weight:bold; color:#1d6f2c;">✅ Товар найден</div>
                        <div style="font-size:0.8rem; color:#7a8a9e;">Нажмите "Сохранить" или "Удалить"</div>
                    </div>
                    <div style="font-size:0.8rem; color:#3e5f7e;">ID: ${key}</div>
                </div>
            `;
        } else {
            resultDiv.innerHTML = `<div style="color:#b33a34; padding:8px;">❌ Товар не найден</div>`;
            clearProductEdit();
        }
        document.getElementById('searchProductBarcode').value = '';
    });
}

function saveProductEdit() {
    if (!editingProductKey) {
        showToast('❌ Найдите товар', true);
        return;
    }
    
    const barcode = document.getElementById('editBarcode').value.trim();
    const name = document.getElementById('editName').value.trim();
    const price = parseFloat(document.getElementById('editPrice').value);
    const discountPrice = parseFloat(document.getElementById('editDiscountPrice').value);
    
    if (!barcode || !name || isNaN(price) || price <= 0 || isNaN(discountPrice) || discountPrice <= 0) {
        showToast('❌ Заполните все поля', true);
        return;
    }
    
    db.ref('stores/' + storeId + '/products/' + editingProductKey).update({
        barcode, name, price, discountPrice
    }).then(() => {
        showToast(`✅ Товар "${name}" обновлён`);
        document.getElementById('productEditResult').innerHTML = `<div style="color:#1d6f2c;">✅ Товар обновлён</div>`;
        clearProductEdit();
    }).catch(err => showToast('❌ Ошибка', true));
}

function deleteProduct() {
    if (!editingProductKey) {
        showToast('❌ Найдите товар', true);
        return;
    }
    
    const name = document.getElementById('editName').value.trim();
    if (!confirm(`Удалить товар "${name}"?`)) return;
    
    db.ref('stores/' + storeId + '/products/' + editingProductKey).remove().then(() => {
        showToast(`🗑 Товар "${name}" удалён`);
        document.getElementById('productEditResult').innerHTML = `<div style="color:#b33a34;">🗑 Товар удалён</div>`;
        clearProductEdit();
    }).catch(err => showToast('❌ Ошибка', true));
}

function clearProductEdit() {
    document.getElementById('editBarcode').value = '';
    document.getElementById('editName').value = '';
    document.getElementById('editPrice').value = '';
    document.getElementById('editDiscountPrice').value = '';
    editingProductKey = null;
    setTimeout(() => {
        document.getElementById('productEditResult').style.display = 'none';
    }, 3000);
}

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
    updateWeightPrice();
}

function updateWeightPrice() {
    const product = document.getElementById('weightProduct').value;
    document.getElementById('weightPrice').value = weightPrices[product] || 0;
}

function addWeightProduct() {
    const category = document.getElementById('weightCategory').value;
    const product = document.getElementById('weightProduct').value;
    const quantity = parseFloat(document.getElementById('weightQuantity').value) || 1;
    const price = parseFloat(document.getElementById('weightPrice').value) || 0;
    
    if (!product || price <= 0) {
        showToast('❌ Выберите товар', true);
        return;
    }
    
    const unit = category === 'Выпечка' ? 'шт' : 'кг';
    const displayName = `${product} (${unit})`;
    const finalPrice = currentClient ? price * 0.9 : price;
    
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

// ===== ПОИСК КЛИЕНТА =====
function scanClient() {
    const input = document.getElementById('clientScanInput').value.trim();
    if (!input) {
        showToast('❌ Введите данные', true);
        return;
    }
    
    const cleanInput = input.replace(/\D/g, '');
    
    db.ref('clients').once('value', snap => {
        const clients = snap.val();
        let found = null;
        let foundId = null;
        
        for (let key in clients) {
            const c = clients[key];
            if (c.cardNumber === cleanInput || c.phone === input || c.phone === cleanInput ||
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
                        <br><span class="badge">🎫 ${found.cardNumber}</span>
                        <br><span style="font-size:0.8rem;">⭐ ${found.balance || 0} баллов</span>
                    </div>
                </div>
                <button class="small-btn danger" onclick="clearScannedClient()">✕</button>
            `;
            
            document.getElementById('discountSection').style.display = 'block';
            document.getElementById('clientPointsDisplay').innerText = found.balance || 0;
            document.getElementById('discountInfo').innerHTML = '';
            discountAmount = 0;
            updateCartPricesWithDiscount();
            showToast(`🎫 ${displayName}`);
        } else {
            showToast('❌ Клиент не найден', true);
            document.getElementById('discountSection').style.display = 'none';
            currentClient = null;
            updateCartPricesWithoutDiscount();
        }
        document.getElementById('clientScanInput').value = '';
    });
}

// ===== ОСТАЛЬНЫЕ ФУНКЦИИ =====
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

function updateCartPricesWithDiscount() {
    if (!currentClient) return;
    for (let item of currentCart) {
        if (item.isWeight) {
            item.price = (weightPrices[item.originalName] || item.price) * 0.9;
        } else {
            db.ref('stores/' + storeId + '/products').orderByChild('barcode').equalTo(item.barcode).once('value', snap => {
                let product = null;
                snap.forEach(child => { product = child.val(); });
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
            item.price = weightPrices[item.originalName] || 0;
        } else {
            db.ref('stores/' + storeId + '/products').orderByChild('barcode').equalTo(item.barcode).once('value', snap => {
                let product = null;
                snap.forEach(child => { product = child.val(); });
                if (product) {
                    item.price = product.price;
                    updateCartUI();
                }
            });
        }
    }
    updateCartUI();
}

function addToCart() {
    const barcode = document.getElementById('cartBarcodeInput').value.trim();
    const quantity = parseInt(document.getElementById('cartQuantity').value) || 1;
    
    if (!barcode) {
        showToast('❌ Введите штрихкод', true);
        return;
    }
    
    db.ref('stores/' + storeId + '/products').orderByChild('barcode').equalTo(barcode).once('value', snap => {
        let product = null;
        snap.forEach(child => { product = child.val(); });
        
        if (!product) {
            showToast('❌ Товар не найден', true);
            document.getElementById('cartBarcodeInput').value = '';
            return;
        }
        
        const price = currentClient ? product.discountPrice : product.price;
        const existing = currentCart.find(item => item.barcode === barcode && !item.isWeight);
        if (existing) {
            existing.quantity += quantity;
        } else {
            currentCart.push({
                id: Date.now(),
                barcode: barcode,
                name: product.name,
                price: price,
                quantity: quantity,
                isWeight: false
            });
        }
        showToast(`✅ ${product.name} +${quantity}`);
        document.getElementById('cartBarcodeInput').value = '';
        document.getElementById('cartQuantity').value = '1';
        updateCartUI();
    });
}

function updateCartUI() {
    const container = document.getElementById('cartList');
    cartTotal = currentCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    originalTotal = cartTotal;
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
                    ${item.isWeight ? `<span style="font-size:0.7rem; color:#7a8a9e; display:block;">⚖️ ${unit}</span>` : `<span style="font-size:0.7rem; color:#7a8a9e; display:block;">${item.barcode}</span>`}
                    ${currentClient ? '<span style="font-size:0.7rem; color:#1d6f2c;">✅ Со скидкой</span>' : ''}
                </div>
                <div style="text-align:right;">
                    ${displayQty} ${unit} × ${item.price.toFixed(2)} ₽ = ${(item.price * item.quantity).toFixed(2)} ₽
                    <button class="small-btn danger" onclick="removeFromCart(${idx})" style="display:block; margin-top:4px;">✕</button>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
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
        showToast('❌ Найдите клиента', true);
        return;
    }
    const total = cartTotal;
    if (total <= 0) { showToast('❌ Корзина пуста', true); return; }
    
    const availablePoints = currentClient.balance || 0;
    const maxDiscount = Math.floor(availablePoints / 10);
    if (maxDiscount <= 0) { showToast('❌ Недостаточно баллов', true); return; }
    
    discountAmount = Math.min(total, maxDiscount);
    document.getElementById('discountInfo').innerHTML = `✅ Списано ${discountAmount * 10} баллов = ${discountAmount.toFixed(2)} ₽`;
    document.getElementById('discountInfo').style.color = '#1d6f2c';
    document.getElementById('clientPointsDisplay').innerText = currentClient.balance - (discountAmount * 10);
    updateCartUI();
    showToast(`✨ Списано ${discountAmount * 10} баллов`);
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
        showToast('❌ Корзина пуста', true);
        return;
    }
    if (!selectedPayment) {
        showToast('❌ Выберите способ оплаты', true);
        return;
    }
    
    const total = Math.max(0, cartTotal - discountAmount);
    const pointsEarned = Math.floor(total / 100) * 5;
    let cashGiven = null;
    let change = 0;
    
    if (selectedPayment === 'cash') {
        cashGiven = parseFloat(document.getElementById('cashGiven').value);
        if (isNaN(cashGiven) || cashGiven < total) {
            showToast('❌ Недостаточно средств', true);
            return;
        }
        change = cashGiven - total;
        showToast(`💰 Сдача: ${change.toFixed(2)} ₽`);
    } else {
        showToast(`💳 Оплачено: ${total.toFixed(2)} ₽`);
    }
    
    const displayName = currentClient ? (currentClient.nickname || currentClient.fullName) : 'Без карты';
    
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
        change: selectedPayment === 'cash' ? change : null,
        clientName: displayName,
        clientId: currentClient ? currentClient.id : null,
        clientPhone: currentClient ? currentClient.phone : null
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
            showToast(`🎉 Начислено ${pointsEarned} баллов`);
        }
        
        await db.ref('cashier_history').push(purchase);
        await db.ref('stores/' + storeId + '/history').push(purchase);
        
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
        loadCashierHistoryLite();
        
    } catch(err) {
        showToast('❌ Ошибка: ' + err.message, true);
    }
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
