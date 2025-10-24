// Easter Egg System JavaScript
// Add this to dashboard.html before </body>

const EasterEggSystem = {
    userEmail: null,
    status: null,

    async init(email) {
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
            this.status.loginStreak = data.loginStreak;
            this.updateStreakBadge();
        } catch (error) {
            console.error('Error tracking daily login:', error);
        }
    },

    updateUI() {
        if (!this.status) return;

        // Show eye if ready (72h + 3 logins) - PRIORITY
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
            return; // Stop here
        }

        // Show eye if already unlocked
        if (this.status.eyeUnlocked) {
            this.showEye();
            return; // Stop here
        }

        // Show pyramid after 20 seconds if not unlocked yet
        if (this.status.showPyramid && !this.status.pyramidUnlocked) {
            setTimeout(() => {
                this.showPyramid();
            }, 20000); // 20 seconds
        }

        // Keep showing pyramid if unlocked but eye not ready
        if (this.status.pyramidUnlocked && !this.status.eyeReady) {
            this.showPyramid();
        }

        // Update streak badge
        this.updateStreakBadge();
    },

    showPyramid() {
        // Only show pyramid on the-hidden-door.html
        const isHiddenDoorPage = window.location.pathname.includes('the-hidden-door.html');
        if (!isHiddenDoorPage) return;
        
        const container = document.createElement('div');
        container.className = 'easter-egg-container';
        container.id = 'easterEgg';
        container.innerHTML = '<div class="pyramid"></div>';
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
            this.showRiddle('<img src="assets/images/logo.png" alt="BILLIONAIRS">', 'The Pyramid', data.riddle);
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
                
                // Gleichzeitig: Römische Zahlen Reset (III → I)
                // Temporär login_streak auf 1 setzen für Badge-Anzeige während Transformation
                const originalStreak = this.status.loginStreak;
                
                setTimeout(() => {
                    // Reset Badge während Transformation
                    const badge = document.getElementById('streakBadge');
                    if (badge) {
                        badge.style.transition = 'opacity 0.5s ease-out';
                        badge.style.opacity = '0';
                        
                        setTimeout(() => {
                            // Zeige "I" statt "III" - neuer Zyklus beginnt
                            this.status.loginStreak = 1; // Temporär für Anzeige
                            this.updateStreakBadge();
                            badge.style.transition = 'opacity 0.5s ease-in';
                            badge.style.opacity = '1';
                            
                            // Restore original streak
                            this.status.loginStreak = originalStreak;
                        }, 500);
                    }
                }, 300); // Starte Badge-Animation kurz nach Logo-Fade
                
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
            container.innerHTML = `
                <div class="eye">
                    <div class="rays"></div>
                </div>
            `;
            container.onclick = () => this.openEye();
            document.body.appendChild(container);
        }
    },

    async openEye() {
        if (this.status.chatReady && !this.status.chatUnlocked) {
            // Unlock chat
            try {
                await fetch('/api/easter-egg', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: this.userEmail,
                        action: 'unlock_chat'
                    })
                });
                
                this.showChat();
            } catch (error) {
                console.error('Error unlocking chat:', error);
            }
        } else if (this.status.chatUnlocked) {
            // Open chat
            this.showChat();
        } else {
            // Show riddle
            try {
                const response = await fetch('/api/easter-egg', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: this.userEmail,
                        action: 'unlock_eye'
                    })
                });

                const data = await response.json();
                this.showRiddle('<img src="assets/images/eye-simple.svg" alt="All-Seeing Eye" style="width: 80px; height: 80px;">', 'The All-Seeing Eye', data.riddle);
            } catch (error) {
                console.error('Error opening eye:', error);
            }
        }
    },

    showRiddle(icon, title, text) {
        const modal = document.createElement('div');
        modal.className = 'riddle-modal show';
        modal.innerHTML = `
            <div class="riddle-content">
                <div class="riddle-icon">${icon}</div>
                <h2 class="riddle-title">${title}</h2>
                <p class="riddle-text">${text}</p>
                <button class="riddle-close" onclick="this.closest('.riddle-modal').remove()">
                    I Understand
                </button>
            </div>
        `;
        document.body.appendChild(modal);
    },

    showChat() {
        const modal = document.createElement('div');
        modal.className = 'riddle-modal show';
        
        if (this.status.chatUnlocked) {
            modal.innerHTML = `
                <div class="riddle-content">
                    <div class="riddle-icon">💬</div>
                    <h2 class="riddle-title">The Inner Circle</h2>
                    <p class="riddle-text">Welcome to the conversation that shapes the world.</p>
                    <div class="chat-preview">
                        <p class="chat-locked-message">
                            Anonymous chat coming soon...<br>
                            You've unlocked access. Stay tuned.
                        </p>
                    </div>
                    <button class="riddle-close" onclick="this.closest('.riddle-modal').remove()">
                        Close
                    </button>
                </div>
            `;
        } else {
            modal.innerHTML = `
                <div class="riddle-content">
                    <div class="riddle-icon">🔒</div>
                    <h2 class="riddle-title">Locked</h2>
                    <p class="riddle-text">The eye sees, but does not yet speak.<br>Return when seven suns have set.</p>
                    <button class="riddle-close" onclick="this.closest('.riddle-modal').remove()">
                        Close
                    </button>
                </div>
            `;
        }
        
        document.body.appendChild(modal);
    },

    updateStreakBadge() {
        // Only show streak badge on the-hidden-door.html
        const isHiddenDoorPage = window.location.pathname.includes('the-hidden-door.html');
        
        let badge = document.getElementById('streakBadge');
        if (!badge && this.status.loginStreak > 0 && isHiddenDoorPage) {
            badge = document.createElement('div');
            badge.id = 'streakBadge';
            badge.className = 'login-streak-badge';
            document.body.appendChild(badge);
        }

        if (badge && this.status.loginStreak > 0 && isHiddenDoorPage) {
            // Wenn Auge erschienen ist (eyeReady oder eyeUnlocked), zähle bis 7
            // Sonst nur bis 3 (für das Logo)
            let displayStreak = this.status.loginStreak;
            let maxStreak = 3;
            
            if (this.status.eyeReady || this.status.eyeUnlocked) {
                // Eye Phase: Zähle 7 Tage
                maxStreak = 7;
            }
            
            // Römische Zahlen bis 7
            const romanNumerals = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
            const roman = romanNumerals[Math.min(displayStreak, maxStreak)] || displayStreak;
            badge.innerHTML = `<div class="login-streak-number">${roman}</div>`;
        } else if (badge && !isHiddenDoorPage) {
            // Remove badge if on dashboard
            badge.remove();
        }
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
