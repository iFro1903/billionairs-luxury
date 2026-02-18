// Password Strength Indicator
function updatePasswordStrength(pw) {
    const bar = document.getElementById('passwordStrengthBar');
    if (!bar) return;
    bar.style.display = pw.length > 0 ? 'block' : 'none';
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^a-zA-Z0-9]/.test(pw)) score++;
    const colors = ['#c0392b', '#e67e22', '#C9A96E', '#50C878'];
    const langLabels = {
        en: ['WEAK', 'FAIR', 'STRONG', 'VERY STRONG'],
        de: ['SCHWACH', 'MITTEL', 'STARK', 'SEHR STARK'],
        fr: ['FAIBLE', 'MOYEN', 'FORT', 'TRES FORT'],
        es: ['D\u00c9BIL', 'MEDIO', 'FUERTE', 'MUY FUERTE'],
        it: ['DEBOLE', 'MEDIO', 'FORTE', 'MOLTO FORTE'],
        ru: ['\u0421\u041b\u0410\u0411\u042b\u0419', '\u0421\u0420\u0415\u0414\u041d\u0418\u0419', '\u041d\u0410\u0414\u0401\u0416\u041d\u042b\u0419', '\u041e\u0427\u0415\u041d\u042c \u041d\u0410\u0414\u0401\u0416\u041d\u042b\u0419'],
        zh: ['\u5f31', '\u4e2d\u7b49', '\u5f3a', '\u975e\u5e38\u5f3a'],
        ja: ['\u5f31\u3044', '\u666e\u901a', '\u5f37\u3044', '\u975e\u5e38\u306b\u5f37\u3044'],
        ar: ['\u0636\u0639\u064a\u0641', '\u0645\u062a\u0648\u0633\u0637', '\u0642\u0648\u064a', '\u0642\u0648\u064a \u062c\u062f\u0627']
    };
    const lang = localStorage.getItem('billionairs_lang') || 'en';
    const labels = langLabels[lang] || langLabels.en;
    for (let i = 1; i <= 4; i++) {
        document.getElementById('str' + i).style.background = i <= score ? colors[score - 1] : 'rgba(255,255,255,0.1)';
    }
    document.getElementById('strLabel').textContent = score > 0 ? labels[score - 1] : '';
    document.getElementById('strLabel').style.color = score > 0 ? colors[score - 1] : 'rgba(255,255,255,0.4)';
}

// Wire up password input event listener (replaces inline oninput)
document.addEventListener('DOMContentLoaded', function() {
    const passwordInput = document.getElementById('customerPassword');
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            updatePasswordStrength(this.value);
        });
    }
});
