// ===== КЛИЕНТ (ОПТИМИЗИРОВАННЫЙ) =====

const user = checkAuth();
if (!user || user.role !== 'client') {
    window.location.href = 'index.html';
}

let currentBarcodeColor = '#000000';
let selectedStoreId = null;
let selectedStoreName = null;
let scannerInitialized = false;
let codeReader = null;
let productsCache = {};
let historyCache = [];
let storesCache = [];
let isLoading = false;

document.addEventListener('DOMContentLoaded', function() {
    // Быстрая загрузка профиля
    document.getElementById('clientName').innerHTML = `👤 ${user.nickname || user.fullName}`;
    document.getElementById('clientStoreDisplay').innerHTML = `🏪 ${user.storeName || 'Магазин'}`;
    document.getElementById('clientBalance').innerText = user.balance || 0;
    
    document.getElementById('profilePhone').value = user.phone || '';
    document.getElementById('profileNickname').value = user.nickname || '';
    document.getElementById('profileCardNumber').value = user.cardNumber || '';
    
    updateClientInfo();
    generateEAN13(user.cardNumber);
    
    // Загружаем только необходимые данные
    loadClientStores();
    loadClientHistoryLite();
    
    if (user.nickname) {
        document.getElementById('nicknameStatus').innerHTML = `✅ Никнейм установлен: ${user.nickname}`;
        document.getElementById('nicknameStatus').style.color = '#1d6f2c';
    }
});

// ===== ОБНОВЛЕНИЕ ИНФОРМАЦИИ =====
function updateClientInfo() {
    const displayName = user.nickname || user.fullName;
    document.getElementById('clientInfo').innerHTML = `
        <div>
            <h3>${displayName}</h3>
            ${user.nickname ? `<span style="font-size:0.8rem; color:#7a8a9e;">(${user.fullName})</span><br>` : ''}
            <span class="badge">🎫 Карта: ${user.cardNumber}</span><br>
            <span style="font-size:0.8rem;">📱 ${user.phone}</span><br>
            <span style="font-size:0.8rem;color:#3e5f7e;">✅ Единая карта</span>
            ${selectedStoreName ? `<br><span style="font-size:0.8rem;color:#1d6f2c;">🏪 ${selectedStoreName}</span>` : ''}
        </div>
    `;
    document.getElementById('clientName').innerHTML = `👤 ${displayName}`;
}

// ===== ЗАГРУЗКА МАГАЗИНОВ (КЭШИРОВАННАЯ) =====
function loadClientStores() {
    if (isLoading) return;
    isLoading = true;
    
    const select = document.getElementById('clientStoreSelector');
    select.innerHTML = '<option value="">Загрузка...</option>';
    
    // Проверяем кэш
    if (storesCache.length > 0) {
        renderStores(storesCache);
        isLoading = false;
        return;
    }
    
    db.ref('stores').once('value', snap => {
        const stores = snap.val();
        storesCache = stores || {};
        renderStores(storesCache);
        isLoading = false;
    }).catch(err => {
        console.error('Ошибка загрузки магазинов:', err);
        select.innerHTML = '<option value="">Ошибка загрузки</option>';
        isLoading = false;
    });
}

function renderStores(stores) {
    const select = document.getElementById('clientStoreSelector');
    select.innerHTML = '<option value="">Выберите магазин</option>';
    
    if (!stores || Object.keys(stores).length === 0) {
        select.innerHTML = '<option value="">Нет магазинов</option>';
        return;
    }
    
    let hasStore = false;
    for (let key in stores) {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = stores[key].name;
        if (key === user.storeId) {
            option.selected = true;
            selectedStoreId = key;
            selectedStoreName = stores[key].name;
            document.getElementById('selectedStoreDisplay').innerHTML = `✅ Текущий магазин: ${selectedStoreName}`;
            hasStore = true;
        }
        select.appendChild(option);
    }
    
    if (!hasStore && stores) {
        const firstKey = Object.keys(stores)[0];
        select.value = firstKey;
        selectedStoreId = firstKey;
        selectedStoreName = stores[firstKey].name;
        document.getElementById('selectedStoreDisplay').innerHTML = `✅ Выбран магазин: ${selectedStoreName}`;
    }
    
    updateClientInfo();
    // Загружаем товары только если есть выбранный магазин
    if (selectedStoreId) {
        loadStoreProductsLite();
    }
}

