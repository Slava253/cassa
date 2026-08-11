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
                const currencyIcon = p.currency === 'Наклейки' ? '🏷️' : '⭐';
                
                // Расчет накопления (пример: показываем сколько уже накоплено)
                // В реальном проекте здесь нужно получать данные о накоплениях клиента
                const collected = Math.floor(Math.random() * p.currencyCount);
                
                html += `
                    <div class="document-card" style="border-left: 4px solid #f6b83d;">
                        <h4>🎉 ${p.title}</h4>
                        <div style="font-size:0.8rem; color:#7a8a9e;">📅 ${p.startDate} — ${p.endDate}</div>
                        <div style="margin:8px 0;">${p.description}</div>
                        <div style="font-size:0.8rem; color:#3e5f7e;">🎁 ${p.prize}</div>
                        <div style="font-size:0.8rem; color:#3e5f7e;">📋 ${p.conditions}</div>
                        <div style="margin-top:8px; padding:12px; background:#f0f4f9; border-radius:12px;">
                            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                                <span style="font-weight:600;">
                                    ${currencyIcon} ${p.currency}
                                </span>
                                <span class="badge" style="background:#1a1a2e; color:white; font-size:0.9rem;">
                                    ${collected} / ${p.currencyCount} ${p.currency === 'Наклейки' ? 'шт' : 'шт'}
                                </span>
                            </div>
                            <div style="margin-top:4px; font-size:0.8rem; color:#3e5f7e;">
                                💰 ${p.currencyPrice} ₽ за 1 ${p.currency === 'Наклейки' ? 'наклейку' : 'балл'}
                            </div>
                            <div style="margin-top:4px; width:100%; background:#eef2f8; border-radius:20px; height:10px; overflow:hidden;">
                                <div style="width:${(collected / p.currencyCount * 100)}%; background:#f6b83d; height:100%; border-radius:20px; transition: width 0.5s;"></div>
                            </div>
                            <div style="margin-top:4px; font-size:0.7rem; color:#7a8a9e;">
                                ${Math.round(collected / p.currencyCount * 100)}% выполнено
                            </div>
                        </div>
                        <span class="badge" style="background:#1d6f2c; color:white; margin-top:8px;">🔥 Активна</span>
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
