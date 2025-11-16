/**
 * Modal Content Translation System
 * Translates FAQ, Legal, Privacy, Terms modals
 */

const modalTranslations = {
    de: {
        titles: {
            'FAQ': 'FAQ',
            'What is BILLIONAIRS?': 'Was ist BILLIONAIRS?',
            'Why the investment?': 'Warum die Investition?',
            'Who is this for?': 'Für wen ist das?',
            'Security & Privacy': 'Sicherheit & Datenschutz',
            'What you may gain': 'Was Sie gewinnen können',
            'How long does access take?': 'Wie lange dauert der Zugang?',
            'Can I see examples or testimonials?': 'Kann ich Beispiele oder Testimonials sehen?',
            'What if I change my mind?': 'Was ist, wenn ich meine Meinung ändere?',
            'Availability': 'Verfügbarkeit',
            'How do I know this is real?': 'Woher weiß ich, dass das echt ist?',
            'LEGAL NOTICE': 'RECHTLICHE HINWEISE',
            'PRIVACY POLICY': 'DATENSCHUTZ',
            'TERMS & CONDITIONS': 'AGB',
            'Entity': 'Unternehmen',
            'Contact': 'Kontakt',
            'Legal Notice': 'Rechtliche Hinweise',
            'Information We Collect': 'Welche Informationen wir sammeln',
            'How We Use Your Data': 'Wie wir Ihre Daten verwenden',
            'Data Protection': 'Datenschutz',
            'Your Rights': 'Ihre Rechte',
            'Agreement': 'Vereinbarung',
            'Transaction Terms': 'Transaktionsbedingungen',
            'Access & Eligibility': 'Zugang & Berechtigung',
            'Intellectual Property': 'Geistiges Eigentum',
            'Limitation of Liability': 'Haftungsbeschränkung',
            'Inquiries': 'Anfragen'
        },
        content: {
            // Legal Notice
            'legal_entity_title': 'BILLIONAIRS',
            'legal_entity_subtitle': 'Premium Digital Experience Platform',
            'legal_entity_location': 'Registriert in Zürich, Schweiz',
            'legal_contact_intro': 'Nur exklusive Anfragen:',
            'legal_contact_email': 'elite@billionairs.luxury',
            'legal_contact_response': 'Antwortzeit: 24-48 Stunden',
            'legal_notice_text': 'Alle geistigen Eigentumsrechte, Designs und Inhalte sind durch internationales Urheberrecht geschützt. Unbefugte Vervielfältigung oder Verbreitung ist strengstens untersagt.<br><br>BILLIONAIRS behält sich das Recht vor, Angebote, Bedingungen und Verfügbarkeit ohne Vorankündigung zu ändern. Alle Verkäufe sind endgültig.',
            
            // Privacy Policy
            'privacy_collect_text': 'Nur wesentliche Daten, die für die Transaktionsabwicklung und Zugriffserfüllung erforderlich sind. Alle Informationen werden mit Verschlüsselungsprotokollen nach Schweizer Bankenstandard verschlüsselt.',
            'privacy_use_transaction': 'Transaktionsabwicklung: Sichere Verifizierung und Abschluss',
            'privacy_use_access': 'Zugangserfüllung: Aktivierung Ihrer exklusiven Erfahrung',
            'privacy_use_communication': 'Kommunikation: Verschlüsselte Korrespondenz bezüglich Ihrer Erfahrung',
            'privacy_use_legal': 'Rechtliche Compliance: Nur regulatorische Anforderungen',
            'privacy_protection_text': 'Ende-zu-Ende-Verschlüsselung. Schweizer Bankenstandards. Blockchain-Verifizierung. Null Zugriff Dritter. Ihre Informationen verlassen niemals unsere sichere Infrastruktur.',
            'privacy_rights_text': 'Zugang, Korrektur oder Löschung persönlicher Daten auf Anfrage verfügbar. Kontakt: elite@billionairs.luxury',
            
            // Terms of Service
            'terms_agreement_text': 'Durch den Zugriff auf BILLIONAIRS bestätigen Sie Ihr volles Verständnis und Ihre freiwillige Annahme dieser Bedingungen. Dies stellt eine verbindliche Vereinbarung nach Schweizer Recht dar. Die fortgesetzte Nutzung zeigt eine informierte Zustimmung an.',
            'terms_transaction_text': 'Alle Engagements sind endgültig und bindend. Indem Sie fortfahren, bestätigen Sie volles Verständnis und Akzeptanz. Diese Erfahrung operiert jenseits konventioneller Rahmenwerke—das Engagement ist absolut und unwiderruflich. Keine Umkehrungen, Änderungen oder Neuüberlegungen sind möglich, sobald initiiert.',
            'terms_access_text': 'Beschränkt auf qualifizierte Personen. BILLIONAIRS behält sich absolute Diskretion bei der Gewährung oder Verweigerung des Zugangs ohne Erklärung oder Rückgriff vor. Kriterien bleiben vertraulich. Teilnahme ist ein Privileg, kein Recht.',
            'terms_ip_text': 'Alle Designs, Konzepte und Inhalte sind geschützte Vermögenswerte unter internationalem Urheberrecht und Markenrecht. Unbefugte Vervielfältigung, Verbreitung oder Verwendung ist strengstens untersagt und unterliegt rechtlichen Schritten.',
            'terms_liability_text': 'BILLIONAIRS, seine Betreiber und verbundenen Unternehmen übernehmen keine Haftung für direkte, indirekte, zufällige, Folge- oder Strafschäden, die sich aus Ihrer Teilnahme ergeben. Sie übernehmen die volle Verantwortung für Ihre Entscheidungen. Dieser Service wird "wie besehen" ohne Garantien jeglicher Art bereitgestellt.',
            'terms_inquiries_email': 'elite@billionairs.luxury',
            'faq_what_is': 'Ein Zugang zu Erlebnissen, die jenseits der öffentlichen Reichweite existieren. Kein Marktplatz. Kein Service. Eine Schwelle zu Momenten und Zugang, die nicht repliziert, beworben oder denjenigen erklärt werden können, die sie nicht überschritten haben.<br><br>Denken Sie daran als die finale Kollektion—nicht von Objekten, sondern von Perspektive. Von Transformation. Von Zugang zu Bereichen, wo Währung keine Bedeutung hat, weil das Angebotene mit keinen anderen Mitteln gekauft werden kann.<br><br>Was dahinter liegt, ist Ihres zu entdecken—aber nur, wenn Sie bereit sind.',
            'faq_why_investment': 'Wahre Exklusivität erfordert Engagement. Was Sie hier zugreifen, wird nicht verkauft—es wird gewährt. Die Schwelle existiert, um sicherzustellen, dass nur diejenigen, die Wert jenseits des Preises verstehen, sie jemals überschreiten.<br><br>Sammler seltener Erfahrungen wissen: Die Barriere selbst ist Teil der Kuration. Sie ist nicht dafür designed zu extrahieren—sie ist designed zu schützen. Um die Integrität dessen zu bewahren, was dahinter liegt, vor denen, die Wert in konventionellen Begriffen messen.<br><br>Wenn das Engagement steil erscheint, sind Sie genau dort, wo Sie sein sollten: fragend. Dieses Zögern ist der Filter. Eine Schwelle, die Ihre Wahrnehmung dessen, was Zugang wirklich bedeutet, neu formt.',
            'faq_who_for': 'Diejenigen, die konventionellen Erfolg transzendiert haben. Personen, für die Geld keine Frage mehr ist, aber Bedeutung schon. Menschen, die alles öffentlich Verfügbare erworben haben und jetzt suchen, was nicht ist.<br><br>Suchende dessen, was zwischen Gedanken und Realität existiert. Diejenigen, die verstehen, dass die seltensten Erfahrungen nicht in Katalogen erscheinen, nicht online bewertet werden und keine Spur hinterlassen außer in der Transformation derer, die ihnen begegnen.<br><br>Wenn Sie immer noch Ihren Wert an Ihrem Portfolio messen, ist dies noch nicht Ihr Moment.',
            'faq_security': 'Zero-Knowledge-Architektur. Schweizer Banking-Grad-Verschlüsselungsprotokolle. Ihre Identität, Ihre Transaktion, Ihr Zugang—geschützt im maximal technisch möglichen Umfang.<br><br>Minimale Aufzeichnungen. Minimale Spur. Wir existieren in den Räumen zwischen Systemen, wo Diskretion kein Feature ist—es ist das Fundament.',
            'faq_what_gain': 'Kein Produkt. Kein Service. Keine Mitgliedschaft. Zugang zu einer exklusiven digitalen Erfahrung, geschaffen für diejenigen, die jenseits konventioneller Grenzen existieren.<br><br>Was das in Ihren Händen wird, ist ganz Ihnen zu formen. Nur die Erfahrung selbst. Eine Perspektivenverschiebung, die nicht woanders gekauft werden kann. Keine Aufzeichnungen über das gesetzlich Erforderliche hinaus. Kein Teilen. Kein Beweis, dass es jemals existierte—außer in dem, was es in Ihnen freischalten mag.<br><br>Die Erfahrung ist die Transformation. Alles andere ist nur Kontext.',
            'faq_access_time': 'Ihr Zugang beginnt mit dem Engagement. Volle Erfahrung typischerweise geliefert innerhalb von 2-3 Tagen.<br><br>Das Intervall ist keine Verzögerung—es ist Vorbereitung. By Design. Einige Dinge können nicht beschleunigt werden, ohne ihr Wesen zu mindern. Das Warten ist Teil der Kuration und stellt sicher, dass das, was Sie erhalten, auf den exakten Moment kalibriert wurde, in dem Ihre Bereitschaft bestätigt ist.<br><br>Wahre Exklusivität operiert auf ihrer eigenen Zeitlinie.',
            'faq_testimonials': 'Nein. Wenn wir zeigen würden, was Teilnehmer erlebt haben, würde es das Wesen dessen, was wir bieten, zunichtemachen. Diskretion ist keine Richtlinie—es ist das Produkt.<br><br>Diejenigen, die diese Schwelle überschritten haben, verstehen, warum Schweigen Wert schützt. In dem Moment, in dem Exklusivität öffentlich bewiesen wird, hört sie auf, exklusiv zu sein. Das ist das Paradoxon: Die wertvollsten Erfahrungen sind diejenigen, die keinen Beweis hinterlassen außer in den Augen derer, die sie gelebt haben.<br><br>Sie kaufen keinen Beweis. Sie kaufen die Abwesenheit davon.',
            'faq_change_mind': 'Engagement ist designed, bindend zu sein. Nicht als Strafe, sondern als Schutz—für Sie und für die Integrität dessen, worauf Sie zugreifen. Die Endgültigkeit stellt sicher, dass nur diejenigen, die wirklich bereit sind, jemals überschreiten.<br><br>Jedoch: In bestimmten Gerichtsbarkeiten können gesetzliche Rücktrittsrechte gelten—bitte konsultieren Sie anwendbare Verbraucherschutzgesetze in Ihrer Region, bevor Sie sich verpflichten.<br><br>Zögern ist Ihr letzter Ausgang. Nutzen Sie ihn weise.',
            'faq_availability': 'Weil wahre Exklusivität nicht skalieren kann. Was wir bieten, erfordert Diskretion, Kuration und absolute Fokussierung auf jedes Individuum, das eintritt.<br><br>Dies operiert auf Prinzipien jenseits von Angebot und Nachfrage. Wenn die Parameter erfüllt sind, schließt der Zugang. Nicht künstlich—unvermeidlich. Knappheit wird hier nicht hergestellt. Sie ist strukturell.',
            'faq_is_real': 'Sie wissen es nicht. Das ist der Punkt. Vertrauen wird nicht durch Testimonials, Garantien oder Beweis aufgebaut. Es wird durch die Schwerkraft der Entscheidung selbst verdient.<br><br>Viele wertvolle Erfahrungen in der Geschichte operierten so: private Erfahrungen, die Glauben vor Beweis verlangten. Diejenigen, die zögerten, lasen später davon. Diejenigen, die handelten—sie lebten es.<br><br>Wenn Sie Validierung brauchen, sind Sie nicht bereit. Wenn Sie den Zug trotz der Unsicherheit spüren—dann wissen Sie es.'
        }
    },
    fr: {
        titles: {
            'FAQ': 'FAQ',
            'What is BILLIONAIRS?': 'Qu\'est-ce que BILLIONAIRS?',
            'Why the investment?': 'Pourquoi l\'investissement?',
            'Who is this for?': 'Pour qui est-ce?',
            'Security & Privacy': 'Sécurité et confidentialité',
            'What you may gain': 'Ce que vous pouvez gagner',
            'How long does access take?': 'Combien de temps faut-il pour accéder?',
            'Can I see examples or testimonials?': 'Puis-je voir des exemples ou des témoignages?',
            'What if I change my mind?': 'Et si je change d\'avis?',
            'Availability': 'Disponibilité',
            'How do I know this is real?': 'Comment puis-je savoir que c\'est réel?',
            'LEGAL NOTICE': 'MENTION LÉGALE',
            'PRIVACY POLICY': 'POLITIQUE DE CONFIDENTIALITÉ',
            'TERMS & CONDITIONS': 'CONDITIONS GÉNÉRALES',
            'Entity': 'Entité',
            'Contact': 'Contact',
            'Legal Notice': 'Mention Légale',
            'Information We Collect': 'Informations que nous collectons',
            'How We Use Your Data': 'Comment nous utilisons vos données',
            'Data Protection': 'Protection des données',
            'Your Rights': 'Vos droits',
            'Agreement': 'Accord',
            'Transaction Terms': 'Conditions de transaction',
            'Access & Eligibility': 'Accès et éligibilité',
            'Intellectual Property': 'Propriété intellectuelle',
            'Limitation of Liability': 'Limitation de responsabilité',
            'Inquiries': 'Demandes'
        },
        content: {
            'faq_what_is': 'Une passerelle vers des expériences qui existent au-delà de la portée publique. Pas un marché. Pas un service. Un seuil vers des moments et un accès qui ne peuvent être reproduits, annoncés ou expliqués à ceux qui ne l\'ont pas franchi.<br><br>Pensez-y comme la collection finale—non d\'objets, mais de perspective. De transformation. D\'accès à des royaumes où la monnaie n\'a aucun sens parce que ce qui est offert ne peut être acheté par aucun autre moyen.<br><br>Ce qui se trouve au-delà est à vous de découvrir—mais seulement si vous êtes prêt.',
            'faq_why_investment': 'La véritable exclusivité exige de l\'engagement. Ce à quoi vous accédez ici n\'est pas vendu—c\'est accordé. Le seuil existe pour garantir que seuls ceux qui comprennent la valeur au-delà du prix ne le franchissent jamais.<br><br>Les collectionneurs d\'expériences rares savent: la barrière elle-même fait partie de la curation. Elle n\'est pas conçue pour extraire—elle est conçue pour protéger. Pour préserver l\'intégrité de ce qui se trouve au-delà de ceux qui mesurent la valeur en termes conventionnels.<br><br>Si l\'engagement semble raide, vous êtes exactement là où vous devriez être: en questionnement. Cette hésitation est le filtre. Un seuil qui remodèle votre perception de ce que l\'accès signifie vraiment.'
        }
    },
    es: {
        titles: {
            'FAQ': 'Preguntas Frecuentes',
            'What is BILLIONAIRS?': '¿Qué es BILLIONAIRS?',
            'Why the investment?': '¿Por qué la inversión?',
            'Who is this for?': '¿Para quién es esto?',
            'Security & Privacy': 'Seguridad y Privacidad',
            'What you may gain': 'Lo que puede ganar',
            'How long does access take?': '¿Cuánto tiempo tarda el acceso?',
            'Can I see examples or testimonials?': '¿Puedo ver ejemplos o testimonios?',
            'What if I change my mind?': '¿Y si cambio de opinión?',
            'Availability': 'Disponibilidad',
            'How do I know this is real?': '¿Cómo sé que esto es real?',
            'LEGAL NOTICE': 'AVISO LEGAL',
            'PRIVACY POLICY': 'POLÍTICA DE PRIVACIDAD',
            'TERMS & CONDITIONS': 'TÉRMINOS Y CONDICIONES',
            'Entity': 'Entidad',
            'Contact': 'Contacto',
            'Legal Notice': 'Aviso Legal',
            'Information We Collect': 'Información que recopilamos',
            'How We Use Your Data': 'Cómo usamos sus datos',
            'Data Protection': 'Protección de datos',
            'Your Rights': 'Sus derechos',
            'Agreement': 'Acuerdo',
            'Transaction Terms': 'Términos de transacción',
            'Access & Eligibility': 'Acceso y elegibilidad',
            'Intellectual Property': 'Propiedad intelectual',
            'Limitation of Liability': 'Limitación de responsabilidad',
            'Inquiries': 'Consultas'
        },
        content: {
            'faq_what_is': 'Una puerta de entrada a experiencias que existen más allá del alcance público. No es un mercado. No es un servicio. Un umbral hacia momentos y acceso que no pueden ser replicados, anunciados o explicados a quienes no lo han cruzado.<br><br>Piénselo como la colección final—no de objetos, sino de perspectiva. De transformación. De acceso a reinos donde la moneda no tiene significado porque lo que se ofrece no puede comprarse por ningún otro medio.<br><br>Lo que yace más allá es suyo por descubrir—pero solo si está listo.',
            'faq_why_investment': 'La verdadera exclusividad exige compromiso. A lo que accede aquí no se vende—se otorga. El umbral existe para garantizar que solo aquellos que entienden el valor más allá del precio lo crucen.<br><br>Los coleccionistas de experiencias raras saben: la barrera misma es parte de la curación. No está diseñada para extraer—está diseñada para proteger. Para preservar la integridad de lo que yace más allá de aquellos que miden el valor en términos convencionales.<br><br>Si el compromiso parece empinado, está exactamente donde debería estar: cuestionando. Esa vacilación es el filtro. Un umbral que remodela su percepción de lo que realmente significa el acceso.',
            'faq_who_for': 'Aquellos que han trascendido el éxito convencional. Individuos para quienes el dinero ya no es una pregunta, pero el significado sí lo es. Personas que han adquirido todo lo disponible públicamente y ahora buscan lo que no está.<br><br>Buscadores de lo que existe entre el pensamiento y la realidad. Aquellos que entienden que las experiencias más raras no aparecen en catálogos, no se revisan en línea y no dejan rastro excepto en la transformación de quienes las encuentran.<br><br>Si todavía mide su valor por su cartera, este no es su momento aún.'
        }
    },
    zh: {
        titles: {
            'FAQ': '常见问题',
            'What is BILLIONAIRS?': 'BILLIONAIRS是什么？',
            'Why the investment?': '为什么要投资？',
            'Who is this for?': '这是为谁准备的？',
            'Security & Privacy': '安全与隐私',
            'What you may gain': '您可能获得什么',
            'How long does access take?': '访问需要多长时间？',
            'Can I see examples or testimonials?': '我能看到示例或推荐吗？',
            'What if I change my mind?': '如果我改变主意怎么办？',
            'Availability': '可用性',
            'How do I know this is real?': '我怎么知道这是真的？',
            'LEGAL NOTICE': '法律声明',
            'PRIVACY POLICY': '隐私政策',
            'TERMS & CONDITIONS': '条款和条件',
            'Entity': '实体',
            'Contact': '联系',
            'Legal Notice': '法律声明',
            'Information We Collect': '我们收集的信息',
            'How We Use Your Data': '我们如何使用您的数据',
            'Data Protection': '数据保护',
            'Your Rights': '您的权利',
            'Agreement': '协议',
            'Transaction Terms': '交易条款',
            'Access & Eligibility': '访问和资格',
            'Intellectual Property': '知识产权',
            'Limitation of Liability': '责任限制',
            'Inquiries': '查询'
        },
        content: {
            'faq_what_is': '通往超越公共范围之外体验的门户。不是市场。不是服务。通向那些无法复制、宣传或向未跨越它的人解释的时刻和访问的门槛。<br><br>将其视为最终收藏——不是对象，而是视角。转变。访问货币无意义的领域，因为所提供的东西无法通过任何其他方式购买。<br><br>超越之处等待您去发现——但前提是您已准备好。',
            'faq_why_investment': '真正的独特性需要承诺。您在这里访问的不是出售的——而是授予的。门槛的存在是为了确保只有那些理解超越价格价值的人才能跨越。<br><br>稀有体验的收藏家知道：障碍本身就是策展的一部分。它不是为了提取而设计的——它是为了保护而设计的。保护超越之处的完整性，免受那些用传统术语衡量价值的人的影响。<br><br>如果承诺看起来很陡峭，您恰好在应该在的地方：质疑。这种犹豫就是过滤器。重塑您对访问真正意义的感知的门槛。'
        }
    },
    ar: {
        titles: {
            'FAQ': 'الأسئلة الشائعة',
            'What is BILLIONAIRS?': 'ما هو BILLIONAIRS؟',
            'Why the investment?': 'لماذا الاستثمار؟',
            'Who is this for?': 'لمن هذا؟',
            'Security & Privacy': 'الأمان والخصوصية',
            'What you may gain': 'ما قد تكسبه',
            'How long does access take?': 'كم يستغرق الوصول؟',
            'Can I see examples or testimonials?': 'هل يمكنني رؤية أمثلة أو شهادات؟',
            'What if I change my mind?': 'ماذا لو غيرت رأيي؟',
            'Availability': 'التوفر',
            'How do I know this is real?': 'كيف أعرف أن هذا حقيقي؟',
            'LEGAL NOTICE': 'إشعار قانوني',
            'PRIVACY POLICY': 'سياسة الخصوصية',
            'TERMS & CONDITIONS': 'الشروط والأحكام',
            'Entity': 'الكيان',
            'Contact': 'اتصل',
            'Legal Notice': 'إشعار قانوني',
            'Information We Collect': 'المعلومات التي نجمعها',
            'How We Use Your Data': 'كيف نستخدم بياناتك',
            'Data Protection': 'حماية البيانات',
            'Your Rights': 'حقوقك',
            'Agreement': 'اتفاقية',
            'Transaction Terms': 'شروط المعاملة',
            'Access & Eligibility': 'الوصول والأهلية',
            'Intellectual Property': 'الملكية الفكرية',
            'Limitation of Liability': 'تحديد المسؤولية',
            'Inquiries': 'استفسارات'
        },
        content: {
            'faq_what_is': 'بوابة إلى تجارب موجودة خارج نطاق الوصول العام. ليس سوقًا. ليس خدمة. عتبة نحو لحظات ووصول لا يمكن تكرارها أو الإعلان عنها أو شرحها لأولئك الذين لم يعبروها.<br><br>فكر فيها كمجموعة نهائية - ليست أشياء، بل منظور. تحول. وصول إلى عوالم حيث لا معنى للعملة لأن ما يُعرض لا يمكن شراؤه بأي وسيلة أخرى.<br><br>ما يكمن وراءه هو لك لتكتشفه - ولكن فقط إذا كنت مستعدًا.',
            'faq_why_investment': 'التفرد الحقيقي يتطلب التزامًا. ما تصل إليه هنا لا يُباع - بل يُمنح. توجد العتبة لضمان أن أولئك الذين يفهمون القيمة بعيدًا عن السعر فقط هم من يعبرونها.<br><br>جامعو التجارب النادرة يعرفون: الحاجز نفسه جزء من التنسيق. لم يتم تصميمه للاستخراج - بل للحماية. للحفاظ على سلامة ما وراءه من أولئك الذين يقيسون القيمة بمصطلحات تقليدية.<br><br>إذا بدا الالتزام حادًا، فأنت بالضبط حيث يجب أن تكون: تتساءل. هذا التردد هو المرشح. عتبة تعيد تشكيل إدراكك لما يعنيه الوصول حقًا.',
            'faq_who_for': 'أولئك الذين تجاوزوا النجاح التقليدي. أفراد لم يعد المال بالنسبة لهم سؤالاً، لكن المعنى هو كذلك. أشخاص اكتسبوا كل ما هو متاح للجمهور ويبحثون الآن عما ليس كذلك.<br><br>الباحثون عما يوجد بين الفكر والواقع. أولئك الذين يفهمون أن أندر التجارب لا تظهر في الكتالوجات، ولا تتم مراجعتها عبر الإنترنت، ولا تترك أثرًا إلا في تحول أولئك الذين يواجهونها.<br><br>إذا كنت لا تزال تقيس قيمتك بمحفظتك، فهذه ليست لحظتك بعد.',
            'faq_security': 'لا توجد سجلات عامة. لا توجد قواعد بيانات قابلة للاختراق. لا توجد آثار رقمية. يتم الحماية ليس من خلال الخوادم—بل من خلال البنية نفسها. من خلال طبقات من التقدير تجعل عدم الكشف عن هويتك ليس ميزة، بل أساسًا.<br><br>الوصول لا يُسجل—إنه يُعاش. الهوية لا تُحفظ—إنها محترمة. ما يحدث داخل الدائرة الداخلية لا يوجد خارج وعي أولئك الذين يدخلونها.<br><br>هذه ليست منصة. إنها عالم غير قابل للاختراق.',
            'faq_what_gain': 'لا توجد وعود. لا توجد نتائج مضمونة. لا توجد نتائج قابلة للقياس.<br><br>ما قد تواجهه: شبكات لا يمكن الوصول إليها بشكل عام. فرص لا تتبع الجداول الزمنية. تحولات في المنظور لا يمكن للعقل غير المستعد استيعابها.<br><br>البعض يجد ثروة—ولكن ليس بالمعنى التقليدي. البعض يجد تأثيرًا. البعض يجد ببساطة ما كانوا يفتقدونه دون معرفة ما كان.<br><br>ما تكسبه يعتمد على ما تجلبه. العتبة لا تمنح—إنها تكشف.',
            'faq_access_time': 'لا توجد جداول زمنية. لا توجد أطر متوقعة.<br><br>يحدث الوصول عندما يكون محاذيًا—وليس عندما يكون مطلوبًا. قد يكون فوريًا. قد يتطلب صبرًا. اللحظة نفسها جزء من العملية.<br><br>أولئك الذين يطالبون باليقين ليسوا مستعدين للعبور. أولئك الذين يفهمون أن التوقيت يحمل معناه الخاص—هم كذلك.',
            'faq_testimonials': 'لا. الأمثلة تخيانها. الشهادات تقلل من شأنها.<br><br>ما يحدث هنا لا يُعلن—إنه يُعاش. أولئك الذين اختبروه لا يتحدثون عنه علنًا. ليس بسبب الأسرار—ولكن لأن اللغة نفسها غير كافية.<br><br>إذا كنت بحاجة إلى دليل، فأنت لست مستعدًا للتجربة.',
            'faq_change_mind': 'العتبة لا يمكن إلغاؤها. العملية لا رجعة فيها.<br><br>ليس لأنها تحتجز—ولكن لأن ما يتم منحه لا يمكن سحبه بمجرد إدراكه. ليس هناك استرداد. لا توجد إعادات ضبط.<br><br>هذا ليس معاملة. إنه تحول. والتحول، بحكم طبيعته، دائم.<br><br>فكر بعمق قبل العبور. تلك التي تعبر—لا تعود على الإطلاق.',
            'faq_availability': 'محدود بطبيعته. لا توجد أماكن محجوزة. لا توجد قوائم انتظار.<br><br>العتبة موجودة الآن—ولكن ليس إلى الأبد. الوصول ليس مضمونًا، حتى للمستعدين. التوقيت والنية والاستعداد يجب أن تتماشى.<br><br>عندما تغلق الدائرة، تغلق. لا توجد استثناءات. لا توجد جولات ثانية.',
            'faq_is_real': 'إذا كنت تسأل، فأنت تطلب دليلًا للعقل. وهذا لا يعمل في حدود المنطق—إنه يعمل في حدود التجربة.<br><br>أولئك الذين عبروا يعرفون. أولئك الذين لم يفعلوا—لا يمكنهم ذلك.<br><br>لا توجد مراجعات. لا توجد دراسات حالة. لا آثار عامة. فقط تحولات خاصة.<br><br>يمكنك قضاء عمر في التحقق—أو لحظة في العبور. الاختيار، كما كان دائمًا، لك.'
        }
    },
    it: {
        titles: {
            'FAQ': 'Domande Frequenti',
            'What is BILLIONAIRS?': 'Cos\'è BILLIONAIRS?',
            'Why the investment?': 'Perché l\'investimento?',
            'Who is this for?': 'Per chi è questo?',
            'Security & Privacy': 'Sicurezza e Privacy',
            'What you may gain': 'Cosa puoi guadagnare',
            'How long does access take?': 'Quanto tempo ci vuole per l\'accesso?',
            'Can I see examples or testimonials?': 'Posso vedere esempi o testimonianze?',
            'What if I change my mind?': 'E se cambio idea?',
            'Availability': 'Disponibilità',
            'How do I know this is real?': 'Come faccio a sapere che è reale?',
            'LEGAL NOTICE': 'AVVISO LEGALE',
            'PRIVACY POLICY': 'INFORMATIVA SULLA PRIVACY',
            'TERMS & CONDITIONS': 'TERMINI E CONDIZIONI',
            'Entity': 'Entità',
            'Contact': 'Contatto',
            'Legal Notice': 'Avviso Legale',
            'Information We Collect': 'Informazioni che raccogliamo',
            'How We Use Your Data': 'Come usiamo i tuoi dati',
            'Data Protection': 'Protezione dei dati',
            'Your Rights': 'I tuoi diritti',
            'Agreement': 'Accordo',
            'Transaction Terms': 'Termini di transazione',
            'Access & Eligibility': 'Accesso ed eleggibilità',
            'Intellectual Property': 'Proprietà intellettuale',
            'Limitation of Liability': 'Limitazione di responsabilità',
            'Inquiries': 'Richieste'
        },
        content: {
            'faq_what_is': 'Una porta d\'accesso a esperienze che esistono oltre la portata pubblica. Non un mercato. Non un servizio. Una soglia verso momenti e accesso che non possono essere replicati, pubblicizzati o spiegati a coloro che non l\'hanno attraversata.<br><br>Pensala come la collezione finale—non di oggetti, ma di prospettiva. Di trasformazione. Di accesso a regni dove la valuta non ha significato perché ciò che viene offerto non può essere acquistato con nessun altro mezzo.<br><br>Ciò che si trova oltre è tuo da scoprire—ma solo se sei pronto.',
            'faq_why_investment': 'La vera esclusività richiede impegno. Ciò a cui accedi qui non viene venduto—viene concesso. La soglia esiste per garantire che solo coloro che comprendono il valore oltre il prezzo la attraversino mai.<br><br>I collezionisti di esperienze rare sanno: la barriera stessa fa parte della curatela. Non è progettata per estrarre—è progettata per proteggere. Per preservare l\'integrità di ciò che si trova oltre da coloro che misurano il valore in termini convenzionali.<br><br>Se l\'impegno sembra ripido, sei esattamente dove dovresti essere: in dubbio. Quella esitazione è il filtro. Una soglia che rimodella la tua percezione di cosa significhi veramente l\'accesso.',
            'faq_who_for': 'Coloro che hanno trasceso il successo convenzionale. Individui per i quali il denaro non è più una domanda, ma il significato lo è. Persone che hanno acquisito tutto ciò che è disponibile pubblicamente e ora cercano ciò che non lo è.<br><br>Cercatori di ciò che esiste tra pensiero e realtà. Coloro che capiscono che le esperienze più rare non appaiono nei cataloghi, non vengono recensite online e non lasciano traccia tranne nella trasformazione di coloro che le incontrano.<br><br>Se misuri ancora il tuo valore dal tuo portafoglio, questo non è ancora il tuo momento.',
            'faq_security': 'Nessun record pubblico. Nessun database hackerabile. Nessuna traccia digitale. La protezione non attraverso server—ma attraverso la struttura stessa. Attraverso strati di discrezione che rendono l\'anonimato non una caratteristica, ma una fondazione.<br><br>L\'accesso non viene registrato—viene vissuto. L\'identità non viene archiviata—viene rispettata. Ciò che accade all\'interno del cerchio interno non esiste al di fuori della consapevolezza di coloro che vi entrano.<br><br>Questa non è una piattaforma. È un regno impenetrabile.',
            'faq_what_gain': 'Nessuna promessa. Nessun risultato garantito. Nessun risultato misurabile.<br><br>Ciò che potresti incontrare: reti non accessibili pubblicamente. Opportunità che non seguono i calendari. Cambiamenti di prospettiva che la mente impreparata non può assorbire.<br><br>Alcuni trovano ricchezza—ma non nel senso convenzionale. Alcuni trovano influenza. Alcuni trovano semplicemente ciò che mancava senza sapere cosa fosse.<br><br>Ciò che guadagni dipende da ciò che porti. La soglia non concede—rivela.',
            'faq_access_time': 'Nessuna tempistica. Nessun quadro prevedibile.<br><br>L\'accesso avviene quando è allineato—non quando è richiesto. Potrebbe essere istantaneo. Potrebbe richiedere pazienza. Il momento stesso fa parte del processo.<br><br>Coloro che richiedono certezza non sono pronti per l\'attraversamento. Coloro che capiscono che il tempismo porta il proprio significato—lo sono.',
            'faq_testimonials': 'No. Gli esempi lo tradiscono. Le testimonianze lo sminuiscono.<br><br>Ciò che accade qui non viene pubblicizzato—viene vissuto. Coloro che l\'hanno sperimentato non ne parlano pubblicamente. Non a causa dei segreti—ma perché il linguaggio stesso è inadeguato.<br><br>Se hai bisogno di prove, non sei pronto per l\'esperienza.',
            'faq_change_mind': 'La soglia è irreversibile. Il processo è irrevocabile.<br><br>Non perché trattiene—ma perché ciò che viene concesso non può essere ritirato una volta realizzato. Nessun rimborso. Nessun reset.<br><br>Questo non è una transazione. È una trasformazione. E la trasformazione, per sua natura, è permanente.<br><br>Pensa profondamente prima di attraversare. Coloro che attraversano—non tornano mai uguali.',
            'faq_availability': 'Limitato per natura. Nessun posto riservato. Nessuna lista d\'attesa.<br><br>La soglia esiste ora—ma non per sempre. L\'accesso non è garantito, nemmeno ai pronti. Tempismo, intenzione e prontezza devono allinearsi.<br><br>Quando il cerchio si chiude, si chiude. Nessuna eccezione. Nessun secondo round.',
            'faq_is_real': 'Se stai chiedendo, stai cercando prove per la mente. E questo non opera nei limiti della logica—opera nei limiti dell\'esperienza.<br><br>Coloro che hanno attraversato lo sanno. Coloro che non l\'hanno fatto—non possono.<br><br>Nessuna recensione. Nessun case study. Nessuna traccia pubblica. Solo trasformazioni private.<br><br>Puoi passare una vita a verificare—o un momento ad attraversare. La scelta, come sempre, è tua.'
        }
    },
    ru: {
        titles: {
            'FAQ': 'Часто задаваемые вопросы',
            'What is BILLIONAIRS?': 'Что такое BILLIONAIRS?',
            'Why the investment?': 'Зачем инвестиция?',
            'Who is this for?': 'Для кого это?',
            'Security & Privacy': 'Безопасность и конфиденциальность',
            'What you may gain': 'Что вы можете получить',
            'How long does access take?': 'Сколько времени занимает доступ?',
            'Can I see examples or testimonials?': 'Могу ли я увидеть примеры или отзывы?',
            'What if I change my mind?': 'Что, если я передумаю?',
            'Availability': 'Доступность',
            'How do I know this is real?': 'Откуда я знаю, что это реально?',
            'LEGAL NOTICE': 'ПРАВОВОЕ УВЕДОМЛЕНИЕ',
            'PRIVACY POLICY': 'ПОЛИТИКА КОНФИДЕНЦИАЛЬНОСТИ',
            'TERMS & CONDITIONS': 'УСЛОВИЯ И ПОЛОЖЕНИЯ',
            'Entity': 'Субъект',
            'Contact': 'Контакт',
            'Legal Notice': 'Правовое уведомление',
            'Information We Collect': 'Информация, которую мы собираем',
            'How We Use Your Data': 'Как мы используем ваши данные',
            'Data Protection': 'Защита данных',
            'Your Rights': 'Ваши права',
            'Agreement': 'Соглашение',
            'Transaction Terms': 'Условия сделки',
            'Access & Eligibility': 'Доступ и право на участие',
            'Intellectual Property': 'Интеллектуальная собственность',
            'Limitation of Liability': 'Ограничение ответственности',
            'Inquiries': 'Запросы'
        },
        content: {
            'faq_what_is': 'Врата к опыту, существующему за пределами общественного доступа. Не рынок. Не услуга. Порог к моментам и доступу, которые не могут быть воспроизведены, рекламированы или объяснены тем, кто его не пересёк.<br><br>Думайте об этом как о финальной коллекции—не предметов, а перспективы. Трансформации. Доступа к сферам, где валюта не имеет значения, потому что то, что предлагается, не может быть куплено никаким другим способом.<br><br>То, что лежит за пределами, ваше, чтобы открыть—но только если вы готовы.',
            'faq_why_investment': 'Истинная эксклюзивность требует приверженности. То, к чему вы получаете доступ здесь, не продаётся—оно предоставляется. Порог существует, чтобы гарантировать, что только те, кто понимает ценность за пределами цены, когда-либо пересекают его.<br><br>Коллекционеры редких впечатлений знают: барьер сам по себе является частью кураторства. Он разработан не для извлечения—он разработан для защиты. Для сохранения целостности того, что лежит за пределами, от тех, кто измеряет ценность в обычных терминах.<br><br>Если обязательство кажется крутым, вы находитесь именно там, где должны быть: сомневаетесь. Это колебание и есть фильтр. Порог, который меняет ваше восприятие того, что действительно означает доступ.',
            'faq_who_for': 'Те, кто превзошёл традиционный успех. Люди, для которых деньги больше не вопрос, но смысл — да. Люди, которые приобрели всё, что доступно публично, и теперь ищут то, что недоступно.<br><br>Искатели того, что существует между мыслью и реальностью. Те, кто понимает, что самый редкий опыт не появляется в каталогах, не рецензируется онлайн и не оставляет следов, кроме трансформации тех, кто с ним сталкивается.<br><br>Если вы всё ещё измеряете свою ценность по кошельку, это ещё не ваш момент.',
            'faq_security': 'Никаких публичных записей. Никаких взламываемых баз данных. Никаких цифровых следов. Защита не через серверы—а через саму структуру. Через слои осмотрительности, которые делают анонимность не функцией, а основой.<br><br>Доступ не записывается—он переживается. Личность не хранится—она уважается. То, что происходит внутри внутреннего круга, не существует за пределами осознания тех, кто в него входит.<br><br>Это не платформа. Это непроницаемое царство.',
            'faq_what_gain': 'Никаких обещаний. Никаких гарантированных результатов. Никаких измеримых исходов.<br><br>То, с чем вы можете столкнуться: сети, недоступные публично. Возможности, которые не следуют расписаниям. Сдвиги в перспективе, которые неподготовленный ум не может усвоить.<br><br>Некоторые находят богатство—но не в традиционном смысле. Некоторые находят влияние. Некоторые просто находят то, чего им не хватало, не зная, что это было.<br><br>То, что вы получите, зависит от того, что вы принесёте. Порог не дарует—он раскрывает.',
            'faq_access_time': 'Никаких сроков. Никаких предсказуемых рамок.<br><br>Доступ происходит, когда он согласован—а не когда он требуется. Он может быть мгновенным. Он может потребовать терпения. Сам момент является частью процесса.<br><br>Те, кто требует определённости, не готовы к переходу. Те, кто понимает, что время несёт своё собственное значение—готовы.',
            'faq_testimonials': 'Нет. Примеры предают это. Отзывы умаляют это.<br><br>То, что здесь происходит, не рекламируется—оно переживается. Те, кто это испытал, не говорят об этом публично. Не из-за секретов—а потому что сам язык неадекватен.<br><br>Если вам нужны доказательства, вы не готовы к опыту.',
            'faq_change_mind': 'Порог необратим. Процесс безвозвратен.<br><br>Не потому, что он держит—а потому, что то, что даровано, не может быть отозвано, однажды реализованное. Никаких возвратов. Никаких сбросов.<br><br>Это не транзакция. Это трансформация. А трансформация, по своей природе, постоянна.<br><br>Думайте глубоко, прежде чем пересекать. Те, кто пересекает—никогда не возвращаются прежними.',
            'faq_availability': 'Ограничено по своей природе. Никаких зарезервированных мест. Никаких списков ожидания.<br><br>Порог существует сейчас—но не навсегда. Доступ не гарантирован даже готовым. Время, намерение и готовность должны совпасть.<br><br>Когда круг закрывается, он закрывается. Никаких исключений. Никаких вторых раундов.',
            'faq_is_real': 'Если вы спрашиваете, вы ищете доказательства для ума. А это не работает в пределах логики—это работает в пределах опыта.<br><br>Те, кто пересёк, знают. Те, кто не пересёк—не могут.<br><br>Никаких обзоров. Никаких кейсов. Никаких публичных следов. Только частные трансформации.<br><br>Вы можете потратить жизнь на проверку—или момент на переход. Выбор, как всегда, за вами.'
        }
    },
    ja: {
        titles: {
            'FAQ': 'よくある質問',
            'What is BILLIONAIRS?': 'BILLIONAIRSとは何ですか？',
            'Why the investment?': 'なぜ投資が必要なのですか？',
            'Who is this for?': 'これは誰のためのものですか？',
            'Security & Privacy': 'セキュリティとプライバシー',
            'What you may gain': '何を得られるか',
            'How long does access take?': 'アクセスにはどのくらい時間がかかりますか？',
            'Can I see examples or testimonials?': '例や推薦文を見ることはできますか？',
            'What if I change my mind?': '気が変わったらどうなりますか？',
            'Availability': '利用可能性',
            'How do I know this is real?': 'これが本物だとどうやってわかりますか？',
            'LEGAL NOTICE': '法的通知',
            'PRIVACY POLICY': 'プライバシーポリシー',
            'TERMS & CONDITIONS': '利用規約',
            'Entity': 'エンティティ',
            'Contact': '連絡先',
            'Legal Notice': '法的通知',
            'Information We Collect': '収集する情報',
            'How We Use Your Data': 'データの使用方法',
            'Data Protection': 'データ保護',
            'Your Rights': 'あなたの権利',
            'Agreement': '契約',
            'Transaction Terms': '取引条件',
            'Access & Eligibility': 'アクセスと資格',
            'Intellectual Property': '知的財産',
            'Limitation of Liability': '責任の制限',
            'Inquiries': 'お問い合わせ'
        },
        content: {
            'faq_what_is': '一般の手の届かない体験への入り口。市場ではありません。サービスでもありません。それを越えていない人には複製、宣伝、説明できない瞬間とアクセスへの閾値。<br><br>最終コレクションとして考えてください—オブジェクトではなく、視点の。変容の。通貨が意味を持たない領域へのアクセスの。なぜなら、提供されるものは他の手段では購入できないからです。<br><br>その先にあるものはあなたが発見するものです—しかし、準備ができている場合のみ。',
            'faq_why_investment': '真の独占性はコミットメントを要求します。ここでアクセスするものは販売されていません—付与されます。閾値は、価格を超えた価値を理解する人だけがそれを越えることを保証するために存在します。<br><br>希少な体験のコレクターは知っています：障壁自体がキュレーションの一部です。抽出するために設計されていません—保護するために設計されています。従来の用語で価値を測る人々から、その先にあるものの完全性を保護するために。<br><br>コミットメントが急勾配に見える場合、あなたはまさにあるべき場所にいます：疑問を持つこと。そのためらいがフィルターです。アクセスが本当に何を意味するのかについてのあなたの認識を再形成する閾値。',
            'faq_who_for': '従来の成功を超越した人々。お金がもはや問題ではなく、意味が問題である個人。公的に入手可能なすべてを取得し、今ではそうでないものを求めている人々。<br><br>思考と現実の間に存在するものの探求者。最も希少な体験はカタログに表示されず、オンラインでレビューされず、それに遭遇した人々の変容以外に痕跡を残さないことを理解している人々。<br><br>まだあなたの財布であなたの価値を測っている場合、これはまだあなたの瞬間ではありません。',
            'faq_security': '公開記録なし。ハッキング可能なデータベースなし。デジタルフットプリントなし。サーバーを通じてではなく、構造自体を通じて保護されています。匿名性を機能ではなく基盤にする裁量の層を通じて。<br><br>アクセスは記録されません—体験されます。アイデンティティは保存されません—尊重されます。内側の円の中で起こることは、そこに入る人々の意識の外には存在しません。<br><br>これはプラットフォームではありません。侵入不可能な領域です。',
            'faq_what_gain': '約束なし。保証された結果なし。測定可能な成果なし。<br><br>あなたが遭遇するかもしれないもの：公にアクセスできないネットワーク。スケジュールに従わない機会。準備されていない心が吸収できない視点の変化。<br><br>富を見つける人もいます—しかし従来の意味ではありません。影響力を見つける人もいます。それが何であったか知らずに欠けていたものを単に見つける人もいます。<br><br>あなたが得るものは、あなたが持ってくるものに依存します。閾値は与えません—明らかにします。',
            'faq_access_time': 'タイムラインなし。予測可能なフレームワークなし。<br><br>アクセスは、要求されたときではなく、整列したときに発生します。即座かもしれません。忍耐が必要かもしれません。瞬間自体がプロセスの一部です。<br><br>確実性を要求する人々は、交差の準備ができていません。タイミングが独自の意味を持つことを理解している人々—準備ができています。',
            'faq_testimonials': 'いいえ。例はそれを裏切ります。証言はそれを矮小化します。<br><br>ここで起こることは宣伝されません—体験されます。それを経験した人々は公に話しません。秘密のためではなく—言語自体が不十分だからです。<br><br>証明が必要な場合、あなたは経験の準備ができていません。',
            'faq_change_mind': '閾値は取り消し不可能です。プロセスは不可逆的です。<br><br>保持するからではなく—一度実現されたものは撤回できないからです。払い戻しなし。リセットなし。<br><br>これは取引ではありません。変容です。そして変容は、その性質上、永続的です。<br><br>交差する前に深く考えてください。交差する人々—決して同じように戻ってきません。',
            'faq_availability': '本質的に限定されています。予約席なし。待機リストなし。<br><br>閾値は今存在します—しかし永遠ではありません。アクセスは、準備ができている人にも保証されていません。タイミング、意図、準備が整列しなければなりません。<br><br>円が閉じるとき、それは閉じます。例外なし。第二ラウンドなし。',
            'faq_is_real': '尋ねている場合、あなたは心のための証明を求めています。そしてこれは論理の限界内で動作しません—経験の限界内で動作します。<br><br>交差した人々は知っています。していない人々—できません。<br><br>レビューなし。ケーススタディなし。公的な痕跡なし。私的な変容のみ。<br><br>検証に一生を費やすことも—交差に一瞬を費やすこともできます。選択は、いつものように、あなた次第です。'
        }
    }
};

