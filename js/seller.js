// ===== ПРОДАВЕЦ =====

const user = checkAuth();
if (!user || user.role !== 'seller') {
    window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('sellerName').innerHTML = `👤 ${user.fullName}`;
    loadProducts();
    
    document.getElementById('productBarcode').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') document.getElementById('productName').focus();
    });
    document.getElementById('productName').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') document.getElementById('productPrice').focus();
    });
    document.getElementById('productPrice').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addProduct();
    });
});

function addProduct() {
    const barcode = document.getElementById('productBarcode').value.trim();
    const name = document.getElementById('productName').value.trim();
    const price = parseFloat(document.getElementById('productPrice').value);
    const size = document.getElementById('productSize').value;
    const description = document.getElementById('productDescription').value.trim();
    const statusDiv = document.getElementById('addProductStatus');
    
    if (!barcode) {
        statusDiv.innerHTML = '❌ Отсканируйте штрихкод товара';
        statusDiv.style.color = '#b33a34';
        document.getElementById('productBarcode').focus();
        return;
    }
    if (!name) {
        statusDiv.innerHTML = '❌ Введите название товара';
        statusDiv.style.color = '#b33a34';
        document.getElementById('productName').focus();
        return;
    }
    if (isNaN(price) || price <= 0) {
        statusDiv.innerHTML = '❌ Введите корректную цену';
        statusDiv.style.color = '#b33a34';
        document.getElementById('productPrice').focus();
        return;
    }
    
    statusDiv.innerHTML = '⏳ Проверка...';
    statusDiv.style.color = '#7a8a9e';
    
    db.ref('products').orderByChild('barcode').equalTo(barcode).once('value')
    .then(snap => {
        if (snap.exists()) {
            statusDiv.innerHTML = '❌ Товар с таким штрихкодом уже существует!';
            statusDiv.style.color = '#b33a34';
            return;
        }
        
        const productData = {
            barcode: barcode,
            name: name,
            price: price,
            size: size,
            description: description || '',
            createdAt: new Date().toISOString(),
            sellerId: user.id,
            sellerName: user.fullName
        };
        
        return db.ref('products').push(productData);
    })
    .then(() => {
        statusDiv.innerHTML = `✅ Товар "${name}" добавлен!`;
        statusDiv.style.color = '#1d6f2c';
        document.getElementById('productBarcode').value = '';
        document.getElementById('productName').value = '';
        document.getElementById('productPrice').value = '';
        document.getElementById('productDescription').value = '';
        loadProducts();
        setTimeout(() => statusDiv.innerHTML = '', 3000);
    })
    .catch(err => {
        statusDiv.innerHTML = '❌ Ошибка: ' + err.message;
        statusDiv.style.color = '#b33a34';
    });
}

function loadProducts() {
    const container = document.getElementById('productsList');
    container.innerHTML = '<div class="loading-spinner">Загрузка...</div>';
    
    db.ref('products').on('value', snap => {
        const data = snap.val();
        if (!data) {
            container.innerHTML = '<div class="empty-state">Нет товаров</div>';
            return;
        }
        let html = '';
        for (let key in data) {
            const p = data[key];
            const sizeLabel = p.size === 'large' ? '🚚 Большой' : '📦 Маленький';
            html += `
                <div class="member-item">
                    <div>
                        <strong>${p.name}</strong><br>
                        <span style="font-size:0.7rem; color:#7a8a9e;">Штрихкод: ${p.barcode}</span><br>
                        <span class="badge">💰 ${p.price} ₽</span>
                        <span class="badge">${sizeLabel}</span>
                        ${p.description ? `<span style="font-size:0.7rem; color:#3e5f7e; display:block;">${p.description}</span>` : ''}
                    </div>
                    <button class="small-btn danger" onclick="deleteProduct('${key}')">🗑</button>
                </div>
            `;
        }
        container.innerHTML = html;
    });
}

function deleteProduct(id) {
    if (!confirm('Удалить товар?')) return;
    db.ref('products/' + id).remove().then(() => {
        showToast('🗑 Товар удалён');
        loadProducts();
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
