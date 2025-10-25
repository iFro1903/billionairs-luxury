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

            if (response.ok) {
                const data = await response.json();
                sessionStorage.setItem('adminSession', JSON.stringify({ email: data.email }));
                this.showDashboard(data.email);
            } else {
                errorDiv.textContent = 'Invalid credentials';
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

        // Update content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `tab-${tabName}`);
        });

        // Load tab-specific data
        if (tabName === 'easter-eggs') this.loadEasterEggData();
        if (tabName === 'chat') this.loadChatData();
        if (tabName === 'payments') this.loadPaymentsData();
        if (tabName === 'stats') this.loadStatsData();
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
                    tr.innerHTML = `
                        <td>${new Date(payment.created_at).toLocaleDateString('de-CH')}</td>
                        <td>${payment.email}</td>
                        <td>${formatCHF(payment.amount)}</td>
                        <td><span class="payment-method-badge ${payment.method}">${payment.method}</span></td>
                        <td><span class="status-badge paid">${payment.status}</span></td>
                    `;
                    tbody.appendChild(tr);
                });
            } else {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #888;">No payments yet</td></tr>';
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
}

// Initialize admin panel
const adminPanel = new AdminPanel();
