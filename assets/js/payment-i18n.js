/**
 * Payment Section i18n - Essential Translations
 * Covers main titles, labels, buttons - All 9 languages
 */

const paymentTranslations = {
    'de': {
        title_luxury: 'EXKLUSIVER', title_emphasis: 'ZUGANG', subtitle: 'Nur auf Einladung',
        method_title: 'Gesichert durch Schweizer Bankstandards',
        method_subtitle: 'Ihre Kreditkartenzahlung wird sicher durch unser Schweizer Banksystem verarbeitet',
        card_title: 'Kredit- / Debitkarte', card_instant: '✓ Sofortige Abwicklung', card_providers: 'Visa, Mastercard, Amex',
        wire_title: 'Banküberweisung', wire_unlimited: '✓ Unbegrenzter Betrag', wire_details: 'Manuelle Überweisungsdetails bereitgestellt',
        crypto_title: 'Kryptowährung', crypto_fast: '✓ Unbegrenzt - Schnell', crypto_coins: 'Bitcoin, Ethereum, USDT',
        first_name: 'Vorname', last_name: 'Nachname', email: 'E-Mail-Adresse', password: 'Passwort',
        password_confirm: 'Passwort bestätigen', phone: 'Telefonnummer', company: 'Firma (Optional)',
        ph_first_name: 'Ihr Vorname', ph_last_name: 'Ihr Nachname', ph_email: 'ihre.email@beispiel.com',
        ph_password: 'Erstellen Sie ein sicheres Passwort (mind. 8 Zeichen)', ph_password_confirm: 'Passwort erneut eingeben',
        ph_phone: '+41 XX XXX XX XX', ph_company: 'Ihr Firmenname',
        password_help: 'Dies wird für den Zugang zu Ihrem INNER CIRCLE Konto verwendet',
        btn_secure_payment: 'SICHERE ZAHLUNG'
    },
    'fr': {
        title_luxury: 'ACCÈS', title_emphasis: 'EXCLUSIF', subtitle: 'Sur Invitation Uniquement',
        method_title: 'Sécurisé par les normes bancaires suisses',
        method_subtitle: 'Votre paiement par carte de crédit sera traité en toute sécurité par notre système bancaire suisse certifié',
        card_title: 'Carte de Crédit / Débit', card_instant: '✓ Traitement Instantané', card_providers: 'Visa, Mastercard, Amex',
        wire_title: 'Virement Bancaire', wire_unlimited: '✓ Montant Illimité', wire_details: 'Détails du virement manuel fournis',
        crypto_title: 'Cryptomonnaie', crypto_fast: '✓ Illimité - Rapide', crypto_coins: 'Bitcoin, Ethereum, USDT',
        first_name: 'Prénom', last_name: 'Nom', email: 'Adresse E-mail', password: 'Mot de Passe',
        password_confirm: 'Confirmer le Mot de Passe', phone: 'Numéro de Téléphone', company: 'Entreprise (Optionnel)',
        ph_first_name: 'Votre Prénom', ph_last_name: 'Votre Nom', ph_email: 'votre.email@exemple.com',
        ph_password: 'Créez un mot de passe sécurisé (min. 8 caractères)', ph_password_confirm: 'Ressaisissez votre mot de passe',
        ph_phone: '+41 XX XXX XX XX', ph_company: 'Nom de votre entreprise',
        password_help: 'Utilisé pour accéder à votre compte INNER CIRCLE',
        btn_secure_payment: 'PAIEMENT SÉCURISÉ'
    },
    'es': {
        title_luxury: 'ACCESO', title_emphasis: 'EXCLUSIVO', subtitle: 'Solo por Invitación',
        method_title: 'Protegido por estándares bancarios suizos',
        method_subtitle: 'Su pago con tarjeta de crédito será procesado de forma segura por nuestro sistema bancario suizo certificado',
        card_title: 'Tarjeta de Crédito / Débito', card_instant: '✓ Procesamiento Instantáneo', card_providers: 'Visa, Mastercard, Amex',
        wire_title: 'Transferencia Bancaria', wire_unlimited: '✓ Cantidad Ilimitada', wire_details: 'Detalles de transferencia manual proporcionados',
        crypto_title: 'Criptomoneda', crypto_fast: '✓ Ilimitado - Rápido', crypto_coins: 'Bitcoin, Ethereum, USDT',
        first_name: 'Nombre', last_name: 'Apellido', email: 'Dirección de Correo', password: 'Contraseña',
        password_confirm: 'Confirmar Contraseña', phone: 'Número de Teléfono', company: 'Empresa (Opcional)',
        ph_first_name: 'Su Nombre', ph_last_name: 'Su Apellido', ph_email: 'su.email@ejemplo.com',
        ph_password: 'Cree una contraseña segura (mín. 8 caracteres)', ph_password_confirm: 'Vuelva a ingresar su contraseña',
        ph_phone: '+34 XXX XX XX XX', ph_company: 'Nombre de su empresa',
        password_help: 'Se usará para acceder a su cuenta INNER CIRCLE',
        btn_secure_payment: 'PAGO SEGURO'
    },
    'zh': {
        title_luxury: '独家', title_emphasis: '访问', subtitle: '仅限邀请',
        method_title: '瑞士银行标准保障安全',
        method_subtitle: '您的信用卡付款将通过我们经瑞士银行认证的支付系统安全处理',
        card_title: '信用卡 / 借记卡', card_instant: '✓ 即时处理', card_providers: 'Visa, Mastercard, Amex',
        wire_title: '银行转账', wire_unlimited: '✓ 无限金额', wire_details: '提供手动转账详细信息',
        crypto_title: '加密货币', crypto_fast: '✓ 无限 - 快速', crypto_coins: 'Bitcoin, Ethereum, USDT',
        first_name: '名字', last_name: '姓氏', email: '电子邮件地址', password: '密码',
        password_confirm: '确认密码', phone: '电话号码', company: '公司（可选）',
        ph_first_name: '您的名字', ph_last_name: '您的姓氏', ph_email: 'your.email@example.com',
        ph_password: '创建安全密码（至少8个字符）', ph_password_confirm: '重新输入密码',
        ph_phone: '+86 XXX XXXX XXXX', ph_company: '您的公司名称',
        password_help: '用于访问您的 INNER CIRCLE 账户',
        btn_secure_payment: '安全支付'
    },
    'ar': {
        title_luxury: 'الوصول', title_emphasis: 'الحصري', subtitle: 'بالدعوة فقط',
        method_title: 'مؤمّن بمعايير البنوك السويسرية',
        method_subtitle: 'ستتم معالجة دفعتك ببطاقة الائتمان بشكل آمن عبر نظامنا المصرفي السويسري المعتمد',
        card_title: 'بطاقة ائتمان / خصم', card_instant: '✓ معالجة فورية', card_providers: 'Visa, Mastercard, Amex',
        wire_title: 'تحويل بنكي', wire_unlimited: '✓ مبلغ غير محدود', wire_details: 'تفاصيل التحويل اليدوي المقدمة',
        crypto_title: 'عملة مشفرة', crypto_fast: '✓ غير محدود - سريع', crypto_coins: 'Bitcoin, Ethereum, USDT',
        first_name: 'الاسم الأول', last_name: 'اسم العائلة', email: 'عنوان البريد الإلكتروني', password: 'كلمة المرور',
        password_confirm: 'تأكيد كلمة المرور', phone: 'رقم الهاتف', company: 'الشركة (اختياري)',
        ph_first_name: 'اسمك الأول', ph_last_name: 'اسم عائلتك', ph_email: 'your.email@example.com',
        ph_password: 'إنشاء كلمة مرور آمنة (8 أحرف على الأقل)', ph_password_confirm: 'أعد إدخال كلمة المرور',
        ph_phone: '+971 XX XXX XXXX', ph_company: 'اسم شركتك',
        password_help: 'سيتم استخدامه للوصول إلى حساب INNER CIRCLE الخاص بك',
        btn_secure_payment: 'دفع آمن'
    },
    'it': {
        title_luxury: 'ACCESSO', title_emphasis: 'ESCLUSIVO', subtitle: 'Solo su Invito',
        method_title: 'Protetto dagli standard bancari svizzeri',
        method_subtitle: 'Il pagamento con carta di credito sarà elaborato in modo sicuro dal nostro sistema bancario svizzero certificato',
        card_title: 'Carta di Credito / Debito', card_instant: '✓ Elaborazione Istantanea', card_providers: 'Visa, Mastercard, Amex',
        wire_title: 'Bonifico Bancario', wire_unlimited: '✓ Importo Illimitato', wire_details: 'Dettagli bonifico manuale forniti',
        crypto_title: 'Criptovaluta', crypto_fast: '✓ Illimitato - Veloce', crypto_coins: 'Bitcoin, Ethereum, USDT',
        first_name: 'Nome', last_name: 'Cognome', email: 'Indirizzo Email', password: 'Password',
        password_confirm: 'Conferma Password', phone: 'Numero di Telefono', company: 'Azienda (Opzionale)',
        ph_first_name: 'Il tuo Nome', ph_last_name: 'Il tuo Cognome', ph_email: 'tua.email@esempio.com',
        ph_password: 'Crea una password sicura (min. 8 caratteri)', ph_password_confirm: 'Reinserisci la password',
        ph_phone: '+39 XXX XXX XXXX', ph_company: 'Nome della tua azienda',
        password_help: 'Verrà utilizzato per accedere al tuo account INNER CIRCLE',
        btn_secure_payment: 'PAGAMENTO SICURO'
    },
    'ru': {
        title_luxury: 'ЭКСКЛЮЗИВНЫЙ', title_emphasis: 'ДОСТУП', subtitle: 'Только по Приглашению',
        method_title: 'Защищено швейцарскими банковскими стандартами',
        method_subtitle: 'Ваш платёж кредитной картой будет безопасно обработан через нашу сертифицированную швейцарскую банковскую систему',
        card_title: 'Кредитная / Дебетовая Карта', card_instant: '✓ Мгновенная Обработка', card_providers: 'Visa, Mastercard, Amex',
        wire_title: 'Банковский Перевод', wire_unlimited: '✓ Неограниченная Сумма', wire_details: 'Предоставлены реквизиты ручного перевода',
        crypto_title: 'Криптовалюта', crypto_fast: '✓ Неограниченно - Быстро', crypto_coins: 'Bitcoin, Ethereum, USDT',
        first_name: 'Имя', last_name: 'Фамилия', email: 'Адрес Электронной Почты', password: 'Пароль',
        password_confirm: 'Подтвердить Пароль', phone: 'Номер Телефона', company: 'Компания (Необязательно)',
        ph_first_name: 'Ваше Имя', ph_last_name: 'Ваша Фамилия', ph_email: 'ваш.email@пример.com',
        ph_password: 'Создайте надежный пароль (мин. 8 символов)', ph_password_confirm: 'Введите пароль повторно',
        ph_phone: '+7 XXX XXX XX XX', ph_company: 'Название вашей компании',
        password_help: 'Будет использоваться для доступа к вашему аккаунту INNER CIRCLE',
        btn_secure_payment: 'БЕЗОПАСНЫЙ ПЛАТЕЖ'
    },
    'ja': {
        title_luxury: '限定', title_emphasis: 'アクセス', subtitle: '招待制のみ',
        method_title: 'スイス銀行基準で保護',
        method_subtitle: 'クレジットカード決済はスイス銀行認定の決済システムで安全に処理されます',
        card_title: 'クレジット / デビットカード', card_instant: '✓ 即時処理', card_providers: 'Visa, Mastercard, Amex',
        wire_title: '銀行送金', wire_unlimited: '✓ 無制限の金額', wire_details: '手動送金の詳細が提供されます',
        crypto_title: '暗号通貨', crypto_fast: '✓ 無制限 - 高速', crypto_coins: 'Bitcoin, Ethereum, USDT',
        first_name: '名', last_name: '姓', email: 'メールアドレス', password: 'パスワード',
        password_confirm: 'パスワードの確認', phone: '電話番号', company: '会社（任意）',
        ph_first_name: 'あなたの名前', ph_last_name: 'あなたの姓', ph_email: 'your.email@example.com',
        ph_password: '安全なパスワードを作成（8文字以上）', ph_password_confirm: 'パスワードを再入力',
        ph_phone: '+81 XX XXXX XXXX', ph_company: 'あなたの会社名',
        password_help: 'INNER CIRCLE アカウントへのアクセスに使用されます',
        btn_secure_payment: '安全な支払い'
    },
    'en': {
        title_luxury: 'EXCLUSIVE', title_emphasis: 'ACCESS', subtitle: 'By Invitation Only',
        method_title: 'Secured by Swiss Banking Standards',
        method_subtitle: 'Your credit card payment will be securely processed through our Swiss banking certified payment system',
        card_title: 'Credit / Debit Card', card_instant: '✓ Instant Processing', card_providers: 'Visa, Mastercard, Amex',
        wire_title: 'Bank Wire Transfer', wire_unlimited: '✓ Unlimited amount', wire_details: 'Manual transfer details provided',
        crypto_title: 'Cryptocurrency', crypto_fast: '✓ Unlimited - Fast', crypto_coins: 'Bitcoin, Ethereum, USDT',
        first_name: 'First Name', last_name: 'Last Name', email: 'Email Address', password: 'Password',
        password_confirm: 'Confirm Password', phone: 'Phone Number', company: 'Company (Optional)',
        ph_first_name: 'Your First Name', ph_last_name: 'Your Last Name', ph_email: 'your.email@example.com',
        ph_password: 'Create a secure password (min. 8 characters)', ph_password_confirm: 'Re-enter your password',
        ph_phone: '+41 XX XXX XX XX', ph_company: 'Your Company Name',
        password_help: 'This will be used to access your INNER CIRCLE account',
        btn_secure_payment: 'SECURE PAYMENT'
    }
};

