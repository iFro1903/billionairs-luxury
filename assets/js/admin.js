// BILLIONAIRS CEO Admin Panel
class AdminPanel {
    constructor() {
        this.ceoEmail = 'furkan_akaslan@hotmail.com';
        this.currentTab = 'users';
        this.init();
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
        if (tabName === 'easter-eggs') this.loadEasterEggData();
        if (tabName === 'chat') this.loadChatData();
        if (tabName === 'payments') this.loadPaymentsData();
        if (tabName === 'stats') this.loadStatsData();
        if (tabName === 'security') this.loadSecurityTab();
        if (tabName === 'audit') this.loadAuditTab();
    }

    async loadUsersData() {
        try {
            const response = await fetch('/api/admin-users');
            const data = await response.json();

            // Update stats
            document.getElementById('totalUsers').textContent = data.total || 0;
            document.getElementById('paidUsers').textContent = data.paid || 0;
            document.getElementById('activeUsers').textContent = data.active || 0;

            // Populate table
            const tbody = document.getElementById('usersTableBody');
            tbody.innerHTML = '';

            data.users.forEach(user => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${user.email}</td>
                    <td>${user.name || 'N/A'}</td>
                    <td>${new Date(user.created_at).toLocaleDateString()}</td>
                    <td><span class="status-badge ${user.has_paid ? 'paid' : 'unpaid'}">${user.has_paid ? 'Paid' : 'Free'}</span></td>
                    <td>
                        ${user.pyramid_unlocked ? '🔓' : '🔒'} Pyramid
                        ${user.eye_unlocked ? '🔓' : '🔒'} Eye
                        ${user.chat_ready ? '🔓' : '🔒'} Chat
                    </td>
                    <td>
                        <button class="action-btn" onclick="adminPanel.viewUser('${user.email}')">View</button>
                        <button class="action-btn danger" onclick="adminPanel.deleteUser('${user.email}')">Delete</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            // Populate user select for easter eggs
            const select = document.getElementById('easterEggUserSelect');
            select.innerHTML = '<option value="">Choose user...</option>';
            data.users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.email;
                option.textContent = `${user.email} (${user.name || 'No name'})`;
                select.appendChild(option);
            });

        } catch (error) {
            console.error('Error loading users:', error);
        }
    }

    async loadEasterEggData() {
        const select = document.getElementById('easterEggUserSelect');
        const selectedEmail = select.value;

        if (!selectedEmail) return;

        // Setup unlock buttons
        document.querySelectorAll('.unlock-btn').forEach(btn => {
            btn.onclick = () => this.handleUnlock(selectedEmail, btn.dataset.unlock);
        });
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
            const response = await fetch('/api/admin-payments');
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
            const response = await fetch('/api/admin-stats');
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

    async deleteUser(email) {
        if (!confirm(`Delete user ${email}? This cannot be undone!`)) return;

        try {
            const response = await fetch('/api/admin-delete-user', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            if (response.ok) {
                alert('User deleted successfully');
                this.loadUsersData();
            } else {
                alert('Failed to delete user');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
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
                        <p>${analytics.customers[0]?.user_email || 'N/A'}</p>
                        <p>Spent: CHF ${(analytics.customers[0]?.total_spent / 100 || 0).toLocaleString()}</p>
                        <p>Payments: ${analytics.customers[0]?.payment_count || 0}</p>
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
}

// Initialize admin panel
const adminPanel = new AdminPanel();

// Expose to window for onclick handlers
window.admin = adminPanel;