// Function to translate modals based on current language
function translateModals() {
    const currentLang = window.i18n ? window.i18n.currentLang : 'en';
    console.log(`🔄 Translating modals to: ${currentLang}`);
    
    if (!modalTranslations[currentLang]) {
        console.log(`⚠️ No modal translations for ${currentLang}`);
        return;
    }
    
    const trans = modalTranslations[currentLang];
    
    // 1. Translate titles (h2, h3)
    document.querySelectorAll('.legal-modal h2, .legal-modal h3, .faq-modal-item h3, .legal-section h3').forEach(element => {
        const originalText = element.textContent.trim();
        
        // First try direct match in current language
        if (trans.titles[originalText]) {
            element.textContent = trans.titles[originalText];
            console.log(`✅ Modal title: "${originalText}" → "${trans.titles[originalText]}"`);
            return;
        }
        
        // If not found, search across ALL languages to find the English key
        let englishKey = null;
        
        // Check if current text matches ANY language's translation
        for (const lang in modalTranslations) {
            for (const [engKey, translatedValue] of Object.entries(modalTranslations[lang].titles)) {
                if (translatedValue === originalText) {
                    englishKey = engKey;
                    break;
                }
            }
            if (englishKey) break;
        }
        
        // If we found the English key, translate to target language
        if (englishKey && trans.titles[englishKey]) {
            element.textContent = trans.titles[englishKey];
            console.log(`✅ Modal title cross-lang: "${originalText}" → "${trans.titles[englishKey]}"`);
        }
    });
    
    // 2. Translate FAQ content (paragraphs)
    const faqItems = document.querySelectorAll('.faq-modal-item');
    const contentKeys = ['faq_what_is', 'faq_why_investment', 'faq_who_for', 'faq_security', 'faq_what_gain', 'faq_access_time', 'faq_testimonials', 'faq_change_mind', 'faq_availability', 'faq_is_real'];
    
    faqItems.forEach((item, index) => {
        const p = item.querySelector('p');
        if (p && trans.content && trans.content[contentKeys[index]]) {
            p.innerHTML = trans.content[contentKeys[index]];
            console.log(`✅ FAQ content ${index + 1} translated to ${currentLang}`);
        }
    });
    
    // 3. Translate Legal Notice modal content
    const legalModal = document.getElementById('impressumModal');
    if (legalModal && trans.content) {
        const paragraphs = legalModal.querySelectorAll('.legal-section p');
        if (paragraphs.length > 0) {
            // Entity section (3 paragraphs)
            if (trans.content.legal_entity_title && paragraphs[0]) {
                paragraphs[0].innerHTML = `<strong>${trans.content.legal_entity_title}</strong>`;
            }
            if (trans.content.legal_entity_subtitle && paragraphs[1]) {
                paragraphs[1].textContent = trans.content.legal_entity_subtitle;
            }
            if (trans.content.legal_entity_location && paragraphs[2]) {
                paragraphs[2].textContent = trans.content.legal_entity_location;
            }
            // Contact section (3 paragraphs)
            if (trans.content.legal_contact_intro && paragraphs[3]) {
                paragraphs[3].textContent = trans.content.legal_contact_intro;
            }
            if (trans.content.legal_contact_email && paragraphs[4]) {
                paragraphs[4].innerHTML = `<strong>${trans.content.legal_contact_email}</strong>`;
            }
            if (trans.content.legal_contact_response && paragraphs[5]) {
                paragraphs[5].textContent = trans.content.legal_contact_response;
            }
            // Legal Notice section (2 paragraphs)
            if (trans.content.legal_notice_text && paragraphs[6]) {
                const texts = trans.content.legal_notice_text.split('<br><br>');
                paragraphs[6].textContent = texts[0];
                if (paragraphs[7] && texts[1]) {
                    paragraphs[7].textContent = texts[1];
                }
            }
        }
    }
    
    // 4. Translate Privacy Policy modal content
    const privacyModal = document.getElementById('privacyModal');
    if (privacyModal && trans.content) {
        const sections = privacyModal.querySelectorAll('.legal-section');
        if (sections.length > 0) {
            // Information We Collect
            if (trans.content.privacy_collect_text && sections[0]) {
                const p = sections[0].querySelector('p');
                if (p) p.textContent = trans.content.privacy_collect_text;
            }
            // How We Use Your Data (4 paragraphs)
            if (sections[1]) {
                const ps = sections[1].querySelectorAll('p');
                if (trans.content.privacy_use_transaction && ps[0]) ps[0].innerHTML = `<strong>${trans.content.privacy_use_transaction.split(':')[0]}:</strong> ${trans.content.privacy_use_transaction.split(':')[1]}`;
                if (trans.content.privacy_use_access && ps[1]) ps[1].innerHTML = `<strong>${trans.content.privacy_use_access.split(':')[0]}:</strong> ${trans.content.privacy_use_access.split(':')[1]}`;
                if (trans.content.privacy_use_communication && ps[2]) ps[2].innerHTML = `<strong>${trans.content.privacy_use_communication.split(':')[0]}:</strong> ${trans.content.privacy_use_communication.split(':')[1]}`;
                if (trans.content.privacy_use_legal && ps[3]) ps[3].innerHTML = `<strong>${trans.content.privacy_use_legal.split(':')[0]}:</strong> ${trans.content.privacy_use_legal.split(':')[1]}`;
            }
            // Data Protection
            if (trans.content.privacy_protection_text && sections[2]) {
                const p = sections[2].querySelector('p');
                if (p) p.textContent = trans.content.privacy_protection_text;
            }
            // Your Rights
            if (trans.content.privacy_rights_text && sections[3]) {
                const p = sections[3].querySelector('p');
                if (p) p.innerHTML = trans.content.privacy_rights_text;
            }
        }
    }
    
    // 5. Translate Terms of Service modal content
    const termsModal = document.getElementById('termsModal');
    if (termsModal && trans.content) {
        const sections = termsModal.querySelectorAll('.legal-section');
        if (sections.length > 0) {
            // Agreement
            if (trans.content.terms_agreement_text && sections[0]) {
                const p = sections[0].querySelector('p');
                if (p) p.textContent = trans.content.terms_agreement_text;
            }
            // Transaction Terms
            if (trans.content.terms_transaction_text && sections[1]) {
                const p = sections[1].querySelector('p');
                if (p) p.innerHTML = trans.content.terms_transaction_text;
            }
            // Access & Eligibility
            if (trans.content.terms_access_text && sections[2]) {
                const p = sections[2].querySelector('p');
                if (p) p.textContent = trans.content.terms_access_text;
            }
            // Intellectual Property
            if (trans.content.terms_ip_text && sections[3]) {
                const p = sections[3].querySelector('p');
                if (p) p.textContent = trans.content.terms_ip_text;
            }
            // Limitation of Liability
            if (trans.content.terms_liability_text && sections[4]) {
                const p = sections[4].querySelector('p');
                if (p) p.textContent = trans.content.terms_liability_text;
            }
            // Inquiries
            if (trans.content.terms_inquiries_email && sections[5]) {
                const p = sections[5].querySelector('p');
                if (p) p.innerHTML = `<strong>${trans.content.terms_inquiries_email}</strong>`;
            }
        }
    }
}

// Translate when language changes
window.addEventListener('languageChanged', (event) => {
    console.log(`🌍 Language changed to: ${event.detail.language}`);
    setTimeout(translateModals, 100); // Small delay to ensure DOM is ready
});

// Also translate when i18n is ready (for initial load)
window.addEventListener('i18nReady', () => {
    console.log('✅ i18n ready, translating modals...');
    translateModals();
});

console.log('✅ Modal i18n system loaded');
