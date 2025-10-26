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

        // Setup emergency button
        document.getElementById('emergencyBtn').addEventListener('click', () => {
            this.toggleEmergencyMode();
        });

        // Check emergency mode status
        this.checkEmergencyMode();

        // Load initial data
        this.loadUsersData();
        this.loadChatData();
        this.loadStatsData();
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
}

// Initialize admin panel
const adminPanel = new AdminPanel();

// Expose to window for onclick handlers
window.admin = adminPanel;
