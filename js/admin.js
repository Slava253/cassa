// ===== АДМИНИСТРАТОР =====

let cashierPhotoData = null;

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
                        ${c.photoUrl ? `<img src="${c.photoUrl}" class="member-photo">` : '<div style="width:54px;height:54px;background:#d9e2ed;border-radius:50%;display:flex;align-items:center;justify-content:center;">📷</div>'}
                        <div>
                            <strong>${c.fullName}</strong><br>
                            <span class="badge">🔑 Логин: ${c.login}</span><br>
                            <span style="font-size:0.7rem;color:#3e5f7e;">🔒 Пароль: ${c.password}</span>
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
    
    if (!fullName) {
        showToast('❌ Введите ФИО кассира', true);
        document.getElementById('cashierFullName').focus();
        return;
    }
    
    if (!login) {
        showToast('❌ Введите логин кассира', true);
        document.getElementById('cashierLogin').focus();
        return;
    }
    
    if (!password) {
        showToast('❌ Введите пароль кассира', true);
        document.getElementById('cashierPassword').focus();
        return;
    }
    
    // Проверяем уникальность логина
    db.ref('cashiers').orderByChild('login').equalTo(login).once('value', snap => {
        if (snap.exists()) {
            showToast('❌ Логин уже занят! Придумайте другой.', true);
            document.getElementById('cashierLogin').focus();
            return;
        }
        
        const data = { 
            fullName: fullName, 
            login: login, 
            password: password, 
            photoUrl: cashierPhotoData || '' 
        };
        
        db.ref('cashiers').push(data).then(() => {
            document.getElementById('cashierFullName').value = '';
            document.getElementById('cashierLogin').value = '';
            document.getElementById('cashierPassword').value = '';
            document.getElementById('cashierPhotoPreview').innerHTML = '';
            cashierPhotoData = null;
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
                            <span class="badge">🎫 Карта: ${c.cardNumber || key.slice(0,8)}</span><br>
                            <span style="font-size:0.7rem;">📱 ${c.phone}</span>
                        </div>
                    </div>
                    <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
                        <span class="badge">⭐ ${c.balance || 0} баллов</span>
                        <button class="small-btn" onclick="viewClientHistory('${key}')">📜 История</button>
                        <button class="small-btn danger" onclick="removeClient('${key}')">🗑</button>
                    </div>
                </div>
            `;
        }
        container.innerHTML = html;
    });
}

function createClientCard() {
    const fullName = document.getElementById('clientFullName').value.trim();
    const phone = document.getElementById('clientPhone').value.trim();
    
    if (!fullName) {
        showToast('❌ Введите ФИО клиента', true);
        document.getElementById('clientFullName').focus();
        return;
    }
    
    if (!phone) {
        showToast('❌ Введите телефон клиента', true);
        document.getElementById('clientPhone').focus();
        return;
    }
    
    // Проверяем уникальность телефона
    db.ref('clients').orderByChild('phone').equalTo(phone).once('value', snap => {
        if (snap.exists()) {
            showToast('❌ Клиент с таким телефоном уже существует', true);
            document.getElementById('clientPhone').focus();
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
            document.getElementById('clientFullName').value = '';
            document.getElementById('clientPhone').value = '';
            showToast(`✅ Карта создана! Номер: ${cardNumber}`);
        }).catch(err => showToast('❌ Ошибка: ' + err.message, true));
    });
}

function removeClient(id) {
    if (!confirm('Удалить клиента?')) return;
    db.ref('clients/' + id).remove().then(() => {
        showToast('🗑 Клиент удалён');
    });
}

function viewClientHistory(id) {
    db.ref('clients/' + id + '/history').once('value', snap => {
        const history = snap.val() || [];
        db.ref('clients/' + id).once('value', snap2 => {
            const data = snap2.val();
            let html = `
                <div class="modal" onclick="this.style.display='none'">
                    <div class="modal-card" onclick="event.stopPropagation()">
                        <h3 style="margin-bottom:16px;">📜 История: ${data.fullName}</h3>
            `;
            if (history.length === 0) {
                html += '<div class="empty-state">Нет покупок</div>';
            } else {
                history.slice().reverse().forEach(item => {
                    html += `
                        <div class="history-item">
                            <div><span style="font-size:0.7rem;color:#7a8a9e;">${item.date}</span></div>
                            <div>${item.total} ₽ <span class="badge">+${item.points} баллов</span></div>
                        </div>
                    `;
                });
            }
            html += `<button onclick="this.closest('.modal').style.display='none'" style="margin-top:16px;">Закрыть</button>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', html);
        });
    });
}

// ===== ФОТО =====
function onCashierPhoto(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = e => {
            cashierPhotoData = e.target.result;
            document.getElementById('cashierPhotoPreview').innerHTML = `
                <img src="${e.target.result}" class="photo-preview">
                <button class="small-btn danger" onclick="clearCashierPhoto()">Очистить</button>
            `;
        };
        reader.readAsDataURL(file);
    }
}

function clearCashierPhoto() {
    cashierPhotoData = null;
    document.getElementById('cashierPhotoPreview').innerHTML = '';
    document.getElementById('cashierPhoto').value = '';
}
