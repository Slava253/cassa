// Добавляем функцию очистки старой истории в cashier.js

// ===== ОЧИСТКА ИСТОРИИ СТАРШЕ 7 ДНЕЙ =====
function cleanOldHistory() {
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const cutoffDate = new Date(now - sevenDays);
    
    // Очищаем историю кассира
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
            db.ref().update(updates).then(() => {
                console.log('🗑 Удалена старая история кассира');
            });
        }
    });
    
    // Очищаем историю магазина
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
            db.ref().update(updates).then(() => {
                console.log('🗑 Удалена старая история магазина');
            });
        }
    });
}

// Вызываем очистку при загрузке кассира и раз в час
document.addEventListener('DOMContentLoaded', function() {
    // ... остальной код ...
    cleanOldHistory();
    setInterval(cleanOldHistory, 60 * 60 * 1000); // Каждый час
});
