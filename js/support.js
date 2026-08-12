// ===== ПОДДЕРЖКА =====

const user = checkAuth();
if (!user || user.role !== 'support') {
    window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('supportName').innerHTML = `🆘 ${user.fullName}`;
    loadSupportMessages();
});

function loadSupportMessages() {
    const container = document.getElementById('supportMessagesList');
    container.innerHTML = '<div class="loading-spinner">Загрузка...</div>';
    
    db.ref('support_messages').orderByChild('status').equalTo('Новое').on('value', snap => {
        const data = snap.val();
        if (!data) {
            container.innerHTML = '<div class="empty-state">Нет новых сообщений</div>';
            return;
        }
        let html = '';
        for (let key in data) {
            const m = data[key];
            html += `
                <div class="member-item">
                    <div>
                        <strong>👤 ${m.clientName || 'Клиент'}</strong>
                        <span style="font-size:0.7rem; color:#7a8a9e; display:block;">📱 ${m.clientPhone || 'Не указан'}</span>
                        <span style="font-size:0.8rem; display:block;">💬 ${m.message}</span>
                        <span style="font-size:0.7rem; color:#7a8a9e;">📅 ${m.date}</span>
                        <span class="badge" style="background:#f6b83d;">${m.status}</span>
                    </div>
                    <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:8px;">
                        <input type="text" id="response_${key}" placeholder="Введите ответ..." style="flex:2; min-width:150px;">
                        <button onclick="sendResponse('${key}')" class="btn-success">📨 Ответить</button>
                        <button onclick="closeSupport('${key}')" class="btn-warning">✅ Закрыть</button>
                    </div>
                </div>
            `;
        }
        container.innerHTML = html;
    });
}

function sendResponse(id) {
    const response = document.getElementById('response_' + id).value.trim();
    if (!response) {
        showToast('❌ Введите ответ', true);
        return;
    }
    
    db.ref('support_messages/' + id).update({
        response: response,
        status: 'Отвечено',
        responseDate: new Date().toLocaleString('ru-RU'),
        supportName: user.fullName
    }).then(() => {
        showToast('✅ Ответ отправлен клиенту');
        document.getElementById('response_' + id).value = '';
        // Перезагружаем список
        loadSupportMessages();
        // Обновляем сообщения у клиента
        updateClientSupportMessages(id, response);
    }).catch(err => showToast('❌ Ошибка: ' + err.message, true));
}

function updateClientSupportMessages(id, response) {
    // Получаем данные сообщения
    db.ref('support_messages/' + id).once('value', snap => {
        const data = snap.val();
        if (data && data.clientId) {
            // Обновляем в клиентских сообщениях (если клиент онлайн)
            // Это будет отображаться при следующей загрузке
        }
    });
}

function closeSupport(id) {
    if (!confirm('Закрыть обращение?')) return;
    
    db.ref('support_messages/' + id).update({
        status: 'Закрыто',
        closedDate: new Date().toLocaleString('ru-RU')
    }).then(() => {
        showToast('✅ Обращение закрыто');
        loadSupportMessages();
    });
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
