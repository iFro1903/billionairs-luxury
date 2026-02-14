import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import { getCorsOrigin } from '../lib/cors.js';

// Generate unique certificate number from email
async function generateCertNumber(email) {
    const { createHash } = await import('crypto');
    const hash = createHash('sha256').update(email.toLowerCase() + 'BILLIONAIRS2025').digest('hex');
    return 'BILL-2025-' + hash.substring(0, 8).toUpperCase();
}

// Certificate translations
const translations = {
    en: {
        private_circle: "Private Member's Circle",
        tagline: "Est. Zürich • MMXXV",
        title: "Certificate of Exclusive Access",
        final_truth: "THE FINAL TRUTH",
        intro: "You have crossed the threshold<br>few dare to approach.",
        not_gold: "What lies beyond is <em>not gold</em>.<br><em>Not diamonds</em>. Not material wealth.",
        builders: "It is the understanding that separates<br>the <strong>builders</strong> from the dreamers.",
        quote: "Time is not money.<br>Time is the canvas upon which wealth is painted.<br><br>Master your minutes, and millions follow.",
        secret: "The secret every titan of industry knows:",
        something_precious: "<strong>Not gold. Not diamonds.</strong><br><strong>Something far more precious.</strong>",
        moves_in_circles: "<em>Something that moves in circles,<br>yet never repeats.</em>",
        one_decision: "One decision. One moment.<br>Everything changes.",
        you_possess: "You now possess what the elite measure their lives by.",
        investment: "Membership Investment",
        subscription: "Annual Subscription",
        payment_confirmed: "Payment Confirmed",
        access_granted: "Access Granted",
        member_verified: "Member Verified",
        security: "Secured by Swiss Banking Standards<br>Blockchain Verified • Encrypted Infrastructure<br>Zürich, Switzerland",
        establishment: "Billionairs Private Member's Circle • Established MMXXV"
    },
    de: {
        private_circle: "Privater Mitgliederkreis",
        tagline: "Gegr. Zürich • MMXXV",
        title: "Zertifikat für Exklusiven Zugang",
        final_truth: "DIE ENDGÜLTIGE WAHRHEIT",
        intro: "Sie haben die Schwelle überschritten,<br>die nur wenige zu betreten wagen.",
        not_gold: "Was dahinter liegt, ist <em>nicht Gold</em>.<br><em>Nicht Diamanten</em>. Nicht materieller Reichtum.",
        builders: "Es ist das Verständnis, das<br>die <strong>Erbauer</strong> von den Träumern trennt.",
        quote: "Zeit ist nicht Geld.<br>Zeit ist die Leinwand, auf der Reichtum gemalt wird.<br><br>Meistern Sie Ihre Minuten, und Millionen folgen.",
        secret: "Das Geheimnis, das jeder Titan der Industrie kennt:",
        something_precious: "<strong>Nicht Gold. Nicht Diamanten.</strong><br><strong>Etwas viel Kostbareres.</strong>",
        moves_in_circles: "<em>Etwas, das sich im Kreis bewegt,<br>aber sich nie wiederholt.</em>",
        one_decision: "Eine Entscheidung. Ein Moment.<br>Alles ändert sich.",
        you_possess: "Sie besitzen jetzt, woran die Elite ihr Leben misst.",
        investment: "Mitgliedschaftsinvestition",
        subscription: "Jährliches Abonnement",
        payment_confirmed: "Zahlung Bestätigt",
        access_granted: "Zugang Gewährt",
        member_verified: "Mitglied Verifiziert",
        security: "Gesichert durch Schweizer Bankstandards<br>Blockchain Verifiziert • Verschlüsselte Infrastruktur<br>Zürich, Schweiz",
        establishment: "Billionairs Privater Mitgliederkreis • Gegründet MMXXV"
    },
    fr: {
        private_circle: "Cercle Privé des Membres",
        tagline: "Fondé à Zurich • MMXXV",
        title: "Certificat d'Accès Exclusif",
        final_truth: "LA VÉRITÉ FINALE",
        intro: "Vous avez franchi le seuil<br>que peu osent approcher.",
        not_gold: "Ce qui se trouve au-delà n'est <em>ni or</em>.<br><em>Ni diamants</em>. Ni richesse matérielle.",
        builders: "C'est la compréhension qui sépare<br>les <strong>bâtisseurs</strong> des rêveurs.",
        quote: "Le temps n'est pas de l'argent.<br>Le temps est la toile sur laquelle la richesse est peinte.<br><br>Maîtrisez vos minutes, et les millions suivent.",
        secret: "Le secret que connaît tout titan de l'industrie :",
        something_precious: "<strong>Ni or. Ni diamants.</strong><br><strong>Quelque chose de bien plus précieux.</strong>",
        moves_in_circles: "<em>Quelque chose qui tourne en rond,<br>mais ne se répète jamais.</em>",
        one_decision: "Une décision. Un moment.<br>Tout change.",
        you_possess: "Vous possédez maintenant ce par quoi l'élite mesure sa vie.",
        investment: "Investissement d'Adhésion",
        subscription: "Abonnement Annuel",
        payment_confirmed: "Paiement Confirmé",
        access_granted: "Accès Accordé",
        member_verified: "Membre Vérifié",
        security: "Sécurisé par les Standards Bancaires Suisses<br>Vérifié par Blockchain • Infrastructure Cryptée<br>Zurich, Suisse",
        establishment: "Billionairs Cercle Privé des Membres • Fondé MMXXV"
    },
    es: {
        private_circle: "Círculo Privado de Miembros",
        tagline: "Est. Zúrich • MMXXV",
        title: "Certificado de Acceso Exclusivo",
        final_truth: "LA VERDAD FINAL",
        intro: "Has cruzado el umbral<br>que pocos se atreven a acercarse.",
        not_gold: "Lo que yace más allá no es <em>oro</em>.<br><em>No diamantes</em>. No riqueza material.",
        builders: "Es la comprensión que separa a<br>los <strong>constructores</strong> de los soñadores.",
        quote: "El tiempo no es dinero.<br>El tiempo es el lienzo sobre el cual se pinta la riqueza.<br><br>Domina tus minutos, y los millones siguen.",
        secret: "El secreto que todo titán de la industria conoce:",
        something_precious: "<strong>No oro. No diamantes.</strong><br><strong>Algo mucho más precioso.</strong>",
        moves_in_circles: "<em>Algo que se mueve en círculos,<br>pero nunca se repite.</em>",
        one_decision: "Una decisión. Un momento.<br>Todo cambia.",
        you_possess: "Ahora posees lo que la élite mide en sus vidas.",
        investment: "Inversión de Membresía",
        subscription: "Suscripción Anual",
        payment_confirmed: "Pago Confirmado",
        access_granted: "Acceso Concedido",
        member_verified: "Miembro Verificado",
        security: "Asegurado por Estándares Bancarios Suizos<br>Verificado por Blockchain • Infraestructura Encriptada<br>Zúrich, Suiza",
        establishment: "Billionairs Círculo Privado de Miembros • Establecido MMXXV"
    },
    it: {
        private_circle: "Cerchia Privata dei Membri",
        tagline: "Fondato Zurigo • MMXXV",
        title: "Certificato di Accesso Esclusivo",
        final_truth: "LA VERITÀ FINALE",
        intro: "Hai attraversato la soglia<br>che pochi osano avvicinare.",
        not_gold: "Ciò che si trova oltre non è <em>oro</em>.<br><em>Non diamanti</em>. Non ricchezza materiale.",
        builders: "È la comprensione che separa<br>i <strong>costruttori</strong> dai sognatori.",
        quote: "Il tempo non è denaro.<br>Il tempo è la tela su cui viene dipinta la ricchezza.<br><br>Padroneggia i tuoi minuti e i milioni seguono.",
        secret: "Il segreto che ogni titano dell'industria conosce:",
        something_precious: "<strong>Non oro. Non diamanti.</strong><br><strong>Qualcosa di molto più prezioso.</strong>",
        moves_in_circles: "<em>Qualcosa che si muove in cerchio,<br>ma non si ripete mai.</em>",
        one_decision: "Una decisione. Un momento.<br>Tutto cambia.",
        you_possess: "Ora possiedi ciò con cui l'élite misura la propria vita.",
        investment: "Investimento di Adesione",
        subscription: "Abbonamento Annuale",
        payment_confirmed: "Pagamento Confermato",
        access_granted: "Accesso Concesso",
        member_verified: "Membro Verificato",
        security: "Protetto da Standard Bancari Svizzeri<br>Verificato tramite Blockchain • Infrastruttura Crittografata<br>Zurigo, Svizzera",
        establishment: "Billionairs Cerchia Privata dei Membri • Fondato MMXXV"
    },
    ru: {
        private_circle: "Частный Круг Членов",
        tagline: "Осн. Цюрих • MMXXV",
        title: "Сертификат Эксклюзивного Доступа",
        final_truth: "ОКОНЧАТЕЛЬНАЯ ИСТИНА",
        intro: "Вы пересекли порог,<br>к которому немногие осмеливаются приблизиться.",
        not_gold: "То, что за ним, — это <em>не золото</em>.<br><em>Не бриллианты</em>. Не материальное богатство.",
        builders: "Это понимание, которое отделяет<br><strong>строителей</strong> от мечтателей.",
        quote: "Время — это не деньги.<br>Время — это холст, на котором рисуется богатство.<br><br>Овладейте своими минутами, и миллионы последуют.",
        secret: "Секрет, который знает каждый титан индустрии:",
        something_precious: "<strong>Не золото. Не бриллианты.</strong><br><strong>Что-то гораздо более ценное.</strong>",
        moves_in_circles: "<em>Что-то, что движется по кругу,<br>но никогда не повторяется.</em>",
        one_decision: "Одно решение. Один момент.<br>Всё меняется.",
        you_possess: "Теперь вы обладаете тем, чем элита измеряет свою жизнь.",
        investment: "Инвестиция в Членство",
        subscription: "Годовая Подписка",
        payment_confirmed: "Платёж Подтверждён",
        access_granted: "Доступ Предоставлен",
        member_verified: "Член Верифицирован",
        security: "Защищено по Швейцарским Банковским Стандартам<br>Верифицировано Блокчейном • Зашифрованная Инфраструктура<br>Цюрих, Швейцария",
        establishment: "Billionairs Частный Круг Членов • Основан MMXXV"
    },
    zh: {
        private_circle: "私人会员圈",
        tagline: "苏黎世创立 • MMXXV",
        title: "专属访问证书",
        final_truth: "最终真相",
        intro: "你已跨越了<br>少数人敢于接近的门槛。",
        not_gold: "超越之处不是<em>黄金</em>。<br><em>不是钻石</em>。不是物质财富。",
        builders: "这是将<strong>建设者</strong><br>与梦想家分开的理解。",
        quote: "时间不是金钱。<br>时间是描绘财富的画布。<br><br>掌控你的分钟，百万随之而来。",
        secret: "每个行业巨头都知道的秘密：",
        something_precious: "<strong>不是黄金。不是钻石。</strong><br><strong>而是更珍贵的东西。</strong>",
        moves_in_circles: "<em>它循环运动，<br>却从不重复。</em>",
        one_decision: "一个决定。一个瞬间。<br>一切都会改变。",
        you_possess: "你现在拥有精英用来衡量生命的东西。",
        investment: "会员投资",
        subscription: "年度订阅",
        payment_confirmed: "付款已确认",
        access_granted: "已授予访问权限",
        member_verified: "会员已验证",
        security: "由瑞士银行标准保护<br>区块链验证 • 加密基础设施<br>苏黎世，瑞士",
        establishment: "Billionairs 私人会员圈 • 创立于 MMXXV"
    },
    ja: {
        private_circle: "プライベートメンバーズサークル",
        tagline: "設立 チューリッヒ • MMXXV",
        title: "限定アクセス証明書",
        final_truth: "最終真実",
        intro: "あなたは、ほとんどの人が近づくことを<br>恐れる閾値を越えました。",
        not_gold: "その向こうにあるのは<em>金ではありません</em>。<br><em>ダイヤモンドでもありません</em>。物質的な富でもありません。",
        builders: "それは<strong>建設者</strong>を<br>夢想家から分ける理解です。",
        quote: "時は金なりではありません。<br>時間は富が描かれるキャンバスです。<br><br>分を制すれば、百万が続きます。",
        secret: "業界のあらゆる巨人が知っている秘密：",
        something_precious: "<strong>金ではありません。ダイヤモンドでもありません。</strong><br><strong>もっと貴重なものです。</strong>",
        moves_in_circles: "<em>円を描いて動くが、<br>決して繰り返さないもの。</em>",
        one_decision: "一つの決断。一つの瞬間。<br>すべてが変わります。",
        you_possess: "あなたは今、エリートが人生を測るものを所有しています。",
        investment: "メンバーシップ投資",
        subscription: "年間サブスクリプション",
        payment_confirmed: "支払い確認済み",
        access_granted: "アクセス許可",
        member_verified: "メンバー認証済み",
        security: "スイス銀行基準で保護<br>ブロックチェーン認証 • 暗号化インフラストラクチャ<br>チューリッヒ、スイス",
        establishment: "Billionairs プライベートメンバーズサークル • 設立 MMXXV"
    },
    ar: {
        private_circle: "دائرة الأعضاء الخاصة",
        tagline: "تأسست في زيوريخ • MMXXV",
        title: "شهادة الوصول الحصري",
        final_truth: "الحقيقة النهائية",
        intro: "لقد عبرت العتبة<br>التي قلة تجرؤ على الاقتراب منها.",
        not_gold: "ما يكمن وراءها ليس <em>ذهبًا</em>.<br><em>ليس ألماسًا</em>. ليس ثروة مادية.",
        builders: "إنه الفهم الذي<br>يفصل <strong>البناة</strong> عن الحالمين.",
        quote: "الوقت ليس مالاً.<br>الوقت هو اللوحة التي ترسم عليها الثروة.<br><br>أتقن دقائقك، وتتبعها الملايين.",
        secret: "السر الذي يعرفه كل عملاق في الصناعة:",
        something_precious: "<strong>ليس ذهبًا. ليس ألماسًا.</strong><br><strong>شيء أكثر قيمة بكثير.</strong>",
        moves_in_circles: "<em>شيء يتحرك في دوائر،<br>لكنه لا يتكرر أبدًا.</em>",
        one_decision: "قرار واحد. لحظة واحدة.<br>كل شيء يتغير.",
        you_possess: "أنت الآن تمتلك ما تقيس به النخبة حياتهم.",
        investment: "استثمار العضوية",
        subscription: "اشتراك سنوي",
        payment_confirmed: "تم تأكيد الدفع",
        access_granted: "تم منح الوصول",
        member_verified: "عضو موثق",
        security: "محمي بمعايير البنوك السويسرية<br>موثق بالبلوكتشين • بنية تحتية مشفرة<br>زيوريخ، سويسرا",
        establishment: "Billionairs دائرة الأعضاء الخاصة • تأسست MMXXV"
    }
};

