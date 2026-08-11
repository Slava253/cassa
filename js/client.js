// Добавляем функцию загрузки акций в client.js

// ===== ЗАГРУЗКА АКЦИЙ =====
function loadClientPromotions() {
    const container = document.getElementById('clientPromotionsList');
    container.innerHTML = '<div class="loading-spinner">Загрузка акций...</div>';
    
    db.ref('promotions').orderByChild('active').equalTo(true).once('value', snap => {
        const data = snap.val();
        if (!data) {
            container.innerHTML = '<div class="empty-state">Нет активных акций</div>';
            return;
        }
        
        const now = new Date();
        let html = '';
        let hasActive = false;
        
        for (let key in data) {
            const p = data[key];
            const start = new Date(p.startDate);
            const end = new Date(p.endDate);
            
            if (start <= now && end >= now && p.active) {
                hasActive = true;
                html += `
                    <div class="document-card" style="border-left: 4px solid #f6b83d;">
                        <h4>🎉 ${p.title}</h4>
                        <div style="font-size:0.8rem; color:#7a8a9e;">📅 ${p.startDate} — ${p.endDate}</div>
                        <div style="margin:8px 0;">${p.description}</div>
                        <div style="font-size:0.8rem; color:#3e5f7e;">🎁 ${p.prize}</div>
                        <div style="font-size:0.8rem; color:#3e5f7e;">📋 ${p.conditions}</div>
                        <span class="badge" style="background:#1d6f2c; color:white;">🔥 Активна</span>
                    </div>
                `;
            }
        }
        
        container.innerHTML = hasActive ? html : '<div class="empty-state">Нет активных акций</div>';
    });
}

// ===== ОБНОВЛЯЕМ ВКЛАДКИ КЛИЕНТА =====
function switchClientTab(tab) {
    if (scannerInitialized) stopCameraScanner();
    
    document.querySelectorAll('#client-profile, #client-card, #client-history, #client-shop, #client-promotions').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.tab-btn[data-tab^="client-"]').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById('client-' + tab).style.display = 'block';
    document.querySelector(`.tab-btn[data-tab="client-${tab}"]`).classList.add('active');
    
    if (tab === 'shop' && selectedStoreId) loadStoreProductsLite();
    if (tab === 'history') loadClientHistoryLite();
    if (tab === 'promotions') loadClientPromotions();
}

// ===== ОБНОВЛЯЕМ ЗАГРУЗКУ МАГАЗИНОВ С АДРЕСАМИ =====
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
        const address = stores[key].address ? `📍 ${stores[key].address}` : '';
        option.textContent = `${stores[key].name} ${address}`;
        if (key === user.storeId) {
            option.selected = true;
            selectedStoreId = key;
            selectedStoreName = stores[key].name;
            document.getElementById('selectedStoreDisplay').innerHTML = `✅ Текущий магазин: ${selectedStoreName} ${address}`;
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
    if (selectedStoreId) loadStoreProductsLite();
}
