/**
 * Page-wide i18n translations for all remaining elements
 * Ensures NOTHING stays in English when language changes
 */

const pageTranslations = {
    'de': {
        // Trust section
        'trust.rules_title': 'Regeln',
        'trust.rules_subtitle': 'Respekt und Diskretion sind Pflicht',
        'trust.members_title': 'Vertraut von Mitgliedern aus 12 Ländern',
        'trust.others': '+ 5 weitere',
        'trust.click_hint': 'Klicken Sie auf Mitglieder, um ihre Erfahrungen zu lesen',
        
        // What This Isn't section
        'what_isnt.title': 'WAS DAS HIER NICHT IST',
        'what_isnt.item1': 'Das ist kein Networking-Club. Wir machen keine Dinner.',
        'what_isnt.item2': 'Das ist keine Social-Media-Plattform. Keine Feeds, keine Likes, kein Content.',
        'what_isnt.item3': 'Das ist kein Investmentfonds. Wir fassen Ihr Geld nicht an.',
        'what_isnt.item4': 'Das ist keine Beratung. Keine Ratschläge, kein Coaching.',
        'what_isnt.item5': 'Das ist nicht verhandelbar. Der Preis ändert sich nicht.',
        'what_isnt.item6': 'Das ist nicht für jeden. Mit Absicht.',
        'last_days.title': 'Letzte Tage',
        'last_days.cat1': 'SAMMLERSTÜCKE',
        'last_days.item1': 'Mitglied in Singapur hat seltene Patek Philippe 5711 über Netzwerk-Kontakt beschafft. 40% unter Marktwert.',
        'last_days.cat2': 'KRYPTO',
        'last_days.item2': 'Mitglied in Dubai erhielt frühe Token-Empfehlung von einem anderen Mitglied. Einstieg bei $0.08, Ausstieg bei $2.40. 2.900% Rendite in 11 Tagen. Kein öffentliches Alpha — reines Netzwerk-Intel.',
        'last_days.cat3': 'IMMOBILIEN',
        'last_days.item3': 'Zürcher Mitglied erwarb Penthouse an der Bahnhofstrasse durch Mitglieder-Vorstellung. CHF 14M. Verkäufer wollte diskrete Transaktion — kein Makler, kein Listing, keine Spur.',
        'last_days.cat4': 'PRIVATE EQUITY',
        'last_days.item4': 'Drei Mitglieder poolten $25M in Pre-IPO Fintech-Deal. Vermittlung kam über privaten Netzwerk-Kanal. Lock-up: 8 Monate. Prognostiziert mindestens 5x.',
        'the_truth.title': 'D I E &nbsp; W A H R H E I T',
        'the_truth.item1': 'Wenn Sie Testimonials brauchen, sind Sie nicht bereit.',
        'the_truth.item2': 'Wenn Sie eine Geld-zurück-Garantie brauchen, fehlt Ihnen das Vertrauen.',
        'the_truth.item3': 'Wenn Sie Preisoptionen brauchen, sind Sie nicht liquide genug.',
        'the_truth.item4': 'Das ist keine Arroganz. Es ist Realität.',
        'the_truth.item5': 'Die Menschen, die hierher gehören, erkennen den Wert sofort.<br>Sie zögern nicht, sie verhandeln nicht, sie warten nicht.',
        'the_truth.signature': '— The Mechanism',
        
        // Hero buttons
        'hero.not_ready': 'NOCH NICHT BEREIT',
        'hero.description': 'Ein privates digitales Netzwerk für ausgewählte Unternehmer, Investoren und High-Performer. Diskret. Anonym. Nur auf Einladung.',
        'hero.origin': 'Gegründet in der Schweiz. Geschaffen für Menschen, die Privatsphäre, Unabhängigkeit und echte Verbindungen jenseits sozialer Medien schätzen.',
        
        // Rejection screen
        'rejection.title': 'NOCH NICHT.',
        'rejection.message': 'Nicht jede Tür öffnet sich beim ersten Versuch.',
        'rejection.warning': 'Doch die Weisheit rät',
        'rejection.truth1': '<strong>Manche Türen öffnen sich nur einmal.</strong>',
        'rejection.truth2': '<strong>Gewisse Momente existieren außerhalb der Zeit.</strong>',
        'rejection.truth3': '<strong>Wahrer Zugang wird niemals erzwungen.</strong>',
        'rejection.final': 'Wenn die Bereitschaft kommt, bleibt die Tür offen. Bis sie es nicht mehr tut.',
        'rejection.ready_now': 'ICH BIN JETZT BEREIT',
        'rejection.not_my_time': 'NICHT MEINE ZEIT',
        'rejection.reminder': 'Die Zeit wartet auf niemanden. Nicht mal auf uns.'
    },
    'fr': {
        'trust.rules_title': 'Règles',
        'trust.rules_subtitle': 'Le respect et la discrétion sont obligatoires',
        'trust.members_title': 'Approuvé par des membres dans 12 pays',
        'trust.others': '+ 5 autres',
        'trust.click_hint': 'Cliquez sur les membres pour lire leur expérience',
        'what_isnt.title': 'CE QUE CE N\'EST PAS',
        'what_isnt.item1': 'Ce n\'est pas un club de networking. Nous ne faisons pas de dîners.',
        'what_isnt.item2': 'Ce n\'est pas une plateforme sociale. Pas de flux, pas de likes, pas de contenu.',
        'what_isnt.item3': 'Ce n\'est pas un fonds d\'investissement. Nous ne touchons pas à votre argent.',
        'what_isnt.item4': 'Ce n\'est pas un service de conseil. Pas de conseils, pas de coaching.',
        'what_isnt.item5': 'Ce n\'est pas négociable. Le prix ne change pas.',
        'what_isnt.item6': 'Ce n\'est pas pour tout le monde. Par conception.',
        'last_days.title': 'Ces Derniers Jours',
        'last_days.cat1': 'COLLECTION',
        'last_days.item1': 'Membre à Singapour a trouvé une rare Patek Philippe 5711 via une connexion du réseau. 40% en dessous du marché.',
        'last_days.cat2': 'CRYPTO',
        'last_days.item2': 'Membre à Dubaï a reçu une recommandation de token d’un autre membre. Entrée à $0.08, sortie à $2.40. 2 900% de rendement en 11 jours. Aucun alpha public — pur intel réseau.',
        'last_days.cat3': 'IMMOBILIER',
        'last_days.item3': 'Membre zurichois a acquis un penthouse Bahnhofstrasse via introduction d’un membre. CHF 14M. Le vendeur voulait une transaction discrète — pas de courtier, pas d’annonce, aucune trace.',
        'last_days.cat4': 'CAPITAL-INVESTISSEMENT',
        'last_days.item4': 'Trois membres ont poolé $25M dans un deal fintech pré-IPO. Introduction via un canal privé du réseau. Lock-up: 8 mois. Projection minimum 5x.',
        'the_truth.title': 'L A &nbsp; V É R I T É',
        'the_truth.item1': 'Si vous avez besoin de témoignages, vous n\'êtes pas prêt.',
        'the_truth.item2': 'Si vous avez besoin d\'une garantie de remboursement, vous manquez de confiance.',
        'the_truth.item3': 'Si vous avez besoin d\'options de prix, vous n\'êtes pas assez liquide.',
        'the_truth.item4': 'Ce n\'est pas de l\'arrogance. C\'est la réalité.',
        'the_truth.item5': 'Ceux qui ont leur place ici reconnaissent la valeur instantanément.<br>Ils ne délibèrent pas, ne négocient pas, n\'attendent pas.',
        'the_truth.signature': '— The Mechanism',
        'hero.not_ready': 'PAS ENCORE PRÊT',
        'hero.description': 'Un réseau numérique privé pour entrepreneurs, investisseurs et personnalités de haut niveau sélectionnés. Discret. Anonyme. Sur invitation uniquement.',
        'hero.origin': 'Fondé en Suisse. Créé pour ceux qui valorisent la confidentialité, l\'indépendance et les connexions authentiques au-delà des réseaux sociaux.',
        'rejection.title': 'PAS ENCORE.',
        'rejection.message': 'Toutes les portes ne s\'ouvrent pas à la première approche.',
        'rejection.warning': 'Pourtant la sagesse suggère',
        'rejection.truth1': '<strong>Certaines portes ne s\'ouvrent qu\'une fois.</strong>',
        'rejection.truth2': '<strong>Certains moments existent en dehors du temps.</strong>',
        'rejection.truth3': '<strong>Le véritable accès n\'est jamais forcé.</strong>',
        'rejection.final': 'Quand la préparation arrive, la porte reste ouverte. Jusqu\'à ce qu\'elle ne le soit plus.',
        'rejection.ready_now': 'JE SUIS PRÊT MAINTENANT',
        'rejection.not_my_time': 'PAS MON MOMENT',
        'rejection.reminder': 'Le temps n\'attend personne. Pas même nous.'
    },
    'es': {
        'trust.rules_title': 'Reglas',
        'trust.rules_subtitle': 'El respeto y la discreción son obligatorios',
        'trust.members_title': 'Confianza de miembros en 12 países',
        'trust.others': '+ 5 más',
        'trust.click_hint': 'Haga clic en los miembros para leer su experiencia',
        'what_isnt.title': 'LO QUE ESTO NO ES',
        'what_isnt.item1': 'Esto no es un club de networking. No hacemos cenas.',
        'what_isnt.item2': 'Esto no es una plataforma social. Sin feeds, sin likes, sin contenido.',
        'what_isnt.item3': 'Esto no es un fondo de inversión. No tocamos tu dinero.',
        'what_isnt.item4': 'Esto no es un servicio de consultoría. Sin consejos, sin coaching.',
        'what_isnt.item5': 'Esto no es negociable. El precio no cambia.',
        'what_isnt.item6': 'Esto no es para todos. Por diseño.',
        'last_days.title': 'Últimos Días',
        'last_days.cat1': 'COLECCIONABLES',
        'last_days.item1': 'Miembro en Singapur consiguió un raro Patek Philippe 5711 a través de conexión de la red. 40% por debajo del mercado.',
        'last_days.cat2': 'CRIPTO',
        'last_days.item2': 'Miembro en Dubái recibió recomendación temprana de token de otro miembro. Entrada a $0.08, salida a $2.40. 2.900% de retorno en 11 días. Sin alfa público — puro intel de red.',
        'last_days.cat3': 'BIENES RAÍCES',
        'last_days.item3': 'Miembro de Zúrich adquirió penthouse en Bahnhofstrasse por presentación de miembro. CHF 14M. Vendedor quería transacción discreta — sin broker, sin listado, sin rastro.',
        'last_days.cat4': 'CAPITAL PRIVADO',
        'last_days.item4': 'Tres miembros juntaron $25M en deal fintech pre-IPO. Introducción a través de canal privado de red. Lock-up: 8 meses. Proyección mínima 5x.',
        'the_truth.title': 'L A &nbsp; V E R D A D',
        'the_truth.item1': 'Si necesitas ver testimonios, no estás listo.',
        'the_truth.item2': 'Si necesitas garantía de devolución, no tienes confianza.',
        'the_truth.item3': 'Si necesitas opciones de precio, no eres lo suficientemente líquido.',
        'the_truth.item4': 'Esto no es arrogancia. Es realidad.',
        'the_truth.item5': 'Las personas que pertenecen aquí reconocen el valor al instante.<br>No deliberan, no negocian, no esperan.',
        'the_truth.signature': '— The Mechanism',
        'hero.not_ready': 'AÚN NO ESTOY LISTO',
        'hero.description': 'Una red digital privada para empresarios, inversores e individuos de alto rendimiento seleccionados. Discreta. Anónima. Solo por invitación.',
        'hero.origin': 'Fundada en Suiza. Creada para personas que valoran la privacidad, la independencia y las conexiones significativas más allá de las redes sociales.',
        'rejection.title': 'AÚN NO.',
        'rejection.message': 'No todas las puertas se abren en el primer intento.',
        'rejection.warning': 'Pero la sabiduría sugiere',
        'rejection.truth1': '<strong>Algunas puertas se abren solo una vez.</strong>',
        'rejection.truth2': '<strong>Ciertos momentos existen fuera del tiempo.</strong>',
        'rejection.truth3': '<strong>El verdadero acceso nunca se fuerza.</strong>',
        'rejection.final': 'Cuando llegue la preparación, la puerta permanece. Hasta que ya no lo hace.',
        'rejection.ready_now': 'ESTOY LISTO AHORA',
        'rejection.not_my_time': 'NO ES MI MOMENTO',
        'rejection.reminder': 'El tiempo no espera a nadie. Ni siquiera a nosotros.'
    },
    'zh': {
        'trust.rules_title': '规则',
        'trust.rules_subtitle': '尊重和保密是强制性的',
        'trust.members_title': '受到12个国家会员的信赖',
        'trust.others': '+ 5 位其他人',
        'trust.click_hint': '点击会员阅读他们的体验',
        'what_isnt.title': '这不是什么',
        'what_isnt.item1': '这不是社交俱乐部。我们不举办晚宴。',
        'what_isnt.item2': '这不是社交平台。没有动态，没有点赞，没有内容。',
        'what_isnt.item3': '这不是投资基金。我们不碰您的钱。',
        'what_isnt.item4': '这不是咨询服务。没有建议，没有辅导。',
        'what_isnt.item5': '这不可谈判。价格不会改变。',
        'what_isnt.item6': '这不适合所有人。这是设计如此。',
        'last_days.title': '近几天',
        'last_days.cat1': '收藏品',
        'last_days.item1': '新加坡会员通过网络联系获得稀有百达翡丽5711。低于市场价%40。',
        'last_days.cat2': '加密货币',
        'last_days.item2': '迪拜会员从另一会员处获得早期代币推荐。$0.08进入，$2.40退出。11天内回报2,900%。无公开信息—纯网络情报。',
        'last_days.cat3': '房地产',
        'last_days.item3': '苏黎世会员通过会员介绍购得班霍夫大街顶层公寓。CHF 14M。卖家希望私密交易—无经纪人、无挂牌、无痕迹。',
        'last_days.cat4': '私募股权',
        'last_days.item4': '三名会员合池2500万美元投入前IPO金融科技交易。介绍通过私人网络渠道。锁定期8个月。预计至少5倍。',
        'the_truth.title': '真 &nbsp; 相',
        'the_truth.item1': '如果你需要看推荐信，你还没准备好。',
        'the_truth.item2': '如果你需要退款保证，你缺乏信心。',
        'the_truth.item3': '如果你需要定价选项，你流动性不足。',
        'the_truth.item4': '这不是傲慢。这是现实。',
        'the_truth.item5': '属于这里的人会立刻认识到价值。<br>他们不犹豫，不谈判，不等待。',
        'the_truth.signature': '— The Mechanism',
        'hero.not_ready': '我还没准备好',
        'hero.description': '为精选企业家、投资者和高绩效人士打造的私人数字网络。低调。匿名。仅限邀请。',
        'hero.origin': '创立于瑞士。为重视隐私、独立和超越社交媒体的真正连接的人而创建。',
        'rejection.title': '还没有。',
        'rejection.message': '并非每扇门在第一次尝试时都会打开。',
        'rejection.warning': '然而智慧告诉我们',
        'rejection.truth1': '<strong>有些门只会打开一次。</strong>',
        'rejection.truth2': '<strong>某些时刻存在于时间之外。</strong>',
        'rejection.truth3': '<strong>真正的访问永远不会被强迫。</strong>',
        'rejection.final': '当准备好时，门会保持打开。直到它不再打开。',
        'rejection.ready_now': '我现在准备好了',
        'rejection.not_my_time': '不是我的时候',
        'rejection.reminder': '时间不等人。甚至不等我们。'
    },
    'ar': {
        'trust.rules_title': 'القواعد',
        'trust.rules_subtitle': 'الاحترام والسرية إلزاميان',
        'trust.members_title': 'موثوق به من قبل الأعضاء في 12 دولة',
        'trust.others': '+ 5 آخرين',
        'trust.click_hint': 'انقر على الأعضاء لقراءة تجربتهم',
        'what_isnt.title': 'ما ليس هذا',
        'what_isnt.item1': 'هذا ليس نادي تواصل. نحن لا نقيم عشاءات.',
        'what_isnt.item2': 'هذه ليست منصة اجتماعية. لا تدفقات، لا إعجابات، لا محتوى.',
        'what_isnt.item3': 'هذا ليس صندوق استثمار. نحن لا نلمس أموالك.',
        'what_isnt.item4': 'هذه ليست خدمة استشارية. لا نصائح، لا تدريب.',
        'what_isnt.item5': 'هذا غير قابل للتفاوض. السعر لا يتغير.',
        'what_isnt.item6': 'هذا ليس للجميع. بالتصميم.',
        'last_days.title': 'آخر الأيام',
        'last_days.cat1': 'مقتنيات',
        'last_days.item1': 'عضو في سنغافورة حصل على ساعة باتيك فيليب 5711 نادرة عبر اتصال الشبكة. أقل بـ 40% من السوق.',
        'last_days.cat2': 'كريبتو',
        'last_days.item2': 'عضو في دبي تلقى توصية مبكرة بعملة رقمية من عضو آخر. دخول عند $0.08، خروج عند $2.40. عائد 2,900% في 11 يوم. لا معلومات عامة — معلومات شبكة خالصة.',
        'last_days.cat3': 'عقارات',
        'last_days.item3': 'عضو في زيورخ اشترى بنتهاوس في بانهوفشتراسه عبر تقديم عضو. CHF 14M. البائع أراد معاملة سرية — بدون وسيط، بدون إعلان، بدون أثر.',
        'last_days.cat4': 'استثمار خاص',
        'last_days.item4': 'ثلاثة أعضاء جمعوا $25M في صفقة فنتك قبل الاكتتاب. التقديم جاء عبر قناة شبكة خاصة. فترة الحظر: 8 أشهر. التوقع 5x كحد أدنى.',
        'hero.not_ready': 'لست جاهزاً بعد',
        'hero.description': 'شبكة رقمية خاصة لرواد أعمال ومستثمرين وأفراد متميزين مختارين. سرية. مجهولة الهوية. بدعوة فقط.',
        'hero.origin': 'تأسست في سويسرا. أُنشئت لمن يقدّرون الخصوصية والاستقلالية والروابط الحقيقية بعيداً عن وسائل التواصل الاجتماعي.',
        'rejection.title': 'ليس بعد.',
        'rejection.message': 'ليس كل باب يفتح في المحاولة الأولى.',
        'rejection.warning': 'لكن الحكمة تقترح',
        'rejection.truth1': '<strong>بعض الأبواب تفتح مرة واحدة فقط.</strong>',
        'rejection.truth2': '<strong>بعض اللحظات موجودة خارج الزمن.</strong>',
        'rejection.truth3': '<strong>الوصول الحقيقي لا يُفرض أبداً.</strong>',
        'rejection.final': 'عندما يحين الاستعداد، يبقى الباب مفتوحاً. حتى لا يعود كذلك.',
        'rejection.ready_now': 'أنا مستعد الآن',
        'rejection.not_my_time': 'ليس وقتي',
        'rejection.reminder': 'الوقت لا ينتظر أحداً. حتى نحن.'
    },
    'it': {
        'trust.rules_title': 'Regole',
        'trust.rules_subtitle': 'Rispetto e discrezione sono obbligatori',
        'trust.members_title': 'Fidato da membri in 12 paesi',
        'trust.others': '+ 5 altri',
        'trust.click_hint': 'Clicca sui membri per leggere la loro esperienza',
        'what_isnt.title': 'COSA NON È QUESTO',
        'what_isnt.item1': 'Questo non è un club di networking. Non facciamo cene.',
        'what_isnt.item2': 'Questa non è una piattaforma social. Nessun feed, nessun like, nessun contenuto.',
        'what_isnt.item3': 'Questo non è un fondo di investimento. Non tocchiamo i tuoi soldi.',
        'what_isnt.item4': 'Questo non è un servizio di consulenza. Nessun consiglio, nessun coaching.',
        'what_isnt.item5': 'Questo non è negoziabile. Il prezzo non cambia.',
        'what_isnt.item6': 'Questo non è per tutti. Per scelta.',
        'last_days.title': 'Ultimi Giorni',
        'last_days.cat1': 'COLLEZIONISMO',
        'last_days.item1': 'Membro a Singapore ha trovato un raro Patek Philippe 5711 tramite contatto di rete. 40% sotto il mercato.',
        'last_days.cat2': 'CRIPTO',
        'last_days.item2': 'Membro a Dubai ha ricevuto raccomandazione anticipata su token da un altro membro. Ingresso a $0.08, uscita a $2.40. 2.900% di rendimento in 11 giorni. Nessun alfa pubblico — puro intel di rete.',
        'last_days.cat3': 'IMMOBILIARE',
        'last_days.item3': 'Membro di Zurigo ha acquisito un attico in Bahnhofstrasse tramite presentazione di un membro. CHF 14M. Il venditore voleva una transazione discreta — nessun broker, nessun annuncio, nessuna traccia.',
        'last_days.cat4': 'PRIVATE EQUITY',
        'last_days.item4': 'Tre membri hanno raccolto $25M in un deal fintech pre-IPO. Introduzione tramite canale privato di rete. Lock-up: 8 mesi. Proiezione minima 5x.',
        'the_truth.title': 'L A &nbsp; V E R I T À',
        'the_truth.item1': 'Se hai bisogno di vedere testimonianze, non sei pronto.',
        'the_truth.item2': 'Se hai bisogno di una garanzia di rimborso, ti manca la fiducia.',
        'the_truth.item3': 'Se hai bisogno di opzioni di prezzo, non sei abbastanza liquido.',
        'the_truth.item4': 'Questa non è arroganza. È realtà.',
        'the_truth.item5': 'Le persone che appartengono qui riconoscono il valore istantaneamente.<br>Non deliberano, non negoziano, non aspettano.',
        'the_truth.signature': '— The Mechanism',
        'hero.not_ready': 'NON SONO ANCORA PRONTO',
        'hero.description': 'Una rete digitale privata per imprenditori, investitori e individui ad alte prestazioni selezionati. Discreta. Anonima. Solo su invito.',
        'hero.origin': 'Fondata in Svizzera. Creata per chi apprezza la privacy, l\'indipendenza e connessioni autentiche oltre i social media.',
        'rejection.title': 'NON ANCORA.',
        'rejection.message': 'Non ogni porta si apre al primo tentativo.',
        'rejection.warning': 'Eppure la saggezza suggerisce',
        'rejection.truth1': '<strong>Alcune porte si aprono solo una volta.</strong>',
        'rejection.truth2': '<strong>Certi momenti esistono fuori dal tempo.</strong>',
        'rejection.truth3': '<strong>Il vero accesso non è mai forzato.</strong>',
        'rejection.final': 'Quando arriva la prontezza, la porta rimane aperta. Fino a quando non lo è più.',
        'rejection.ready_now': 'SONO PRONTO ORA',
        'rejection.not_my_time': 'NON È IL MIO MOMENTO',
        'rejection.reminder': 'Il tempo non aspetta nessuno. Nemmeno noi.'
    },
    'ru': {
        'trust.rules_title': 'Правила',
        'trust.rules_subtitle': 'Уважение и конфиденциальность обязательны',
        'trust.members_title': 'Доверие членов из 12 стран',
        'trust.others': '+ 5 других',
        'trust.click_hint': 'Нажмите на участников, чтобы прочитать их опыт',
        'what_isnt.title': 'ЧЕМ ЭТО НЕ ЯВЛЯЕТСЯ',
        'what_isnt.item1': 'Это не клуб для нетворкинга. Мы не устраиваем ужинов.',
        'what_isnt.item2': 'Это не социальная платформа. Нет лент, нет лайков, нет контента.',
        'what_isnt.item3': 'Это не инвестиционный фонд. Мы не трогаем ваши деньги.',
        'what_isnt.item4': 'Это не консалтинговая услуга. Нет советов, нет коучинга.',
        'what_isnt.item5': 'Это не подлежит обсуждению. Цена не меняется.',
        'what_isnt.item6': 'Это не для всех. Так задумано.',
        'last_days.title': 'Последние дни',
        'last_days.cat1': 'КОЛЛЕКЦИОННЫЕ',
        'last_days.item1': 'Член в Сингапуре нашел редкие Patek Philippe 5711 через контакт сети. На 40% ниже рынка.',
        'last_days.cat2': 'КРИПТО',
        'last_days.item2': 'Член в Дубае получил раннюю рекомендацию токена от другого члена. Вход при $0.08, выход при $2.40. Доходность 2 900% за 11 дней. Никакой публичной информации — чистый сетевой интел.',
        'last_days.cat3': 'НЕДВИЖИМОСТЬ',
        'last_days.item3': 'Член в Цюрихе приобрел пентхаус на Банхофштрассе через представление члена. CHF 14M. Продавец хотел дискретную сделку — без брокера, без объявления, без следов.',
        'last_days.cat4': 'ЧАСТНЫЙ КАПИТАЛ',
        'last_days.item4': 'Три члена объединили $25M в пре-IPO финтех-сделку. Представление через частный канал сети. Lock-up: 8 месяцев. Прогноз минимум 5x.',
        'the_truth.title': 'П Р А В Д А',
        'the_truth.item1': 'Если вам нужны отзывы, вы не готовы.',
        'the_truth.item2': 'Если вам нужна гарантия возврата денег, вам не хватает уверенности.',
        'the_truth.item3': 'Если вам нужны варианты цен, вы недостаточно ликвидны.',
        'the_truth.item4': 'Это не высокомерие. Это реальность.',
        'the_truth.item5': 'Люди, которые принадлежат сюда, мгновенно распознают ценность.<br>Они не раздумывают, не торгуются, не ждут.',
        'the_truth.signature': '— The Mechanism',
        'hero.not_ready': 'Я ЕЩЕ НЕ ГОТОВ',
        'hero.description': 'Частная цифровая сеть для избранных предпринимателей, инвесторов и высокоэффективных личностей. Конфиденциально. Анонимно. Только по приглашению.',
        'hero.origin': 'Основана в Швейцарии. Создана для тех, кто ценит конфиденциальность, независимость и подлинные связи за пределами социальных сетей.',
        'rejection.title': 'ЕЩЕ НЕТ.',
        'rejection.message': 'Не каждая дверь открывается с первого раза.',
        'rejection.warning': 'Но мудрость подсказывает',
        'rejection.truth1': '<strong>Некоторые двери открываются только раз.</strong>',
        'rejection.truth2': '<strong>Определенные моменты существуют вне времени.</strong>',
        'rejection.truth3': '<strong>Истинный доступ никогда не форсируется.</strong>',
        'rejection.final': 'Когда приходит готовность, дверь остается открытой. Пока не перестанет.',
        'rejection.ready_now': 'Я ГОТОВ СЕЙЧАС',
        'rejection.not_my_time': 'НЕ МОЕ ВРЕМЯ',
        'rejection.reminder': 'Время не ждет никого. Даже нас.'
    },
    'ja': {
        'trust.rules_title': 'ルール',
        'trust.rules_subtitle': '尊重と裁量は必須です',
        'trust.members_title': '12か国の会員から信頼されています',
        'trust.others': '+ 5 名その他',
        'trust.click_hint': 'メンバーをクリックして体験を読む',
        'what_isnt.title': 'これは何ではないか',
        'what_isnt.item1': 'これはネットワーキングクラブではありません。ディナーは行いません。',
        'what_isnt.item2': 'これはソーシャルプラットフォームではありません。フィードなし、いいねなし、コンテンツなし。',
        'what_isnt.item3': 'これは投資ファンドではありません。あなたのお金には触れません。',
        'what_isnt.item4': 'これはコンサルティングサービスではありません。アドバイスなし、コーチングなし。',
        'what_isnt.item5': 'これは交渉不可です。価格は変わりません。',
        'what_isnt.item6': 'これは万人向けではありません。意図的に。',
        'last_days.title': '最近の数日',
        'last_days.cat1': 'コレクション',
        'last_days.item1': 'シンガポールのメンバーがネットワーク経由で希少なPatek Philippe 5711を入手。市場価格より40%安。',
        'last_days.cat2': 'クリプト',
        'last_days.item2': 'ドバイのメンバーが他のメンバーから早期トークン推薦を受け取り。$0.08で参入、$2.40で退出。11日間で2,900%のリターン。公開情報なし—純粋なネットワークインテル。',
        'last_days.cat3': '不動産',
        'last_days.item3': 'チューリッヒのメンバーがメンバー紹介でバーンホフシュトラッセのペントハウスを取得。CHF 14M。売り手は秘密取引を希望—ブローカーなし、掲載なし、痕跡なし。',
        'last_days.cat4': 'プライベートエクイティ',
        'last_days.item4': '3人のメンバーが$25MをプレIPOフィンテックディールに出資。紹介はプライベートネットワークチャネル経由。ロックアップ期間: 8ヶ月。予想最低5倍。',
        'the_truth.title': '真 &nbsp; 実',
        'the_truth.item1': '推薦状が必要なら、あなたはまだ準備ができていない。',
        'the_truth.item2': '返金保証が必要なら、あなたには自信がない。',
        'the_truth.item3': '価格オプションが必要なら、あなたは十分な流動性がない。',
        'the_truth.item4': 'これは傲慢ではない。現実だ。',
        'the_truth.item5': 'ここに属する人は瞬時に価値を認識する。<br>彼らは迷わない、交渉しない、待たない。',
        'the_truth.signature': '— The Mechanism',
        'hero.not_ready': 'まだ準備ができていない',
        'hero.description': '厳選された起業家、投資家、ハイパフォーマーのためのプライベートデジタルネットワーク。慎重に。匿名で。招待制のみ。',
        'hero.origin': 'スイスで設立。プライバシー、独立性、ソーシャルメディアを超えた本物のつながりを大切にする方のために。',
        'rejection.title': 'まだです。',
        'rejection.message': 'すべてのドアが最初のアプローチで開くわけではありません。',
        'rejection.warning': 'しかし知恵は示唆している',
        'rejection.truth1': '<strong>あるドアは一度しか開かない。</strong>',
        'rejection.truth2': '<strong>特定の瞬間は時間の外に存在する。</strong>',
        'rejection.truth3': '<strong>真のアクセスは決して強要されない。</strong>',
        'rejection.final': '準備が整えば、ドアは開いたままです。開かなくなるまで。',
        'rejection.ready_now': '今準備ができました',
        'rejection.not_my_time': '私の時間ではない',
        'rejection.reminder': '時間は誰も待たない。私たちでさえも。'
    },
    'en': {
        'trust.rules_title': 'Rules',
        'trust.rules_subtitle': 'Respect and discretion are mandatory',
        'trust.members_title': 'Trusted by members across 12 countries',
        'trust.others': '+ 5 others',
        'trust.click_hint': 'Click on members to read their experience',
        'what_isnt.title': 'WHAT THIS ISN\'T',
        'what_isnt.item1': 'This is not a networking club. We don\'t do dinners.',
        'what_isnt.item2': 'This is not a social platform. No feeds, no likes, no content.',
        'what_isnt.item3': 'This is not an investment fund. We don\'t touch your money.',
        'what_isnt.item4': 'This is not a consulting service. No advice, no coaching.',
        'what_isnt.item5': 'This is not negotiable. The price doesn\'t change.',
        'what_isnt.item6': 'This is not for everyone. By design.',
        'last_days.title': 'Last Few Days',
        'last_days.cat1': 'COLLECTIBLES',
        'last_days.item1': 'Singapore member sourced rare Patek Philippe 5711 through network connection. Below market by 40%.',
        'last_days.cat2': 'CRYPTO',
        'last_days.item2': 'Member in Dubai received early token recommendation from fellow member. Entered at $0.08, exited at $2.40. 2,900% return in 11 days. No public alpha — pure network intel.',
        'last_days.cat3': 'REAL ESTATE',
        'last_days.item3': 'Zürich member acquired penthouse in Bahnhofstrasse through member introduction. CHF 14M. Seller wanted discreet transaction — no broker, no listing, no trace.',
        'last_days.cat4': 'PRIVATE EQUITY',
        'last_days.item4': 'Three members pooled $25M into pre-IPO fintech deal. Introduction came through private network channel. Lock-up period: 8 months. Projected 5x minimum.',
        'the_truth.title': 'T H E &nbsp; T R U T H',
        'the_truth.item1': 'If you need to see testimonials, you\'re not ready.',
        'the_truth.item2': 'If you need a money-back guarantee, you\'re not confident.',
        'the_truth.item3': 'If you need pricing options, you\'re not liquid enough.',
        'the_truth.item4': 'This isn\'t arrogance. It\'s reality.',
        'the_truth.item5': 'The people who belong here recognize the value instantly.<br>They don\'t deliberate, they don\'t negotiate, they don\'t wait.',
        'the_truth.signature': '— The Mechanism',
        'hero.not_ready': 'I\'M NOT THERE YET',
        'hero.description': 'A private digital network for selected entrepreneurs, investors and high-performing individuals. Discreet. Anonymous. By invitation only.',
        'hero.origin': 'Founded in Switzerland. Created for individuals who value privacy, independence and meaningful connections beyond social media.',
        'rejection.title': 'NOT YET.',
        'rejection.message': 'Not every door opens on the first approach.',
        'rejection.warning': 'Yet wisdom suggests',
        'rejection.truth1': '<strong>Some doors open only once.</strong>',
        'rejection.truth2': '<strong>Certain moments exist outside of time.</strong>',
        'rejection.truth3': '<strong>True access is never forced.</strong>',
        'rejection.final': 'When readiness arrives, the door remains. Until it doesn\'t.',
        'rejection.ready_now': 'I\'M READY NOW',
        'rejection.not_my_time': 'NOT MY TIME',
        'rejection.reminder': 'Time moves for no one. Not even us.'
    }
};

