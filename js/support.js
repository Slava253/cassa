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
                        <strong>${m.clientName || 'Клиент'}</strong>
                        <span style="font-size:0.7rem; color:#7a8a9e; display:block;">📱 ${m.clientPhone || 'Не указан'}</span>
                        <span style="font-size:0.8rem; display:block;">💬 ${m.message}</span>
                        <span style="font-size:0.7rem; color:#7a8a9e;">📅 ${m.date}</span>
                        <span class="badge" style="background:#f6b83d;">${m.status}</span>
                    </div>
                    <div style="display:flex; gap:8px; flex-wrap:wrap;">
                        <input type="text" id="response_${key}" placeholder="Ответ..." style="flex:1; min-width:150px;">
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
        status: 'Отвечено'
    }).then(() => {
        showToast('✅ Ответ отправлен');
        document.getElementById('response_' + id).value = '';
        loadSupportMessages();
    }).catch(err => showToast('❌ Ошибка: ' + err.message, true));
}

function closeSupport(id) {
    if (!confirm('Закрыть обращение?')) return;
    
    db.ref('support_messages/' + id).update({
        status: 'Закрыто'
    }).then(() => {
        showToast('✅ Обращение закрыто');
        loadSupportMessages();
    });
}