function changeClientStore() {
    const select = document.getElementById('clientStoreSelector');
    const storeId = select.value;
    if (!storeId) {
        selectedStoreId = null;
        selectedStoreName = null;
        document.getElementById('selectedStoreDisplay').innerHTML = '';
        document.getElementById('storeProductsList').innerHTML = '<div class="empty-state">Выберите магазин</div>';
        updateClientInfo();
        return;
    }
    
    db.ref('stores/' + storeId).once('value', snap => {
        const store = snap.val();
        if (store) {
            selectedStoreId = storeId;
            selectedStoreName = store.name;
            document.getElementById('selectedStoreDisplay').innerHTML = `✅ Выбран магазин: ${selectedStoreName}`;
            updateClientInfo();
            loadStoreProductsLite();
            document.getElementById('priceResult').style.display = 'none';
        }
    });
}

// ===== ПРОСМОТР ТОВАРОВ (ОПТИМИЗИРОВАННЫЙ) =====
function loadStoreProductsLite() {
    const container = document.getElementById('storeProductsList');
    
    if (!selectedStoreId) {
        container.innerHTML = '<div class="empty-state">Выберите магазин</div>';
        return;
    }
    
    // Проверяем кэш
    const cacheKey = 'products_' + selectedStoreId;
    if (productsCache[cacheKey]) {
        renderProducts(productsCache[cacheKey]);
        return;
    }
    
    container.innerHTML = '<div class="loading-spinner">Загрузка...</div>';
    
    db.ref('stores/' + selectedStoreId + '/products').limitToFirst(100).once('value', snap => {
        const products = snap.val();
        productsCache[cacheKey] = products || {};
        renderProducts(productsCache[cacheKey]);
    }).catch(() => {
        container.innerHTML = '<div class="empty-state">Ошибка загрузки товаров</div>';
    });
}

function renderProducts(products) {
    const container = document.getElementById('storeProductsList');
    
    if (!products || Object.keys(products).length === 0) {
        container.innerHTML = '<div class="empty-state">В этом магазине пока нет товаров</div>';
        return;
    }
    
    let html = '';
    let count = 0;
    const productList = Object.values(products);
    
    // Показываем только первые 50 товаров для быстрой загрузки
    const displayProducts = productList.slice(0, 50);
    
    displayProducts.forEach(p => {
        count++;
        html += `
            <div class="history-item">
                <div>
                    <strong>${p.name}</strong>
                    <span style="font-size:0.7rem; color:#7a8a9e; display:block;">${p.barcode}</span>
                </div>
                <div style="text-align:right;">
                    <div style="font-weight:bold;">${p.price.toFixed(2)} ₽</div>
                    <div style="font-size:0.7rem; color:#1d6f2c;">💎 ${p.discountPrice.toFixed(2)} ₽</div>
                </div>
            </div>
        `;
    });
    
    const totalCount = productList.length;
    const moreText = totalCount > 50 ? `<div style="text-align:center; padding:8px; color:#7a8a9e; font-size:0.8rem;">Показаны первые 50 товаров из ${totalCount}</div>` : '';
    
    container.innerHTML = `
        <div style="margin-bottom:8px; font-size:0.8rem; color:#7a8a9e;">Всего товаров: ${totalCount}</div>
        ${html}
        ${moreText}
    `;
}