/**
 * Translate all elements with data-i18n-key attribute
 */
function translatePageElements() {
    const currentLang = window.i18n?.currentLang || 'en';
    const translations = pageTranslations[currentLang] || pageTranslations['en'];
    
    console.log('🔄 [PAGE-I18N] Translating page elements to:', currentLang);
    console.log('🔄 [PAGE-I18N] Available translations:', Object.keys(translations));
    
    // Find all elements with data-i18n-key
    const elements = document.querySelectorAll('[data-i18n-key]');
    console.log('🔄 [PAGE-I18N] Found elements with data-i18n-key:', elements.length);
    
    let translatedCount = 0;
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n-key');
        console.log('🔍 [PAGE-I18N] Processing element with key:', key);
        
        if (translations[key]) {
            const oldText = element.innerHTML;
            const translation = translations[key];
            
            // Check if translation contains HTML tags or entities
            if (translation.includes('<') || translation.includes('&')) {
                element.innerHTML = translation; // Use innerHTML for HTML content
            } else {
                element.textContent = translation; // Use textContent for plain text
            }
            
            translatedCount++;
            console.log(`✓ [PAGE-I18N] Translated ${key}: "${oldText}" → "${translation}"`);
        } else {
            console.warn(`⚠️ [PAGE-I18N] Missing translation for key: ${key} in language ${currentLang}`);
        }
    });
    
    console.log(`✅ [PAGE-I18N] Translated ${translatedCount} page elements to ${currentLang}`);
}

// Make function globally accessible
window.translatePageElements = translatePageElements;

// Listen for language changes
window.addEventListener('languageChanged', (event) => {
    console.log('🌍 Language changed - translating page elements:', event.detail.language);
    setTimeout(translatePageElements, 50);
});

window.addEventListener('i18nReady', () => {
    console.log('🌍 i18n ready - translating page elements');
    setTimeout(translatePageElements, 100);
});

// Initial translation when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(translatePageElements, 150);
    });
} else {
    setTimeout(translatePageElements, 150);
}
