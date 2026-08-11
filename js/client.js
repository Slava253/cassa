// ===== КЛИЕНТ =====

const user = checkAuth();
if (!user || user.role !== 'client') {
    window.location.href = 'index.html';
}

let currentBarcodeColor = '#000000';
let selectedStoreId = null;
let selectedStoreName = null;
let scannerInitialized = false;
let codeReader = null;
let productsCache = {};
let historyCache = [];
let storesCache = [];
let isLoading = false;

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('clientName').innerHTML = `👤 ${user.nickname || user.fullName}`;
    document.getElementById('clientStoreDisplay').innerHTML = `🏪 ${user.storeName || 'Магазин'}`;
    document.getElementById('clientBalance').innerText = user.balance || 0;
    
    document.getElementById('profilePhone').value = user.phone || '';
    document.getElementById('profileNickname').value = user.nickname || '';
    document.getElementById('profileCardNumber').value = user.cardNumber || '';
    
    document.getElementById('profilePhone').removeAttribute('readonly');
    document.getElementById('profilePhone').style.background = '#ffffff';
    
    updateClientInfo();
    generateEAN13(user.cardNumber);
    loadClientStores();
    loadClientHistoryLite();
    
    if (user.nickname) {
        document.getElementById('nicknameStatus').innerHTML = `✅ Никнейм установлен: ${user.nickname}`;
        document.getElementById('nicknameStatus').style.color = '#1d6f2c';
    }
});

// ===== СОХРАНЕНИЕ НОМЕРА ТЕЛЕФОНА =====
function savePhoneNumber() {
    const phone = document.getElementById('profilePhone').value.trim();
    if (!phone) {
        showToast('❌ Введите номер телефона', true);
        document.getElementById('profilePhone').focus();
        return;
    }
    
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
        showToast('❌ Введите корректный номер телефона', true);
        return;
    }
    
    const clientId = user.id;
    const oldPhone = user.phone;
    
    db.ref('clients').orderByChild('phone').equalTo(phone).once('value', snap => {
        let exists = false;
        snap.forEach(child => {
            if (child.key !== clientId) exists = true;
        });
        
        if (exists) {
            showToast('❌ Этот номер телефона уже используется', true);
            return;
        }
        
        db.ref('clients/' + clientId).update({ phone: phone }).then(() => {
            user.phone = phone;
            localStorage.setItem('shop_user', JSON.stringify(user));
            updateClientInfo();
            showToast(`✅ Номер телефона обновлён: ${phone
