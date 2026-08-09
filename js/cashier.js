// Добавляем обработчики Enter для полей добавления товара
document.addEventListener('DOMContentLoaded', function() {
    // ... существующий код ...
    
    // Enter для добавления товара
    document.getElementById('newProductBarcode').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            document.getElementById('newProductName').focus();
        }
    });
    document.getElementById('newProductName').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            document.getElementById('newProductPrice').focus();
        }
    });
    document.getElementById('newProductPrice').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            document.getElementById('newProductDiscountPrice').focus();
        }
    });
    document.getElementById('newProductDiscountPrice').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addNewProduct();
        }
    });
});