function translatePaymentSection() {
    const lang = window.i18n?.currentLang || 'en';
    const t = paymentTranslations[lang] || paymentTranslations['en'];
    
    console.log('🔄 [PAYMENT-I18N] Translating payment section to:', lang);
    
    // Header
    const titleLuxury = document.querySelector('.title-luxury');
    const titleEmphasis = document.querySelector('.title-emphasis');
    const subtitle = document.querySelector('.payment-section .subtitle');
    if (titleLuxury) titleLuxury.textContent = t.title_luxury;
    if (titleEmphasis) titleEmphasis.textContent = t.title_emphasis;
    if (subtitle) subtitle.textContent = t.subtitle;
    
    // Payment method section
    const methodTitle = document.querySelector('.payment-method-title');
    if (methodTitle) methodTitle.textContent = t.method_title;
    
    // Payment methods
    const methods = document.querySelectorAll('.payment-method');
    if (methods[0]) {
        methods[0].querySelector('h4').textContent = t.card_title;
        methods[0].querySelector('p').textContent = t.card_instant;
        methods[0].querySelector('small').textContent = t.card_providers;
    }
    if (methods[1]) {
        methods[1].querySelector('h4').textContent = t.wire_title;
        methods[1].querySelector('p').textContent = t.wire_unlimited;
        methods[1].querySelector('small').textContent = t.wire_details;
    }
    if (methods[2]) {
        methods[2].querySelector('h4').textContent = t.crypto_title;
        methods[2].querySelector('p').textContent = t.crypto_fast;
        methods[2].querySelector('small').textContent = t.crypto_coins;
    }
    
    // Form labels
    const labels = {
        'customerFirstName': t.first_name,
        'customerLastName': t.last_name,
        'customerEmail': t.email,
        'customerPassword': t.password,
        'customerPasswordConfirm': t.password_confirm,
        'customerPhone': t.phone,
        'customerCompany': t.company
    };
    
    Object.keys(labels).forEach(id => {
        const label = document.querySelector(`label[for="${id}"]`);
        if (label) label.textContent = labels[id];
    });
    
    // Placeholders
    const inputs = {
        'customerFirstName': t.ph_first_name,
        'customerLastName': t.ph_last_name,
        'customerEmail': t.ph_email,
        'customerPassword': t.ph_password,
        'customerPasswordConfirm': t.ph_password_confirm,
        'customerPhone': t.ph_phone,
        'customerCompany': t.ph_company
    };
    
    Object.keys(inputs).forEach(id => {
        const input = document.getElementById(id);
        if (input) input.placeholder = inputs[id];
    });
    
    // Button
    const btn = document.querySelector('.payment-button .button-text');
    if (btn) btn.textContent = t.btn_secure_payment;
    
    console.log('✅ [PAYMENT-I18N] Payment section translated');
}

window.translatePaymentSection = translatePaymentSection;

// Listen for language changes
window.addEventListener('languageChanged', () => {
    setTimeout(translatePaymentSection, 50);
});

window.addEventListener('i18nReady', () => {
    setTimeout(translatePaymentSection, 100);
});

// Initial translation
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(translatePaymentSection, 150);
    });
} else {
    setTimeout(translatePaymentSection, 150);
}
