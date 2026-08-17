// ===== АДМИНИСТРАТОР =====

const user = checkAuth();
if (!user || user.role !== 'admin') {
    window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', function() {
    loadSellers();
    loadEmployees();
    loadCouriers();
    loadSupport();
    loadClients();
    loadPromotions();
});

// ===== ПРОДАВЦЫ =====
function addSeller() {
    const fullName = document.getElementById('sellerFullName').value.trim();
    const login = document.getElementById('sellerLogin').value.trim();
    const password = document.getElementById('sellerPassword').value.trim();
    
    if (!fullName || !login || !password) {
        showToast('❌ Заполните все поля!', true);
        return;
    }
    
    db.ref('sellers').orderByChild('login').equalTo(login).once('value', snap => {
        if (snap.exists()) {
            showToast('❌ Логин уже занят!', true);
            return;
        }
        
        db.ref('sellers').push({ fullName, login, password, createdAt: new Date().toISOString() })
        .then(() => {
            document.getElementById('sellerFullName').value = '';
            document.getElementById('sellerLogin').value = '';
            document.getElementById('sellerPassword').value = '';
            showToast('✅ Продавец добавлен!');
            loadSellers();
        });
    });
}

function loadSellers() {
    const container = document.getElementById('sellersList');
    container.innerHTML = '<div class="loading-spinner">Загрузка...</div>';
    
    db.ref('sellers').on('value', snap => {
        const data = snap.val();
        if (!data) { container.innerHTML = '<div class="empty-state">Нет продавцов</div>'; return; }
        let html = '';
        for (let key in data) {
            const s = data[key];
            html += `
                <div class="member-item">
                    <div>
                        <strong>📦 ${s.fullName}</strong><br>
                        <span class="badge">🔑 ${s.login}</span>
                        <span style="font-size:0.7rem;color:#3e5f7e;">🔒 ${s.password}</span>
                    </div>
                    <button class="small-btn danger" onclick="removeUser('sellers','${key}')">🗑</button>
                </div>
            `;
        }
        container.innerHTML = html;
    });
}

// ===== СОТРУДНИКИ =====
function addEmployee() {
    const fullName = document.getElementById('employeeFullName').value.trim();
    const login = document.getElementById('employeeLogin').value.trim();
    const password = document.getElementById('employeePassword').value.trim();
    
    if (!fullName || !login || !password) {
        showToast('❌ Заполните все поля!', true);
        return;
    }
    
    db.ref('employees').orderByChild('login').equalTo(login).once('value', snap => {
        if (snap.exists()) {
            showToast('❌ Логин уже занят!', true);
            return;
        }
        
        db.ref('employees').push({ fullName, login, password, createdAt: new Date().toISOString() })
        .then(() => {
            document.getElementById('employeeFullName').value = '';
            document.getElementById('employeeLogin').value = '';
            document.getElementById('employeePassword').value = '';
            showToast('✅ Сотрудник добавлен!');
            loadEmployees();
        });
    });
}

function loadEmployees() {
    const container = document.getElementById('employeesList');
    container.innerHTML = '<div class="loading-spinner">Загрузка...</div>';
    
    db.ref('employees').on('value', snap => {
        const data = snap.val();
        if (!data) { container.innerHTML = '<div class="empty-state">Нет сотрудников</div>'; return; }
        let html = '';
        for (let key in data) {
            const e = data[key];
            html += `
                <div class="member-item">
                    <div>
                        <strong>💳 ${e.fullName}</strong><br>
                        <span class="badge">🔑 ${e.login}</span>
                        <span style="font-size:0.7rem;color:#3e5f7e;">🔒 ${e.password}</span>
                    </div>
                    <button class="small-btn danger" onclick="removeUser('employees','${key}')">🗑</button>
                </div>
            `;
        }
        container.innerHTML = html;
    });
}

// ===== КУРЬЕРЫ =====
function addCourier() {
    const fullName = document.getElementById('courierFullName').value.trim();
    const login = document.getElementById('courierLogin').value.trim();
    const password = document.getElementById('courierPassword').value.trim();
    
    if (!fullName || !login || !password) {
        showToast('❌ Заполните все поля!', true);
        return;
    }
    
    db.ref('couriers').orderByChild('login').equalTo(login).once('value', snap => {
        if (snap.exists()) {
            showToast('❌ Логин уже занят!', true);
            return;
        }
        
        db.ref('couriers').push({ fullName, login, password, createdAt: new Date().toISOString() })
        .then(() => {
            document.getElementById('courierFullName').value = '';
            document.getElementById('courierLogin').value = '';
            document.getElementById('courierPassword').value = '';
            showToast('✅ Курьер добавлен!');
            loadCouriers();
        });
    });
}

