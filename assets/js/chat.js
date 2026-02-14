// Premium Luxury Chat System — E2E Encrypted & Screenshot-Protected
class LuxuryChat {
    constructor() {
        this.userEmail = null;
        this.username = null;
        this.messages = [];
        this.isOpen = false;
        this.lastMessageCount = 0;
        this.pollingInterval = null;
        this.particleInterval = null;
        this.screenshotProtectionActive = false;
        this.soundEnabled = localStorage.getItem('chat_sound') !== 'off';
        this.notificationSound = null;
        
        // Cleanup on page unload
        window.addEventListener('beforeunload', () => this.cleanup());
    }
    
    cleanup() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
        if (this.particleInterval) {
            clearInterval(this.particleInterval);
            this.particleInterval = null;
        }
        this.removeScreenshotProtection();
        console.log('🧹 Chat: Intervals cleared');
    }

    init(userEmail) {
        this.userEmail = userEmail;
        // Record session start — members only see messages from NOW onwards
        this.sessionStart = new Date().toISOString();
        this.generateUsername();
        this.initNotificationSound();
        this.createChatUI();
        this.initScreenshotProtection();
        this.requestPushPermission();
        this.startPolling();
    }

    // ═══════════════════════════════════════════════
    // NOTIFICATION SOUND SYSTEM
    // ═══════════════════════════════════════════════
    
    initNotificationSound() {
        // Create AudioContext-based notification sound (luxury chime)
        this._audioCtx = null;
    }
    
    playNotificationSound() {
        if (!this.soundEnabled) return;
        
        try {
            // Create AudioContext on first use, recreate if closed
            if (!this._audioCtx || this._audioCtx.state === 'closed') {
                this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            const ctx = this._audioCtx;
            
            // Resume if suspended (required after user leaves & returns)
            if (ctx.state === 'suspended') {
                ctx.resume().then(() => this._playChime(ctx));
                return;
            }
            
            this._playChime(ctx);
        } catch (e) {
            console.warn('Sound playback failed:', e);
            // Reset AudioContext for next attempt
            this._audioCtx = null;
        }
    }
    
    _playChime(ctx) {
        try {
            const now = ctx.currentTime;
            
            // Luxury chime: Two soft bell tones (C5 + E5)
            const playTone = (freq, start, duration, volume) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + start);
                
                gain.gain.setValueAtTime(0, now + start);
                gain.gain.linearRampToValueAtTime(volume, now + start + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, now + start + duration);
                
                osc.start(now + start);
                osc.stop(now + start + duration);
            };
            
            // Elegant three-note chime
            playTone(523.25, 0, 0.3, 0.15);     // C5
            playTone(659.25, 0.12, 0.35, 0.12);  // E5
            playTone(783.99, 0.22, 0.4, 0.08);   // G5 (soft)
        } catch (e) {
            console.warn('Chime playback failed:', e);
        }
    }
    
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        localStorage.setItem('chat_sound', this.soundEnabled ? 'on' : 'off');
        
        const btn = document.getElementById('chatSoundToggle');
        if (btn) {
            btn.innerHTML = this.soundEnabled ? '🔔' : '🔇';
            btn.title = this.soundEnabled ? 'Sound deaktivieren' : 'Sound aktivieren';
        }
        
        // Play a test chime when turning on
        if (this.soundEnabled) {
            this.playNotificationSound();
        }
    }
    
    // ═══════════════════════════════════════════════
    // PUSH NOTIFICATIONS — Auto-Subscribe
    // ═══════════════════════════════════════════════
    
    async requestPushPermission() {
        // Check basic support
        if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
            console.warn('Push notifications not supported on this device');
            return;
        }
        
        try {
            // Wait for service worker to be ready
            const registration = await navigator.serviceWorker.ready;
            
            if (Notification.permission === 'default') {
                // Delay prompt so it doesn't appear immediately
                setTimeout(async () => {
                    try {
                        const permission = await Notification.requestPermission();
                        if (permission === 'granted') {
                            await this._subscribeToPush(registration);
                        }
                    } catch (e) {
                        console.warn('Permission request failed:', e);
                    }
                }, 3000);
            } else if (Notification.permission === 'granted') {
                // Already granted — ensure subscription exists
                await this._subscribeToPush(registration);
            }
        } catch (e) {
            console.warn('Push subscription failed:', e);
        }
    }
    
    async _subscribeToPush(registration) {
        try {
            let subscription = await registration.pushManager.getSubscription();
            
            if (!subscription) {
                // VAPID public key
                const vapidKey = 'BImYUR7FiZgYywJNjKzSiIkDPdotF5OX5E1h023JBKk4Yr6nSnIzq6OD5PDNKLSl-UK1xxoFFY4uWWPyNAJaoGs';
                const applicationServerKey = this._urlBase64ToUint8Array(vapidKey);
                
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: applicationServerKey
                });
                console.log('New push subscription created');
            }
            
            // Send subscription to server with email
            const userEmail = this.userEmail || sessionStorage.getItem('userEmail') || localStorage.getItem('userEmail');
            
            await fetch('/api/push-subscribe', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-user-email': userEmail || ''
                },
                body: JSON.stringify({
                    subscription: subscription.toJSON(),
                    userAgent: navigator.userAgent,
                    email: userEmail
                })
            });
            
            console.log('Push subscription saved to server');
        } catch (e) {
            console.warn('Push subscribe error:', e);
        }
    }
    
    _urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    // ═══════════════════════════════════════════════
    // SCREENSHOT PROTECTION SYSTEM
    // ═══════════════════════════════════════════════
    
    initScreenshotProtection() {
        this.screenshotProtectionActive = true;
        
        // 1. Block PrintScreen key (Desktop)
        this._onKeyDown = (e) => {
            if (!this.isOpen) return;
            
            // PrintScreen
            if (e.key === 'PrintScreen' || e.keyCode === 44) {
                e.preventDefault();
                this.showSecurityWarning();
                this.blurChat(2000);
                return false;
            }
            
            // Windows Snipping Tool: Win+Shift+S
            if (e.key === 'S' && e.shiftKey && (e.metaKey || e.getModifierState('OS'))) {
                e.preventDefault();
                this.showSecurityWarning();
                this.blurChat(2000);
                return false;
            }
            
            // Ctrl+Shift+S (Save As / Screenshot tools)
            if (e.key === 's' && e.ctrlKey && e.shiftKey) {
                e.preventDefault();
                this.showSecurityWarning();
                return false;
            }
            
            // Ctrl+P (Print)
            if (e.key === 'p' && e.ctrlKey) {
                e.preventDefault();
                this.showSecurityWarning();
                return false;
            }

            // Ctrl+Shift+I (Dev Tools)
            if (e.key === 'I' && e.ctrlKey && e.shiftKey) {
                e.preventDefault();
                return false;
            }
        };
        document.addEventListener('keydown', this._onKeyDown, true);
        document.addEventListener('keyup', (e) => {
            if (e.key === 'PrintScreen' && this.isOpen) {
                try {
                    navigator.clipboard.writeText('Screenshot blocked by BILLIONAIRS Security');
                } catch(err) { }
            }
        }, true);
        
        // 2. Blur on visibility change (tab switch, app switch)
        this._onVisibility = () => {
            if (!this.isOpen) return;
            const chatMessages = document.getElementById('chatMessages');
            if (!chatMessages) return;
            
            if (document.hidden) {
                chatMessages.style.filter = 'blur(20px)';
                chatMessages.style.transition = 'filter 0.1s ease';
            } else {
                setTimeout(() => {
                    chatMessages.style.filter = '';
                    chatMessages.style.transition = 'filter 0.3s ease';
                }, 300);
            }
        };
        document.addEventListener('visibilitychange', this._onVisibility);
        
        // 3. MOBILE Screenshot Detection (iOS + Android)
        // On iOS/Android, taking a screenshot causes window.blur -> window.focus
        this._onWindowBlur = () => {
            if (!this.isOpen) return;
            const chatMessages = document.getElementById('chatMessages');
            if (!chatMessages) return;
            
            // Immediately blur chat content
            chatMessages.style.filter = 'blur(25px)';
            chatMessages.style.transition = 'filter 0.05s ease';
            this._blurredByScreenshot = true;
        };
        
        this._onWindowFocus = () => {
            if (!this.isOpen || !this._blurredByScreenshot) return;
            const chatMessages = document.getElementById('chatMessages');
            if (!chatMessages) return;
            
            // Show warning, then slowly unblur
            this.showSecurityWarning();
            setTimeout(() => {
                chatMessages.style.filter = '';
                chatMessages.style.transition = 'filter 0.5s ease';
                this._blurredByScreenshot = false;
            }, 1500);
        };
        
        window.addEventListener('blur', this._onWindowBlur);
        window.addEventListener('focus', this._onWindowFocus);
        
        // 4. iOS: Detect screenshot via resize (iOS briefly changes viewport during screenshot)
        this._lastHeight = window.innerHeight;
        this._onResize = () => {
            if (!this.isOpen) return;
            const heightDiff = Math.abs(window.innerHeight - this._lastHeight);
            this._lastHeight = window.innerHeight;
            
            // iOS screenshot causes a tiny resize flash
            if (heightDiff > 0 && heightDiff < 100) {
                this.blurChat(2000);
            }
        };
        window.addEventListener('resize', this._onResize);
        
        // 5. Block right-click on chat
        this._onContextMenu = (e) => {
            if (!this.isOpen) return;
            const chatOverlay = document.getElementById('chatOverlay');
            if (chatOverlay && chatOverlay.contains(e.target)) {
                e.preventDefault();
                this.showSecurityWarning();
                return false;
            }
        };
        document.addEventListener('contextmenu', this._onContextMenu);
        
        // 6. Block long-press on mobile (prevents context menu / save image)
        this._onTouchStart = null;
        this._onTouchEnd = null;
        if ('ontouchstart' in window) {
            let touchTimer = null;
            this._onTouchStart = (e) => {
                if (!this.isOpen) return;
                const chatOverlay = document.getElementById('chatOverlay');
                if (chatOverlay && chatOverlay.contains(e.target)) {
                    touchTimer = setTimeout(() => {
                        e.preventDefault();
                    }, 500);
                }
            };
            this._onTouchEnd = () => {
                if (touchTimer) clearTimeout(touchTimer);
            };
            document.addEventListener('touchstart', this._onTouchStart, { passive: false });
            document.addEventListener('touchend', this._onTouchEnd);
            document.addEventListener('touchmove', this._onTouchEnd);
        }
    }
    
    removeScreenshotProtection() {
        if (this._onKeyDown) document.removeEventListener('keydown', this._onKeyDown, true);
        if (this._onVisibility) document.removeEventListener('visibilitychange', this._onVisibility);
        if (this._onContextMenu) document.removeEventListener('contextmenu', this._onContextMenu);
        if (this._onWindowBlur) window.removeEventListener('blur', this._onWindowBlur);
        if (this._onWindowFocus) window.removeEventListener('focus', this._onWindowFocus);
        if (this._onResize) window.removeEventListener('resize', this._onResize);
        if (this._onTouchStart) {
            document.removeEventListener('touchstart', this._onTouchStart);
            document.removeEventListener('touchend', this._onTouchEnd);
            document.removeEventListener('touchmove', this._onTouchEnd);
        }
        this.screenshotProtectionActive = false;
    }
    
    blurChat(duration) {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;
        
        chatMessages.style.filter = 'blur(30px)';
        chatMessages.style.transition = 'filter 0.1s ease';
        
        setTimeout(() => {
            chatMessages.style.filter = '';
            chatMessages.style.transition = 'filter 0.5s ease';
        }, duration);
    }
    
    showSecurityWarning() {
        // Remove any existing warning
        const existing = document.querySelector('.chat-security-warning');
        if (existing) existing.remove();
        
        const warning = document.createElement('div');
        warning.className = 'chat-security-warning';
        warning.innerHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0,0,0,0.95);
                border: 2px solid #e8b4b8;
                border-radius: 16px;
                padding: 2rem 3rem;
                z-index: 100001;
                text-align: center;
                animation: secWarningPulse 0.5s ease;
                backdrop-filter: blur(10px);
            ">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">🔒</div>
                <div style="
                    font-family: 'Playfair Display', serif;
                    color: #e8b4b8;
                    font-size: 1.1rem;
                    font-weight: 600;
                    letter-spacing: 2px;
                    margin-bottom: 0.5rem;
                ">SCREENSHOT BLOCKED</div>
                <div style="
                    color: #888;
                    font-size: 0.8rem;
                    font-family: 'Montserrat', sans-serif;
                ">This chat is protected by end-to-end encryption</div>
            </div>
        `;
        document.body.appendChild(warning);
        
        setTimeout(() => warning.remove(), 2500);
    }

    generateUsername() {
        // Generate "Titan #XXXX" username based on user ID or random
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        this.username = `Titan #${randomNum}`;
    }

    createChatUI() {
        // Inject screenshot protection CSS
        if (!document.getElementById('chatSecurityCSS')) {
            const secCSS = document.createElement('style');
            secCSS.id = 'chatSecurityCSS';
            secCSS.textContent = `
                /* Screenshot Protection */
                .chat-messages {
                    -webkit-user-select: none !important;
                    -moz-user-select: none !important;
                    -ms-user-select: none !important;
                    user-select: none !important;
                    -webkit-touch-callout: none !important;
                }
                .chat-messages * {
                    -webkit-user-select: none !important;
                    user-select: none !important;
                }
                .chat-input {
                    -webkit-user-select: text !important;
                    user-select: text !important;
                }
                /* Invisible watermark layer */
                .chat-watermark {
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    pointer-events: none;
                    z-index: 10;
                    opacity: 0.015;
                    overflow: hidden;
                    font-size: 9px;
                    color: #e8b4b8;
                    line-height: 2;
                    letter-spacing: 8px;
                    transform: rotate(-25deg);
                    word-break: break-all;
                }
                /* Encryption badge */
                .chat-encryption-badge {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    padding: 4px 0;
                    background: rgba(232, 180, 184, 0.06);
                    border-bottom: 1px solid rgba(232, 180, 184, 0.1);
                    font-family: 'Montserrat', sans-serif;
                    font-size: 0.65rem;
                    color: rgba(232, 180, 184, 0.6);
                    letter-spacing: 1.5px;
                    text-transform: uppercase;
                }
                .chat-encryption-badge svg {
                    width: 11px;
                    height: 11px;
                    fill: rgba(232, 180, 184, 0.5);
                }
                /* Security warning animation */
                @keyframes secWarningPulse {
                    0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
                    50% { transform: translate(-50%, -50%) scale(1.05); }
                    100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                }
                /* Anti-screenshot: make content harder to capture on some devices */
                .chat-overlay.show .chat-messages {
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                @media print {
                    .chat-overlay { display: none !important; }
                }
                /* Content warning animation */
                @keyframes warningFadeIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes inputShake {
                    0%, 100% { transform: translateX(0); }
                    15% { transform: translateX(-6px); }
                    30% { transform: translateX(5px); }
                    45% { transform: translateX(-4px); }
                    60% { transform: translateX(3px); }
                    75% { transform: translateX(-2px); }
                }
                /* Sound toggle button */
                .chat-sound-toggle {
                    background: none;
                    border: 1px solid rgba(232, 180, 184, 0.2);
                    border-radius: 50%;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    font-size: 0.85rem;
                    transition: all 0.3s ease;
                    padding: 0;
                }
                .chat-sound-toggle:hover {
                    background: rgba(232, 180, 184, 0.1);
                    border-color: rgba(232, 180, 184, 0.4);
                }
            `;
            document.head.appendChild(secCSS);
        }
        
        // Generate watermark text (user email repeated)
        const watermarkText = this.userEmail ? 
            Array(200).fill(this.userEmail).join(' · ') : '';

        const chatHTML = `
            <div class="chat-overlay" id="chatOverlay">
                <div class="chat-container">
                    <div class="chat-header">
                        <div>
                            <div class="chat-title">THE INNER CIRCLE</div>
                            <div class="chat-subtitle">TITANS ONLY</div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <div class="chat-online-count">
                                <div class="chat-online-dot"></div>
                                <span id="onlineCount">1</span> Online
                            </div>
                            <button class="chat-sound-toggle" id="chatSoundToggle" title="${this.soundEnabled ? 'Sound deaktivieren' : 'Sound aktivieren'}">
                                ${this.soundEnabled ? '🔔' : '🔇'}
                            </button>
                            <button class="chat-close" id="chatCloseBtn">×</button>
                        </div>
                    </div>
                    
                    <div class="chat-encryption-badge">
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z"/>
                        </svg>
                        End-to-End Encrypted · Screenshot Protected
                    </div>
                    
                    <div class="chat-messages" id="chatMessages" style="position: relative;">
                        <div class="chat-watermark" id="chatWatermark">${watermarkText}</div>
                        <div class="chat-empty">
                            <div class="chat-empty-icon">💬</div>
                            <div class="chat-empty-text">Welcome, ${this.username}</div>
                            <div class="chat-empty-subtext">You've unlocked The Inner Circle.<br>Share wisdom with fellow Titans.</div>
                        </div>
                    </div>
                    
                    <div class="chat-input-container">
                        <input 
                            type="file" 
                            id="chatFileInput" 
                            accept="image/*,.pdf,.doc,.docx,.txt"
                            style="display: none;"
                        />
                        <button class="chat-attach-btn" id="chatAttachBtn" title="Bild oder Datei anhängen">
                            📎
                        </button>
                        <input 
                            type="text" 
                            class="chat-input" 
                            id="chatInput" 
                            placeholder="Share your thoughts..."
                            maxlength="500"
                        />
                        <button class="chat-send-btn" id="chatSendBtn">
                            ➤
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', chatHTML);

        // Event listeners
        document.getElementById('chatCloseBtn').addEventListener('click', () => {
            this.close();
        });

        document.getElementById('chatSoundToggle').addEventListener('click', () => {
            this.toggleSound();
        });

        document.getElementById('chatAttachBtn').addEventListener('click', () => {
            document.getElementById('chatFileInput').click();
        });

        document.getElementById('chatFileInput').addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files[0]);
        });

        // Drag & Drop support
        const chatMessages = document.getElementById('chatMessages');
        const chatInput = document.getElementById('chatInput');
        
        // Prevent default drag behaviors on the whole chat
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            chatMessages.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
            chatInput.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        // Highlight on drag over
        ['dragenter', 'dragover'].forEach(eventName => {
            chatMessages.addEventListener(eventName, () => {
                chatMessages.style.background = 'rgba(232, 196, 168, 0.05)';
            });
            chatInput.addEventListener(eventName, () => {
                chatInput.style.background = 'rgba(232, 196, 168, 0.08)';
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            chatMessages.addEventListener(eventName, () => {
                chatMessages.style.background = '';
            });
            chatInput.addEventListener(eventName, () => {
                chatInput.style.background = '';
            });
        });

        // Handle dropped files
        const handleDrop = (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileUpload(files[0]);
            }
        };

        chatMessages.addEventListener('drop', handleDrop);
        chatInput.addEventListener('drop', handleDrop);

        document.getElementById('chatSendBtn').addEventListener('click', () => {
            this.sendMessage();
        });

        // Enter key to send
        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
    }

    open() {
        // Prevent any shifts - lock the original eye in place
        const easterEggContainer = document.querySelector('.easter-egg-container');
        if (!easterEggContainer) return;
        
        easterEggContainer.style.pointerEvents = 'none';
        
        // Get the existing eye element
        const existingEye = easterEggContainer.querySelector('.eye');
        
        if (existingEye) {
            // Clone the existing eye to animate it
            const eyeClone = existingEye.cloneNode(true);
            const rect = easterEggContainer.getBoundingClientRect();
            
            // Position clone EXACTLY at original position
            eyeClone.style.position = 'fixed';
            eyeClone.style.top = rect.top + 'px';
            eyeClone.style.left = rect.left + 'px';
            eyeClone.style.width = '80px';
            eyeClone.style.height = '80px';
            eyeClone.style.zIndex = '9998';
            eyeClone.classList.add('eye-closing');
            
            document.body.appendChild(eyeClone);
            
            // Hide original immediately
            easterEggContainer.style.opacity = '0';
            
            // Create particle trail during flight
            this.particleInterval = setInterval(() => {
                const particle = document.createElement('div');
                particle.className = 'eye-particles';
                const cloneRect = eyeClone.getBoundingClientRect();
                particle.style.top = (cloneRect.top + 40) + 'px';
                particle.style.left = (cloneRect.left + 40) + 'px';
                document.body.appendChild(particle);
                
                setTimeout(() => particle.remove(), 1500);
            }, 80);
            
            // Start flying to center after dramatic close
            setTimeout(() => {
                eyeClone.classList.add('traveling');
                if (this.particleInterval) {
                    clearInterval(this.particleInterval);
                    this.particleInterval = null;
                }
            }, 2000);
            
            // Remove clone after it reaches center
            setTimeout(() => eyeClone.remove(), 4600);
        }

        // Phase 2: Eye opening in center with expanding aura rings
        setTimeout(() => {
            // Multiple aura layers for drama
            const aura = document.createElement('div');
            aura.className = 'eye-center-aura';
            document.body.appendChild(aura);
            
            // Eye element
            const eyeCenter = document.createElement('div');
            eyeCenter.className = 'eye-center';
            eyeCenter.innerHTML = '<img src="assets/images/eye-simple.svg" style="width: 100%; height: 100%;">';
            document.body.appendChild(eyeCenter);
            
            setTimeout(() => {
                aura.remove();
                eyeCenter.remove();
            }, 5000);
        }, 4600);

        // Phase 3: EPIC light explosion
        setTimeout(() => {
            const explosion = document.createElement('div');
            explosion.className = 'light-explosion';
            document.body.appendChild(explosion);
            
            setTimeout(() => explosion.remove(), 2000);
        }, 9300);

        // Phase 4: Chat reveal - THE GRAND FINALE
        setTimeout(() => {
            const overlay = document.getElementById('chatOverlay');
            overlay.classList.add('show');
            this.isOpen = true;
            
            // Resume AudioContext (needs user gesture context)
            if (this._audioCtx && this._audioCtx.state === 'suspended') {
                this._audioCtx.resume();
            }
            
            // Mark session start time in database
            this.markChatSession();
            
            this.loadMessages();
            this.scrollToBottom();
        }, 9500);
    }

    async markChatSession() {
        // Set chat_opened_at to NOW for this session
        try {
            await fetch('/api/easter-egg', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: this.userEmail,
                    action: 'mark_chat_session'
                })
            });
        } catch (error) {
            console.error('Error marking chat session:', error);
        }
    }

    close() {
        const overlay = document.getElementById('chatOverlay');
        overlay.classList.remove('show');
        this.isOpen = false;
        
        // Clear any screenshot blur
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            chatMessages.style.filter = '';
        }
        this._blurredByScreenshot = false;
        
        // Restore the eye
        const easterEggContainer = document.querySelector('.easter-egg-container');
        if (easterEggContainer) {
            easterEggContainer.style.opacity = '1';
            easterEggContainer.style.pointerEvents = 'auto';
        }
    }

    // ═══════════════════════════════════════════════
    // CONTENT MODERATION — Personal Info Filter
    // ═══════════════════════════════════════════════
    
    checkForPersonalInfo(text) {
        if (!text) return null;
        const lower = text.toLowerCase().replace(/\s+/g, ' ');
        
        // Email pattern: word@word.tld
        if (/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/i.test(text)) {
            return 'email address';
        }
        
        // Phone numbers: various formats (min 7 digits with optional separators)
        if (/(?:\+?\d{1,4}[\s\-.]?)?(?:\(?\d{2,5}\)?[\s\-.]?)?\d{3,}[\s\-.]?\d{2,}/g.test(text) && 
            text.replace(/[^\d]/g, '').length >= 7) {
            return 'phone number';
        }
        
        // Instagram: @handle, instagram.com/..., "insta:", "ig:", "mein insta"
        if (/(?:instagram\.com\/|@[a-zA-Z0-9._]{3,}|\b(?:insta|ig)\s*[:=]|\bmein\s*(?:insta|ig)\b|\bmy\s*(?:insta|ig)\b|\bfollow\s*(?:me|mich)\b)/i.test(text)) {
            return 'Instagram';
        }
        
        // Twitter/X: twitter.com/..., x.com/...
        if (/(?:twitter\.com\/|x\.com\/[a-zA-Z0-9_]|\btwitter\s*[:=]|\bmein\s*twitter\b|\bmy\s*twitter\b)/i.test(text)) {
            return 'Twitter/X';
        }
        
        // Snapchat
        if (/(?:snapchat\.com\/|\bsnapchat\s*[:=]|\bsnap\s*[:=]|\bmein\s*snap(?:chat)?\b|\bmy\s*snap(?:chat)?\b|\badd\s*(?:me|mich)\s*(?:on|auf)\s*snap)/i.test(text)) {
            return 'Snapchat';
        }
        
        // TikTok
        if (/(?:tiktok\.com\/@|\btiktok\s*[:=]|\bmein\s*tiktok\b|\bmy\s*tiktok\b)/i.test(text)) {
            return 'TikTok';
        }
        
        // WhatsApp / Telegram / Signal
        if (/(?:wa\.me\/|\bwhatsapp\s*[:=]|\btelegram\s*[:=]|\bsignal\s*[:=]|\bschreib\s*(?:mir|mich)\s*(?:auf|per|über)\s*(?:whatsapp|telegram|signal)|\bmessage\s*me\s*on\s*(?:whatsapp|telegram|signal))/i.test(text)) {
            return 'WhatsApp/Telegram';
        }
        
        // Discord
        if (/(?:discord\.gg\/|\bdiscord\s*[:=]|\bmein\s*discord\b|\bmy\s*discord\b)/i.test(text)) {
            return 'Discord';
        }
        
        // Facebook / LinkedIn
        if (/(?:facebook\.com\/|fb\.com\/|linkedin\.com\/in\/|\bfacebook\s*[:=]|\blinkedin\s*[:=])/i.test(text)) {
            return 'Facebook/LinkedIn';
        }
        
        // YouTube channel
        if (/(?:youtube\.com\/(?:c\/|channel\/|@)|youtu\.be\/|\byoutube\s*[:=]|\bmein\s*(?:youtube|kanal)\b|\bmy\s*(?:youtube|channel)\b)/i.test(text)) {
            return 'YouTube';
        }
        
        // Generic URLs (http, https, www)
        if (/(?:https?:\/\/|www\.)[a-zA-Z0-9\-]+\.[a-zA-Z]{2,}/i.test(text)) {
            return 'link/URL';
        }
        
        // Physical addresses (German/English patterns: Straße, Street, Str., PLZ)
        if (/(?:\b\d{4,5}\s+[A-ZÄÖÜ][a-zäöüß]+|\b[\wäöüß]+(?:straße|strasse|str\.|gasse|weg|allee|platz|ring|damm)\s+\d|\b\d+\s+(?:street|road|avenue|drive|lane|blvd)\b)/i.test(text)) {
            return 'address';
        }
        
        return null;
    }
    
    showContentWarning(type) {
        // Show warning as a system message in chat
        const container = document.getElementById('chatMessages');
        if (!container) return;
        
        // Remove existing warning
        const existing = container.querySelector('.chat-content-warning');
        if (existing) existing.remove();
        
        const warningEl = document.createElement('div');
        warningEl.className = 'chat-content-warning';
        warningEl.innerHTML = `
            <div style="
                background: rgba(255, 70, 70, 0.08);
                border: 1px solid rgba(255, 70, 70, 0.3);
                border-radius: 12px;
                padding: 1rem 1.2rem;
                margin: 0.8rem 1rem;
                text-align: center;
                animation: warningFadeIn 0.3s ease;
            ">
                <div style="
                    font-family: 'Playfair Display', serif;
                    color: #ff6b6b;
                    font-size: 0.95rem;
                    font-weight: 600;
                    letter-spacing: 1.5px;
                    margin-bottom: 0.4rem;
                ">WARNING</div>
                <div style="
                    color: rgba(255, 150, 150, 0.9);
                    font-size: 0.78rem;
                    font-family: 'Montserrat', sans-serif;
                    line-height: 1.5;
                ">Sharing personal information (${this.escapeHtml(type)}) is not allowed in The Inner Circle.<br>
                This includes social media, emails, phone numbers, and addresses.<br>
                <span style="color: #e8b4b8; font-weight: 500;">Your anonymity protects you.</span></div>
            </div>
        `;
        container.appendChild(warningEl);
        this.scrollToBottom();
        
        // Auto-remove after 8 seconds
        setTimeout(() => {
            if (warningEl.parentNode) {
                warningEl.style.transition = 'opacity 0.5s ease';
                warningEl.style.opacity = '0';
                setTimeout(() => warningEl.remove(), 500);
            }
        }, 8000);
    }

    async sendMessage(fileUrl = null, fileName = null, fileType = null) {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();

        if (!message && !fileUrl) return;

        // Content Moderation: Check for personal info
        if (message) {
            const violation = this.checkForPersonalInfo(message);
            if (violation) {
                this.showContentWarning(violation);
                // Shake the input field
                input.style.animation = 'none';
                input.offsetHeight; // trigger reflow
                input.style.animation = 'inputShake 0.5s ease';
                return; // Block the message
            }
        }

        try {
            const payload = {
                email: this.userEmail,
                username: this.username,
                message: message || ''
            };

            // Add file data if present
            if (fileUrl) {
                payload.fileUrl = fileUrl;
                payload.fileName = fileName;
                payload.fileType = fileType;
            }

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const data = await response.json();
                // Check if server-side filter caught something
                if (data.blocked) {
                    this.showContentWarning(data.blockedType || 'personal information');
                    return;
                }
                input.value = '';
                await this.loadMessages();
                this.scrollToBottom();
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    }

    async handleFileUpload(file) {
        if (!file) return;

        // Show loading state
        const input = document.getElementById('chatInput');
        const originalPlaceholder = input.placeholder;
        input.placeholder = 'Uploading file...';
        input.disabled = true;

        try {
            // Upload via our secure server endpoint
            const formData = new FormData();
            formData.append('file', file);

            console.log('Uploading file via server...');
            
            const response = await fetch('/api/upload-file', {
                method: 'POST',
                body: formData
            });

            console.log('Upload response status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                
                // Determine file type
                const isImage = file.type.startsWith('image/');
                const fileType = isImage ? 'image' : 'file';
                
                // Send message with file
                await this.sendMessage(data.secure_url, file.name, fileType);
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error('Upload error:', errorData);
                alert(`Upload failed: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Upload error. Please try again.');
        } finally {
            input.placeholder = originalPlaceholder;
            input.disabled = false;
            // Clear file input
            document.getElementById('chatFileInput').value = '';
        }
    }

    async loadMessages() {
        try {
            const sinceParam = this.sessionStart ? `&since=${encodeURIComponent(this.sessionStart)}` : '';
            const response = await fetch(`/api/chat?email=${this.userEmail}${sinceParam}`);
            const data = await response.json();

            if (data.messages) {
                const newMessageCount = data.messages.length;
                
                // Check if new messages arrived while chat is closed
                if (!this.isOpen && this.lastMessageCount > 0 && newMessageCount > this.lastMessageCount) {
                    this.triggerEyeBlink();
                    this.playNotificationSound();
                    
                    // Send browser notification
                    if (window.notificationManager && data.messages.length > 0) {
                        const latestMessage = data.messages[data.messages.length - 1];
                        window.notificationManager.notifyNewChatMessage(latestMessage.username);
                    }
                }
                
                // Check if new messages arrived while chat is open
                const hasNewMessages = newMessageCount > this.lastMessageCount;
                
                // Play sound for new messages while chat is open (from others)
                if (this.isOpen && hasNewMessages && this.lastMessageCount > 0) {
                    const latestMsg = data.messages[data.messages.length - 1];
                    if (latestMsg && latestMsg.username !== this.username) {
                        this.playNotificationSound();
                    }
                }
                
                this.lastMessageCount = newMessageCount;
                this.messages = data.messages;
                this.renderMessages();
                
                // Auto-scroll if chat is open and new messages arrived
                if (this.isOpen && hasNewMessages) {
                    this.scrollToBottom();
                }
            }

            if (data.onlineCount) {
                document.getElementById('onlineCount').textContent = data.onlineCount;
            }
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    }

    triggerEyeBlink() {
        const eye = document.querySelector('.easter-egg-container .eye');
        if (!eye) return;
        
        // Add blink class
        eye.classList.add('eye-blink-notification');
        
        // Remove after animation
        setTimeout(() => {
            eye.classList.remove('eye-blink-notification');
        }, 1000);
    }

    renderMessages() {
        const container = document.getElementById('chatMessages');
        
        if (this.messages.length === 0) {
            return; // Keep empty state
        }

        // Remove empty state only once
        const emptyState = container.querySelector('.chat-empty');
        if (emptyState) {
            emptyState.remove();
        }

        // Get existing message IDs to avoid duplicates
        const existingMessages = new Set(
            Array.from(container.querySelectorAll('.message')).map(el => el.dataset.messageId)
        );

        // Only add new messages (don't re-render everything)
        this.messages.forEach((msg, index) => {
            const messageId = `${msg.created_at}_${msg.username}_${index}`;
            
            // Skip if message already exists
            if (existingMessages.has(messageId)) {
                return;
            }

            const isOwn = msg.username === this.username;
            const messageEl = document.createElement('div');
            messageEl.className = `message ${isOwn ? 'own' : 'other'}`;
            messageEl.dataset.messageId = messageId;

            const time = new Date(msg.created_at).toLocaleTimeString('de-DE', {
                hour: '2-digit',
                minute: '2-digit'
            });

            let contentHTML = '';
            
            // Add file if present
            if (msg.file_url) {
                const safeUrl = this.escapeHtml(msg.file_url);
                if (msg.file_type === 'image') {
                    contentHTML += `
                        <div class="message-image">
                            <img src="${safeUrl}" alt="${this.escapeHtml(msg.file_name)}" 
                                 onclick="window.open('${safeUrl}', '_blank')"
                                 style="max-width: 300px; max-height: 300px; border-radius: 8px; cursor: pointer;">
                        </div>
                    `;
                } else {
                    contentHTML += `
                        <div class="message-file">
                            <a href="${safeUrl}" target="_blank" class="file-link">
                                📄 ${this.escapeHtml(msg.file_name)}
                            </a>
                        </div>
                    `;
                }
            }
            
            // Add text message if present
            if (msg.message) {
                contentHTML += `<div class="message-bubble">${this.escapeHtml(msg.message)}</div>`;
            }

            messageEl.innerHTML = `
                <div class="message-header">${this.escapeHtml(msg.username)}</div>
                ${contentHTML}
                <div class="message-time">${time}</div>
            `;

            container.appendChild(messageEl);
        });
    }

    scrollToBottom() {
        const container = document.getElementById('chatMessages');
        setTimeout(() => {
            container.scrollTop = container.scrollHeight;
        }, 100);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    startPolling() {
        // Clear any existing interval
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }
        
        // Initial load to set baseline
        this.loadMessages();
        
        // Poll for new messages every 3 seconds
        this.pollingInterval = setInterval(() => {
            this.loadMessages();
        }, 3000);
    }
}

// Global instance
let luxuryChat = null;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Chat will be initialized by easter-egg.js when unlocked
    });
}
