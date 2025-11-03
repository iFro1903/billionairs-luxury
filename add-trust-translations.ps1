# Add trust translations to all remaining languages
$filePath = "c:\Users\kerem\OneDrive\Desktop\Billionairs app neuer versuch 19.10\assets\js\i18n.js"
$content = Get-Content $filePath -Raw

# Spanish
$content = $content -replace `
"('es':\s*\{[^}]*'Exclusive Access': 'Acceso Exclusivo',)", `
"`$1`n                `n                // Trust Section`n                `"Some experiences can't be explained.<br>They can only be lived.`": 'Algunas experiencias no se pueden explicar.<br>Solo se pueden vivir.',`n                `"Where wealth is the entry requirement. Not the achievement.`": 'Donde la riqueza es el requisito de entrada. No el logro.',`n                "

# Chinese  
$content = $content -replace `
"('zh':\s*\{[^}]*'Exclusive Access': '专属访问',)", `
"`$1`n                `n                // Trust Section`n                `"Some experiences can't be explained.<br>They can only be lived.`": '有些体验无法用言语解释。<br>只能亲身体验。',`n                `"Where wealth is the entry requirement. Not the achievement.`": '财富是入场条件。而非成就。',`n                "

# Arabic
$content = $content -replace `
"('ar':\s*\{[^}]*'Exclusive Access': 'وصول حصري',)", `
"`$1`n                `n                // Trust Section`n                `"Some experiences can't be explained.<br>They can only be lived.`": 'بعض التجارب لا يمكن شرحها.<br>يمكن فقط عيشها.',`n                `"Where wealth is the entry requirement. Not the achievement.`": 'حيث الثروة هي شرط الدخول. وليس الإنجاز.',`n                "

# Italian
$content = $content -replace `
"('it':\s*\{[^}]*'Exclusive Access': 'Accesso Esclusivo',)", `
"`$1`n                `n                // Trust Section`n                `"Some experiences can't be explained.<br>They can only be lived.`": 'Alcune esperienze non possono essere spiegate.<br>Possono solo essere vissute.',`n                `"Where wealth is the entry requirement. Not the achievement.`": 'Dove la ricchezza è il requisito d\'ingresso. Non il risultato.',`n                "

# Russian
$content = $content -replace `
"('ru':\s*\{[^}]*'Exclusive Access': 'Эксклюзивный доступ',)", `
"`$1`n                `n                // Trust Section`n                `"Some experiences can't be explained.<br>They can only be lived.`": 'Некоторые переживания невозможно объяснить.<br>Их можно только прожить.',`n                `"Where wealth is the entry requirement. Not the achievement.`": 'Где богатство - это входное требование. А не достижение.',`n                "

# Japanese
$content = $content -replace `
"('ja':\s*\{[^}]*'Exclusive Access': '限定アクセス',)", `
"`$1`n                `n                // Trust Section`n                `"Some experiences can't be explained.<br>They can only be lived.`": '説明できない体験があります。<br>体験することしかできません。',`n                `"Where wealth is the entry requirement. Not the achievement.`": '富は入場条件です。達成ではありません。',`n                "

Set-Content $filePath $content -Encoding UTF8
Write-Host "✅ Trust translations added to all languages!"