function buildCertificateHTML(t, certNumber) {
    const isRTL = false; // AR would be RTL but we keep certificate LTR for design consistency
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;0,6..96,600;0,6..96,700;1,6..96,400&family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&display=swap');

        @page { size: A4; margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: 'Crimson Text', serif;
            background: #000;
            color: #E8B4A0;
            width: 21cm;
        }

        .page {
            width: 21cm;
            min-height: 29.7cm;
            background: linear-gradient(135deg, #000000 0%, #0d0d0d 50%, #000000 100%);
            padding: 2.5cm 2.5cm;
            position: relative;
            box-shadow: inset 0 0 0 1px rgba(232, 180, 160, 0.3),
                        inset 0 0 0 2px rgba(0, 0, 0, 0.8),
                        inset 0 0 0 3px rgba(232, 180, 160, 0.15);
        }

        .corner-ornament {
            position: absolute;
            width: 80px;
            height: 80px;
            border-style: solid;
            border-color: rgba(232, 180, 160, 0.4);
        }
        .corner-ornament.top-left { top: 1cm; left: 1cm; border-width: 1px 0 0 1px; }
        .corner-ornament.top-right { top: 1cm; right: 1cm; border-width: 1px 1px 0 0; }
        .corner-ornament.bottom-left { bottom: 1cm; left: 1cm; border-width: 0 0 1px 1px; }
        .corner-ornament.bottom-right { bottom: 1cm; right: 1cm; border-width: 0 1px 1px 0; }

        .header {
            text-align: center;
            margin-bottom: 2cm;
        }

        .institution-name {
            font-family: 'Bodoni Moda', serif;
            font-size: 10px;
            letter-spacing: 6px;
            text-transform: uppercase;
            color: rgba(232, 180, 160, 0.7);
            margin-bottom: 5px;
        }

        .logo {
            font-family: 'Bodoni Moda', serif;
            font-size: 46px;
            font-weight: 700;
            letter-spacing: 15px;
            color: #E8B4A0;
            margin-bottom: 12px;
            text-transform: uppercase;
        }

        .tagline {
            font-size: 9px;
            letter-spacing: 5px;
            color: rgba(232, 180, 160, 0.5);
            text-transform: uppercase;
        }

        .divider {
            width: 55px;
            height: 1px;
            background: linear-gradient(90deg, transparent, #E8B4A0, transparent);
            margin: 28px auto;
        }

        .certificate-title { text-align: center; margin: 30px 0 28px; }
        .certificate-label {
            font-size: 9px;
            letter-spacing: 4px;
            color: rgba(232, 180, 160, 0.5);
            text-transform: uppercase;
            margin-bottom: 12px;
        }
        .certificate-name {
            font-family: 'Bodoni Moda', serif;
            font-size: 32px;
            font-weight: 600;
            letter-spacing: 7px;
            color: #ffffff;
            text-transform: uppercase;
        }

        .content {
            max-width: 500px;
            margin: 0 auto;
            text-align: center;
            line-height: 2.4;
            font-size: 16px;
            color: rgba(255, 255, 255, 0.85);
        }
        .content p { margin-bottom: 28px; }
        .content em { font-style: italic; color: #E8B4A0; }
        .content strong { font-weight: 700; color: #E8B4A0; letter-spacing: 0.5px; }

        .quote-block {
            margin: 50px auto;
            padding: 45px 40px;
            max-width: 550px;
            border-top: 1px solid rgba(232, 180, 160, 0.25);
            border-bottom: 1px solid rgba(232, 180, 160, 0.25);
            position: relative;
            background: linear-gradient(180deg, transparent 0%, rgba(232, 180, 160, 0.02) 50%, transparent 100%);
        }
        .quote-block::before {
            content: '\\201E';
            position: absolute;
            top: -15px;
            left: 50%;
            transform: translateX(-50%);
            font-family: 'Bodoni Moda', serif;
            font-size: 80px;
            color: rgba(232, 180, 160, 0.2);
            line-height: 1;
        }
        .quote-text {
            font-family: 'Bodoni Moda', serif;
            font-style: italic;
            font-size: 16px;
            line-height: 1.8;
            color: #E8B4A0;
            text-align: center;
        }

        .amount-section {
            margin: 40px 0;
            padding: 28px 30px;
            text-align: center;
            border: 1px solid rgba(232, 180, 160, 0.25);
            background: linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(20,20,20,0.2) 100%);
        }
        .amount-label {
            font-size: 9px;
            letter-spacing: 3px;
            color: rgba(232, 180, 160, 0.6);
            text-transform: uppercase;
            margin-bottom: 12px;
        }
        .amount-value {
            font-family: 'Bodoni Moda', serif;
            font-size: 36px;
            font-weight: 600;
            color: #E8B4A0;
            letter-spacing: 3px;
            margin-bottom: 18px;
        }
        .amount-period {
            font-size: 10px;
            letter-spacing: 2px;
            color: rgba(255,255,255,0.5);
            text-transform: uppercase;
        }
        .status-badges {
            display: flex;
            justify-content: center;
            gap: 25px;
            margin-top: 20px;
            flex-wrap: wrap;
        }
        .badge {
            font-size: 8px;
            letter-spacing: 2px;
            color: #2ecc71;
            text-transform: uppercase;
            padding: 6px 14px;
            border: 1px solid rgba(46, 204, 113, 0.3);
            background: rgba(46, 204, 113, 0.05);
        }
        .badge::before { content: none; }

        .footer {
            margin-top: 50px;
            padding-top: 25px;
            border-top: 1px solid rgba(232, 180, 160, 0.2);
            text-align: center;
        }
        .security-info {
            font-size: 8px;
            letter-spacing: 3px;
            color: rgba(232, 180, 160, 0.4);
            text-transform: uppercase;
            line-height: 2;
            margin-bottom: 15px;
        }
        .verification-code {
            font-family: 'Courier New', monospace;
            font-size: 8px;
            letter-spacing: 2px;
            color: rgba(232, 180, 160, 0.35);
            margin-top: 10px;
        }
        .establishment {
            font-size: 8px;
            letter-spacing: 2px;
            color: rgba(255,255,255,0.25);
            text-transform: uppercase;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="page">
        <div class="corner-ornament top-left"></div>
        <div class="corner-ornament top-right"></div>
        <div class="corner-ornament bottom-left"></div>
        <div class="corner-ornament bottom-right"></div>

        <div class="header">
            <div class="institution-name">${t.private_circle}</div>
            <div class="logo">BILLIONAIRS</div>
            <div class="tagline">${t.tagline}</div>
        </div>

        <div class="divider"></div>

        <div class="certificate-title">
            <div class="certificate-label">${t.title}</div>
            <div class="certificate-name">${t.final_truth}</div>
        </div>

        <div class="content">
            <p>${t.intro}</p>
            <p>${t.not_gold}</p>
            <p>${t.builders}</p>
        </div>

        <div class="quote-block">
            <div class="quote-text">${t.quote}</div>
        </div>

        <div class="content">
            <p>${t.secret}</p>
            <p>${t.something_precious}</p>
            <p>${t.moves_in_circles}</p>
            <p style="margin-top: 35px;">${t.one_decision}</p>
            <p>${t.you_possess}</p>
        </div>

        <div class="amount-section">
            <div class="amount-label">${t.investment}</div>
            <div class="amount-value">CHF 500,000</div>
            <div class="amount-period">${t.subscription}</div>
            <div class="status-badges">
                <div class="badge">${t.payment_confirmed}</div>
                <div class="badge">${t.access_granted}</div>
                <div class="badge">${t.member_verified}</div>
            </div>
        </div>

        <div class="footer">
            <div class="security-info">${t.security}</div>
            <div class="verification-code">CERTIFICATE NO. ${certNumber}</div>
            <div class="establishment">${t.establishment}</div>
        </div>
    </div>
</body>
</html>`;
}

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    let browser = null;

    try {
        const { email, lang } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Verify user has paid
        const { sql } = await import('@vercel/postgres');

        const result = await sql`
            SELECT id, payment_status, member_id, full_name
            FROM users 
            WHERE email = ${email}
        `;

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];
        if (user.payment_status !== 'paid') {
            return res.status(403).json({ error: 'Payment required' });
        }

        // Generate certificate number
        const certNumber = await generateCertNumber(email);

        // Get translations
        const userLang = lang && translations[lang] ? lang : 'en';
        const t = translations[userLang];

        // Build HTML
        const html = buildCertificateHTML(t, certNumber);

        // Launch browser
        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
        });

        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0', timeout: 15000 });

        // Wait for fonts to load
        await page.evaluateHandle('document.fonts.ready');
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Generate PDF
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: 0, right: 0, bottom: 0, left: 0 },
            preferCSSPageSize: true,
        });

        await browser.close();
        browser = null;

        // Log download
        try {
            await sql`
                INSERT INTO downloads (user_id, downloaded_at)
                VALUES (${user.id}, NOW())
            `;
        } catch (logErr) {
            console.error('Download log failed (non-critical):', logErr.message);
        }

        // Send PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="BILLIONAIRS-Certificate-${certNumber}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.status(200).send(Buffer.from(pdfBuffer));

    } catch (error) {
        console.error('Certificate PDF generation error:', error);
        if (browser) {
            try { await browser.close(); } catch (e) {}
        }
        res.status(500).json({ error: 'Failed to generate certificate PDF' });
    }
}
