// BILLIONAIRS CEO Admin Panel
class AdminPanel {
    constructor() {
        this.ceoEmail = 'furkan_akaslan@hotmail.com';
        this.currentTab = 'users';
        this.init();
    }

    // Prevent XSS: escape user-supplied data before inserting into HTML
    escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // 365-day membership countdown timer (starts after payment)
    getMembershipTimer(paidAt, hasPaid, createdAt) {
        if (!hasPaid) return '<span style="color:#888; font-size:12px;">Not Paid</span>';
        
        // Use paid_at if available, otherwise fall back to created_at
        const startDate = paidAt ? new Date(paidAt) : (createdAt ? new Date(createdAt) : null);
        if (!startDate) return '<span style="color:#f39c12; font-size:12px;">Paid (no date)</span>';
        const expiresAt = new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000);
        const now = new Date();
        const diffMs = expiresAt - now;
        
        if (diffMs <= 0) {
            return '<span style="color:#e74c3c; font-weight:600;">⛔ EXPIRED</span>';
        }
        
        const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        // Color: green > 180d, yellow > 30d, red <= 30d
        let color = '#2ecc71';
        if (totalDays <= 30) color = '#e74c3c';
        else if (totalDays <= 180) color = '#f39c12';
        
        // Progress bar (365 = 100%)
        const percent = Math.round((totalDays / 365) * 100);
        
