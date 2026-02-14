// API Endpoint: Reveal Content (Server-side protected)
// Only returns the secret content to authenticated, paid users
import pg from 'pg';

const { Pool } = pg;

function getPool() {
    const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.STORAGE_URL;
    return new Pool({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false }
    });
}

// CORS: Only allow requests from our domain
function getCorsOrigin(req) {
    const origin = req.headers.origin || req.headers['origin'];
    const allowed = ['https://billionairs.luxury', 'https://www.billionairs.luxury'];
    return allowed.includes(origin) ? origin : allowed[0];
}

// Read token from HttpOnly cookie
function getTokenFromCookie(req) {
    const cookies = req.headers.cookie || '';
    const match = cookies.match(/billionairs_session=([^;]+)/);
    return match ? match[1] : null;
}

// The reveal content - stored server-side, never sent to client until verified
const REVEAL_CONTENT = {
    en: {
        title: 'THE FINAL TRUTH',
        description: `You have crossed the threshold few dare to approach.<br><br>
What lies beyond is not gold. Not diamonds. Not material wealth.<br><br>
It is the understanding that separates the builders from the dreamers.<br><br>
<strong>Time is not money.</strong><br>
Time is the canvas upon which wealth is painted.<br><br>
Master your minutes, and millions follow.<br><br>
The secret every titan of industry knows:<br>
Not gold. Not diamonds.<br>
Something far more precious.<br><br>
Something that moves in circles, yet never repeats.<br><br>
One decision. One moment. Everything changes.<br><br>
<strong>You now possess what the elite measure their lives by.</strong>`
    },
    de: {
        title: 'DIE LETZTE WAHRHEIT',
        description: `Sie haben die Schwelle überschritten, die nur wenige wagen.<br><br>
Was dahinter liegt, ist nicht Gold. Nicht Diamanten. Nicht materieller Reichtum.<br><br>
Es ist das Verständnis, das die Erbauer von den Träumern trennt.<br><br>
<strong>Zeit ist nicht Geld.</strong><br>
Zeit ist die Leinwand, auf der Reichtum gemalt wird.<br><br>
Beherrschen Sie Ihre Minuten, und Millionen folgen.<br><br>
Das Geheimnis, das jeder Industrietitan kennt:<br>
Nicht Gold. Nicht Diamanten.<br>
Etwas viel Kostbareres.<br><br>
Etwas, das sich im Kreis bewegt, sich aber nie wiederholt.<br><br>
Eine Entscheidung. Ein Moment. Alles ändert sich.<br><br>
<strong>Sie besitzen jetzt das, womit die Elite ihr Leben misst.</strong>`
    },
    fr: {
        title: 'LA VÉRITÉ FINALE',
        description: `Vous avez franchi le seuil que peu osent approcher.<br><br>
Ce qui se trouve au-delà n'est pas de l'or. Pas des diamants. Pas de richesse matérielle.<br><br>
C'est la compréhension qui sépare les bâtisseurs des rêveurs.<br><br>
<strong>Le temps n'est pas de l'argent.</strong><br>
Le temps est la toile sur laquelle la richesse est peinte.<br><br>
Maîtrisez vos minutes, et les millions suivent.<br><br>
Le secret que tout titan de l'industrie connaît:<br>
Pas d'or. Pas de diamants.<br>
Quelque chose de bien plus précieux.<br><br>
Quelque chose qui se déplace en cercles, mais ne se répète jamais.<br><br>
Une décision. Un moment. Tout change.<br><br>
<strong>Vous possédez maintenant ce par quoi l'élite mesure sa vie.</strong>`
    },
    es: {
        title: 'LA VERDAD FINAL',
        description: `Has cruzado el umbral que pocos se atreven a acercarse.<br><br>
Lo que hay más allá no es oro. Ni diamantes. Ni riqueza material.<br><br>
Es la comprensión que separa a los constructores de los soñadores.<br><br>
<strong>El tiempo no es dinero.</strong><br>
El tiempo es el lienzo sobre el cual se pinta la riqueza.<br><br>
Domina tus minutos, y los millones seguirán.<br><br>
El secreto que todo titán de la industria conoce:<br>
No oro. No diamantes.<br>
Algo mucho más precioso.<br><br>
Algo que se mueve en círculos, pero nunca se repite.<br><br>
Una decisión. Un momento. Todo cambia.<br><br>
<strong>Ahora posees con lo que la élite mide sus vidas.</strong>`
    },
    zh: {
        title: '最终真相',
        description: `您已跨越了少数人敢于接近的门槛。<br><br>
超越之处不是黄金。不是钻石。不是物质财富。<br><br>
这是将建设者与梦想家分开的理解。<br><br>
<strong>时间不是金钱。</strong><br>
时间是财富绘制的画布。<br><br>
掌握你的分钟，百万随之而来。<br><br>
每个工业巨头都知道的秘密：<br>
不是黄金。不是钻石。<br>
更珍贵的东西。<br><br>
循环运动，但永不重复的东西。<br><br>
一个决定。一个时刻。一切都改变。<br><br>
<strong>您现在拥有精英衡量生活的东西。</strong>`
    },
    ar: {
        title: 'الحقيقة النهائية',
        description: `لقد عبرت العتبة التي يجرؤ القليلون على الاقتراب منها.<br><br>
ما وراءها ليس ذهباً. ولا ألماساً. ولا ثروة مادية.<br><br>
إنه الفهم الذي يفصل البناة عن الحالمين.<br><br>
<strong>الوقت ليس مالاً.</strong><br>
الوقت هو اللوحة التي ترسم عليها الثروة.<br><br>
أتقن دقائقك، والملايين تتبع.<br><br>
السر الذي يعرفه كل عملاق صناعي:<br>
ليس ذهباً. ولا ألماساً.<br>
شيء أكثر قيمة بكثير.<br><br>
شيء يتحرك في دوائر، لكنه لا يتكرر أبداً.<br><br>
قرار واحد. لحظة واحدة. كل شيء يتغير.<br><br>
<strong>أنت الآن تمتلك ما تقيس به النخبة حياتها.</strong>`
    },
    it: {
        title: 'LA VERITÀ FINALE',
        description: `Hai attraversato la soglia che pochi osano avvicinare.<br><br>
Ciò che si trova oltre non è oro. Non diamanti. Non ricchezza materiale.<br><br>
È la comprensione che separa i costruttori dai sognatori.<br><br>
<strong>Il tempo non è denaro.</strong><br>
Il tempo è la tela su cui si dipinge la ricchezza.<br><br>
Padroneggia i tuoi minuti, e milioni seguiranno.<br><br>
Il segreto che ogni titano dell'industria conosce:<br>
Non oro. Non diamanti.<br>
Qualcosa di molto più prezioso.<br><br>
Qualcosa che si muove in cerchi, ma non si ripete mai.<br><br>
Una decisione. Un momento. Tutto cambia.<br><br>
<strong>Ora possiedi ciò con cui l'élite misura le proprie vite.</strong>`
    },
    ru: {
        title: 'ОКОНЧАТЕЛЬНАЯ ИСТИНА',
        description: `Вы пересекли порог, к которому немногие осмеливаются приблизиться.<br><br>
То, что находится за ним, — это не золото. Не бриллианты. Не материальное богатство.<br><br>
Это понимание, которое отделяет строителей от мечтателей.<br><br>
<strong>Время — это не деньги.</strong><br>
Время — это холст, на котором рисуется богатство.<br><br>
Овладейте своими минутами, и миллионы последуют.<br><br>
Секрет, который знает каждый титан индустрии:<br>
Не золото. Не бриллианты.<br>
Нечто гораздо более ценное.<br><br>
Нечто, что движется по кругу, но никогда не повторяется.<br><br>
Одно решение. Один момент. Все меняется.<br><br>
<strong>Теперь вы обладаете тем, чем элита измеряет свои жизни.</strong>`
    },
    ja: {
        title: '最終の真実',
        description: `あなたは、ほとんどの人が近づこうとしない敷居を越えました。<br><br>
その先にあるのは金ではありません。ダイヤモンドでもありません。物質的な富でもありません。<br><br>
建設者と夢想家を分けるのは理解です。<br><br>
<strong>時間はお金ではありません。</strong><br>
時間は富が描かれるキャンバスです。<br><br>
あなたの分を支配すれば、何百万もついてきます。<br><br>
すべての産業の巨人が知っている秘密：<br>
金ではない。ダイヤモンドではない。<br>
もっと貴重なもの。<br><br>
円を描いて動くが、決して繰り返さないもの。<br><br>
一つの決断。一つの瞬間。すべてが変わる。<br><br>
<strong>あなたは今、エリートが人生を測るものを所有しています。</strong>`
    }
};

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const pool = getPool();

    try {
        const { lang } = req.body;
        const token = getTokenFromCookie(req) || req.body.token;

        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Verify session token AND check payment status
        const result = await pool.query(
            `SELECT u.payment_status, u.email 
             FROM sessions s 
             JOIN users u ON s.user_id = u.id 
             WHERE s.token = $1 AND s.expires_at > NOW()`,
            [token]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid or expired session' });
        }

        const user = result.rows[0];

        if (user.payment_status !== 'paid') {
            return res.status(403).json({ error: 'Payment required to access this content' });
        }

        // User is authenticated AND has paid — return the secret content
        const language = lang && REVEAL_CONTENT[lang] ? lang : 'en';
        const content = REVEAL_CONTENT[language];

        return res.status(200).json({
            success: true,
            title: content.title,
            description: content.description
        });

    } catch (error) {
        console.error('❌ Reveal content error:', error);
        return res.status(500).json({ error: 'Server error' });
    } finally {
        await pool.end();
    }
}
