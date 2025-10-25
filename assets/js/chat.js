// Premium Luxury Chat System
class LuxuryChat {
    constructor() {
        this.userEmail = null;
        this.username = null;
        this.messages = [];
        this.isOpen = false;
        this.lastMessageCount = 0;
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
                            <button class="chat-close" id="chatCloseBtn">×</button>
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
            let particleInterval = setInterval(() => {
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
                clearInterval(particleInterval);
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
        
        // Restore the eye
        const easterEggContainer = document.querySelector('.easter-egg-container');
        if (easterEggContainer) {
            easterEggContainer.style.opacity = '1';
            easterEggContainer.style.pointerEvents = 'auto';
        }
    }

    async sendMessage(fileUrl = null, fileName = null, fileType = null) {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();

        if (!message && !fileUrl) return;

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
            const response = await fetch(`/api/chat?email=${this.userEmail}`);
            const data = await response.json();

            if (data.messages) {
                const newMessageCount = data.messages.length;
                
                // Check if new messages arrived while chat is closed
                if (!this.isOpen && this.lastMessageCount > 0 && newMessageCount > this.lastMessageCount) {
                    this.triggerEyeBlink();
                }
                
                // Check if new messages arrived while chat is open
                const hasNewMessages = newMessageCount > this.lastMessageCount;
                
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
                if (msg.file_type === 'image') {
                    contentHTML += `
                        <div class="message-image">
                            <img src="${msg.file_url}" alt="${this.escapeHtml(msg.file_name)}" 
                                 onclick="window.open('${msg.file_url}', '_blank')"
                                 style="max-width: 300px; max-height: 300px; border-radius: 8px; cursor: pointer;">
                        </div>
                    `;
                } else {
                    contentHTML += `
                        <div class="message-file">
                            <a href="${msg.file_url}" target="_blank" class="file-link">
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
        // Initial load to set baseline
        this.loadMessages();
        
        // Poll for new messages every 3 seconds
        setInterval(() => {
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
