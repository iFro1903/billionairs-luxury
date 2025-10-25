// Premium Luxury Chat System
class LuxuryChat {
    constructor() {
        this.userEmail = null;
        this.username = null;
        this.messages = [];
        this.isOpen = false;
    }

    init(userEmail) {
        this.userEmail = userEmail;
        this.generateUsername();
        this.createChatUI();
        this.startPolling();
    }

    generateUsername() {
        // Generate "Titan #XXXX" username based on user ID or random
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        this.username = `Titan #${randomNum}`;
    }

    createChatUI() {
        const chatHTML = `
            <div class="chat-overlay" id="chatOverlay">
                <div class="chat-container">
                    <div class="chat-header">
                        <div>
                            <div class="chat-title">THE INNER CIRCLE</div>
                            <div class="chat-subtitle">TITANS ONLY</div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 1.5rem;">
                            <div class="chat-online-count">
                                <div class="chat-online-dot"></div>
                                <span id="onlineCount">1</span> Online
                            </div>
                            <button class="chat-close" onclick="luxuryChat.close()">×</button>
                        </div>
                    </div>
                    
                    <div class="chat-messages" id="chatMessages">
                        <div class="chat-empty">
                            <div class="chat-empty-icon">💬</div>
                            <div class="chat-empty-text">Welcome, ${this.username}</div>
                            <div class="chat-empty-subtext">You've unlocked The Inner Circle.<br>Share wisdom with fellow Titans.</div>
                        </div>
                    </div>
                    
                    <div class="chat-input-container">
                        <input 
                            type="text" 
                            class="chat-input" 
                            id="chatInput" 
                            placeholder="Share your thoughts..."
                            maxlength="500"
                        />
                        <button class="chat-send-btn" onclick="luxuryChat.sendMessage()">
                            ➤
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', chatHTML);

        // Enter key to send
        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
    }

    open() {
        // Get the existing eye element
        const existingEye = document.querySelector('.easter-egg-container .eye');
        
        if (existingEye) {
            // Clone the existing eye to animate it
            const eyeClone = existingEye.cloneNode(true);
            const easterEggContainer = document.querySelector('.easter-egg-container');
            const rect = easterEggContainer.getBoundingClientRect();
            
            // Position clone at same position as original
            eyeClone.style.position = 'fixed';
            eyeClone.style.top = rect.top + 'px';
            eyeClone.style.right = (window.innerWidth - rect.right) + 'px';
            eyeClone.style.zIndex = '9998';
            eyeClone.style.width = '80px';
            eyeClone.style.height = '80px';
            eyeClone.classList.add('eye-closing');
            
            document.body.appendChild(eyeClone);
            
            // Hide original eye
            easterEggContainer.style.opacity = '0';
            easterEggContainer.style.pointerEvents = 'none';
            
            // Start traveling to center after eyelids close
            setTimeout(() => {
                eyeClone.classList.add('traveling');
            }, 600);
            
            // Remove clone after it reaches center
            setTimeout(() => eyeClone.remove(), 2200);
        }

        // Phase 2: Light beam trail during travel
        setTimeout(() => {
            const beam = document.createElement('div');
            beam.className = 'eye-beam';
            document.body.appendChild(beam);
            
            setTimeout(() => beam.remove(), 2200);
        }, 600);

        // Phase 3: Eye opening in center with aura
        setTimeout(() => {
            // Aura background
            const aura = document.createElement('div');
            aura.className = 'eye-center-aura';
            document.body.appendChild(aura);
            
            // Eye element
            const eyeCenter = document.createElement('div');
            eyeCenter.className = 'eye-center';
            eyeCenter.innerHTML = '<img src="assets/images/eye-simple.svg" style="width: 100%; height: 100%; position: relative; z-index: 2;">';
            document.body.appendChild(eyeCenter);
            
            setTimeout(() => {
                aura.remove();
                eyeCenter.remove();
            }, 2500);
        }, 2200);

        // Phase 4: Premium light explosion
        setTimeout(() => {
            const explosion = document.createElement('div');
            explosion.className = 'light-explosion';
            document.body.appendChild(explosion);
            
            setTimeout(() => explosion.remove(), 2000);
        }, 4500);

        // Phase 5: Chat reveal with premium fade
        setTimeout(() => {
            const overlay = document.getElementById('chatOverlay');
            overlay.classList.add('show');
            this.isOpen = true;
            this.loadMessages();
            this.scrollToBottom();
        }, 4700);
    }

    close() {
        const overlay = document.getElementById('chatOverlay');
        overlay.classList.remove('show');
        this.isOpen = false;
    }

    async sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();

        if (!message) return;

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: this.userEmail,
                    username: this.username,
                    message: message
                })
            });

            if (response.ok) {
                input.value = '';
                await this.loadMessages();
                this.scrollToBottom();
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    }

    async loadMessages() {
        try {
            const response = await fetch(`/api/chat?email=${this.userEmail}`);
            const data = await response.json();

            if (data.messages) {
                this.messages = data.messages;
                this.renderMessages();
            }

            if (data.onlineCount) {
                document.getElementById('onlineCount').textContent = data.onlineCount;
            }
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    }

    renderMessages() {
        const container = document.getElementById('chatMessages');
        
        if (this.messages.length === 0) {
            return; // Keep empty state
        }

        // Remove empty state
        const emptyState = container.querySelector('.chat-empty');
        if (emptyState) {
            emptyState.remove();
        }

        // Clear and render all messages
        container.innerHTML = '';

        this.messages.forEach(msg => {
            const isOwn = msg.username === this.username;
            const messageEl = document.createElement('div');
            messageEl.className = `message ${isOwn ? 'own' : 'other'}`;

            const time = new Date(msg.created_at).toLocaleTimeString('de-DE', {
                hour: '2-digit',
                minute: '2-digit'
            });

            messageEl.innerHTML = `
                <div class="message-header">${msg.username}</div>
                <div class="message-bubble">${this.escapeHtml(msg.message)}</div>
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
        // Poll for new messages every 3 seconds
        setInterval(() => {
            if (this.isOpen) {
                this.loadMessages();
            }
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
