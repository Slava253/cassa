// ===== ГЕНЕРАТОР ШТРИХКОДА EAN-13 =====
// Полноценная реализация EAN-13 без внешних библиотек

var EAN13 = {
    // Кодировка символов EAN-13
    encoding: {
        '0': ['0001101', '0100111', '1110010'],
        '1': ['0011001', '0110011', '1100110'],
        '2': ['0010011', '0011011', '1101100'],
        '3': ['0111101', '0100001', '1000010'],
        '4': ['0100011', '0011101', '1011100'],
        '5': ['0110001', '0111001', '1001110'],
        '6': ['0101111', '0000101', '1010000'],
        '7': ['0111011', '0010001', '1000100'],
        '8': ['0110111', '0001001', '1001000'],
        '9': ['0001011', '0010111', '1110100']
    },
    
    // Структура кодирования EAN-13
    structure: [
        ['LLLLLL', 'RRRRRR'],
        ['LLGLGG', 'RRRRRR'],
        ['LLGGLG', 'RRRRRR'],
        ['LLGGGL', 'RRRRRR'],
        ['LGLLGG', 'RRRRRR'],
        ['LGGLLG', 'RRRRRR'],
        ['LGGGLL', 'RRRRRR'],
        ['LGLGLG', 'RRRRRR'],
        ['LGLGGL', 'RRRRRR'],
        ['LGGLGL', 'RRRRRR']
    ],
    
    // Проверка контрольной суммы EAN-13
    checksum: function(code) {
        if (code.length !== 12) return false;
        var sum = 0;
        for (var i = 0; i < 12; i++) {
            sum += parseInt(code[i]) * (i % 2 === 0 ? 1 : 3);
        }
        var check = (10 - (sum % 10)) % 10;
        return check;
    },
    
    // Генерация полного кода EAN-13
    generate: function(input) {
        // Если передан полный код (13 символов), проверяем контрольную сумму
        if (input.length === 13) {
            var code = input.substring(0, 12);
            var check = parseInt(input[12]);
            if (this.checksum(code) !== check) {
                console.warn('Неверная контрольная сумма, пересчитываю...');
                input = code + this.checksum(code);
            }
            return input;
        }
        
        // Если передан код из 12 цифр, добавляем контрольную сумму
        if (input.length === 12) {
            return input + this.checksum(input);
        }
        
        // Если передан код из 11 цифр, генерируем остальные
        if (input.length === 11) {
            // Добавляем префикс '0' для 12-значного кода
            var code = '0' + input;
            return code + this.checksum(code);
        }
        
        // Если код короче 11 символов, дополняем нулями
        var padded = input.padStart(11, '0');
        var code = '0' + padded;
        return code + this.checksum(code);
    },
    
    // Генерация случайного EAN-13
    random: function() {
        var code = '';
        for (var i = 0; i < 12; i++) {
            code += Math.floor(Math.random() * 10);
        }
        return code + this.checksum(code);
    },
    
    // Рисование штрихкода на Canvas
    draw: function(canvas, code, options) {
        if (!canvas) return;
        
        var opts = options || {};
        var width = opts.width || 300;
        var height = opts.height || 150;
        var fontSize = opts.fontSize || 16;
        var bgColor = opts.bgColor || '#ffffff';
        var fgColor = opts.fgColor || '#000000';
        
        // Проверяем и форматируем код
        var fullCode = this.generate(code);
        if (fullCode.length !== 13) {
            console.error('Неверный код EAN-13:', fullCode);
            return;
        }
        
        // Настройки
        canvas.width = width;
        canvas.height = height;
        var ctx = canvas.getContext('2d');
        
        // Очистка
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, width, height);
        
        // Параметры штрихкода
        var leftMargin = 20;
        var rightMargin = 20;
        var topMargin = 20;
        var bottomMargin = 40;
        var barWidth = (width - leftMargin - rightMargin) / 95;
        var barHeight = height - topMargin - bottomMargin;
        
        // Кодирование
        var pattern = this.encode(fullCode);
        
        // Рисование штрихов
        var x = leftMargin;
        ctx.fillStyle = fgColor;
        for (var i = 0; i < pattern.length; i++) {
            if (pattern[i] === '1') {
                ctx.fillRect(x, topMargin, barWidth, barHeight);
            }
            x += barWidth;
        }
        
        // Рисование цифр под штрихкодом
        ctx.fillStyle = fgColor;
        ctx.font = fontSize + 'px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        // Первая цифра (отдельно слева)
        var firstDigit = fullCode[0];
        ctx.fillText(firstDigit, leftMargin + 10 * barWidth, height - 25);
        
        // Остальные цифры (6 + 6)
        var leftGroup = fullCode.substring(1, 7);
        var rightGroup = fullCode.substring(7, 13);
        
        var leftStart = leftMargin + 12 * barWidth;
        var leftWidth = 48 * barWidth;
        var rightStart = leftMargin + 72 * barWidth;
        var rightWidth = 48 * barWidth;
        
        for (var j = 0; j < 6; j++) {
            ctx.fillText(leftGroup[j], leftStart + (j + 0.5) * (leftWidth / 6), height - 25);
            ctx.fillText(rightGroup[j], rightStart + (j + 0.5) * (rightWidth / 6), height - 25);
        }
        
        // Дополнительная информация
        ctx.font = '10px Arial';
        ctx.fillStyle = '#666';
        ctx.textAlign = 'right';
        ctx.fillText('EAN-13', width - 10, height - 10);
        
        return fullCode;
    },
    
    // Кодирование EAN-13 в бинарный паттерн
    encode: function(code) {
        if (code.length !== 13) return '';
        
        var firstDigit = parseInt(code[0]);
        var structure = this.structure[firstDigit][0];
        
        var pattern = '';
        var leftPart = code.substring(1, 7);
        var rightPart = code.substring(7, 13);
        
        // Левая часть
        for (var i = 0; i < 6; i++) {
            var digit = leftPart[i];
            var encoding = structure[i];
            var enc = this.encoding[digit];
            if (encoding === 'L') {
                pattern += enc[0];
            } else if (encoding === 'G') {
                pattern += enc[1];
            } else {
                pattern += enc[2];
            }
        }
        
        // Разделитель
        pattern += '01010';
        
        // Правая часть (всегда R)
        for (var j = 0; j < 6; j++) {
            var digit = rightPart[j];
            pattern += this.encoding[digit][2];
        }
        
        // Стоп-символ
        pattern += '101';
        
        return pattern;
    }
};
