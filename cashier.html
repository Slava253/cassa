// ===== ЗВУК ПРИ ДОБАВЛЕНИИ ЗАКАЗА =====
function playOrderSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Приятный звук кассы
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.frequency.value = 880;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.2);
        
        // Второй звук (как подтверждение)
        setTimeout(() => {
            const osc2 = audioCtx.createOscillator();
            const gain2 = audioCtx.createGain();
            osc2.connect(gain2);
            gain2.connect(audioCtx.destination);
            osc2.frequency.value = 1100;
            osc2.type = 'sine';
            gain2.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
            osc2.start();
            osc2.stop(audioCtx.currentTime + 0.15);
        }, 150);
    } catch(e) {
        // Если звук не поддерживается - игнорируем
        console.log('Звук не поддерживается');
    }
}

// Добавляем вызов звука в функцию processPayment
// В конце функции processPayment добавляем:
// playOrderSound();

// Также добавляем звук при добавлении товара в корзину
function addToCart() {
    // ... существующий код ...
    // В конце функции:
    playOrderSound();
}

// И при добавлении весового товара
function addWeightProduct() {
    // ... существующий код ...
    // В конце функции:
    playOrderSound();
}