// ===== СКАНЕР ЦЕН =====
function scanPrice() {
    const barcode = document.getElementById('priceScannerInput').value.trim();
    if (!barcode) {
        showToast('❌ Введите штрихкод', true);
        return;
    }
    if (!selectedStoreId) {
        showToast('❌ Выберите магазин', true);
        return;
    }
    
    const resultDiv = document.getElementById('priceResult');
    const contentDiv = document.getElementById('priceResultContent');
    resultDiv.style.display = 'block';
    contentDiv.innerHTML = '<div class="loading-spinner">Поиск...</div>';
    
    db.ref('stores/' + selectedStoreId + '/products').orderByChild('barcode').equalTo(barcode).once('value', snap => {
        let product = null;
        snap.forEach(child => { product = child.val(); });
        
        if (product) {
            contentDiv.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
                    <div>
                        <div style="font-size:1.2rem; font-weight:bold;">${product.name}</div>
                        <div style="font-size:0.8rem; color:#7a8a9e;">${product.barcode}</div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:1.5rem; font-weight:bold; color:#1a1a2e;">${product.price.toFixed(2)} ₽</div>
                        <div style="font-size:0.8rem; color:#1d6f2c;">💎 ${product.discountPrice.toFixed(2)} ₽</div>
                    </div>
                </div>
                <div style="margin-top:12px; padding-top:12px; border-top:1px solid #eef2f8; font-size:0.8rem; color:#3e5f7e;">
                    💡 По карте: ${product.discountPrice.toFixed(2)} ₽
                </div>
            `;
        } else {
            contentDiv.innerHTML = `
                <div style="text-align:center; color:#b33a34; padding:12px;">
                    <div style="font-size:2rem;">❌</div>
                    <div style="font-weight:bold;">Товар не найден</div>
                </div>
            `;
        }
        document.getElementById('priceScannerInput').value = '';
    });
}

// ===== СКАНЕР ЧЕРЕЗ КАМЕРУ =====
async function startCameraScanner() {
    const container = document.getElementById('scannerContainer');
    const video = document.getElementById('scannerVideo');
    const resultDiv = document.getElementById('scannerResult');
    const resultText = document.getElementById('scannerResultText');
    
    container.style.display = 'block';
    resultDiv.style.display = 'none';
    
    try {
        codeReader = new ZXing.BrowserMultiFormatReader();
        const videoInputDevices = await codeReader.listVideoInputDevices();
        
        if (videoInputDevices.length === 0) {
            showToast('❌ Камера не найдена', true);
            container.style.display = 'none';
            return;
        }
        
        const selectedDeviceId = videoInputDevices[0].deviceId;
        
        codeReader.decodeFromVideoDevice(selectedDeviceId, video, (result, err) => {
            if (result) {
                resultDiv.style.display = 'block';
                resultText.textContent = `✅ Найден: ${result.text}`;
                resultText.style.color = '#4CAF50';
                document.getElementById('priceScannerInput').value = result.text;
                scanPrice();
                setTimeout(() => stopCameraScanner(), 1500);
            }
        });
        
        scannerInitialized = true;
        showToast('📷 Наведите камеру на штрихкод');
    } catch (error) {
        showToast('❌ Ошибка камеры', true);
        container.style.display = 'none';
    }
}

function stopCameraScanner() {
    const container = document.getElementById('scannerContainer');
    const video = document.getElementById('scannerVideo');
    
    if (codeReader) {
        try { codeReader.reset(); } catch(e) {}
        codeReader = null;
    }
    if (video.srcObject) {
        const tracks = video.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        video.srcObject = null;
    }
    container.style.display = 'none';
    scannerInitialized = false;
}

// ===== ИСТОРИЯ (ОПТИМИЗИРОВАННАЯ) =====
function loadClientHistoryLite() {
    const container = document.getElementById('clientHistory');
    const clientId = user.id;
    
    // Проверяем кэш
    if (historyCache.length > 0) {
        renderHistory(historyCache);
        return;
    }
    
    container.innerHTML = '<div class="loading-spinner">Загрузка...</div>';
    
    // Загружаем только последние 20 записей
    db.ref('clients/' + clientId + '/history').limitToLast(20).once('value', snap => {
        const history = snap.val() || [];
        historyCache = history;
        renderHistory(history);
    }).catch(() => {
        container.innerHTML = '<div class="empty-state">Ошибка загрузки</div>';
    });
}

function renderHistory(history) {
    const container = document.getElementById('clientHistory');
    
    if (!history || Object.keys(history).length === 0) {
        container.innerHTML = '<div class="empty-state">Нет покупок</div>';
        return;
    }
    
    const historyArray = Object.values(history);
    if (historyArray.length === 0) {
        container.innerHTML = '<div class="empty-state">Нет покупок</div>';
        return;
    }
    
    let html = '';
    const reversed = historyArray.reverse().slice(0, 20);
    
    reversed.forEach(item => {
        html += `
            <div class="history-item">
                <div>
                    <span style="font-size:0.7rem;color:#7a8a9e;">${item.date || 'Дата неизвестна'}</span>
                    <div style="font-weight:500;">${item.items || 'Покупка'}</div>
                    <span style="font-size:0.6rem;color:#3e5f7e;">${item.paymentMethod || ''}</span>
                    ${item.discount > 0 ? `<span style="font-size:0.6rem;color:#1d6f2c;">✅ Скидка: ${item.discount} ₽</span>` : ''}
                </div>
                <div style="text-align:right;">
                    <strong>${item.total || 0} ₽</strong>
                    <span class="badge" style="display:block; margin-top:4px;">+${item.pointsEarned || 0} баллов</span>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Слушаем изменения баланса (легковесный слушатель)
    db.ref('clients/' + user.id + '/balance').on('value', snap => {
        const balance = snap.val() || 0;
        document.getElementById('clientBalance').innerText = balance;
        const saved = JSON.parse(localStorage.getItem('shop_user'));
        saved.balance = balance;
        localStorage.setItem('shop_user', JSON.stringify(saved));
    });
}

// ===== ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК =====
function switchClientTab(tab) {
    if (scannerInitialized) stopCameraScanner();
    
    document.querySelectorAll('#client-profile, #client-card, #client-history, #client-shop').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.tab-btn[data-tab^="client-"]').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById('client-' + tab).style.display = 'block';
    document.querySelector(`.tab-btn[data-tab="client-${tab}"]`).classList.add('active');
    
    // Загружаем только при необходимости
    if (tab === 'shop' && selectedStoreId) {
        loadStoreProductsLite();
    }
    if (tab === 'history') {
        loadClientHistoryLite();
    }
}

// ===== ОСТАЛЬНЫЕ ФУНКЦИИ =====
function saveNickname() {
    const nickname = document.getElementById('profileNickname').value.trim();
    if (!nickname) { showToast('❌ Введите никнейм', true); return; }
    
    const clientId = user.id;
    db.ref('clients/' + clientId).update({ nickname: nickname }).then(() => {
        user.nickname = nickname;
        localStorage.setItem('shop_user', JSON.stringify(user));
        updateClientInfo();
        document.getElementById('nicknameStatus').innerHTML = `✅ Никнейм сохранён: ${nickname}`;
        document.getElementById('nicknameStatus').style.color = '#1d6f2c';
        showToast(`✅ Никнейм сохранён!`);
    }).catch(err => showToast('❌ Ошибка', true));
}

function generateEAN13(cardNumber, color) {
    try {
        const canvas = document.getElementById('barcodeCanvas');
        if (!canvas) return;
        const fgColor = color || currentBarcodeColor || '#000000';
        const ean13 = EAN13.generate(cardNumber);
        EAN13.draw(canvas, ean13, {
            width: 420, height: 190, fontSize: 22,
            bgColor: '#ffffff', fgColor: fgColor
        });
        document.getElementById('barcodeNumber').textContent = ean13;
        document.getElementById('barcodeNumber').style.color = fgColor;
    } catch(e) {
        console.error('Ошибка EAN-13:', e);
    }
}

function changeBarcodeColor(color) {
    currentBarcodeColor = color;
    generateEAN13(user.cardNumber, color);
    showToast('🎨 Цвет изменён');
}

function downloadBarcode() {
    const canvas = document.getElementById('barcodeCanvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'barcode-' + user.cardNumber + '.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('💾 Штрихкод сохранён');
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
