// BILLIONAIRS CEO Admin Panel — Redesign
class AdminPanel {
    constructor() {
        this.ceoEmail = 'furkan_akaslan@hotmail.com';
        this.currentTab = 'users';
        this.users = [];
        this.autoRefreshTimer = null;
        this.init();
    }

    // ========== HELPERS ==========
    escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
    }

    formatTimeAgo(date) {
        const diff = Date.now() - date.getTime();
        const m = Math.floor(diff/60000), h = Math.floor(diff/3600000), d = Math.floor(diff/86400000);
        if (m < 1) return 'Gerade eben';
        if (m < 60) return `${m}m`;
        if (h < 24) return `${h}h`;
        if (d < 7) return `${d}d`;
        return date.toLocaleDateString('de-DE');
    }

    getSession() {
        try { return JSON.parse(sessionStorage.getItem('adminSession')); } catch { return null; }
    }

    getMembershipTimer(paidAt, hasPaid, createdAt) {
        if (!hasPaid) return '<span style="color:#888;font-size:12px;">—</span>';
        const start = paidAt ? new Date(paidAt) : (createdAt ? new Date(createdAt) : null);
        if (!start) return '<span style="color:#f39c12;font-size:12px;">Paid</span>';
        const expires = new Date(start.getTime() + 365*24*60*60*1000);
        const diff = expires - new Date();
        if (diff <= 0) return '<span style="color:#e74c3c;font-weight:600;">EXPIRED</span>';
        const days = Math.floor(diff/(1000*60*60*24));
        const hrs = Math.floor((diff%(1000*60*60*24))/(1000*60*60));
        let color = '#2ecc71';
        if (days <= 30) color = '#e74c3c';
        else if (days <= 180) color = '#f39c12';
        const pct = Math.round((days/365)*100);
        return `<div style="min-width:110px;">
            <div style="font-size:12px;font-weight:700;color:${color};">${days}d ${hrs}h</div>
            <div style="background:rgba(255,255,255,.1);border-radius:3px;height:4px;margin-top:3px;">
                <div style="width:${pct}%;height:100%;background:${color};border-radius:3px;"></div>
            </div>
            <div style="font-size:10px;color:#666;margin-top:1px;">${pct}%</div>
        </div>`;
    }

    // ========== INIT ==========
    init() {
        const session = this.getSession();
        if (session && session.email === this.ceoEmail) {
            this.showDashboard(session.email);
            return;
        }
        document.getElementById('adminLoginForm').addEventListener('submit', e => {
            e.preventDefault();
            this.handleLogin();
        });
    }

    async handleLogin() {
        const email = document.getElementById('adminEmail').value.toLowerCase().trim();
        const password = document.getElementById('adminPassword').value;
        const err = document.getElementById('loginError');

        if (email !== this.ceoEmail) { err.textContent = 'Zugang verweigert'; return; }

        try {
            const res = await fetch('/api/admin-auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (res.ok) {
                if (data.requiresTwoFactor) { this.show2FAPrompt(email, password); return; }
                sessionStorage.setItem('adminSession', JSON.stringify({ email: data.email, password }));
                this.showDashboard(data.email);
            } else {
                err.textContent = data.error || 'Login fehlgeschlagen';
            }
        } catch (e) {
            console.error('Login error:', e);
            err.textContent = 'Verbindungsfehler';
        }
    }

    // ========== DASHBOARD ==========
    showDashboard(email) {
        document.getElementById('adminLogin').classList.add('hidden');
        document.getElementById('adminDashboard').classList.remove('hidden');
        document.getElementById('adminUserName').textContent = email;

        // Sidebar nav
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });

        // Logout
        document.getElementById('adminLogout').addEventListener('click', () => {
            sessionStorage.removeItem('adminSession');
            location.reload();
        });

        // Mobile menu
        const toggle = document.getElementById('menuToggle');
        const sidebar = document.getElementById('sidebar');
        const overlay = this.createOverlay();
        toggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('show');
        });
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('show');
        });

        // Emergency
        document.getElementById('emergencyBtn').addEventListener('click', () => this.toggleEmergencyMode());

        // Danger zone
        const delBtn = document.getElementById('deleteAllUsersBtn');
        if (delBtn) delBtn.addEventListener('click', () => this.deleteAllUsers());
        const testBtn = document.getElementById('createTestUsersBtn');
        if (testBtn) testBtn.addEventListener('click', () => this.createTestUsers());

        // Create member form
        const form = document.getElementById('createMemberForm');
        if (form) form.addEventListener('submit', e => { e.preventDefault(); this.createMember(); });

        // Bulk easter egg controls
        this.setupBulkEasterEggControls();

        // CSV Export
        const csvBtn = document.getElementById('csvExportBtn');
        if (csvBtn) csvBtn.addEventListener('click', () => this.exportCSV());

        // Refresh button
        const refBtn = document.getElementById('refreshUsersBtn');
        if (refBtn) refBtn.addEventListener('click', () => this.loadUsersData());

        // Auto-refresh toggle
        const arToggle = document.getElementById('autoRefreshToggle');
        if (arToggle) arToggle.addEventListener('change', e => this.setAutoRefresh(e.target.checked));

        // User search
        const searchInput = document.getElementById('userSearch');
        if (searchInput) searchInput.addEventListener('input', () => this.filterUsersTable());

        // Status filter
        const statusFilter = document.getElementById('userStatusFilter');
        if (statusFilter) statusFilter.addEventListener('change', () => this.filterUsersTable());

        // Modal close
        const closeModal = document.getElementById('closeModal');
        if (closeModal) closeModal.addEventListener('click', () => this.closeModal());
        document.getElementById('memberModal')?.addEventListener('click', e => {
            if (e.target.id === 'memberModal') this.closeModal();
        });

        // Check emergency
        this.checkEmergencyMode();

        // Export buttons
        this.setupExportButtons();

        // Broadcast button
        this.setupBroadcastButton();

        // Load data
        this.loadUsersData();
        this.loadStatsData();
        this.loadEnhancedAnalytics();
    }

    createOverlay() {
        let ov = document.querySelector('.sidebar-overlay');
        if (!ov) {
            ov = document.createElement('div');
            ov.className = 'sidebar-overlay';
            document.body.appendChild(ov);
        }
        return ov;
    }

    // ========== TAB SWITCHING ==========
    switchTab(tab) {
        this.currentTab = tab;
        const titles = {
            'users': 'Members', 'easter-eggs': 'Easter Eggs', 'chat': 'Chat',
            'payments': 'Payments', 'stats': 'Statistics', 'security': 'Security', 'audit': 'Audit Logs'
        };
        document.getElementById('pageTitle').textContent = titles[tab] || tab;

        document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
        document.querySelectorAll('.tab').forEach(t => {
            const match = t.id === `tab-${tab}` || t.id === `${tab}Tab`;
            t.classList.toggle('active', match);
        });

        // Close sidebar on mobile
        document.getElementById('sidebar').classList.remove('open');
        document.querySelector('.sidebar-overlay')?.classList.remove('show');

        // Load data
        if (tab === 'users') this.loadUsersData();
        if (tab === 'easter-eggs') this.loadUsersData();
        if (tab === 'chat') this.loadChatData();
        if (tab === 'payments') this.loadPaymentsData();
        if (tab === 'stats') { this.loadStatsData(); this.loadEnhancedAnalytics(); }
        if (tab === 'security') this.loadSecurityTab();
        if (tab === 'audit') this.loadAuditTab();
    }

    // ========== AUTO-REFRESH ==========
    setAutoRefresh(enabled) {
        if (this.autoRefreshTimer) { clearInterval(this.autoRefreshTimer); this.autoRefreshTimer = null; }
        if (enabled) {
            this.autoRefreshTimer = setInterval(() => {
                if (this.currentTab === 'users') this.loadUsersData();
                else if (this.currentTab === 'chat') this.loadChatData();
                else if (this.currentTab === 'payments') this.loadPaymentsData();
            }, 30000);
        }
    }

    // ========== USERS ==========
    async loadUsersData() {
        try {
            const s = this.getSession();
            const res = await fetch('/api/admin-users', {
                headers: { 'X-Admin-Email': s.email, 'X-Admin-Password': s.password }
            });
            const data = await res.json();
            this.users = data.users || [];

            document.getElementById('totalUsers').textContent = data.total || 0;
            document.getElementById('paidUsers').textContent = data.paid || 0;
            document.getElementById('activeUsers').textContent = data.active || 0;

            // Free users count
            const freeEl = document.getElementById('freeUsers');
            if (freeEl) freeEl.textContent = (data.total || 0) - (data.paid || 0);

            this.renderUsersTable(this.users);
            this.renderIndividualUserControls(this.users);
        } catch (e) {
            console.error('Error loading users:', e);
        }
    }

    renderUsersTable(users) {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        users.forEach(u => {
            const email = this.escapeHtml(u.email);
            const name = this.escapeHtml(u.name || u.full_name || '—');
            const timer = this.getMembershipTimer(u.paid_at, u.has_paid, u.created_at);
            const status = u.has_paid ? 'paid' : (u.payment_status || 'free');
            const colors = {
                paid: { bg:'rgba(46,204,113,.15)', c:'#2ecc71', b:'#2ecc71' },
                pending: { bg:'rgba(243,156,18,.15)', c:'#f39c12', b:'#f39c12' },
                free: { bg:'rgba(220,53,69,.15)', c:'#DC3545', b:'#DC3545' }
            };
            const sc = colors[status] || colors.free;

            const tr = document.createElement('tr');
            tr.dataset.email = (u.email||'').toLowerCase();
            tr.dataset.name = (u.name||u.full_name||'').toLowerCase();
            tr.dataset.status = status;
            tr.innerHTML = `
                <td>${email}</td>
                <td>${name}</td>
                <td>${new Date(u.created_at).toLocaleDateString('de-CH')}</td>
                <td>${timer}</td>
                <td>
                    <select class="status-select" onchange="adminPanel.updateMemberStatus('${email}',this.value,this)"
                        style="background:${sc.bg};color:${sc.c};border:1px solid ${sc.b};border-radius:20px;padding:3px 8px;font-size:11px;font-weight:600;cursor:pointer;outline:none;">
                        <option value="paid" ${status==='paid'?'selected':''}>Paid</option>
                        <option value="pending" ${status==='pending'?'selected':''}>Pending</option>
                        <option value="free" ${status==='free'?'selected':''}>Free</option>
                    </select>
                </td>
                <td style="font-size:12px;">
                    ${u.pyramid_unlocked?'🔓':'🔒'}P ${u.eye_unlocked?'🔓':'🔒'}E ${u.chat_ready||u.chat_unlocked?'🔓':'🔒'}C
                    ${u.is_blocked?'<span style="color:#e74c3c;"> 🚫</span>':''}
                </td>
                <td>
                    <button class="tbl-btn primary" onclick="adminPanel.viewUser('${email}')">Details</button>
                    ${u.is_blocked
                        ? `<button class="tbl-btn success" onclick="adminPanel.unblockUser('${email}')">Unblock</button>`
                        : `<button class="tbl-btn" onclick="adminPanel.blockUser('${email}')">Block</button>`
                    }
                    <button class="tbl-btn danger" onclick="adminPanel.deleteUser('${email}')">Del</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    filterUsersTable() {
        const search = (document.getElementById('userSearch')?.value || '').toLowerCase();
        const statusFilter = document.getElementById('userStatusFilter')?.value || 'all';
        const rows = document.querySelectorAll('#usersTableBody tr');
        rows.forEach(tr => {
            const email = tr.dataset.email || '';
            const name = tr.dataset.name || '';
            const st = tr.dataset.status || '';
            const matchSearch = !search || email.includes(search) || name.includes(search);
            const matchStatus = statusFilter === 'all' || st === statusFilter;
            tr.style.display = (matchSearch && matchStatus) ? '' : 'none';
        });
    }

    // ========== CSV EXPORT ==========
    exportCSV() {
        if (!this.users.length) { alert('Keine User-Daten vorhanden'); return; }
        const headers = ['Email','Name','Registriert','Status','Pyramid','Eye','Chat','Blocked'];
        const rows = this.users.map(u => [
            u.email,
            u.name || u.full_name || '',
            new Date(u.created_at).toLocaleDateString('de-CH'),
            u.has_paid ? 'Paid' : (u.payment_status || 'Free'),
            u.pyramid_unlocked ? 'Yes' : 'No',
            u.eye_unlocked ? 'Yes' : 'No',
            u.chat_ready || u.chat_unlocked ? 'Yes' : 'No',
            u.is_blocked ? 'Yes' : 'No'
        ]);
        const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
        const blob = new Blob(['\ufeff'+csv], { type: 'text/csv;charset=utf-8;' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `billionairs-members-${new Date().toISOString().slice(0,10)}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
    }

    // ========== MEMBER DETAIL MODAL ==========
    viewUser(email) {
        const user = this.users.find(u => u.email === email);
        if (!user) { alert('User nicht gefunden'); return; }

        const modal = document.getElementById('memberModal');
        const title = document.getElementById('modalTitle');
        const body = document.getElementById('modalBody');

        title.textContent = user.email;

        const status = user.has_paid ? 'Paid' : (user.payment_status || 'Free');
        const lastSeen = user.last_seen ? this.formatTimeAgo(new Date(user.last_seen)) : 'Nie';
        const paidAt = user.paid_at ? new Date(user.paid_at).toLocaleDateString('de-CH') : '—';
        const reg = user.created_at ? new Date(user.created_at).toLocaleDateString('de-CH') : '—';

        body.innerHTML = `
            <div class="detail-row"><span class="detail-label">Email</span><span class="detail-value">${this.escapeHtml(user.email)}</span></div>
            <div class="detail-row"><span class="detail-label">Name</span><span class="detail-value">${this.escapeHtml(user.name || user.full_name || '—')}</span></div>
            <div class="detail-row"><span class="detail-label">Member ID</span><span class="detail-value">${this.escapeHtml(user.member_id || '—')}</span></div>
            <div class="detail-row"><span class="detail-label">Registriert</span><span class="detail-value">${reg}</span></div>
            <div class="detail-row"><span class="detail-label">Bezahlt am</span><span class="detail-value">${paidAt}</span></div>
            <div class="detail-row"><span class="detail-label">Status</span><span class="detail-value">${status}</span></div>
            <div class="detail-row"><span class="detail-label">Letzter Login</span><span class="detail-value">${lastSeen}</span></div>
            <div class="detail-row"><span class="detail-label">Pyramid</span><span class="detail-value">${user.pyramid_unlocked ? '🔓 Unlocked' : '🔒 Locked'}</span></div>
            <div class="detail-row"><span class="detail-label">Eye</span><span class="detail-value">${user.eye_unlocked ? '🔓 Unlocked' : '🔒 Locked'}</span></div>
            <div class="detail-row"><span class="detail-label">Chat</span><span class="detail-value">${user.chat_ready || user.chat_unlocked ? '🔓 Unlocked' : '🔒 Locked'}</span></div>
            <div class="detail-row"><span class="detail-label">Blockiert</span><span class="detail-value">${user.is_blocked ? '🚫 Ja' : 'Nein'}</span></div>
            <div class="detail-row"><span class="detail-label">Phone</span><span class="detail-value">${this.escapeHtml(user.phone || '—')}</span></div>
            <div class="detail-row"><span class="detail-label">Company</span><span class="detail-value">${this.escapeHtml(user.company || '—')}</span></div>

            <div class="notes-section">
                <h4 style="color:#E8C4A8;font-size:.9rem;margin-bottom:.5rem;">Notizen</h4>
                <textarea id="memberNotes" placeholder="Interne Notizen...">${this.escapeHtml(user.admin_notes || '')}</textarea>
                <button class="btn-sm btn-gold" style="margin-top:.5rem;" onclick="adminPanel.saveNotes('${this.escapeHtml(user.email)}')">Speichern</button>
            </div>

            <div class="modal-actions">
                <button class="btn-sm btn-gold" onclick="adminPanel.sendEmailToUser('${this.escapeHtml(user.email)}')">📧 Email senden</button>
                ${user.is_blocked
                    ? `<button class="btn-sm btn-green" onclick="adminPanel.unblockUser('${this.escapeHtml(user.email)}');adminPanel.closeModal();">Unblock</button>`
                    : `<button class="btn-sm btn-red" onclick="adminPanel.blockUser('${this.escapeHtml(user.email)}');adminPanel.closeModal();">Block</button>`
                }
                <button class="btn-sm btn-red" onclick="adminPanel.deleteUser('${this.escapeHtml(user.email)}');adminPanel.closeModal();">Löschen</button>
            </div>
        `;

        modal.classList.remove('hidden');
    }

    closeModal() {
        document.getElementById('memberModal').classList.add('hidden');
    }

    // ========== NOTES ==========
    async saveNotes(email) {
        const notes = document.getElementById('memberNotes')?.value || '';
        try {
            const s = this.getSession();
            const res = await fetch('/api/admin-member-notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Admin-Email': s.email, 'X-Admin-Password': s.password },
                body: JSON.stringify({ email, notes })
            });
            if (res.ok) { alert('✅ Notizen gespeichert'); }
            else { alert('❌ Fehler beim Speichern'); }
        } catch (e) {
            console.error('Save notes error:', e);
            alert('❌ Fehler');
        }
    }

    // ========== EMAIL TO USER ==========
    sendEmailToUser(email) {
        const subject = prompt('Betreff:');
        if (!subject) return;
        const message = prompt('Nachricht:');
        if (!message) return;

        this.doSendEmail(email, subject, message);
    }

    async doSendEmail(to, subject, message) {
        try {
            const s = this.getSession();
            const res = await fetch('/api/admin-send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Admin-Email': s.email, 'X-Admin-Password': s.password },
                body: JSON.stringify({ to, subject, message })
            });
            const data = await res.json();
            if (res.ok && data.success) { alert('✅ Email gesendet!'); }
            else { alert(`❌ ${data.error || 'Fehler'}`); }
        } catch (e) {
            console.error('Send email error:', e);
            alert('❌ Fehler');
        }
    }

    // ========== STATUS UPDATE ==========
    async updateMemberStatus(email, newStatus, selectEl) {
        const labels = { paid:'Paid', pending:'Pending', free:'Free' };
        if (!confirm(`Status von ${email} auf "${labels[newStatus]}" ändern?`)) { this.loadUsersData(); return; }

        try {
            const s = this.getSession();
            const res = await fetch('/api/admin-update-status', {
                method: 'POST',
                headers: { 'Content-Type':'application/json', 'X-Admin-Email':s.email, 'X-Admin-Password':s.password },
                body: JSON.stringify({ email, status: newStatus })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                const c = {
                    paid:{bg:'rgba(46,204,113,.15)',c:'#2ecc71',b:'#2ecc71'},
                    pending:{bg:'rgba(243,156,18,.15)',c:'#f39c12',b:'#f39c12'},
                    free:{bg:'rgba(220,53,69,.15)',c:'#DC3545',b:'#DC3545'}
                }[newStatus];
                selectEl.style.background = c.bg; selectEl.style.color = c.c; selectEl.style.borderColor = c.b;
                this.loadUsersData();
            } else { alert(`❌ ${data.error||'Fehler'}`); this.loadUsersData(); }
        } catch (e) { console.error(e); alert('❌ Fehler'); this.loadUsersData(); }
    }

    // ========== DELETE / BLOCK ==========
    async deleteUser(email) {
        if (!confirm(`User ${email} wirklich löschen?`)) return;
        try {
            const res = await fetch('/api/admin-delete-user', {
                method: 'DELETE',
                headers: { 'Content-Type':'application/json' },
                body: JSON.stringify({ email })
            });
            if (res.ok) { alert('✅ User gelöscht'); this.loadUsersData(); }
            else { const d = await res.json(); alert(`❌ ${d.error}`); }
        } catch (e) { console.error(e); alert('❌ Fehler'); }
    }

    async blockUser(email) {
        if (!confirm(`${email} blockieren?`)) return;
        try {
            const s = this.getSession();
            const res = await fetch('/api/admin-block-user', {
                method: 'POST',
                headers: { 'Content-Type':'application/json', 'x-admin-email':s.email, 'x-admin-password':s.password },
                body: JSON.stringify({ email, action:'block' })
            });
            const d = await res.json();
            if (res.ok && d.success) { alert(`✅ ${d.message}`); this.loadUsersData(); }
            else { alert(`❌ ${d.error}`); }
        } catch (e) { console.error(e); alert('❌ Fehler'); }
    }

    async unblockUser(email) {
        if (!confirm(`${email} entsperren?`)) return;
        try {
            const s = this.getSession();
            const res = await fetch('/api/admin-block-user', {
                method: 'POST',
                headers: { 'Content-Type':'application/json', 'x-admin-email':s.email, 'x-admin-password':s.password },
                body: JSON.stringify({ email, action:'unblock' })
            });
            const d = await res.json();
            if (res.ok && d.success) { alert(`✅ ${d.message}`); this.loadUsersData(); }
            else { alert(`❌ ${d.error}`); }
        } catch (e) { console.error(e); alert('❌ Fehler'); }
    }

    // ========== CREATE MEMBER ==========
    async createMember() {
        const email = document.getElementById('newMemberEmail').value.trim().toLowerCase();
        const password = document.getElementById('newMemberPassword').value;
        const fullName = document.getElementById('newMemberName').value.trim();
        const markAsPaid = document.getElementById('newMemberPaid').checked;
        const result = document.getElementById('createMemberResult');

        if (!email || !password) { result.innerHTML = '<span style="color:#e74c3c;">Email und Passwort erforderlich</span>'; return; }
        if (password.length < 8) { result.innerHTML = '<span style="color:#e74c3c;">Passwort min. 8 Zeichen</span>'; return; }

        result.innerHTML = '<span style="color:#E8C4A8;">Erstelle...</span>';
        try {
            const s = this.getSession();
            const res = await fetch('/api/admin-create-member', {
                method: 'POST',
                headers: { 'Content-Type':'application/json', 'X-Admin-Email':s.email, 'X-Admin-Password':s.password },
                body: JSON.stringify({ email, password, fullName, markAsPaid })
            });
            const d = await res.json();
            if (res.ok && d.success) {
                result.innerHTML = `<span style="color:#2ecc71;">✅ ${this.escapeHtml(d.message)}</span>`;
                document.getElementById('newMemberEmail').value = '';
                document.getElementById('newMemberPassword').value = '';
                document.getElementById('newMemberName').value = '';
                this.loadUsersData();
            } else {
                result.innerHTML = `<span style="color:#e74c3c;">❌ ${this.escapeHtml(d.error||'Fehler')}</span>`;
            }
        } catch (e) { console.error(e); result.innerHTML = '<span style="color:#e74c3c;">❌ Verbindungsfehler</span>'; }
    }

    // ========== EASTER EGG CONTROLS ==========
    renderIndividualUserControls(users) {
        const container = document.getElementById('individualUserControls');
        if (!container) return;
        container.innerHTML = '';

        const regular = users.filter(u => u.email !== this.ceoEmail);
        const countEl = document.getElementById('memberCount');
        if (countEl) countEl.textContent = `${regular.length} Members`;

        if (!regular.length) { container.innerHTML = '<p style="color:#888;text-align:center;padding:1rem;">Keine Members</p>'; return; }

        const now = Date.now();
        regular.forEach(u => {
            const email = this.escapeHtml(u.email);
            const name = this.escapeHtml(u.full_name || u.name || '');
            const display = name || email.split('@')[0];
            const lastSeen = u.last_seen ? new Date(u.last_seen) : null;
            const online = lastSeen && (now - lastSeen.getTime()) < 300000;
            const lastText = lastSeen ? this.formatTimeAgo(lastSeen) : 'Nie';
            const paidText = u.paid_at ? new Date(u.paid_at).toLocaleDateString('de-CH') : '—';
            const regText = u.created_at ? new Date(u.created_at).toLocaleDateString('de-CH') : '—';

            const card = document.createElement('div');
            card.className = 'user-control-card';
            card.dataset.userEmail = u.email.toLowerCase();
            card.dataset.userName = (u.full_name||u.name||'').toLowerCase();

            card.innerHTML = `
                <div class="user-control-header" style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
                    <div style="flex:1;">
                        <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
                            <span style="width:8px;height:8px;border-radius:50%;background:${online?'#2ecc71':'#444'};display:inline-block;${online?'box-shadow:0 0 6px rgba(46,204,113,.5);':''}"></span>
                            <span style="font-weight:600;font-size:14px;color:#E8C4A8;">${display}</span>
                        </div>
                        <div style="font-size:11px;color:#777;margin-left:14px;">${email}</div>
                    </div>
                    <span class="user-control-status ${u.has_paid?'paid':'free'}">${u.has_paid?'Paid':'Free'}</span>
                </div>
                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:8px 0;padding:8px;background:rgba(255,255,255,.015);border-radius:6px;">
                    <div style="text-align:center;"><div style="font-size:9px;color:#666;text-transform:uppercase;">Reg.</div><div style="font-size:12px;color:#bbb;">${regText}</div></div>
                    <div style="text-align:center;"><div style="font-size:9px;color:#666;text-transform:uppercase;">Login</div><div style="font-size:12px;color:${online?'#2ecc71':'#bbb'};">${lastText}</div></div>
                    <div style="text-align:center;"><div style="font-size:9px;color:#666;text-transform:uppercase;">Payment</div><div style="font-size:12px;color:${u.paid_at?'#2ecc71':'#e74c3c'};">${paidText}</div></div>
                </div>
                <div class="easter-egg-features">
                    ${['eye','chat'].map(feat => {
                        const unlocked = feat === 'chat' ? (u.chat_ready || u.chat_unlocked) : u[feat+'_unlocked'];
                        const icon = feat === 'eye' ? '👁️' : '💬';
                        return `<div class="feature-control">
                            <div class="feature-control-header">
                                <span class="feature-name">${icon} ${feat.charAt(0).toUpperCase()+feat.slice(1)}</span>
                                <div class="feature-status">
                                    <span class="status-indicator ${unlocked?'unlocked':'locked'}"></span>
                                    <span class="status-text">${unlocked?'On':'Off'}</span>
                                </div>
                            </div>
                            <div class="feature-buttons">
                                <button class="feature-toggle-btn unlock" onclick="adminPanel.toggleFeature('${email}','${feat}',true)" ${unlocked?'disabled':''}>On</button>
                                <button class="feature-toggle-btn lock" onclick="adminPanel.toggleFeature('${email}','${feat}',false)" ${!unlocked?'disabled':''}>Off</button>
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            `;
            container.appendChild(card);
        });

        // Search
        const searchInput = document.getElementById('easterEggUserSearch');
        if (searchInput) {
            const newI = searchInput.cloneNode(true);
            searchInput.parentNode.replaceChild(newI, searchInput);
            newI.addEventListener('input', e => {
                const term = e.target.value.toLowerCase();
                let visible = 0;
                container.querySelectorAll('.user-control-card').forEach(c => {
                    const match = c.dataset.userEmail.includes(term) || c.dataset.userName.includes(term);
                    c.style.display = match ? '' : 'none';
                    if (match) visible++;
                });
                if (countEl) countEl.textContent = term ? `${visible}/${regular.length}` : `${regular.length} Members`;
            });
        }
    }

    async toggleFeature(email, feature, unlock) {
        try {
            const s = this.getSession();
            const res = await fetch('/api/admin-toggle-easter-eggs', {
                method: 'POST',
                headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${s.email}` },
                body: JSON.stringify({ action: unlock?'unlock':'lock', feature, email })
            });
            if (res.ok) { this.loadUsersData(); }
            else { const d = await res.json(); alert(`❌ ${d.error||'Fehler'}`); }
        } catch (e) { console.error(e); alert('❌ Fehler'); }
    }

    setupBulkEasterEggControls() {
        document.querySelectorAll('.bulk-unlock-btn, .bulk-lock-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handleBulkAction(btn.dataset.action, btn.dataset.feature));
        });
    }

    async handleBulkAction(action, feature) {
        const names = { pyramid:'Pyramid', eye:'Eye', chat:'Chat', all:'Alle Features' };
        if (!confirm(`${action==='unlock-all'?'UNLOCK':'LOCK'} ${names[feature]} für ALLE Members?`)) return;
        try {
            const s = this.getSession();
            const res = await fetch('/api/admin-toggle-easter-eggs', {
                method: 'POST',
                headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${s.email}` },
                body: JSON.stringify({ action, feature })
            });
            const d = await res.json();
            if (res.ok) { alert(`✅ ${d.message} (${d.affectedUsers} User)`); this.loadUsersData(); }
            else { alert(`❌ ${d.error}`); }
        } catch (e) { console.error(e); alert('❌ Fehler'); }
    }

    // ========== CHAT ==========
    async loadChatData() {
        try {
            const res = await fetch('/api/chat?ceo=true');
            if (!res.ok) return;
            const data = await res.json();
            if (!data.messages || !Array.isArray(data.messages)) {
                document.getElementById('totalMessages').textContent = '0';
                document.getElementById('todayMessages').textContent = '0';
                document.getElementById('chatUsers').textContent = '0';
                return;
            }
            document.getElementById('totalMessages').textContent = data.messages.length;
            const today = new Date().toDateString();
            document.getElementById('todayMessages').textContent = data.messages.filter(m => new Date(m.created_at).toDateString() === today).length;
            document.getElementById('chatUsers').textContent = new Set(data.messages.map(m => m.email)).size;

            const container = document.getElementById('adminChatMessages');
            container.innerHTML = '';
            data.messages.reverse().forEach(msg => {
                const div = document.createElement('div');
                div.className = 'admin-message';
                div.innerHTML = `
                    <div class="msg-header">
                        <strong>${this.escapeHtml(msg.username)}</strong>
                        <span>${this.escapeHtml(msg.email)}</span>
                        <span>${new Date(msg.created_at).toLocaleString('de-CH')}</span>
                    </div>
                    <div class="msg-content">${this.escapeHtml(msg.message || '[File]')}</div>
                    <button class="delete-msg-btn" onclick="adminPanel.deleteMessage(${msg.id})">Löschen</button>
                `;
                container.appendChild(div);
            });

            // Attach refresh button
            const refBtn = document.getElementById('refreshChat');
            if (refBtn) {
                const newBtn = refBtn.cloneNode(true);
                refBtn.parentNode.replaceChild(newBtn, refBtn);
                newBtn.addEventListener('click', () => this.loadChatData());
            }
        } catch (e) { console.error('Chat error:', e); }
    }

    async deleteMessage(id) {
        if (!confirm('Nachricht löschen?')) return;
        try {
            const res = await fetch('/api/admin-delete-message', {
                method: 'DELETE',
                headers: { 'Content-Type':'application/json' },
                body: JSON.stringify({ messageId: id })
            });
            if (res.ok) this.loadChatData();
        } catch (e) { console.error(e); }
    }

    // ========== PAYMENTS ==========
    async loadPaymentsData() {
        try {
            const s = this.getSession();
            const res = await fetch('/api/admin-payments', {
                headers: { 'X-Admin-Email':s.email, 'X-Admin-Password':s.password }
            });
            const data = await res.json();

            const fmt = a => new Intl.NumberFormat('de-CH',{style:'currency',currency:'CHF',minimumFractionDigits:0,maximumFractionDigits:0}).format(a);
            document.getElementById('totalRevenue').textContent = fmt(data.totalRevenue||0);
            document.getElementById('stripePayments').textContent = data.stripeCount||0;
            document.getElementById('cryptoPayments').textContent = data.cryptoCount||0;

            const tbody = document.getElementById('paymentsTableBody');
            tbody.innerHTML = '';
            if (data.payments && data.payments.length) {
                data.payments.forEach(p => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${new Date(p.created_at).toLocaleDateString('de-CH')}</td>
                        <td>${this.escapeHtml(p.email)}</td>
                        <td>${fmt(p.amount)}</td>
                        <td><span class="payment-method-badge ${p.method}">${p.method}</span></td>
                        <td><span class="status-badge ${p.status==='refunded'?'refunded':'paid'}">${p.status}</span></td>
                    `;
                    tbody.appendChild(tr);
                });
            } else {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#888;">Keine Zahlungen</td></tr>';
            }
        } catch (e) {
            console.error('Payments error:', e);
            document.getElementById('totalRevenue').textContent = 'CHF 0';
        }
    }

    // ========== STATS ==========
    async loadStatsData() {
        try {
            const s = this.getSession();
            const res = await fetch('/api/admin-stats', {
                headers: { 'X-Admin-Email':s.email, 'X-Admin-Password':s.password }
            });
            const data = await res.json();
            document.getElementById('statsRegistered').textContent = data.registered||0;
            document.getElementById('statsPaid').textContent = data.paid||0;
            document.getElementById('statsPyramid').textContent = data.pyramid||0;
            document.getElementById('statsEye').textContent = data.eye||0;
            document.getElementById('statsChat').textContent = data.chat||0;
        } catch (e) { console.error('Stats error:', e); }
    }

    async loadEnhancedAnalytics() {
        const s = this.getSession();
        if (!s) return;
        try {
            const res = await fetch('/api/admin-analytics', {
                headers: { 'x-admin-email':s.email, 'x-admin-password':s.password }
            });
            if (!res.ok) return;
            const a = await res.json();
            const section = document.getElementById('analyticsSection');
            if (!section) return;
            section.innerHTML = `
                <h3>Enhanced Analytics</h3>
                <div class="analytics-grid">
                    <div class="analytics-card">
                        <h4>Revenue</h4>
                        <p>Total: CHF ${(a.revenue?.total_revenue||0).toLocaleString()}</p>
                        <p>Durchschnitt: CHF ${(a.revenue?.avg_payment||0).toLocaleString()}</p>
                        <p>Conversion: ${a.conversion?.conversionRate||0}%</p>
                    </div>
                    <div class="analytics-card">
                        <h4>User Engagement</h4>
                        <p>Aktiv (30d): ${a.users?.activeUsers||0}</p>
                        <p>Neu (7d): ${a.users?.recentRegistrations||0}</p>
                    </div>
                    <div class="analytics-card">
                        <h4>Chat</h4>
                        <p>Messages: ${a.chat?.total_messages||0}</p>
                        <p>User: ${a.chat?.unique_users||0}</p>
                    </div>
                </div>
            `;
        } catch (e) { console.error('Analytics error:', e); }
    }

    // ========== EMERGENCY ==========
    async checkEmergencyMode() {
        try {
            const res = await fetch('/api/check-emergency');
            const data = await res.json();
            this.updateEmergencyButton(data.isActive);
        } catch (e) { console.error(e); }
    }

    updateEmergencyButton(active) {
        const btn = document.getElementById('emergencyBtn');
        const text = btn.querySelector('.emergency-text');
        btn.dataset.active = active;
        text.textContent = active ? 'EMERGENCY: AN' : 'Emergency: OFF';
    }

    async toggleEmergencyMode() {
        const btn = document.getElementById('emergencyBtn');
        const isActive = btn.dataset.active === 'true';
        const msg = isActive ? 'Website ONLINE bringen?' : 'EMERGENCY SHUTDOWN aktivieren?\nAlle User sehen 404!';
        if (!confirm(msg)) return;
        try {
            const res = await fetch('/api/admin-emergency', {
                method: 'POST',
                headers: { 'Content-Type':'application/json' },
                body: JSON.stringify({ email: this.ceoEmail, mode: isActive ? 'deactivate' : 'activate' })
            });
            if (res.ok) {
                this.updateEmergencyButton(!isActive);
                alert(isActive ? '✅ Website ONLINE' : '🚨 Emergency Mode AKTIV');
            }
        } catch (e) { console.error(e); }
    }

    // ========== 2FA ==========
    show2FAPrompt(email, password) {
        const code = prompt('6-stelliger 2FA Code:');
        if (code) this.verify2FAAndLogin(email, password, code);
    }

    async verify2FAAndLogin(email, password, code) {
        try {
            const res = await fetch('/api/admin-auth', {
                method: 'POST',
                headers: { 'Content-Type':'application/json' },
                body: JSON.stringify({ email, password, twoFactorCode: code })
            });
            if (res.ok) {
                const data = await res.json();
                sessionStorage.setItem('adminSession', JSON.stringify({ email: data.email, password }));
                this.showDashboard(data.email);
            } else { alert('Ungültiger Code'); this.show2FAPrompt(email, password); }
        } catch (e) { console.error(e); alert('2FA Fehler'); }
    }

    // ========== SECURITY TAB ==========
    async loadSecurityTab() {
        await this.load2FAStatus();
        await this.loadBlockedIPs();
        this.loadRateLimitStats();
        this.setup2FAHandlers();
        this.setupIPBlockingHandlers();
    }

    async load2FAStatus() {
        try {
            const s = this.getSession();
            await fetch('/api/admin-2fa-setup', {
                method: 'POST',
                headers: { 'Content-Type':'application/json' },
                body: JSON.stringify({ email: this.ceoEmail, password: s?.password||'', action:'status' })
            });
            document.getElementById('2faStatusText').textContent = '2FA: Deaktiviert';
            document.getElementById('enable2FA').classList.remove('hidden');
            document.getElementById('disable2FA').classList.add('hidden');
        } catch (e) { console.error(e); }
    }

    setup2FAHandlers() {
        const e2fa = document.getElementById('enable2FA');
        const d2fa = document.getElementById('disable2FA');
        const v2fa = document.getElementById('verify2FA');
        if (e2fa) { const n = e2fa.cloneNode(true); e2fa.parentNode.replaceChild(n,e2fa); n.addEventListener('click',()=>this.start2FASetup()); }
        if (d2fa) { const n = d2fa.cloneNode(true); d2fa.parentNode.replaceChild(n,d2fa); n.addEventListener('click',()=>this.disable2FA()); }
        if (v2fa) { const n = v2fa.cloneNode(true); v2fa.parentNode.replaceChild(n,v2fa); n.addEventListener('click',()=>this.verify2FASetup()); }
    }

    async start2FASetup() {
        try {
            const s = this.getSession();
            const res = await fetch('/api/admin-2fa-setup', {
                method: 'POST',
                headers: { 'Content-Type':'application/json' },
                body: JSON.stringify({ email: this.ceoEmail, password: s?.password||'', action:'generate' })
            });
            const data = await res.json();
            if (data.success) {
                document.getElementById('twoFactorSetup').classList.remove('hidden');
                new QRCode(document.getElementById('qrCodeCanvas'), { text: data.qrCodeUrl, width: 256, height: 256 });
                const backupDiv = document.getElementById('backupCodes');
                backupDiv.style.display = 'block';
                document.getElementById('backupCodesList').innerHTML = data.backupCodes.map(c => `<div class="backup-code">${c}</div>`).join('');
                document.getElementById('enable2FA').classList.add('hidden');
            }
        } catch (e) { console.error(e); alert('2FA Setup fehlgeschlagen'); }
    }

    async verify2FASetup() {
        const code = document.getElementById('verificationCode').value;
        if (!code || code.length !== 6) { alert('6-stelliger Code erforderlich'); return; }
        try {
            const s = this.getSession();
            const res = await fetch('/api/admin-2fa-setup', {
                method: 'POST',
                headers: { 'Content-Type':'application/json' },
                body: JSON.stringify({ email: this.ceoEmail, password: s?.password||'', action:'verify', code })
            });
            const data = await res.json();
            if (data.success) { alert('✅ 2FA aktiviert!'); location.reload(); }
            else { alert('Ungültiger Code'); }
        } catch (e) { console.error(e); }
    }

    async disable2FA() {
        const code = prompt('Code/Backup-Code eingeben:');
        if (!code) return;
        try {
            const s = this.getSession();
            const res = await fetch('/api/admin-2fa-setup', {
                method: 'POST',
                headers: { 'Content-Type':'application/json' },
                body: JSON.stringify({ email: this.ceoEmail, password: s?.password||'', action:'disable', code })
            });
            const data = await res.json();
            if (data.success) { alert('2FA deaktiviert'); location.reload(); }
            else { alert('Ungültiger Code'); }
        } catch (e) { console.error(e); }
    }

    setupIPBlockingHandlers() {
        const btn = document.getElementById('blockIpBtn');
        if (btn) { const n = btn.cloneNode(true); btn.parentNode.replaceChild(n,btn); n.addEventListener('click',()=>this.blockIP()); }
    }

    async blockIP() {
        const ip = document.getElementById('blockIpAddress').value.trim();
        const reason = document.getElementById('blockReason').value.trim();
        const duration = document.getElementById('blockDuration').value;
        if (!ip) { alert('IP-Adresse eingeben'); return; }
        try {
            const res = await fetch('/api/block-ip', {
                method: 'POST',
                headers: { 'Content-Type':'application/json' },
                body: JSON.stringify({ ip, reason, duration: duration?parseInt(duration):null, adminEmail: this.ceoEmail })
            });
            const d = await res.json();
            if (d.success) { alert('✅ IP blockiert'); document.getElementById('blockIpAddress').value = ''; document.getElementById('blockReason').value = ''; this.loadBlockedIPs(); }
        } catch (e) { console.error(e); }
    }

    async loadBlockedIPs() {
        try {
            const res = await fetch('/api/admin-blocked-ips', { headers: { 'Authorization':'Bearer admin' } });
            const data = await res.json();
            if (data.success) {
                const list = document.getElementById('blockedIpsList');
                if (!data.blockedIps.length) { list.innerHTML = '<p style="color:#888;text-align:center;padding:1rem;">Keine blockierten IPs</p>'; return; }
                list.innerHTML = data.blockedIps.map(i => `
                    <div class="blocked-ip-item">
                        <div class="blocked-ip-info">
                            <div class="blocked-ip-address">${i.ip}</div>
                            <div class="blocked-ip-reason">${i.reason||''}</div>
                            <div class="blocked-ip-meta">${new Date(i.blocked_at).toLocaleString('de-CH')} | ${i.expires_at?'Bis: '+new Date(i.expires_at).toLocaleString('de-CH'):'Permanent'}</div>
                        </div>
                        <span class="ip-status-badge ${i.is_active?'active':'expired'}">${i.is_active?'AKTIV':'EXPIRED'}</span>
                        ${i.is_active?`<button class="btn-sm btn-green" onclick="adminPanel.unblockIP('${i.ip}')">Unblock</button>`:''}
                    </div>
                `).join('');
            }
        } catch (e) { console.error(e); }
    }

    async unblockIP(ip) {
        if (!confirm(`IP ${ip} entsperren?`)) return;
        try {
            const res = await fetch('/api/block-ip', {
                method: 'POST',
                headers: { 'Content-Type':'application/json' },
                body: JSON.stringify({ ip, action:'unblock', adminEmail: this.ceoEmail })
            });
            if ((await res.json()).success) { alert('✅ IP entsperrt'); this.loadBlockedIPs(); }
        } catch (e) { console.error(e); }
    }

    loadRateLimitStats() {
        document.getElementById('totalRequests').textContent = '—';
        document.getElementById('blockedRequests').textContent = '—';
        document.getElementById('autoBlockedIps').textContent = '—';
    }

    // ========== AUDIT ==========
    async loadAuditTab() {
        await this.loadAuditLogs();
        const btn = document.getElementById('refreshAuditLogs');
        if (btn) { const n = btn.cloneNode(true); btn.parentNode.replaceChild(n,btn); n.addEventListener('click',()=>this.loadAuditLogs()); }
    }

    async loadAuditLogs() {
        const action = document.getElementById('auditActionFilter')?.value || '';
        const limit = document.getElementById('auditLimit')?.value || 100;
        try {
            const url = `/api/admin-audit-logs?limit=${limit}${action?'&action='+action:''}`;
            const res = await fetch(url, { headers: { 'Authorization':'Bearer admin' } });
            const data = await res.json();
            if (data.success) {
                document.getElementById('auditStats').innerHTML = (data.stats||[]).map(s => `
                    <div class="stat-item"><span class="stat-label">${s.action}</span><span class="stat-value">${s.count}</span></div>
                `).join('');

                const list = document.getElementById('auditLogsList');
                if (!data.logs.length) { list.innerHTML = '<p style="color:#888;text-align:center;padding:1rem;">Keine Logs</p>'; return; }
                list.innerHTML = data.logs.map(l => `
                    <div class="audit-log-item">
                        <div class="audit-timestamp">${new Date(l.timestamp).toLocaleString('de-CH')}</div>
                        <div class="audit-action">${l.action}</div>
                        <div><div class="audit-user">${l.user_email||'System'}</div><div class="audit-ip">${l.ip||''}</div></div>
                        <div class="audit-details">${l.details||'—'}</div>
                    </div>
                `).join('');
            }
        } catch (e) { console.error('Audit error:', e); }
    }

    // ========== EXPORT BUTTONS ==========
    setupExportButtons() {
        // Dynamically add export buttons to tabs
        const addExport = (tabSel, type, format, label) => {
            const tab = document.querySelector(tabSel);
            if (tab && !tab.querySelector('.export-buttons')) {
                const div = document.createElement('div');
                div.className = 'export-buttons';
                div.innerHTML = `<button onclick="adminPanel.exportData('${type}','${format}')" class="export-btn">${label}</button>`;
                tab.insertBefore(div, tab.firstChild);
            }
        };
        // Only add to payments and audit (users has CSV button already)
        addExport('#tab-payments', 'payments', 'csv', 'CSV Export');
        addExport('#auditTab', 'audit-logs', 'json', 'JSON Export');
    }

    async exportData(type, format) {
        const s = this.getSession();
        if (!s) { alert('Session abgelaufen'); location.reload(); return; }
        try {
            const res = await fetch(`/api/admin-export?type=${type}&format=${format}`, {
                headers: { 'x-admin-email':s.email, 'x-admin-password':s.password }
            });
            if (!res.ok) throw new Error('Export fehlgeschlagen');
            const blob = await res.blob();
            const cd = res.headers.get('Content-Disposition');
            const match = cd?.match(/filename="(.+)"/);
            const filename = match ? match[1] : `export-${type}.${format}`;
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = filename;
            a.click();
            URL.revokeObjectURL(a.href);
        } catch (e) { console.error(e); alert('❌ Export fehlgeschlagen'); }
    }

    // ========== BROADCAST ==========
    setupBroadcastButton() { /* Broadcast button is in topbar if needed */ }

    showBroadcastModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'broadcastModal';
        modal.innerHTML = `
            <div class="modal-content broadcast-modal">
                <h2>Broadcast Notification</h2>
                <form id="broadcastForm">
                    <div class="form-group"><label>Zielgruppe:</label><select id="broadcastAudience" required><option value="all">Alle</option><option value="paid">Paid</option><option value="unpaid">Free</option></select></div>
                    <div class="form-group"><label>Titel:</label><input type="text" id="broadcastTitle" maxlength="50" required></div>
                    <div class="form-group"><label>Nachricht:</label><textarea id="broadcastMessage" maxlength="200" rows="3" required></textarea></div>
                    <div class="form-actions">
                        <button type="submit" class="btn-primary">Senden</button>
                        <button type="button" class="btn-secondary" onclick="document.getElementById('broadcastModal').remove()">Abbrechen</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        document.getElementById('broadcastForm').addEventListener('submit', e => { e.preventDefault(); this.sendBroadcast(); });
    }

    async sendBroadcast() {
        const s = this.getSession();
        const title = document.getElementById('broadcastTitle').value.trim();
        const message = document.getElementById('broadcastMessage').value.trim();
        const audience = document.getElementById('broadcastAudience').value;
        if (!confirm(`Broadcast an "${audience}" senden?`)) return;
        try {
            const res = await fetch('/api/admin-broadcast', {
                method: 'POST',
                headers: { 'Content-Type':'application/json', 'x-admin-email':s.email, 'x-admin-password':s.password },
                body: JSON.stringify({ title, message, url:'/', icon:'/assets/images/icon-192x192.png', targetAudience: audience })
            });
            const d = await res.json();
            if (res.ok && d.success) { alert(`✅ Gesendet: ${d.sent}/${d.total}`); document.getElementById('broadcastModal').remove(); }
            else { alert(`❌ ${d.error}`); }
        } catch (e) { console.error(e); alert('❌ Fehler'); }
    }

    // ========== DELETE ALL / TEST USERS ==========
    async deleteAllUsers() {
        const c = prompt('⚠️ ALLE User löschen (ausser CEO)?\n\nTippe "DELETE ALL":');
        if (c !== 'DELETE ALL') { if (c !== null) alert('Abgebrochen'); return; }
        if (!confirm('LETZTE WARNUNG!\nAlle User permanent löschen?')) return;
        try {
            const s = this.getSession();
            const res = await fetch('/api/admin-delete-users', {
                method: 'POST',
                headers: { 'Content-Type':'application/json' },
                body: JSON.stringify({ adminEmail:s.email, adminPassword:s.password })
            });
            const d = await res.json();
            if (res.ok && d.success) { alert(`✅ ${d.deleted_count} User gelöscht`); this.loadUsersData(); }
            else { alert(`❌ ${d.error}`); }
        } catch (e) { console.error(e); alert('❌ Fehler'); }
    }

    async createTestUsers() {
        if (!confirm('2 Test-User erstellen?')) return;
        try {
            const s = this.getSession();
            const res = await fetch('/api/create-test-users', {
                headers: { 'x-admin-email':s.email, 'x-admin-password':s.password }
            });
            const d = await res.json();
            if (res.ok && d.success) { alert(`✅ ${d.message}`); this.loadUsersData(); }
            else { alert(`❌ ${d.error}`); }
        } catch (e) { console.error(e); alert('❌ Fehler'); }
    }
}

// Init
const adminPanel = new AdminPanel();
window.admin = adminPanel;