function loadCouriers() {
    const container = document.getElementById('couriersList');
    container.innerHTML = '<div class="loading-spinner">Загрузка...</div>';
    
    db.ref('couriers').on('value', snap => {
        const data = snap.val();
        if (!data) { container.innerHTML = '<div class="empty-state">Нет курьеров</div>'; return; }
        let html = '';
        for (let key in data) {
            const c = data[key];
            html += `
                <div class="member-item">
                    <div>
                        <strong>🚚 ${c.fullName}</strong><br>
                        <span class="badge">🔑 ${c.login}</span>
                        <span style="font-size:0.7rem;color:#3e5f7e;">🔒 ${c.password}</span>
                    </div>
                    <button class="small-btn danger" onclick="removeUser('couriers','${key}')">🗑</button>
                </div>
            `;
        }
        container.innerHTML = html;
    });
}

// ===== ПОДДЕРЖКА =====
function addSupport() {
    const fullName = document.getElementById('supportFullName').value.trim();
    const login = document.getElementById('supportLogin').value.trim();
    const password = document.getElementById('supportPassword').value.trim();
    
    if (!fullName || !login || !password) {
        showToast('❌ Заполните все поля!', true);
        return;
    }
    
    db.ref('support').orderByChild('login').equalTo(login).once('value', snap => {
        if (snap.exists()) {
            showToast('❌ Логин уже занят!', true);
            return;
        }
        
        db.ref('support').push({ fullName, login, password, createdAt: new Date().toISOString() })
        .then(() => {
            document.getElementById('supportFullName').value = '';
            document.getElementById('supportLogin').value = '';
            document.getElementById('supportPassword').value = '';
            showToast('✅ Сотрудник поддержки добавлен!');
            loadSupport();
        });
    });
}

function loadSupport() {
    const container = document.getElementById('supportList');
    container.innerHTML = '<div class="loading-spinner">Загрузка...</div>';
    
    db.ref('support').on('value', snap => {
        const data = snap.val();
        if (!data) { container.innerHTML = '<div class="empty-state">Нет сотрудников поддержки</div>'; return; }
        let html = '';
        for (let key in data) {
            const s = data[key];
            html += `
                <div class="member-item">
                    <div>
                        <strong>🆘 ${s.fullName}</strong><br>
                        <span class="badge">🔑 ${s.login}</span>
                        <span style="font-size:0.7rem;color:#3e5f7e;">🔒 ${s.password}</span>
                    </div>
                    <button class="small-btn danger" onclick="removeUser('support','${key}')">🗑</button>
                </div>
            `;
        }
        container.innerHTML = html;
    });
}

// ===== КЛИЕНТЫ =====
function loadClients() {
    const container = document.getElementById('clientsList');
    container.innerHTML = '<div class="loading-spinner">Загрузка...</div>';
    
    db.ref('clients').on('value', snap => {
        const data = snap.val();
        if (!data) { container.innerHTML = '<div class="empty-state">Нет клиентов</div>'; return; }
        let html = '';
        for (let key in data) {
            const c = data[key];
            html += `
                <div class="member-item">
                    <div>
                        <strong>${c.fullName || 'Клиент'}</strong><br>
                        <span class="badge">🎫 ${c.cardNumber || key.slice(0,8)}</span><br>
                        <span style="font-size:0.7rem;">📱 ${c.phone}</span>
                    </div>
                    <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
                        <span class="badge">⭐ ${c.balance || 0} баллов</span>
                        <button class="small-btn danger" onclick="removeUser('clients','${key}')">🗑</button>
                    </div>
                </div>
            `;
        }
        container.innerHTML = html;
    });
}

// ===== АКЦИИ =====
function loadPromotions() {
    const container = document.getElementById('promotionsList');
    container.innerHTML = '<div class="loading-spinner">Загрузка...</div>';
    
    db.ref('promotions').on('value', snap => {
        const data = snap.val();
        if (!data) { container.innerHTML = '<div class="empty-state">Нет акций</div>'; return; }
        let html = '';
        for (let key in data) {
            const p = data[key];
            html += `
                <div class="member-item">
                    <div>
                        <strong>🎉 ${p.title}</strong><br>
                        <span style="font-size:0.8rem; color:#7a8a9e;">📅 ${p.startDate} — ${p.endDate}</span>
                    </div>
                    <button class="small-btn danger" onclick="removeUser('promotions','${key}')">🗑</button>
                </div>
            `;
        }
        container.innerHTML = html;
    });
}

// ===== УДАЛЕНИЕ =====
function removeUser(path, id) {
    if (!confirm('Удалить?')) return;
    db.ref(path + '/' + id).remove().then(() => {
        showToast('🗑 Удалено');
        // Перезагружаем все списки
        loadSellers();
        loadEmployees();
        loadCouriers();
        loadSupport();
        loadClients();
        loadPromotions();
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
