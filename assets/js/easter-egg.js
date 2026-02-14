// Easter Egg System JavaScript
// Add this to dashboard.html before </body>

const EasterEggSystem = {
    userEmail: null,
    status: null,

    async init(email) {
        if (!email) {
            console.warn('EasterEggSystem: No email provided, skipping init');
            return;
        }
        this.userEmail = email;
        await this.recordFirstAccess();
        await this.checkStatus();
        await this.trackDailyLogin();
        this.startMonitoring();
    },

    async recordFirstAccess() {
        try {
            await fetch('/api/easter-egg', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: this.userEmail,
                    action: 'first_access'
                })
            });
        } catch (error) {
            console.error('Error recording first access:', error);
        }
    },

    async checkStatus() {
        try {
            const response = await fetch('/api/easter-egg', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: this.userEmail,
                    action: 'check_status'
                })
            });

            this.status = await response.json();
            this.updateUI();
        } catch (error) {
            console.error('Error checking status:', error);
        }
    },

    async trackDailyLogin() {
        try {
            const response = await fetch('/api/easter-egg', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: this.userEmail,
                    action: 'daily_login'
                })
            });

            const data = await response.json();
            
            if (data.debug) {
            }
            
            this.status.loginStreak = data.loginStreak;
        } catch (error) {
            console.error('Error tracking daily login:', error);
        }
    },

    updateUI() {
        if (!this.status) return;

        // PRIORITY 1: Show eye if already unlocked
        if (this.status.eyeUnlocked) {
            this.showEye();
            return; // Stop here - no logo!
        }

        // PRIORITY 2: Show eye if ready (72h + 3 logins) but not yet unlocked
        if (this.status.eyeReady && !this.status.eyeUnlocked) {
            // First check if pyramid exists
            const existingPyramid = document.getElementById('easterEgg');
            if (existingPyramid && existingPyramid.querySelector('.pyramid')) {
                // Pyramid exists, transform it
                this.transformPyramidToEye();
            } else {
                // Pyramid doesn't exist yet, show it first then transform
                this.showPyramid();
                setTimeout(() => {
                    this.transformPyramidToEye();
                }, 2000); // Wait 2 seconds after showing pyramid
            }
            return; // Stop here - no duplicate logo!
        }

        // PRIORITY 3: Show pyramid after 8 seconds if not unlocked yet
        if (this.status.showPyramid && !this.status.pyramidUnlocked) {
            setTimeout(() => {
                this.showPyramid();
            }, 8000); // 8 seconds
        }

        // PRIORITY 4: Keep showing pyramid if unlocked but eye not ready
        if (this.status.pyramidUnlocked && !this.status.eyeReady) {
            this.showPyramid();
        }

    },

    showPyramid() {
        // Only show pyramid on the-hidden-door.html
        const isHiddenDoorPage = window.location.pathname.includes('the-hidden-door.html');
        if (!isHiddenDoorPage) return;
        
        const container = document.createElement('div');
        container.className = 'easter-egg-container';
        container.id = 'easterEgg';
        container.innerHTML = '<div class="pyramid"><div class="pyramid-glow"></div></div>';
        container.onclick = () => this.openPyramid();
        
        document.body.appendChild(container);
        
        // Animation
        container.style.opacity = '0';
        container.style.transform = 'scale(0)';
        setTimeout(() => {
            container.style.transition = 'all 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
            container.style.opacity = '1';
            container.style.transform = 'scale(1)';
        }, 100);
    },

    async openPyramid() {
        try {
            const response = await fetch('/api/easter-egg', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: this.userEmail,
                    action: 'open_pyramid'
                })
            });

            const data = await response.json();
            
            // Wait for i18n to be available
            await this.waitForI18n();
            
            const title = this.translate('THE PYRAMID');
            const riddleLines = [
                this.translate('The mark of power inverted lies.'),
                this.translate('A single dawn must break before your eyes.'),
                this.translate('Only those with patience and deep loyalty shall see'),
                this.translate('What lies beyond eternity.')
            ];
            const riddle = riddleLines.join('\n');
            this.showRiddle('<img src="assets/images/logo.png" alt="BILLIONAIRS">', title, riddle);
        } catch (error) {
            console.error('Error opening pyramid:', error);
        }
    },

    transformPyramidToEye() {
        // Only transform on the-hidden-door.html
        const isHiddenDoorPage = window.location.pathname.includes('the-hidden-door.html');
        if (!isHiddenDoorPage) return;
        
        const easterEgg = document.getElementById('easterEgg');
        if (easterEgg) {
            const pyramid = easterEgg.querySelector('.pyramid');
            
            if (pyramid) {
                // Smooth Transformation: Fade out logo, fade in eye
                pyramid.style.transition = 'opacity 1s ease-out, transform 1s ease-out';
                pyramid.style.opacity = '0';
                pyramid.style.transform = 'scale(0.8) rotate(180deg)';
                
                setTimeout(() => {
                    easterEgg.innerHTML = `
                        <div class="eye" style="opacity: 0; transform: scale(0.8);">
                        </div>
                    `;
                    
                    const eye = easterEgg.querySelector('.eye');
                    setTimeout(() => {
                        eye.style.transition = 'opacity 1s ease-in, transform 1s ease-in';
                        eye.style.opacity = '1';
                        eye.style.transform = 'scale(1)';
                    }, 50);
                    
                    easterEgg.onclick = () => this.openEye();
                }, 1000);
            } else {
                // Falls kein Pyramid da ist, zeige direkt das Auge
                easterEgg.innerHTML = `<div class="eye"></div>`;
                easterEgg.onclick = () => this.openEye();
            }
        } else {
            this.showEye();
        }
    },

    showEye() {
        // Only show eye on the-hidden-door.html
        const isHiddenDoorPage = window.location.pathname.includes('the-hidden-door.html');
        if (!isHiddenDoorPage) return;
        
        let easterEgg = document.getElementById('easterEgg');
        if (!easterEgg) {
            const container = document.createElement('div');
            container.className = 'easter-egg-container';
            container.id = 'easterEgg';
            container.innerHTML = `<div class="eye"></div>`;
            container.onclick = () => this.openEye();
            document.body.appendChild(container);
        } else {
            // Wenn Container existiert, ersetze Inhalt (falls noch Pyramid drin ist)
            if (easterEgg.querySelector('.pyramid')) {
                easterEgg.innerHTML = `<div class="eye"></div>`;
                easterEgg.onclick = () => this.openEye();
            }
        }
    },

    async openEye() {
        if (!this.userEmail) {
            console.warn('EasterEggSystem: No email, cannot open eye');
            return;
        }
        // Fresh status check from server
        try {
            const freshResponse = await fetch('/api/easter-egg', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: this.userEmail, action: 'check_status' })
            });
            this.status = await freshResponse.json();
        } catch (e) {
            console.error('Status refresh failed:', e);
        }

        // ONLY open chat if admin explicitly unlocked it
        if (this.status.chatUnlocked) {
            this.showChat();
            return;
        }

        // Otherwise ALWAYS show the eye riddle
        try {
            // Mark eye as opened in DB (for tracking)
            await fetch('/api/easter-egg', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: this.userEmail,
                    action: 'unlock_eye'
                })
            });
        } catch (error) {
            console.error('Error recording eye open:', error);
        }

        try {
            await this.waitForI18n();
            
            const title = this.translate('THE ALL-SEEING EYE');
            const riddleLines = [
                this.translate('The eye now watches over you.'),
                this.translate('When the next sun has risen and fallen,'),
                this.translate('The final door will open.')
            ];
            const riddle = riddleLines.join('\n');
            this.showRiddle('<img src="assets/images/eye-simple.svg" alt="All-Seeing Eye" style="width: 80px; height: 80px;">', title, riddle);
        } catch (error) {
            console.error('Error opening eye:', error);
        }
    },

    showRiddle(icon, title, text, onClose) {
        const modal = document.createElement('div');
        modal.className = 'riddle-modal show';
        const buttonText = this.translate('I UNDERSTAND');
        modal.innerHTML = `
            <div class="riddle-content">
                <div class="riddle-icon">${icon}</div>
                <h2 class="riddle-title">${title}</h2>
                <p class="riddle-text">${text}</p>
                <button class="riddle-close">
                    ${buttonText}
                </button>
            </div>
        `;
        
        // Close button with optional callback
        modal.querySelector('.riddle-close').addEventListener('click', () => {
            modal.remove();
            if (typeof onClose === 'function') {
                onClose();
            }
        });
        
        document.body.appendChild(modal);
    },
    
    // Helper: Wait for i18n to be available
    async waitForI18n() {
        let attempts = 0;
        while (!window.i18n && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
    },
    
    // Helper: Translate text using current language
    translate(text) {
        if (!window.i18n) {
            console.warn(`⚠️ i18n not available, using fallback for: "${text}"`);
            return text;
        }
        
        try {
            const lang = window.i18n.currentLang || 'en';
            
            // Try to get from loaded translations first (JSON files)
            if (window.i18n.translations && window.i18n.translations[lang]) {
                const keys = text.split('.');
                let value = window.i18n.translations[lang];
                
                for (const key of keys) {
                    if (value && typeof value === 'object') {
                        value = value[key];
                    } else {
                        value = undefined;
                        break;
                    }
                }
                
                if (value && typeof value === 'string') {
                    return value;
                }
            }
            
            // Fallback to hardcoded textMap
            const textMap = window.i18n.getTextMapForLanguage(lang);
            if (textMap && textMap[text]) {
                const translated = textMap[text];
                return translated;
            }
            
            console.warn(`⚠️ No translation found for: "${text}" in language: ${lang}`);
            return text;
        } catch (error) {
            console.error(`❌ Translation error for "${text}":`, error);
            return text;
        }
    },

    showChat() {
        
        // Initialize and open luxury chat
        if (typeof LuxuryChat === 'undefined') {
            // Store that we want to open chat after redirect
            sessionStorage.setItem('openChatOnLoad', 'true');
            window.location.href = '/the-hidden-door.html';
            return;
        }
        
        if (!window.luxuryChat) {
            window.luxuryChat = new LuxuryChat();
            window.luxuryChat.init(this.userEmail);
        }
        window.luxuryChat.open();
    },

    startMonitoring() {
        // Check status every minute
        setInterval(() => {
            this.checkStatus();
        }, 60000);
    }
};

// Initialize when user data is loaded
// Call this after getting user email in dashboard
// Example: EasterEggSystem.init(userEmail);
