// Добавляем функцию для сканирования EAN-13 в cashier.js

// ===== СКАНИРОВАНИЕ КЛИЕНТА ПО EAN-13 =====
function scanClient() {
    const input = document.getElementById('clientScanInput').value.trim();
    if (!input) {
        showToast('❌ Введите номер карты или отсканируйте штрихкод', true);
        return;
    }
    
    // Очищаем от лишних символов
    const cleanInput = input.replace(/\D/g, '');
    
    // Проверяем, является ли ввод EAN-13 (13 цифр)
    let searchBy = 'phone';
    let searchValue = input;
    
    if (cleanInput.length === 13) {
        // Это EAN-13 штрихкод - ищем по cardNumber
        searchBy = 'cardNumber';
        searchValue = cleanInput;
    } else if (cleanInput.length === 12) {
        // Это может быть номер карты без контрольной суммы
        searchBy = 'cardNumber';
        // Добавляем контрольную сумму
        searchValue = EAN13.generate(cleanInput);
    } else {
        // Ищем по телефону
        searchBy = 'phone';
        searchValue = input;
    }
    
    db.ref('clients').once('value', snap => {
        const clients = snap.val();
        let found = null;
        let foundId = null;
        for (let key in clients) {
            const c = clients[key];
            let match = false;
            if (searchBy === 'phone') {
                match = c.phone === searchValue;
            } else {
                // Поиск по cardNumber с учетом EAN-13
                const cardClean = c.cardNumber ? c.cardNumber.replace(/\D/g, '') : '';
                match = cardClean === searchValue || c.cardNumber === searchValue;
            }
            if (match && c.storeId === storeId) {
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
            showToast('❌ Клиент не найден в этом магазине. Создайте карту!', true);
        }
        document.getElementById('clientScanInput').value = '';
    });
}
