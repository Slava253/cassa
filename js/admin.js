// ===== АДМИНИСТРАТОР =====

const user = checkAuth();
if (!user || user.role !== 'admin') {
    window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', function() {
    loadCashiers();
    loadClients();
});

// ===== КАССИРЫ =====
function loadCashiers() {
    const container = document.getElementById('cashiersList');
    container.innerHTML = '<div class="loading-spinner">Загрузка...</div>';
    
    db.ref('cashiers').on('value', snap => {
        const data = snap.val();
        if (!data) {
            container.innerHTML = '<div class="empty-state">Нет кассиров</div>';
            return;
        }
        let html = '';
        for (let key in data) {
            const c = data[key];
            html += `
                <div class="member-item">
                    <div class="member-info">
                        <div>
                            <strong>${c.fullName}</strong><br>
                            <span class="badge">🔑 ${c.login}</span><br>
                            <span style="font-size:0.7rem;color:#3e5f7e;">🔒 ${c.password}</span>
                        </div>
                    </div>
                    <button class="small-btn danger" onclick="removeCashier('${key}')">🗑 Удалить</button>
                </div>
            `;
        }
        container.innerHTML = html;
    });
}

function addCashier() {
    const fullName = document.getElementById('cashierFullName').value.trim();
    const login = document.getElementById('cashierLogin').value.trim();
    const password = document.getElementById('cashierPassword').value.trim();
    
    if (!fullName || !login || !password) {
        showToast('❌ Заполните все поля!', true);
        return;
    }
    
    db.ref('cashiers').orderByChild('login').equalTo(login).once('value', snap => {
        if (snap.exists()) {
            showToast('❌ Логин уже занят!', true);
            return;
        }
        
        const data = { fullName, login, password };
        db.ref('cashiers').push(data).then(() => {
            document.getElementById('cashierFullName').value = '';
            document.getElementById('cashierLogin').value = '';
            document.getElementById('cashierPassword').value = '';
            showToast(`✅ Кассир ${fullName} добавлен!`);
        }).catch(err => showToast('❌ Ошибка: ' + err.message, true));
    });
}

function removeCashier(id) {
    if (!confirm('Удалить кассира?')) return;
    db.ref('cashiers/' + id).remove().then(() => {
        showToast('🗑 Кассир удалён');
    });
}

// ===== КЛИЕНТЫ =====
function loadClients() {
    const container = document.getElementById('clientsList');
    container.innerHTML = '<div class="loading-spinner">Загрузка...</div>';
    
    db.ref('clients').on('value', snap => {
        const data = snap.val();
        if (!data) {
            container.innerHTML = '<div class="empty-state">Нет клиентов</div>';
            return;
        }
        let html = '';
        for (let key in data) {
            const c = data[key];
            html += `
                <div class="member-item">
                    <div class="member-info">
                        <div>
                            <strong>${c.fullName}</strong><br>
                            <span class="badge">🎫 ${c.cardNumber || key.slice(0,8)}</span><br>
                            <span style="font-size:0.7rem;">📱 ${c.phone}</span>
                        </div>
                    </div>
                    <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
                        <span class="badge">⭐ ${c.balance || 0} баллов</span>
                        <button class="small-btn danger" onclick="removeClient('${key}')">🗑</button>
                    </div>
                </div>
            `;
        }
        container.innerHTML = html;
    });
}

function removeClient(id) {
    if (!confirm('Удалить клиента?')) return;
    db.ref('clients/' + id).remove().then(() => {
        showToast('🗑 Клиент удалён');
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
