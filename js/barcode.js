// ===== ГЕНЕРАТОР ШТРИХКОДА EAN-13 =====
var EAN13 = {
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
    
    checksum: function(code) {
        if (code.length !== 12) return false;
        var sum = 0;
        for (var i = 0; i < 12; i++) {
            sum += parseInt(code[i]) * (i % 2 === 0 ? 1 : 3);
        }
        var check = (10 - (sum % 10)) % 10;
        return check;
    },
    
    generate: function(input) {
        if (!input) return '0000000000000';
        var clean = input.replace(/\D/g, '');
        if (clean.length === 0) clean = '0';
        
        if (clean.length < 12) {
            clean = clean.padStart(12, '0');
        } else if (clean.length > 12) {
            clean = clean.substring(0, 12);
        }
        
        return clean + this.checksum(clean);
    },
    
    draw: function(canvas, code, options) {
        if (!canvas) return;
        
        var opts = options || {};
        var width = opts.width || 380;
        var height = opts.height || 180;
        var fontSize = opts.fontSize || 20;
        var bgColor = opts.bgColor || '#ffffff';
        var fgColor = opts.fgColor || '#000000'; // Черный для лучшего контраста
        
        var fullCode = this.generate(code);
        if (fullCode.length !== 13) {
            console.error('Неверный код EAN-13:', fullCode);
            return;
        }
        
        canvas.width = width;
        canvas.height = height;
        var ctx = canvas.getContext('2d');
        
        // Заливаем фон
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, width, height);
        
        // Добавляем рамку для контраста
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 1;
        ctx.strokeRect(2, 2, width - 4, height - 4);
        
        var leftMargin = 25;
        var rightMargin = 25;
        var topMargin = 25;
        var bottomMargin = 45;
        var barWidth = (width - leftMargin - rightMargin) / 95;
        var barHeight = height - topMargin - bottomMargin;
        
        var pattern = this.encode(fullCode);
        
        var x = leftMargin;
        ctx.fillStyle = fgColor;
        for (var i = 0; i < pattern.length; i++) {
            if (pattern[i] === '1') {
                ctx.fillRect(x, topMargin, barWidth, barHeight);
            }
            x += barWidth;
        }
        
        // Цифры под штрихкодом
        ctx.fillStyle = fgColor;
        ctx.font = fontSize + 'px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        var firstDigit = fullCode[0];
        ctx.fillText(firstDigit, leftMargin + 10 * barWidth, height - 28);
        
        var leftGroup = fullCode.substring(1, 7);
        var rightGroup = fullCode.substring(7, 13);
        
        var leftStart = leftMargin + 12 * barWidth;
        var leftWidth = 48 * barWidth;
        var rightStart = leftMargin + 72 * barWidth;
        var rightWidth = 48 * barWidth;
        
        for (var j = 0; j < 6; j++) {
            ctx.fillText(leftGroup[j], leftStart + (j + 0.5) * (leftWidth / 6), height - 28);
            ctx.fillText(rightGroup[j], rightStart + (j + 0.5) * (rightWidth / 6), height - 28);
        }
        
        // Подпись
        ctx.font = '11px Arial';
        ctx.fillStyle = '#666';
        ctx.textAlign = 'right';
        ctx.fillText('EAN-13', width - 12, height - 8);
        
        // Дополнительная информация внизу
        ctx.textAlign = 'left';
        ctx.font = '9px Arial';
        ctx.fillStyle = '#999';
        ctx.fillText('Штрихкод для сканирования', 12, height - 8);
        
        return fullCode;
    },
    
    encode: function(code) {
        if (code.length !== 13) return '';
        
        var firstDigit = parseInt(code[0]);
        var structure = this.structure[firstDigit][0];
        
        var pattern = '';
        var leftPart = code.substring(1, 7);
        var rightPart = code.substring(7, 13);
        
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
        
        pattern += '01010';
        
        for (var j = 0; j < 6; j++) {
            var digit = rightPart[j];
            pattern += this.encoding[digit][2];
        }
        
        pattern += '101';
        
        return pattern;
    }
};