        return `
            <div style="min-width:140px;">
                <div style="font-size:13px; font-weight:700; color:${color}; margin-bottom:4px;">
                    ${totalDays}d ${hours}h ${minutes}m
                </div>
                <div style="background:rgba(255,255,255,0.1); border-radius:4px; height:6px; overflow:hidden;">
                    <div style="width:${percent}%; height:100%; background:${color}; border-radius:4px; transition:width 0.3s;"></div>
                </div>
                <div style="font-size:10px; color:#888; margin-top:2px;">${percent}% remaining</div>
            </div>
        `;
    }

    init() {
        // Check if already logged in
        const adminSession = sessionStorage.getItem('adminSession');
        if (adminSession) {
            const data = JSON.parse(adminSession);
            if (data.email === this.ceoEmail) {
                this.showDashboard(data.email);
                return;
            }
        }

        // Setup login form
        document.getElementById('adminLoginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
    }

    async handleLogin() {
        const email = document.getElementById('adminEmail').value.toLowerCase().trim();
        const password = document.getElementById('adminPassword').value;
        const errorDiv = document.getElementById('loginError');

        // Check if CEO email
        if (email !== this.ceoEmail) {
            errorDiv.textContent = 'Access Denied: CEO Only';
            errorDiv.classList.add('show');
            return;
        }

        try {
            // Verify with database
            const response = await fetch('/api/admin-auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Check if 2FA is required
                if (data.requiresTwoFactor) {
                    this.show2FAPrompt(email, password);
                    return;
                }

                // Store credentials in sessionStorage (for 2FA operations)
                sessionStorage.setItem('adminSession', JSON.stringify({ 
                    email: data.email, 
                    password: password // Needed for 2FA API calls
                }));
                this.showDashboard(data.email);
            } else {
                // Show specific error message from server
                if (response.status === 429) {
                    errorDiv.textContent = data.error || '⚠️ Too many login attempts. Please wait 1 minute and try again.';
                } else if (response.status === 403) {
                    errorDiv.textContent = data.error || '🚫 IP address blocked';
                } else {
                    errorDiv.textContent = data.error || 'Invalid credentials';
                }
                errorDiv.classList.add('show');
            }
        } catch (error) {
            console.error('Login error:', error);
            errorDiv.textContent = 'Login failed. Please try again.';
            errorDiv.classList.add('show');
        }
    }

    showDashboard(email) {
        document.getElementById('adminLogin').classList.add('hidden');
        document.getElementById('adminDashboard').classList.remove('hidden');
        document.getElementById('adminUserName').textContent = email;

        // Setup navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchTab(btn.dataset.tab);
            });
        });

        // Setup logout
        document.getElementById('adminLogout').addEventListener('click', () => {
            sessionStorage.removeItem('adminSession');
            location.reload();
        });

        // Setup export buttons
        this.setupExportButtons();

        // Setup broadcast notification button
        this.setupBroadcastButton();

        // Setup emergency button
        document.getElementById('emergencyBtn').addEventListener('click', () => {
            this.toggleEmergencyMode();
        });

        // Setup delete all users button
        const deleteAllBtn = document.getElementById('deleteAllUsersBtn');
        if (deleteAllBtn) {
            deleteAllBtn.addEventListener('click', () => {
                this.deleteAllUsers();
            });
        }

        // Setup create test users button
        const createTestBtn = document.getElementById('createTestUsersBtn');
        if (createTestBtn) {
            createTestBtn.addEventListener('click', () => {
                this.createTestUsers();
            });
        }

        // Setup bulk Easter Egg controls
        this.setupBulkEasterEggControls();

        // Setup create member form
        const createMemberForm = document.getElementById('createMemberForm');
        if (createMemberForm) {
            createMemberForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createMember();
            });
        }

        // Check emergency mode status
        this.checkEmergencyMode();

        // Load initial data
        this.loadUsersData();
        this.loadChatData();
        this.loadStatsData();
        this.loadEnhancedAnalytics(); // Load enhanced analytics dashboard
    }

    async checkEmergencyMode() {
        try {
            const response = await fetch('/api/check-emergency');
            const data = await response.json();
            this.updateEmergencyButton(data.isActive);
        } catch (error) {
            console.error('Error checking emergency mode:', error);
        }
    }

    updateEmergencyButton(isActive) {
        const btn = document.getElementById('emergencyBtn');
        const text = btn.querySelector('.emergency-text');
        
        btn.dataset.active = isActive;
        text.textContent = isActive ? 'Emergency Mode: ACTIVE' : 'Emergency Mode: OFF';
    }

    async toggleEmergencyMode() {
        const btn = document.getElementById('emergencyBtn');
        const isCurrentlyActive = btn.dataset.active === 'true';
        
        const action = isCurrentlyActive ? 'deactivate' : 'activate';
        const confirmMsg = isCurrentlyActive 
            ? '🟢 Bring website ONLINE?\n\nAll users will regain access.'
            : '🚨 EMERGENCY SHUTDOWN?\n\nThis will show 404 to ALL users!\nOnly you can restore access.\n\nConfirm?';
        
        if (!confirm(confirmMsg)) return;

        try {
            const response = await fetch('/api/admin-emergency', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: this.ceoEmail,
                    mode: action
                })
            });

            if (response.ok) {
                this.updateEmergencyButton(!isCurrentlyActive);
                alert(isCurrentlyActive 
                    ? '✅ Website is now ONLINE' 
                    : '🚨 EMERGENCY MODE ACTIVE\n\nWebsite is now showing 404 to all users.'
                );
            } else {
                alert('Failed to toggle emergency mode');
            }
        } catch (error) {
            console.error('Error toggling emergency mode:', error);
            alert('Error occurred');
        }
    }

    switchTab(tabName) {
        this.currentTab = tabName;

        // Update nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update content - Handle both naming conventions
        document.querySelectorAll('.tab-content').forEach(content => {
            const matchesOldStyle = content.id === `tab-${tabName}`;
            const matchesNewStyle = content.id === `${tabName}Tab`;
            content.classList.toggle('active', matchesOldStyle || matchesNewStyle);
        });

        // Load tab-specific data
        if (tabName === 'users') this.loadUsersData();
        if (tabName === 'easter-eggs') this.loadUsersData();
        if (tabName === 'chat') this.loadChatData();
        if (tabName === 'payments') this.loadPaymentsData();
        if (tabName === 'stats') this.loadStatsData();
        if (tabName === 'security') this.loadSecurityTab();
        if (tabName === 'audit') this.loadAuditTab();
    }

    async loadUsersData() {
        try {
            const adminSession = JSON.parse(sessionStorage.getItem('adminSession'));
            const response = await fetch('/api/admin-users', {
                headers: {
                    'X-Admin-Email': adminSession.email,
                    'X-Admin-Password': adminSession.password
                }
            });
            const data = await response.json();

            // Update stats
            document.getElementById('totalUsers').textContent = data.total || 0;
            document.getElementById('paidUsers').textContent = data.paid || 0;
            document.getElementById('activeUsers').textContent = data.active || 0;

            // Populate table
            const tbody = document.getElementById('usersTableBody');
            tbody.innerHTML = '';

            data.users.forEach(user => {
                const safeEmail = this.escapeHtml(user.email);
                const safeName = this.escapeHtml(user.name || 'N/A');
                const timerHtml = this.getMembershipTimer(user.paid_at, user.has_paid, user.created_at);
                const currentStatus = user.has_paid ? 'paid' : (user.payment_status || 'free');
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${safeEmail}</td>
                    <td>${safeName}</td>
                    <td>${new Date(user.created_at).toLocaleDateString()}</td>
                    <td>${timerHtml}</td>
                    <td>
                        <select class="status-select status-${currentStatus}" onchange="adminPanel.updateMemberStatus('${safeEmail}', this.value, this)" style="
                            background: ${currentStatus === 'paid' ? 'rgba(76,175,80,0.2)' : currentStatus === 'pending' ? 'rgba(243,156,18,0.2)' : 'rgba(220,53,69,0.2)'};
                            color: ${currentStatus === 'paid' ? '#4CAF50' : currentStatus === 'pending' ? '#f39c12' : '#DC3545'};
                            border: 1px solid ${currentStatus === 'paid' ? '#4CAF50' : currentStatus === 'pending' ? '#f39c12' : '#DC3545'};
                            border-radius: 20px; padding: 4px 12px; font-size: 12px; font-weight: 600;
                            cursor: pointer; outline: none; text-transform: uppercase; letter-spacing: 0.5px;
                        ">
                            <option value="paid" ${currentStatus === 'paid' ? 'selected' : ''}>✅ Paid</option>
                            <option value="pending" ${currentStatus === 'pending' ? 'selected' : ''}>⏳ Pending</option>
                            <option value="free" ${currentStatus === 'free' ? 'selected' : ''}>🆓 Free</option>
                        </select>
                    </td>
                    <td>
                        ${user.pyramid_unlocked ? '🔓' : '🔒'} Pyramid
                        ${user.eye_unlocked ? '🔓' : '🔒'} Eye
                        ${user.chat_ready ? '🔓' : '🔒'} Chat
                        ${user.is_blocked ? '🚫 Blocked' : ''}
                    </td>
                    <td>
                        <button class="action-btn" onclick="adminPanel.viewUser('${safeEmail}')">View</button>
                        ${user.is_blocked 
                            ? `<button class="action-btn success" onclick="adminPanel.unblockUser('${safeEmail}')">Unblock</button>`
                            : `<button class="action-btn warning" onclick="adminPanel.blockUser('${safeEmail}')">Block</button>`
                        }
                        <button class="action-btn danger" onclick="adminPanel.deleteUser('${safeEmail}')">Delete</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            // Populate user select for easter eggs
            this.renderIndividualUserControls(data.users);

        } catch (error) {
            console.error('Error loading users:', error);
            // Show error in UI
            const container = document.getElementById('individualUserControls');
            if (container) {
                container.innerHTML = `<p style="color: #e74c3c; text-align: center; padding: 2rem;">Error loading members: ${error.message}. Please reload the page.</p>`;
            }
        }
    }

    renderIndividualUserControls(users) {
        const container = document.getElementById('individualUserControls');
        if (!container) return;

        container.innerHTML = '';

        // Filter out CEO
        const regularUsers = users.filter(u => u.email !== this.ceoEmail);

        // Update member count
        const countEl = document.getElementById('memberCount');
        if (countEl) countEl.textContent = `${regularUsers.length} Members`;

        if (regularUsers.length === 0) {
            container.innerHTML = '<p style="color: #999; text-align: center; padding: 2rem;">No members found</p>';
            return;
        }

        const now = Date.now();
        const fiveMinMs = 5 * 60 * 1000;

        regularUsers.forEach(user => {
            const safeEmail = this.escapeHtml(user.email);
            const safeName = this.escapeHtml(user.full_name || user.name || '');
            const displayName = safeName || safeEmail.split('@')[0];
            
            // Online status (active in last 5 min)
            const lastSeen = user.last_seen ? new Date(user.last_seen) : null;
            const isOnline = lastSeen && (now - lastSeen.getTime()) < fiveMinMs;
            const lastSeenText = lastSeen ? this.formatTimeAgo(lastSeen) : 'Never';
            
            // Payment info
            const paidAt = user.paid_at ? new Date(user.paid_at) : null;
            const paidAtText = paidAt ? paidAt.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + paidAt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '—';
            const registeredAt = user.created_at ? new Date(user.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

            const card = document.createElement('div');
            card.className = 'user-control-card';
            card.dataset.userEmail = user.email.toLowerCase();
            card.dataset.userName = (user.full_name || user.name || '').toLowerCase();
            
            card.innerHTML = `
                <div class="user-control-header" style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 8px;">
                    <div style="flex: 1; min-width: 200px;">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                            <span style="width: 10px; height: 10px; border-radius: 50%; background: ${isOnline ? '#2ecc71' : '#555'}; display: inline-block; flex-shrink: 0; box-shadow: ${isOnline ? '0 0 8px rgba(46,204,113,0.6)' : 'none'};"></span>
                            <span style="font-weight: 600; font-size: 15px; color: #E8B4A0;">${displayName}</span>
                            ${isOnline ? '<span style="font-size: 10px; color: #2ecc71; text-transform: uppercase; letter-spacing: 1px;">ONLINE</span>' : ''}
                        </div>
                        <div class="user-control-email" style="font-size: 12px; color: #888; margin-left: 18px;">${safeEmail}</div>
                    </div>
                    <span class="user-control-status ${user.has_paid ? 'paid' : 'free'}" style="flex-shrink: 0;">
                        ${user.has_paid ? '💎 Paid' : '🆓 Free'}
                    </span>
                </div>

                <!-- Member Info Grid -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 8px; margin: 12px 0; padding: 10px; background: rgba(255,255,255,0.02); border-radius: 8px; border: 1px solid rgba(232,180,160,0.08);">
                    <div style="text-align: center;">
                        <div style="font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 3px;">Registered</div>
                        <div style="font-size: 13px; color: #ccc;">${registeredAt}</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 3px;">Last Login</div>
                        <div style="font-size: 13px; color: ${isOnline ? '#2ecc71' : '#ccc'};">${lastSeenText}</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 3px;">Payment</div>
                        <div style="font-size: 13px; color: ${paidAt ? '#2ecc71' : '#e74c3c'};">${paidAtText}</div>
                    </div>
                </div>

                <div class="easter-egg-features">
                    <!-- Eye Control -->
                    <div class="feature-control">
                        <div class="feature-control-header">
                            <span class="feature-name">👁️ Eye</span>
                            <div class="feature-status">
                                <span class="status-indicator ${user.eye_unlocked ? 'unlocked' : 'locked'}"></span>
                                <span class="status-text">${user.eye_unlocked ? 'Unlocked' : 'Locked'}</span>
                            </div>
                        </div>
                        <div class="feature-buttons">
                            <button class="feature-toggle-btn unlock" 
                                    onclick="adminPanel.toggleFeature('${safeEmail}', 'eye', true)"
                                    ${user.eye_unlocked ? 'disabled' : ''}>
                                ✅ Unlock
                            </button>
                            <button class="feature-toggle-btn lock" 
                                    onclick="adminPanel.toggleFeature('${safeEmail}', 'eye', false)"
                                    ${!user.eye_unlocked ? 'disabled' : ''}>
                                🔒 Lock
                            </button>
                        </div>
                    </div>

                    <!-- Chat Control -->
                    <div class="feature-control">
                        <div class="feature-control-header">
                            <span class="feature-name">💬 Chat</span>
                            <div class="feature-status">
                                <span class="status-indicator ${user.chat_ready || user.chat_unlocked ? 'unlocked' : 'locked'}"></span>
                                <span class="status-text">${user.chat_ready || user.chat_unlocked ? 'Unlocked' : 'Locked'}</span>
                            </div>
                        </div>
                        <div class="feature-buttons">
                            <button class="feature-toggle-btn unlock" 
                                    onclick="adminPanel.toggleFeature('${safeEmail}', 'chat', true)"
                                    ${user.chat_ready || user.chat_unlocked ? 'disabled' : ''}>
                                ✅ Unlock
                            </button>
                            <button class="feature-toggle-btn lock" 
                                    onclick="adminPanel.toggleFeature('${safeEmail}', 'chat', false)"
                                    ${!(user.chat_ready || user.chat_unlocked) ? 'disabled' : ''}>
                                🔒 Lock
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            container.appendChild(card);
        });

        // Setup search functionality
        const searchInput = document.getElementById('easterEggUserSearch');
        if (searchInput) {
            // Remove old listener by cloning
            const newInput = searchInput.cloneNode(true);
            searchInput.parentNode.replaceChild(newInput, searchInput);
            
            newInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                const cards = container.querySelectorAll('.user-control-card');
                let visible = 0;
                
                cards.forEach(card => {
                    const email = card.dataset.userEmail;
                    const name = card.dataset.userName;
                    const matches = email.includes(searchTerm) || name.includes(searchTerm);
                    card.style.display = matches ? 'block' : 'none';
                    if (matches) visible++;
                });

                if (countEl) countEl.textContent = searchTerm ? `${visible} / ${regularUsers.length} Members` : `${regularUsers.length} Members`;
            });
        }
    }

    formatTimeAgo(date) {
        const now = Date.now();
        const diff = now - date.getTime();
        const mins = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    async createMember() {
        const email = document.getElementById('newMemberEmail').value.trim().toLowerCase();
        const password = document.getElementById('newMemberPassword').value;
        const fullName = document.getElementById('newMemberName').value.trim();
        const markAsPaid = document.getElementById('newMemberPaid').checked;
        const resultDiv = document.getElementById('createMemberResult');

        if (!email || !password) {
            resultDiv.innerHTML = '<span style="color: #e74c3c;">❌ Email and password required</span>';
            return;
        }

        if (password.length < 8) {
            resultDiv.innerHTML = '<span style="color: #e74c3c;">❌ Password must be at least 8 characters</span>';
            return;
        }

        resultDiv.innerHTML = '<span style="color: #E8B4A0;">⏳ Creating member...</span>';

        try {
            const adminSession = JSON.parse(sessionStorage.getItem('adminSession'));

            const response = await fetch('/api/admin-create-member', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-Email': adminSession.email,
                    'X-Admin-Password': adminSession.password
                },
                body: JSON.stringify({ email, password, fullName, markAsPaid })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                resultDiv.innerHTML = `<span style="color: #2ecc71;">✅ ${this.escapeHtml(data.message)} (${data.member.memberId})</span>`;
                // Clear form
                document.getElementById('newMemberEmail').value = '';
                document.getElementById('newMemberPassword').value = '';
                document.getElementById('newMemberName').value = '';
                // Refresh user list
                this.loadUsersData();
            } else {
                resultDiv.innerHTML = `<span style="color: #e74c3c;">❌ ${this.escapeHtml(data.error || 'Failed to create member')}</span>`;
            }
        } catch (error) {
            console.error('Create member error:', error);
            resultDiv.innerHTML = '<span style="color: #e74c3c;">❌ Connection error. Please try again.</span>';
        }
    }

    async toggleFeature(email, feature, unlock) {
        const action = unlock ? 'unlock' : 'lock';
        const featureNames = { pyramid: 'Pyramid 🔺', eye: 'Eye 👁️', chat: 'Chat 💬' };

        try {
            const adminSession = JSON.parse(sessionStorage.getItem('adminSession'));
            
            console.log('Sending toggle request:', { action, feature, email, adminEmail: adminSession.email });
            
            const response = await fetch('/api/admin-toggle-easter-eggs', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminSession.email}`
                },
                body: JSON.stringify({ 
                    action: unlock ? 'unlock' : 'lock',
                    feature,
                    email
                })
            });

            const data = await response.json();
            console.log('Toggle response:', data);

            if (response.ok) {
                // Refresh user list to show updated status
                this.loadUsersData();
            } else {
                console.error('Toggle failed:', response.status, data);
                alert(`❌ Error: ${data.error || 'Failed to toggle feature'}\n\nDetails: ${data.details || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Toggle feature error:', error);
            alert('❌ An error occurred. Please try again.');
        }
    }

    // Legacy function - no longer used with new individual user controls
    async loadEasterEggData() {
        // This function is deprecated - individual user controls are now rendered 
        // automatically in renderIndividualUserControls() called from loadUsersData()
        console.log('ℹ️ loadEasterEggData is deprecated - using renderIndividualUserControls instead');
    }

    setupBulkEasterEggControls() {
        // Setup bulk unlock buttons
        document.querySelectorAll('.bulk-unlock-btn, .bulk-lock-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action; // 'unlock-all' or 'lock-all'
                const feature = btn.dataset.feature; // 'pyramid', 'eye', 'chat', or 'all'
                this.handleBulkAction(action, feature);
            });
        });
    }

    async handleBulkAction(action, feature) {
        const featureNames = {
            'pyramid': 'Pyramid 🔺',
            'eye': 'Eye 👁️',
            'chat': 'Chat 💬',
            'all': 'All Features 🎯'
        };

        const actionText = action === 'unlock-all' ? 'UNLOCK' : 'LOCK';
        const confirmMsg = `⚠️ ${actionText} ${featureNames[feature]} for ALL members?\n\nThis will affect all users except the CEO.\n\nConfirm?`;

        if (!confirm(confirmMsg)) return;

        try {
            const adminSession = JSON.parse(sessionStorage.getItem('adminSession'));
            
            const response = await fetch('/api/admin-toggle-easter-eggs', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminSession.email}`
                },
                body: JSON.stringify({ 
                    action,
                    feature
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert(`✅ Success!\n\n${data.message}\n${data.affectedUsers} users affected.`);
                // Reload user data to show updated status
                this.loadUsersData();
            } else {
                alert(`❌ Error: ${data.error || 'Failed to perform action'}`);
            }
        } catch (error) {
            console.error('Bulk action error:', error);
            alert('❌ An error occurred. Please try again.');
        }
    }

    async handleIndividualToggle(email, type) {
        if (type === 'reset') {
            if (!confirm(`Reset all Easter Eggs for ${email}?`)) return;
            // Handle reset logic (lock all features for this user)
            await this.handleBulkToggleForUser(email, 'lock-all', 'all');
            return;
        }

        if (!confirm(`Toggle ${type} for ${email}?`)) return;

        try {
            const adminSession = JSON.parse(sessionStorage.getItem('adminSession'));
            
            const response = await fetch('/api/admin-toggle-easter-eggs', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminSession.email}`
                },
                body: JSON.stringify({ 
                    action: 'toggle',
                    feature: type,
                    email
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert(`✅ ${data.message}`);
                this.loadUsersData();
            } else {
                alert(`❌ Error: ${data.error || 'Failed to toggle feature'}`);
            }
        } catch (error) {
            console.error('Toggle error:', error);
            alert('❌ An error occurred. Please try again.');
        }
    }

    async handleUnlock(email, type) {
        if (!confirm(`Unlock ${type} for ${email}?`)) return;

        try {
            const response = await fetch('/api/admin-unlock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, unlock: type })
            });

            if (response.ok) {
                alert(`Successfully unlocked ${type} for ${email}`);
                this.loadUsersData();
            } else {
                alert('Failed to unlock. Please try again.');
            }
        } catch (error) {
            console.error('Error unlocking:', error);
            alert('Error occurred. Please try again.');
        }
    }

    async loadChatData() {
        try {
            const response = await fetch('/api/chat?ceo=true');
            
            if (!response.ok) {
                console.error('Chat API error:', response.status);
                return;
            }
            
            const data = await response.json();

            // Check if messages exist
            if (!data.messages || !Array.isArray(data.messages)) {
                console.error('Invalid chat data:', data);
                document.getElementById('totalMessages').textContent = '0';
                document.getElementById('todayMessages').textContent = '0';
                document.getElementById('chatUsers').textContent = '0';
                return;
            }

            // Update stats
            document.getElementById('totalMessages').textContent = data.messages.length;
            
            const today = new Date().toDateString();
            const todayCount = data.messages.filter(m => 
                new Date(m.created_at).toDateString() === today
            ).length;
            document.getElementById('todayMessages').textContent = todayCount;

            const uniqueUsers = new Set(data.messages.map(m => m.email)).size;
            document.getElementById('chatUsers').textContent = uniqueUsers;

            // Display messages
            const container = document.getElementById('adminChatMessages');
            container.innerHTML = '';

            data.messages.reverse().forEach(msg => {
                const div = document.createElement('div');
                div.className = 'admin-message';
                div.innerHTML = `
                    <div class="msg-header">
                        <strong>${msg.username}</strong>
                        <span>${msg.email}</span>
                        <span>${new Date(msg.created_at).toLocaleString()}</span>
                    </div>
                    <div class="msg-content">${msg.message || '[File]'}</div>
                    <button class="delete-msg-btn" onclick="adminPanel.deleteMessage(${msg.id})">Delete</button>
                `;
                container.appendChild(div);
            });

        } catch (error) {
            console.error('Error loading chat:', error);
        }
    }

    async deleteMessage(messageId) {
        if (!confirm('Delete this message?')) return;

        try {
            const response = await fetch(`/api/admin-delete-message`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messageId })
            });

            if (response.ok) {
                this.loadChatData();
            }
        } catch (error) {
            console.error('Error deleting message:', error);
        }
    }

    async loadPaymentsData() {
        try {
            const adminSession = JSON.parse(sessionStorage.getItem('adminSession'));
            const response = await fetch('/api/admin-payments', {
                headers: {
                    'X-Admin-Email': adminSession.email,
                    'X-Admin-Password': adminSession.password
                }
            });
            const data = await response.json();

            // Format revenue with thousand separators
            const formatCHF = (amount) => {
                return new Intl.NumberFormat('de-CH', { 
                    style: 'currency', 
                    currency: 'CHF',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                }).format(amount);
            };

            document.getElementById('totalRevenue').textContent = formatCHF(data.totalRevenue || 0);
            document.getElementById('stripePayments').textContent = data.stripeCount || 0;
            document.getElementById('cryptoPayments').textContent = data.cryptoCount || 0;

            // Populate payments table
            const tbody = document.getElementById('paymentsTableBody');
            tbody.innerHTML = '';

            if (data.payments && data.payments.length > 0) {
                data.payments.forEach(payment => {
                    const tr = document.createElement('tr');
                    const canRefund = payment.status === 'paid' && (payment.method === 'stripe' || payment.method === 'credit_card');
                    
                    tr.innerHTML = `
                        <td>${new Date(payment.created_at).toLocaleDateString('de-CH')}</td>
                        <td>${payment.email}</td>
                        <td>${formatCHF(payment.amount)}</td>
                        <td><span class="payment-method-badge ${payment.method}">${payment.method}</span></td>
                        <td><span class="status-badge ${payment.status === 'refunded' ? 'refunded' : 'paid'}">${payment.status}</span></td>
                        <td>
                            <span style="color: #888; font-size: 12px;">—</span>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
            } else {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #888;">No payments yet</td></tr>';
            }

        } catch (error) {
            console.error('Error loading payments:', error);
            document.getElementById('totalRevenue').textContent = 'CHF 0';
            document.getElementById('stripePayments').textContent = '0';
            document.getElementById('cryptoPayments').textContent = '0';
        }
    }

    async loadStatsData() {
        try {
            const adminSession = JSON.parse(sessionStorage.getItem('adminSession'));
            const response = await fetch('/api/admin-stats', {
                headers: {
                    'X-Admin-Email': adminSession.email,
                    'X-Admin-Password': adminSession.password
                }
            });
            const data = await response.json();

            document.getElementById('statsRegistered').textContent = data.registered || 0;
            document.getElementById('statsPaid').textContent = data.paid || 0;
            document.getElementById('statsPyramid').textContent = data.pyramid || 0;
            document.getElementById('statsEye').textContent = data.eye || 0;
            document.getElementById('statsChat').textContent = data.chat || 0;

        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    viewUser(email) {
        alert(`Viewing user: ${email}\n\n(Full user details coming soon)`);
    }

    async updateMemberStatus(email, newStatus, selectEl) {
        const statusLabels = { paid: 'Paid', pending: 'Pending', free: 'Free' };
        if (!confirm(`Status von ${email} auf "${statusLabels[newStatus]}" ändern?`)) {
            // Revert dropdown
            this.loadUsersData();
            return;
        }

        try {
            const adminSession = JSON.parse(sessionStorage.getItem('adminSession'));
            const response = await fetch('/api/admin-update-status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-Email': adminSession.email,
                    'X-Admin-Password': adminSession.password
                },
                body: JSON.stringify({ email, status: newStatus })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Update dropdown styling
                const colors = {
                    paid: { bg: 'rgba(76,175,80,0.2)', color: '#4CAF50', border: '#4CAF50' },
                    pending: { bg: 'rgba(243,156,18,0.2)', color: '#f39c12', border: '#f39c12' },
                    free: { bg: 'rgba(220,53,69,0.2)', color: '#DC3545', border: '#DC3545' }
                };
                const c = colors[newStatus];
                selectEl.style.background = c.bg;
                selectEl.style.color = c.color;
                selectEl.style.borderColor = c.border;

                alert(`✅ ${email} → ${statusLabels[newStatus]}`);
                // Reload to update timer
                this.loadUsersData();
            } else {
                alert(`❌ Error: ${data.error || 'Unknown error'}`);
                this.loadUsersData();
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('❌ Failed to update status');
            this.loadUsersData();
        }
    }

    async deleteUser(email) {
        if (!confirm(`Delete user ${email}? This cannot be undone!`)) return;

        try {
            const response = await fetch('/api/admin-delete-user', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();
            
            if (response.ok) {
                alert('User deleted successfully');
                this.loadUsersData();
            } else {
                console.error('Delete error:', data);
                alert(`Failed to delete user: ${data.error}\nDetails: ${data.details || 'No details'}`);
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            alert(`Error: ${error.message}`);
        }
    }

    show2FAPrompt(email, password) {
        const code = prompt('Enter your 6-digit 2FA code:');
        if (code) {
            this.verify2FAAndLogin(email, password, code);
        }
    }

    async verify2FAAndLogin(email, password, twoFactorCode) {
        try {
            const response = await fetch('/api/admin-auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, twoFactorCode })
            });

            const data = await response.json();

            if (response.ok) {
                sessionStorage.setItem('adminSession', JSON.stringify({ email: data.email }));
                this.showDashboard(data.email);
            } else {
                alert('Invalid 2FA code. Please try again.');
                this.show2FAPrompt(email, password);
            }
        } catch (error) {
            console.error('2FA verification error:', error);
            alert('2FA verification failed');
        }
    }

    // Security Tab Methods
    async loadSecurityTab() {
        await this.load2FAStatus();
        await this.loadBlockedIPs();
        await this.loadRateLimitStats();
        this.setup2FAHandlers();
        this.setupIPBlockingHandlers();
    }

    async load2FAStatus() {
        try {
            const session = JSON.parse(sessionStorage.getItem('adminSession'));
            const response = await fetch('/api/admin-2fa-setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: this.ceoEmail, 
                    password: session?.password || '',
                    action: 'status'
                })
            });

            // Check if 2FA is enabled (wenn DB-Abfrage fehlschlägt, disabled)
            const statusText = document.getElementById('2faStatusText');
            statusText.textContent = '2FA Status: Disabled';
            document.getElementById('enable2FA').classList.remove('hidden');
            document.getElementById('disable2FA').classList.add('hidden');
        } catch (error) {
            console.error('2FA status error:', error);
        }
    }

    setup2FAHandlers() {
        document.getElementById('enable2FA').addEventListener('click', () => this.start2FASetup());
        document.getElementById('disable2FA').addEventListener('click', () => this.disable2FA());
        document.getElementById('verify2FA').addEventListener('click', () => this.verify2FASetup());
    }

    async start2FASetup() {
        try {
            const session = JSON.parse(sessionStorage.getItem('adminSession'));
            const response = await fetch('/api/admin-2fa-setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: this.ceoEmail, 
                    password: session?.password || '',
                    action: 'generate'
                })
            });

            const data = await response.json();

            if (data.success) {
                // Zeige QR Code
                document.getElementById('twoFactorSetup').classList.remove('hidden');
                
                // Generiere QR Code
                new QRCode(document.getElementById('qrCodeCanvas'), {
                    text: data.qrCodeUrl,
                    width: 256,
                    height: 256
                });

                // Zeige Backup Codes
                const backupCodesDiv = document.getElementById('backupCodes');
                backupCodesDiv.style.display = 'block';
                const codesList = document.getElementById('backupCodesList');
                codesList.innerHTML = data.backupCodes.map(code => 
                    `<div class="backup-code">${code}</div>`
                ).join('');

                document.getElementById('enable2FA').classList.add('hidden');
            }
        } catch (error) {
            console.error('2FA setup error:', error);
            alert('Failed to start 2FA setup');
        }
    }

    async verify2FASetup() {
        const code = document.getElementById('verificationCode').value;
        
        if (!code || code.length !== 6) {
            alert('Please enter a valid 6-digit code');
            return;
        }

        try {
            const session = JSON.parse(sessionStorage.getItem('adminSession'));
            const response = await fetch('/api/admin-2fa-setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: this.ceoEmail, 
                    password: session?.password || '',
                    action: 'verify',
                    code
                })
            });

            const data = await response.json();

            if (data.success) {
                alert('2FA enabled successfully! Save your backup codes.');
                location.reload();
            } else {
                alert('Invalid code. Please try again.');
            }
        } catch (error) {
            console.error('2FA verify error:', error);
            alert('Verification failed');
        }
    }

    async disable2FA() {
        const code = prompt('Enter 2FA code or backup code to disable:');
        
        if (!code) return;

        try {
            const session = JSON.parse(sessionStorage.getItem('adminSession'));
            const response = await fetch('/api/admin-2fa-setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: this.ceoEmail, 
                    password: session?.password || '',
                    action: 'disable',
                    code
                })
            });

            const data = await response.json();

            if (data.success) {
                alert('2FA disabled');
                location.reload();
            } else {
                alert('Invalid code');
            }
        } catch (error) {
            console.error('2FA disable error:', error);
        }
    }

    setupIPBlockingHandlers() {
        document.getElementById('blockIpBtn').addEventListener('click', () => this.blockIP());
    }

    async blockIP() {
        const ip = document.getElementById('blockIpAddress').value.trim();
        const reason = document.getElementById('blockReason').value.trim();
        const duration = document.getElementById('blockDuration').value;

        if (!ip) {
            alert('Please enter an IP address');
            return;
        }

        try {
            const response = await fetch('/api/block-ip', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    ip, 
                    reason,
                    duration: duration ? parseInt(duration) : null,
                    adminEmail: this.ceoEmail
                })
            });

            const data = await response.json();

            if (data.success) {
                alert('IP blocked successfully');
                document.getElementById('blockIpAddress').value = '';
                document.getElementById('blockReason').value = '';
                this.loadBlockedIPs();
            } else {
                alert('Failed to block IP');
            }
        } catch (error) {
            console.error('Block IP error:', error);
        }
    }

    async loadBlockedIPs() {
        try {
            const response = await fetch('/api/admin-blocked-ips', {
                headers: { 'Authorization': 'Bearer admin' }
            });

            const data = await response.json();

            if (data.success) {
                const list = document.getElementById('blockedIpsList');
                
                if (data.blockedIps.length === 0) {
                    list.innerHTML = '<p style="color: #999; text-align: center; padding: 2rem;">No blocked IPs</p>';
                    return;
                }

                list.innerHTML = data.blockedIps.map(item => `
                    <div class="blocked-ip-item">
                        <div class="blocked-ip-info">
                            <div class="blocked-ip-address">${item.ip}</div>
                            <div class="blocked-ip-reason">${item.reason}</div>
                            <div class="blocked-ip-meta">
                                Blocked by: ${item.blocked_by} | 
                                ${new Date(item.blocked_at).toLocaleString()} |
                                ${item.expires_at ? 'Expires: ' + new Date(item.expires_at).toLocaleString() : 'Permanent'}
                            </div>
                        </div>
                        <span class="ip-status-badge ${item.is_active ? 'active' : 'expired'} ${item.auto_blocked ? 'auto' : ''}">
                            ${item.is_active ? 'ACTIVE' : 'EXPIRED'} ${item.auto_blocked ? '(AUTO)' : ''}
                        </span>
                        ${item.is_active ? `
                            <button class="btn btn-success" onclick="adminPanel.unblockIP('${item.ip}')">Unblock</button>
                        ` : ''}
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Load blocked IPs error:', error);
        }
    }

    async unblockIP(ip) {
        if (!confirm(`Unblock IP ${ip}?`)) return;

        try {
            const response = await fetch('/api/block-ip', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    ip, 
                    action: 'unblock',
                    adminEmail: this.ceoEmail
                })
            });

            const data = await response.json();

            if (data.success) {
                alert('IP unblocked');
                this.loadBlockedIPs();
            }
        } catch (error) {
            console.error('Unblock IP error:', error);
        }
    }

    async loadRateLimitStats() {
        // Placeholder - könnte aus audit_logs berechnet werden
        document.getElementById('totalRequests').textContent = '-';
        document.getElementById('blockedRequests').textContent = '-';
        document.getElementById('autoBlockedIps').textContent = '-';
    }

    // Audit Log Tab Methods
    async loadAuditTab() {
        await this.loadAuditLogs();
        this.setupAuditHandlers();
    }

    setupAuditHandlers() {
        document.getElementById('refreshAuditLogs').addEventListener('click', () => this.loadAuditLogs());
    }

    async loadAuditLogs() {
        const action = document.getElementById('auditActionFilter').value;
        const limit = document.getElementById('auditLimit').value || 100;

        try {
            const url = `/api/admin-audit-logs?limit=${limit}${action ? '&action=' + action : ''}`;
            const response = await fetch(url, {
                headers: { 'Authorization': 'Bearer admin' }
            });

            const data = await response.json();

            if (data.success) {
                // Stats
                const statsDiv = document.getElementById('auditStats');
                statsDiv.innerHTML = data.stats.map(stat => `
                    <div class="stat-item">
                        <span class="stat-label">${stat.action}</span>
                        <span class="stat-value">${stat.count}</span>
                    </div>
                `).join('');

                // Logs
                const logsDiv = document.getElementById('auditLogsList');
                
                if (data.logs.length === 0) {
                    logsDiv.innerHTML = '<p style="color: #999; text-align: center; padding: 2rem;">No audit logs found</p>';
                    return;
                }

                logsDiv.innerHTML = data.logs.map(log => `
                    <div class="audit-log-item">
                        <div class="audit-timestamp">${new Date(log.timestamp).toLocaleString()}</div>
                        <div class="audit-action">${log.action}</div>
                        <div>
                            <div class="audit-user">${log.user_email || 'System'}</div>
                            <div class="audit-ip">${log.ip}</div>
                        </div>
                        <div class="audit-details">${log.details || '-'}</div>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Load audit logs error:', error);
        }
    }

    // Refund payment
    async refundPayment(paymentId, userEmail, amount) {
        const reason = prompt(`Full Refund for ${userEmail}?\n\nAmount: CHF ${amount.toLocaleString()}\nOptional reason:`);
        
        if (reason === null) {
            return; // User cancelled
        }

        const confirmRefund = confirm(`⚠️ CONFIRM FULL REFUND\n\nUser: ${userEmail}\nPayment ID: ${paymentId}\nAmount: CHF ${amount.toLocaleString()}\nReason: ${reason || 'None provided'}\n\nThis action cannot be undone. Continue?`);
        
        if (!confirmRefund) {
            return;
        }

        try {
            const response = await fetch('/api/admin-refund', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    paymentId: paymentId,
                    reason: reason || 'Admin refund',
                    adminEmail: localStorage.getItem('adminEmail')
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                alert(`✅ Refund successful!\n\nRefund ID: ${data.refund.refundId}\nAmount: ${data.refund.amount} ${data.refund.currency}\n\nThe user will receive an email confirmation and the refund will appear in their account within 5-10 business days.`);
                
                // Reload payments
                this.loadPaymentsData();
            } else {
                alert(`❌ Refund failed\n\n${data.error || data.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Refund error:', error);
            alert(`❌ Refund failed\n\n${error.message}`);
        }
    }

    async partialRefund(paymentId, userEmail, maxAmount) {
        const amountStr = prompt(`Partial Refund for ${userEmail}\n\nMaximum: CHF ${maxAmount.toLocaleString()}\n\nEnter refund amount (CHF):`);
        
        if (!amountStr) {
            return; // User cancelled
        }

        const amount = parseFloat(amountStr.replace(/[^0-9.]/g, ''));
        
        if (isNaN(amount) || amount <= 0) {
            alert('❌ Invalid amount. Please enter a valid number.');
            return;
        }

        if (amount > maxAmount) {
            alert(`❌ Amount exceeds maximum of CHF ${maxAmount.toLocaleString()}`);
            return;
        }

        const reason = prompt(`Partial Refund: CHF ${amount.toLocaleString()}\n\nOptional reason:`);
        
        if (reason === null) {
            return; // User cancelled
        }

        const confirmRefund = confirm(`⚠️ CONFIRM PARTIAL REFUND\n\nUser: ${userEmail}\nPayment ID: ${paymentId}\nRefund Amount: CHF ${amount.toLocaleString()} (of CHF ${maxAmount.toLocaleString()})\nReason: ${reason || 'None provided'}\n\nThis action cannot be undone. Continue?`);
        
        if (!confirmRefund) {
            return;
        }

        try {
            const response = await fetch('/api/admin-refund', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    paymentId: paymentId,
                    amount: Math.round(amount * 100), // Convert to cents
                    reason: reason || 'Partial admin refund',
                    adminEmail: localStorage.getItem('adminEmail')
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                alert(`✅ Partial refund successful!\n\nRefund ID: ${data.refund.refundId}\nAmount: CHF ${amount.toLocaleString()}\n\nThe user will receive an email confirmation and the refund will appear in their account within 5-10 business days.`);
                
                // Reload payments
                this.loadPaymentsData();
            } else {
                alert(`❌ Refund failed\n\n${data.error || data.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Refund error:', error);
            alert(`❌ Refund failed\n\n${error.message}`);
        }
    }

    showCryptoRefund(userEmail, amount) {
        const walletAddresses = {
            bitcoin: 'bc1q...[Your Bitcoin Wallet Address]',
            ethereum: '0x...[Your Ethereum Wallet Address]',
            usdt: '0x...[Your USDT Wallet Address]'
        };

        const message = `🔐 CRYPTO MANUAL REFUND INSTRUCTIONS

User: ${userEmail}
Amount: CHF ${amount.toLocaleString()}

═══════════════════════════════════════════

REFUND WALLET ADDRESSES:

📍 Bitcoin (BTC):
${walletAddresses.bitcoin}

📍 Ethereum (ETH):
${walletAddresses.ethereum}

📍 USDT (Tether):
${walletAddresses.usdt}

═══════════════════════════════════════════

STEPS:
1. Calculate equivalent crypto amount at current rate
2. Send refund from your wallet to customer's wallet
3. Copy transaction hash
4. Email customer with transaction details
5. Mark refund as completed in database

⚠️ Remember to include transaction fees!`;

        alert(message);

        // Copy first wallet address to clipboard
        if (navigator.clipboard) {
            navigator.clipboard.writeText(walletAddresses.bitcoin).then(() => {
                console.log('Bitcoin address copied to clipboard');
            });
        }
    }

    // ===== EXPORT FUNCTIONS =====
    
    setupExportButtons() {
        // Add export buttons dynamically if not present
        const usersTab = document.querySelector('[data-tab="users"]')?.closest('.tab-content');
        if (usersTab && !usersTab.querySelector('.export-buttons')) {
            const exportDiv = document.createElement('div');
            exportDiv.className = 'export-buttons';
            exportDiv.innerHTML = `
                <button onclick="admin.exportData('users', 'csv')" class="export-btn">📊 Export Users (CSV)</button>
                <button onclick="admin.exportData('users', 'json')" class="export-btn">📄 Export Users (JSON)</button>
            `;
            usersTab.insertBefore(exportDiv, usersTab.firstChild);
        }

        const paymentsTab = document.querySelector('[data-tab="payments"]')?.closest('.tab-content');
        if (paymentsTab && !paymentsTab.querySelector('.export-buttons')) {
            const exportDiv = document.createElement('div');
            exportDiv.className = 'export-buttons';
            exportDiv.innerHTML = `
                <button onclick="admin.exportData('payments', 'csv')" class="export-btn">📊 Export Payments (CSV)</button>
                <button onclick="admin.exportData('payments', 'json')" class="export-btn">📄 Export Payments (JSON)</button>
            `;
            paymentsTab.insertBefore(exportDiv, paymentsTab.firstChild);
        }

        const chatTab = document.querySelector('[data-tab="chat"]')?.closest('.tab-content');
        if (chatTab && !chatTab.querySelector('.export-buttons')) {
            const exportDiv = document.createElement('div');
            exportDiv.className = 'export-buttons';
            exportDiv.innerHTML = `
                <button onclick="admin.exportData('chat', 'txt')" class="export-btn">📝 Export Chat History (TXT)</button>
                <button onclick="admin.exportData('chat', 'json')" class="export-btn">📄 Export Chat (JSON)</button>
            `;
            chatTab.insertBefore(exportDiv, chatTab.firstChild);
        }

        const auditTab = document.querySelector('[data-tab="audit"]')?.closest('.tab-content');
        if (auditTab && !auditTab.querySelector('.export-buttons')) {
            const exportDiv = document.createElement('div');
            exportDiv.className = 'export-buttons';
            exportDiv.innerHTML = `
                <button onclick="admin.exportData('audit-logs', 'json')" class="export-btn">📄 Export Audit Logs (JSON)</button>
                <button onclick="admin.exportData('audit-logs', 'txt')" class="export-btn">📝 Export Audit Logs (TXT)</button>
            `;
            auditTab.insertBefore(exportDiv, auditTab.firstChild);
        }
    }

    async exportData(type, format) {
        const session = JSON.parse(sessionStorage.getItem('adminSession'));
        if (!session) {
            alert('❌ Session expired. Please login again.');
            location.reload();
            return;
        }

        try {
            const response = await fetch(`/api/admin-export?type=${type}&format=${format}`, {
                method: 'GET',
                headers: {
                    'x-admin-email': session.email,
                    'x-admin-password': session.password
                }
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Export failed');
            }

            // Download file
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            
            // Extract filename from Content-Disposition header
            const contentDisposition = response.headers.get('Content-Disposition');
            const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
            const filename = filenameMatch ? filenameMatch[1] : `export-${type}-${Date.now()}.${format}`;
            
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            alert(`✅ Export successful!\n\nFile: ${filename}`);
        } catch (error) {
            console.error('Export error:', error);
            alert(`❌ Export failed\n\n${error.message}`);
        }
    }

    async loadEnhancedAnalytics() {
        const session = JSON.parse(sessionStorage.getItem('adminSession'));
        if (!session) return;

        try {
            const response = await fetch('/api/admin-analytics', {
                method: 'GET',
                headers: {
                    'x-admin-email': session.email,
                    'x-admin-password': session.password
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load analytics');
            }

            const analytics = await response.json();

            // Display analytics in dashboard
            const analyticsSection = document.getElementById('analyticsSection');
            if (!analyticsSection) {
                // Create analytics section if not exists
                const statsSection = document.querySelector('.stats-grid');
                const newSection = document.createElement('div');
                newSection.id = 'analyticsSection';
                newSection.className = 'analytics-enhanced';
                statsSection.insertAdjacentElement('afterend', newSection);
            }

            document.getElementById('analyticsSection').innerHTML = `
                <h3>📊 Enhanced Analytics</h3>
                <div class="analytics-grid">
                    <div class="analytics-card">
                        <h4>💰 Revenue Statistics</h4>
                        <p>Total Revenue: CHF ${(analytics.revenue?.total_revenue || 0).toLocaleString()}</p>
                        <p>Average Payment: CHF ${(analytics.revenue?.avg_payment || 0).toLocaleString()}</p>
                        <p>Conversion Rate: ${analytics.conversion?.conversionRate || 0}%</p>
                    </div>
                    
                    <div class="analytics-card">
                        <h4>👥 User Engagement</h4>
                        <p>Active Users (30d): ${analytics.users?.activeUsers || 0}</p>
                        <p>New Registrations (7d): ${analytics.users?.recentRegistrations || 0}</p>
                        <p>2FA Adoption: ${analytics.twoFA?.adoptionRate || analytics.security?.twoFactorAdoptionRate || 0}%</p>
                    </div>
                    
                    <div class="analytics-card">
                        <h4>💬 Chat Activity</h4>
                        <p>Total Messages: ${analytics.chat?.total_messages || 0}</p>
                        <p>Unique Users: ${analytics.chat?.unique_users || 0}</p>
                        <p>Unread: ${analytics.chat?.unread_messages || 0}</p>
                    </div>
                    
                    <div class="analytics-card">
                        <h4>🔔 Push Notifications</h4>
                        <p>Total Subscriptions: ${analytics.pushNotifications?.total || 0}</p>
                        <p>Active: ${analytics.pushNotifications?.active || 0}</p>
                    </div>
                    
                    <div class="analytics-card">
                        <h4>🔄 Refunds</h4>
                        <p>Total Refunds: ${analytics.refunds?.total_refunds || 0}</p>
                        <p>Amount: CHF ${((analytics.refunds?.refunded_amount || 0) / 100).toLocaleString()}</p>
                        <p>Rate: ${analytics.refunds?.refundRate || 0}%</p>
                    </div>
                    
                    <div class="analytics-card">
                        <h4>🏆 Top Customer</h4>
                        <p>${analytics.topCustomers?.[0]?.email || analytics.customers?.[0]?.user_email || 'N/A'}</p>
                        <p>Spent: CHF ${((analytics.topCustomers?.[0]?.totalSpent || analytics.customers?.[0]?.total_spent || 0) / 100).toLocaleString()}</p>
                        <p>Payments: ${analytics.topCustomers?.[0]?.payments || analytics.customers?.[0]?.payment_count || 0}</p>
                    </div>
                </div>
            `;

        } catch (error) {
            console.error('Analytics loading error:', error);
        }
    }

    // ===== BROADCAST NOTIFICATIONS =====
    
    setupBroadcastButton() {
        const dashboardHeader = document.querySelector('.dashboard-header');
        if (dashboardHeader && !document.getElementById('broadcastBtn')) {
            const broadcastBtn = document.createElement('button');
            broadcastBtn.id = 'broadcastBtn';
            broadcastBtn.className = 'btn-primary';
            broadcastBtn.innerHTML = '📢 Broadcast Notification';
            broadcastBtn.onclick = () => this.showBroadcastModal();
            dashboardHeader.appendChild(broadcastBtn);
        }
    }

    showBroadcastModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'broadcastModal';
        modal.innerHTML = `
            <div class="modal-content broadcast-modal">
                <h2>📢 Broadcast Push Notification</h2>
                <form id="broadcastForm">
                    <div class="form-group">
                        <label>Target Audience:</label>
                        <select id="broadcastAudience" required>
                            <option value="all">All Users</option>
                            <option value="paid">Paid Users Only</option>
                            <option value="unpaid">Unpaid Users Only</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Notification Title:</label>
                        <input type="text" id="broadcastTitle" maxlength="50" placeholder="e.g., New Feature Available!" required />
                    </div>
                    
                    <div class="form-group">
                        <label>Message:</label>
                        <textarea id="broadcastMessage" maxlength="200" rows="4" placeholder="Enter your message..." required></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label>Click URL (Optional):</label>
                        <input type="text" id="broadcastUrl" placeholder="e.g., /dashboard or https://..." />
                    </div>
                    
                    <div class="form-group">
                        <label>Icon URL (Optional):</label>
                        <input type="text" id="broadcastIcon" placeholder="Default: /assets/images/icon-192x192.png" />
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn-primary">📤 Send Broadcast</button>
                        <button type="button" class="btn-secondary" onclick="document.getElementById('broadcastModal').remove()">Cancel</button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('broadcastForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendBroadcastNotification();
        });
    }

    async sendBroadcastNotification() {
        const session = JSON.parse(sessionStorage.getItem('adminSession'));
        if (!session) {
            alert('❌ Session expired. Please login again.');
            location.reload();
            return;
        }

        const title = document.getElementById('broadcastTitle').value.trim();
        const message = document.getElementById('broadcastMessage').value.trim();
        const url = document.getElementById('broadcastUrl').value.trim();
        const icon = document.getElementById('broadcastIcon').value.trim();
        const targetAudience = document.getElementById('broadcastAudience').value;

        if (!title || !message) {
            alert('❌ Title and message are required!');
            return;
        }

        const confirm = window.confirm(`⚠️ CONFIRM BROADCAST\n\nTarget: ${targetAudience}\nTitle: ${title}\nMessage: ${message}\n\nSend notification to all ${targetAudience} users?`);
        
        if (!confirm) return;

        try {
            const response = await fetch('/api/admin-broadcast', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-email': session.email,
                    'x-admin-password': session.password
                },
                body: JSON.stringify({
                    title,
                    message,
                    url: url || '/',
                    icon: icon || '/assets/images/icon-192x192.png',
                    targetAudience
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                alert(`✅ Broadcast Notification Sent!\n\nTarget: ${data.details.targetAudience}\nTotal Recipients: ${data.total}\nSuccessfully Sent: ${data.sent}\nFailed: ${data.failed}`);
                document.getElementById('broadcastModal').remove();
            } else {
                throw new Error(data.error || 'Broadcast failed');
            }
        } catch (error) {
            console.error('Broadcast error:', error);
            alert(`❌ Broadcast failed\n\n${error.message}`);
        }
    }

    async deleteAllUsers() {
        const confirmMsg = `⚠️ DANGER: DELETE ALL USERS ⚠️

This will permanently delete ALL users except:
• furkan_akaslan@hotmail.com (CEO)

This action CANNOT be undone!

Type "DELETE ALL" to confirm:`;
        
        const confirmation = prompt(confirmMsg);
        
        if (confirmation !== 'DELETE ALL') {
            if (confirmation !== null) {
                alert('❌ Deletion cancelled - incorrect confirmation text');
            }
            return;
        }

        // Double confirmation
        const doubleConfirm = confirm('🚨 FINAL WARNING 🚨\n\nAre you ABSOLUTELY SURE?\n\nThis will delete ALL users permanently!');
        
        if (!doubleConfirm) {
            alert('❌ Deletion cancelled');
            return;
        }

        try {
            const session = JSON.parse(sessionStorage.getItem('adminSession'));
            
            const response = await fetch('/api/admin-delete-users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    adminEmail: session.email,
                    adminPassword: session.password
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                alert(`✅ DELETION COMPLETE\n\nDeleted: ${data.deleted_count} users\nPreserved: CEO account\n\nDeleted users:\n${data.deleted_users.slice(0, 10).join('\n')}${data.deleted_users.length > 10 ? '\n...' : ''}`);
                
                // Reload users table
                this.loadUsersData();
            } else {
                throw new Error(data.error || 'Deletion failed');
            }
        } catch (error) {
            console.error('Delete users error:', error);
            alert(`❌ Deletion failed\n\n${error.message}`);
        }
    }

    async blockUser(email) {
        if (!confirm(`🚫 Block user ${email}?\n\nThis user will see a 404 page when trying to access the site.`)) {
            return;
        }

        try {
            const session = JSON.parse(sessionStorage.getItem('adminSession'));
            const response = await fetch('/api/admin-block-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-email': session.email,
                    'x-admin-password': session.password
                },
                body: JSON.stringify({ email, action: 'block' })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                alert(`✅ ${data.message}`);
                this.loadUsersData();
            } else {
                throw new Error(data.error || 'Block failed');
            }
        } catch (error) {
            console.error('Block user error:', error);
            alert(`❌ Block failed\n\n${error.message}`);
        }
    }

    async unblockUser(email) {
        if (!confirm(`✅ Unblock user ${email}?`)) {
            return;
        }

        try {
            const session = JSON.parse(sessionStorage.getItem('adminSession'));
            const response = await fetch('/api/admin-block-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-email': session.email,
                    'x-admin-password': session.password
                },
                body: JSON.stringify({ email, action: 'unblock' })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                alert(`✅ ${data.message}`);
                this.loadUsersData();
            } else {
                throw new Error(data.error || 'Unblock failed');
            }
        } catch (error) {
            console.error('Unblock user error:', error);
            alert(`❌ Unblock failed\n\n${error.message}`);
        }
    }

    async createTestUsers() {
        if (!confirm('👥 Create 2 test users?\n\nEmails:\n- test1@billionairs.luxury\n- test2@billionairs.luxury\n\nPassword: test123')) {
            return;
        }

        try {
            const session = JSON.parse(sessionStorage.getItem('adminSession'));
            const response = await fetch('/api/create-test-users', {
                method: 'GET',
                headers: {
                    'x-admin-email': session.email,
                    'x-admin-password': session.password
                }
            });

            const data = await response.json();

            if (response.ok && data.success) {
                alert(`✅ ${data.message}\n\n${data.users.join('\n')}\n\nPassword: test123`);
                this.loadUsersData();
            } else {
                throw new Error(data.error || 'Creation failed');
            }
        } catch (error) {
            console.error('Create test users error:', error);
            alert(`❌ Creation failed\n\n${error.message}`);
        }
    }
}

// Initialize admin panel
const adminPanel = new AdminPanel();

// Expose to window for onclick handlers
window.admin = adminPanel;
