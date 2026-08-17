<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes, viewport-fit=cover">
    <meta name="theme-color" content="#1a1a2e">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <link rel="manifest" href="manifest.json">
    <link rel="apple-touch-icon" href="img/icon-192.png">
    <title>Marka | Сотрудник</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/mobile.css">
</head>
<body>
    <div class="app-container">
        <div class="header">
            <div class="logo-area">
                <h1>💳 Marka</h1>
                <p>Панель сотрудника</p>
            </div>
            <div class="user-status">
                <span id="employeeName">👤 Сотрудник</span>
                <button onclick="logout()">Выйти</button>
            </div>
        </div>

        <div class="main-content">
            <!-- Поиск клиента по QR -->
            <div class="card">
                <div class="card-title">🎫 Найти клиента по QR</div>
                <div style="display:flex; gap:12px; flex-wrap:wrap;">
                    <div class="form-group" style="flex:2; min-width:200px;">
                        <label>Отсканируйте QR-код клиента</label>
                        <input type="text" id="clientQRInput" placeholder="250633891_02872_160998_1" style="font-size:1rem; font-family:monospace;">
                    </div>
                    <button onclick="findClientByQR()" style="align-self:flex-end;">🔍 Найти</button>
                </div>
                <div id="foundClient" style="display:none;" class="member-item" style="margin-top:12px;"></div>
            </div>

            <!-- Прием товара -->
            <div class="card" style="border: 2px solid #f6b83d;">
                <div class="card-title">📦 Прием товара</div>
                <div style="display:flex; gap:12px; flex-wrap:wrap;">
                    <div class="form-group" style="flex:2; min-width:200px;">
                        <label>🔲 Отсканируйте штрихкод товара</label>
                        <input type="text" id="receiveBarcode" placeholder="4601234567890" style="font-size:1.2rem; font-family:monospace;">
                    </div>
                    <button onclick="findOrdersByProduct()" style="align-self:flex-end;">🔍 Найти заказы</button>
                </div>
                <div id="foundOrders" style="margin-top:12px;"></div>
            </div>

            <!-- Выдача/Возврат -->
            <div class="card" style="border: 2px solid #1d6f2c;">
                <div class="card-title">🔄 Выдача/Возврат</div>
                <div style="display:flex; gap:12px; flex-wrap:wrap;">
                    <div class="form-group" style="flex:2; min-width:200px;">
                        <label>🔲 Отсканируйте штрихкод товара</label>
                        <input type="text" id="returnBarcode" placeholder="4601234567890" style="font-size:1.2rem; font-family:monospace;">
                    </div>
                    <div class="form-group" style="flex:1; min-width:80px;">
                        <label>Количество</label>
                        <input type="number" id="returnQuantity" value="1" min="1">
                    </div>
                    <button onclick="processReturn()" style="align-self:flex-end;">🔄 Выдать/Вернуть</button>
                </div>
                <div id="returnResult" style="margin-top:12px;"></div>
            </div>
        </div>
    </div>

    <div id="toast" class="success-toast" style="display:none;"></div>

    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-database-compat.js"></script>
    <script src="js/firebase-config.js"></script>
    <script src="js/auth.js"></script>
    <script src="js/employee.js"></script>
</body>
</html>
