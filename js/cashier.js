// ===== КАССИР =====

// Проверка авторизации в самом начале
const user = checkAuth();
if (!user || user.role !== 'cashier') {
    window.location.href = 'index.html';
}

let currentCart = [];
let currentClient = null;
let cartTotal = 0;
let selectedPayment = null;
let discountAmount = 0;
let originalTotal = 0;
let editingProductKey = null;
let historyCache = [];
let productsCache = [];

const storeId = user.storeId;
const storeName = user.storeName || 'Магазин';

// Остальной код...
