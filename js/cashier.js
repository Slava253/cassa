// ===== КАССИР =====

let currentCart = [];
let currentClient = null;
let cartTotal = 0;

const user = checkAuth();
if (!user || user.role !== 'cashier') {
    window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('cashierName').innerHTML = `👤 ${user.fullName}`;
    loadCashierHistory();
    updateCartUI();
});

// ===== СОЗДАНИЕ КАРТЫ КЛИЕНТА (КАССИР) =====
function cashierCreateClient() {
    const fullName = document.getElementById('cashierClientName').value.trim();
    const phone = document.getElementById('cashierClientPhone').value.trim();
    
    if (!fullName) {
        showToast('❌ Введите ФИО клиента', true);
        document.getElementById('cashierClientName').focus();
        return;
    }
    if (!phone) {
        showToast('❌ Введите телефон клиента', true);
        document.getElementById('cashierClientPhone').focus();
        return;
    }
    
    db.ref('clients').orderByChild('phone').equalTo(phone).once('value', snap => {
        if (snap.exists()) {
            showToast('❌ Клиент с таким телефоном уже существует', true);
            document.getElementById('cashierClientPhone').focus();
            return;
        }
        
        const cardNumber = '29' + Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
        const data = { 
            fullName: fullName, 
            phone: phone, 
            cardNumber: cardNumber, 
            balance: 0, 
            history: [] 
        };
        
        db.ref('clients').push(data).then(() => {
            document.getElementById('cashierClientName').value = '';
            document.getElementById('cashierClientPhone').value = '';
            showToast(`✅ Карта создана! Номер: ${cardNumber}`);
        }).catch(err => showToast('❌ Ошибка: ' + err.message, true));
    });
}

// ===== СКАНЕР КЛИЕНТА =====
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
            showToast('❌ Клиент не найден', true);
        }
        document.getElementById('clientScanInput').value = '';
    });
}

function clearScannedClient() {
    currentClient = null;
    document.getElementById('scannedClient').style.display = 'none';
    document.getElementById('scannedClient').innerHTML = '';
}

// ===== ТОВАРЫ =====
function addProduct() {
    const barcode = document.getElementById('productBarcode').value.trim();
    const quantity = parseInt(document.getElementById('productQuantity').value) || 1;
    const price = parseFloat(document.getElementById('productPrice').value);
    
    if (!barcode || !price || price <= 0) {
        showToast('❌ Введите штрихкод и цену', true);
        return;
    }
    
    currentCart.push({
        name: 'Товар ' + barcode,
        barcode: barcode,
        price: price,
        quantity: quantity
    });
    
    document.getElementById('productBarcode').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productQuantity').value = '1';
    
    updateCartUI();
    showToast('✅ Товар добавлен');
}

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
                <div>${item.name} x ${item.quantity}</div>
                <div>${(item.price * item.quantity).toFixed(2)} ₽ 
                    <button class="small-btn danger" onclick="removeFromCart(${idx})">✕</button>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function removeFromCart(idx) {
    currentCart.splice(idx, 1);
    updateCartUI();
}

function clearCart() {
    if (currentCart.length === 0) return;
    if (!confirm('Очистить корзину?')) return;
    currentCart = [];
    updateCartUI();
    showToast('🗑 Корзина очищена');
}

// ===== ОПЛАТА =====
async function processPayment() {
    if (currentCart.length === 0) {
        showToast('❌ Корзина пуста', true);
        return;
    }
    
    const total = cartTotal;
    const points = Math.floor(total / 100) * 5;
    
    const purchase = {
        date: new Date().toLocaleString('ru-RU'),
        total: total,
        points: points,
        items: currentCart.map(i => `${i.name} x${i.quantity}`).join(', '),
        cashier: user.fullName
    };
    
    try {
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
            showToast(`✅ Оплата прошла! Начислено ${points} баллов`);
        } else {
            showToast(`✅ Оплата прошла! Без карты баллы не начисляются`);
        }
        
        const cashierPurchase = {
            ...purchase,
            clientName: currentClient ? currentClient.fullName : 'Без карты'
        };
        await db.ref('cashier_history').push(cashierPurchase);
        
        currentCart = [];
        clearScannedClient();
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
                        <strong>${item.clientName || 'Без карты'}</strong><br>
                        <span style="font-size:0.7rem;color:#7a8a9e;">${item.date}</span>
                    </div>
                    <div>${item.total} ₽ <span class="badge">+${item.points} баллов</span></div>
                </div>
            `;
        });
        container.innerHTML = html;
    });
}
