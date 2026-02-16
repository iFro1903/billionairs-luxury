// BILLIONAIRS CEO Admin Panel — Redesign
class AdminPanel {
    constructor() {
        this.ceoEmail = 'furkan_akaslan@hotmail.com';
        this.currentTab = 'users';
        this.users = [];
        this.autoRefreshTimer = null;
        this._cache = {};          // { key: { data, ts } }
        this._cacheTTL = 30000;    // 30 Sekunden
        this.init();
    }

    // ========== HELPERS ==========
    debounce(fn, ms = 300) {
        let timer;
        return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn.apply(this, args), ms); };
    }

    _cacheSet(key, data) { this._cache[key] = { data, ts: Date.now() }; }
    _cacheGet(key) {
        const entry = this._cache[key];
        if (!entry) return null;
        if (Date.now() - entry.ts > this._cacheTTL) { delete this._cache[key]; return null; }
        return entry.data;
    }
    _cacheInvalidate(key) { if (key) delete this._cache[key]; else this._cache = {}; }

    escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
    }

    // ========== TOAST NOTIFICATIONS ==========
    toast(message, type = 'success', duration = 3500) {
        const container = document.getElementById('toastContainer');
        if (!container) { console.warn('Toast container missing'); return; }
        const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <span class="toast-body">${this.escapeHtml(message)}</span>
            <button class="toast-close" aria-label="Schließen">&times;</button>
            <span class="toast-progress" style="animation-duration:${duration}ms"></span>
        `;
        toast.querySelector('.toast-close').addEventListener('click', () => this._removeToast(toast));
        container.appendChild(toast);
        requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('show')));
        setTimeout(() => this._removeToast(toast), duration);
    }
    _removeToast(el) {
        if (!el || el._removing) return;
        el._removing = true;
        el.classList.remove('show');
        el.classList.add('hide');
        setTimeout(() => el.remove(), 400);
    }

    // ========== CONFIRM DIALOG ==========
    confirmDialog(message, icon = '⚠️') {
        return new Promise(resolve => {
            const overlay = document.createElement('div');
            overlay.className = 'confirm-overlay';
            overlay.innerHTML = `
                <div class="confirm-dialog">
                    <div class="confirm-icon">${icon}</div>
                    <div class="confirm-msg">${this.escapeHtml(message)}</div>
                    <div class="confirm-actions">
                        <button class="confirm-btn no">Abbrechen</button>
                        <button class="confirm-btn yes">Bestätigen</button>
                    </div>
                </div>
            `;
            const close = (val) => { overlay.remove(); resolve(val); };
            overlay.querySelector('.confirm-btn.yes').addEventListener('click', () => close(true));
            overlay.querySelector('.confirm-btn.no').addEventListener('click', () => close(false));
            overlay.addEventListener('click', e => { if (e.target === overlay) close(false); });
            document.body.appendChild(overlay);
            overlay.querySelector('.confirm-btn.yes').focus();
        });
    }

    // ========== LOADING SPINNER ==========
    showLoading(container, text = 'Laden...') {
        if (typeof container === 'string') container = document.querySelector(container);
        if (!container) return;
        container.style.position = container.style.position || 'relative';
        if (container.querySelector('.loading-overlay')) return;
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `<div class="loading-spinner"></div><span class="loading-text">${this.escapeHtml(text)}</span>`;
        container.appendChild(overlay);
    }
    hideLoading(container) {
        if (typeof container === 'string') container = document.querySelector(container);
        if (!container) return;
        const overlay = container.querySelector('.loading-overlay');
        if (overlay) overlay.remove();
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
        try {
            const raw = JSON.parse(sessionStorage.getItem('adminSession'));
            if (!raw) return null;
            return { email: raw.email, password: raw.p ? atob(raw.p) : raw.password };
        } catch { return null; }
    }

    setSession(email, password) {
        sessionStorage.setItem('adminSession', JSON.stringify({ email, p: btoa(password) }));
    }

    // Escape for safe use in data-attributes
    safeAttr(str) {
        return String(str).replace(/&/g,'&amp;').replace(/'/g,'&#39;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
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
                this.setSession(data.email, password);
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

        // Refresh button (always force-reload)
        const refBtn = document.getElementById('refreshUsersBtn');
        if (refBtn) refBtn.addEventListener('click', () => { this._cacheInvalidate(); this.loadUsersData(); });

        // Auto-refresh toggle
        const arToggle = document.getElementById('autoRefreshToggle');
        if (arToggle) arToggle.addEventListener('change', e => this.setAutoRefresh(e.target.checked));

        // User search (debounced)
        const searchInput = document.getElementById('userSearch');
        if (searchInput) {
            this._debouncedFilter = this.debounce(() => this.filterUsersTable(), 300);
            searchInput.addEventListener('input', () => this._debouncedFilter());
        }

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

        // Load data (use cache if fresh)
        if (tab === 'users' || tab === 'easter-eggs') {
            if (this._cacheGet('users')) { this.renderUsersTable(this.users); this.renderIndividualUserControls(this.users); }
            else this.loadUsersData();
        }
        if (tab === 'chat') {
            if (!this._cacheGet('chat')) this.loadChatData();
        }
        if (tab === 'payments') {
            if (!this._cacheGet('payments')) this.loadPaymentsData();
        }
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
        const main = document.querySelector('main');
        this.showLoading(main, 'Lade Mitglieder...');
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
            this._cacheSet('users', true);
        } catch (e) {
            console.error('Error loading users:', e);
        } finally {
            this.hideLoading(document.querySelector('main'));
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
                <td data-label="Email">${email}</td>
                <td data-label="Name">${name}</td>
                <td data-label="Registriert">${new Date(u.created_at).toLocaleDateString('de-CH')}</td>
                <td data-label="Timer">${timer}</td>
                <td data-label="Status">
                    <select class="status-select" onchange="adminPanel.updateMemberStatus('${email}',this.value,this)"
                        style="background:${sc.bg};color:${sc.c};border:1px solid ${sc.b};border-radius:20px;padding:3px 8px;font-size:11px;font-weight:600;cursor:pointer;outline:none;">
                        <option value="paid" ${status==='paid'?'selected':''}>Paid</option>
                        <option value="pending" ${status==='pending'?'selected':''}>Pending</option>
                        <option value="free" ${status==='free'?'selected':''}>Free</option>
                    </select>
                </td>
                <td data-label="Features" style="font-size:12px;">
                    ${u.pyramid_unlocked?'🔓':'🔒'}P ${u.eye_unlocked?'🔓':'🔒'}E ${u.chat_ready||u.chat_unlocked?'🔓':'🔒'}C
                    ${u.twofa_enabled?'<span style="color:#2ecc71;" title="2FA aktiv">🔐</span>':''}
                    ${u.is_blocked?'<span style="color:#e74c3c;"> 🚫</span>':''}
                </td>
                <td data-label="Aktionen">
                    <button class="tbl-btn primary" data-action="view" data-email="${this.safeAttr(u.email)}">Details</button>
                    ${u.is_blocked
                        ? `<button class="tbl-btn success" data-action="unblock" data-email="${this.safeAttr(u.email)}">Unblock</button>`
                        : `<button class="tbl-btn" data-action="block" data-email="${this.safeAttr(u.email)}">Block</button>`
                    }
                    <button class="tbl-btn danger" data-action="delete" data-email="${this.safeAttr(u.email)}">Del</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Event delegation for table action buttons
        tbody.addEventListener('click', e => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            const action = btn.dataset.action;
            const em = btn.dataset.email;
            if (action === 'view') this.viewUser(em);
            else if (action === 'block') this.blockUser(em);
            else if (action === 'unblock') this.unblockUser(em);
            else if (action === 'delete') this.deleteUser(em);
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
        if (!this.users.length) { this.toast('Keine User-Daten vorhanden', 'warning'); return; }
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
    async viewUser(email) {
        const user = this.users.find(u => u.email === email);
        if (!user) { this.toast('User nicht gefunden', 'error'); return; }

        // Store current user for PDF language detection
        this._currentUser = user;

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
            <div class="detail-row"><span class="detail-label">2FA</span><span class="detail-value" style="${user.twofa_enabled ? 'color:#2ecc71' : ''}">${user.twofa_enabled ? '🔐 Aktiv' : 'Deaktiviert'}</span></div>
            <div class="detail-row"><span class="detail-label">Blockiert</span><span class="detail-value">${user.is_blocked ? '🚫 Ja' : 'Nein'}</span></div>
            <div class="detail-row"><span class="detail-label">Phone</span><span class="detail-value">${this.escapeHtml(user.phone || '—')}</span></div>
            <div class="detail-row"><span class="detail-label">Company</span><span class="detail-value">${this.escapeHtml(user.company || '—')}</span></div>

            <!-- NDA Signature Section -->
            <div class="nda-section" id="ndaSection" style="margin-top:1.5rem;padding:1rem;border:1px solid rgba(201,169,110,0.3);border-radius:8px;background:rgba(201,169,110,0.05);">
                <h4 style="color:#c9a96e;font-size:.9rem;margin-bottom:.75rem;display:flex;align-items:center;gap:.5rem;">
                    📜 NDA-Vereinbarung
                    <span id="ndaLoadingSpinner" style="font-size:.7rem;color:rgba(255,255,255,0.4);">Laden...</span>
                </h4>
                <div id="ndaContent" style="color:rgba(255,255,255,0.6);font-size:.8rem;">—</div>
            </div>

            <div class="notes-section">
                <h4 style="color:#E8C4A8;font-size:.9rem;margin-bottom:.5rem;">Notizen</h4>
                <textarea id="memberNotes" placeholder="Interne Notizen...">${this.escapeHtml(user.admin_notes || '')}</textarea>
                <button class="btn-sm btn-gold" style="margin-top:.5rem;" data-modal-action="save-notes" data-email="${this.safeAttr(user.email)}">Speichern</button>
            </div>

            <div class="modal-actions">
                <button class="btn-sm btn-gold" data-modal-action="send-email" data-email="${this.safeAttr(user.email)}">📧 Email senden</button>
                ${user.is_blocked
                    ? `<button class="btn-sm btn-green" data-modal-action="unblock" data-email="${this.safeAttr(user.email)}">Unblock</button>`
                    : `<button class="btn-sm btn-red" data-modal-action="block" data-email="${this.safeAttr(user.email)}">Block</button>`
                }
                ${user.twofa_enabled
                    ? `<button class="btn-sm" style="background:rgba(243,156,18,.2);color:#f39c12;border:1px solid #f39c12;" data-modal-action="reset-2fa" data-email="${this.safeAttr(user.email)}">2FA Reset</button>`
                    : ''}
                <button class="btn-sm btn-red" data-modal-action="delete" data-email="${this.safeAttr(user.email)}">Löschen</button>
            </div>
        `;

        modal.classList.remove('hidden');

        // Load NDA signature asynchronously
        this.loadNdaSignature(email);

        // Event delegation for modal action buttons
        body.addEventListener('click', e => {
            const btn = e.target.closest('[data-modal-action]');
            if (!btn) return;
            const act = btn.dataset.modalAction;
            const em = btn.dataset.email;
            if (act === 'save-notes') this.saveNotes(em);
            else if (act === 'send-email') this.sendEmailToUser(em);
            else if (act === 'unblock') { this.unblockUser(em); this.closeModal(); }
            else if (act === 'block') { this.blockUser(em); this.closeModal(); }
            else if (act === 'reset-2fa') { this.reset2FA(em); this.closeModal(); }
            else if (act === 'delete') { this.deleteUser(em); this.closeModal(); }
        });
    }

    async loadNdaSignature(email) {
        const container = document.getElementById('ndaContent');
        const spinner = document.getElementById('ndaLoadingSpinner');
        if (!container) return;

        try {
            const s = this.getSession();
            const res = await fetch(`/api/admin-nda?email=${encodeURIComponent(email)}`, {
                headers: {
                    'X-Admin-Email': s.email,
                    'X-Admin-Password': s.password
                }
            });
            const data = await res.json();
            if (spinner) spinner.style.display = 'none';

            if (!data.success || !data.nda) {
                container.innerHTML = '<span style="color:rgba(255,255,255,0.3);">Keine NDA-Unterschrift vorhanden</span>';
                return;
            }

            const nda = data.nda;
            // Store NDA data for PDF download
            this._currentNda = nda;
            const signedAt = nda.agreed_at ? new Date(nda.agreed_at).toLocaleString('de-CH') : '—';
            const sigId = nda.signature_id || '—';
            const docRef = nda.document_ref || '—';
            const ip = nda.ip_address || '—';

            container.innerHTML = `
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem .75rem;margin-bottom:1rem;">
                    <div><span style="color:rgba(255,255,255,0.4);font-size:.7rem;">Signatur-ID</span><br><span style="color:#c9a96e;">${this.escapeHtml(sigId)}</span></div>
                    <div><span style="color:rgba(255,255,255,0.4);font-size:.7rem;">Dokument</span><br>${this.escapeHtml(docRef)}</div>
                    <div><span style="color:rgba(255,255,255,0.4);font-size:.7rem;">Unterzeichnet am</span><br>${signedAt}</div>
                    <div><span style="color:rgba(255,255,255,0.4);font-size:.7rem;">IP-Adresse</span><br>${this.escapeHtml(ip)}</div>
                    <div><span style="color:rgba(255,255,255,0.4);font-size:.7rem;">Name</span><br>${this.escapeHtml(nda.full_name || '—')}</div>
                    <div><span style="color:rgba(255,255,255,0.4);font-size:.7rem;">Firma</span><br>${this.escapeHtml(nda.company || '—')}</div>
                </div>
                <div style="margin-top:.75rem;">
                    <span style="color:rgba(255,255,255,0.4);font-size:.7rem;">Unterschrift</span>
                    <div style="background:#1a1a2e;border:1px solid rgba(201,169,110,0.2);border-radius:6px;padding:.75rem;margin-top:.25rem;text-align:center;">
                        <img src="${nda.signature_data}" alt="NDA Unterschrift" style="max-width:100%;max-height:120px;filter:brightness(1.2);" />
                    </div>
                </div>
                <div style="margin-top:.75rem;display:flex;gap:.5rem;justify-content:flex-end;">
                    <button class="btn-sm btn-gold" onclick="window.open('${nda.signature_data}','_blank')" style="font-size:.7rem;padding:.25rem .5rem;">🔍 Vollbild</button>
                    <button class="btn-sm btn-gold" onclick="adminPanel.downloadNdaPdf()" style="font-size:.7rem;padding:.25rem .5rem;">📄 PDF herunterladen</button>
                </div>
            `;
        } catch (err) {
            if (spinner) spinner.style.display = 'none';
            container.innerHTML = '<span style="color:#ff6b6b;">Fehler beim Laden der NDA</span>';
            console.error('NDA load error:', err);
        }
    }

    /**
     * Generate and open a personalized NDA PDF document for the current member.
     * Opens a new window with the full NDA text, member data, and signature,
     * then auto-triggers the browser print dialog for Save as PDF.
     */
    downloadNdaPdf() {
        const nda = this._currentNda;
        if (!nda) {
            this.toast('Keine NDA-Daten vorhanden', 'error');
            return;
        }

        const signedAt = nda.agreed_at ? new Date(nda.agreed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A';
        const memberName = this.escapeHtml(nda.full_name || 'N/A');
        const memberEmail = this.escapeHtml(nda.email || 'N/A');
        const memberCompany = this.escapeHtml(nda.company || 'N/A');
        const memberPhone = this.escapeHtml(nda.phone || 'N/A');
        const sigId = this.escapeHtml(nda.signature_id || 'N/A');
        const docRef = this.escapeHtml(nda.document_ref || 'BLX-NDA-2026');
        const ipAddr = this.escapeHtml(nda.ip_address || 'N/A');
        const sigData = nda.signature_data || '';

        // Format date for EES badge (DD.MM.YYYY)
        const eesDate = nda.agreed_at ? new Date(nda.agreed_at).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A';

        // EES signing text in member's language
        const eesTranslations = {
            en: 'EES - Signed via billionairs.luxury',
            de: 'EES - Signiert \u00fcber billionairs.luxury',
            fr: 'EES - Sign\u00e9 via billionairs.luxury',
            es: 'EES - Firmado a trav\u00e9s de billionairs.luxury',
            it: 'EES - Firmato tramite billionairs.luxury',
            ru: 'EES - \u041f\u043e\u0434\u043f\u0438\u0441\u0430\u043d\u043e \u0447\u0435\u0440\u0435\u0437 billionairs.luxury',
            zh: 'EES - \u901a\u8fc7 billionairs.luxury \u7b7e\u7f72',
            ja: 'EES - billionairs.luxury \u3092\u901a\u3058\u3066\u7f72\u540d',
            ar: 'EES - \u0645\u0648\u0642\u0639 \u0639\u0628\u0631 billionairs.luxury'
        };
        // Detect member language from current user data
        const memberLang = (this._currentUser && this._currentUser.preferred_language) || 'en';
        const eesText = eesTranslations[memberLang] || eesTranslations.en;

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>BILLIONAIRS NDA &mdash; ${memberName}</title>
<style>
@page { size: A4; margin: 2.5cm 2.5cm 3cm 2.5cm; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Georgia', 'Times New Roman', serif; font-size: 11pt; line-height: 1.6; color: #1a1a1a; background: #fff; max-width: 210mm; margin: 0 auto; padding: 2.5cm; }
.header { text-align: center; margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 2px solid #c9a96e; }
.header h1 { font-size: 22pt; font-weight: 700; letter-spacing: 4px; color: #1a1a1a; margin-bottom: .3rem; }
.header h2 { font-size: 13pt; font-weight: 400; color: #666; letter-spacing: 2px; text-transform: uppercase; }
.header .doc-ref { font-size: 9pt; color: #999; margin-top: .5rem; }
.gold-line { width: 60px; height: 2px; background: #c9a96e; margin: 1.5rem auto; }
h3 { font-size: 12pt; font-weight: 700; margin-top: 1.5rem; margin-bottom: .5rem; color: #1a1a1a; }
h3 .sn { color: #c9a96e; margin-right: .5rem; }
p { margin-bottom: .8rem; text-align: justify; }
.parties { background: #fafaf8; border: 1px solid #e8e4dc; border-radius: 4px; padding: 1.2rem 1.5rem; margin: 1.5rem 0; }
.parties p { margin-bottom: .4rem; }
.parties strong { color: #c9a96e; }
ol { padding-left: 1.5rem; margin-bottom: .8rem; }
ol li { margin-bottom: .4rem; text-align: justify; }
.confidential-stamp { text-align: center; margin: 1rem 0; font-size: 9pt; font-weight: 700; letter-spacing: 3px; color: #c9a96e; text-transform: uppercase; }
.sig-section { margin-top: 3rem; page-break-inside: avoid; }
.sig-block { display: flex; justify-content: space-between; gap: 3rem; margin-top: 2rem; }
.sig-party { flex: 1; }
.sig-party h4 { font-size: 10pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #c9a96e; margin-bottom: 1rem; }
.sig-line { border-bottom: 1px solid #1a1a1a; height: 40px; margin-bottom: .3rem; }
.sig-label { font-size: 9pt; color: #888; margin-bottom: 1rem; }
.ees-badge { margin-top: .5rem; padding: .6rem 1rem; border: 1px solid #e0ddd6; border-radius: 6px; background: #fafaf8; display: flex; align-items: center; gap: .75rem; }
.ees-badge img { width: 40px; height: auto; }
.ees-badge .ees-info { font-size: 8.5pt; color: #555; line-height: 1.4; }
.ees-badge .ees-info strong { color: #1a1a1a; font-size: 9.5pt; display: block; margin-bottom: 2px; }
.ees-badge .ees-info .ees-note { color: #c9a96e; font-size: 7.5pt; margin-top: 2px; }
.sig-img { max-width: 200px; max-height: 80px; }
.member-sig-line { border-bottom: 1px solid #1a1a1a; min-height: 60px; margin-bottom: .3rem; display: flex; align-items: flex-end; padding-bottom: 4px; }
.footer { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #e8e4dc; text-align: center; font-size: 8.5pt; color: #aaa; }
.meta-box { background: #f8f7f5; border: 1px solid #e0ddd6; border-radius: 4px; padding: .8rem 1rem; margin: 1rem 0; font-size: 9pt; color: #666; }
.meta-box strong { color: #1a1a1a; }
@media print { body { padding: 0; } .no-print { display: none !important; } }
.print-bar { position: fixed; top: 0; left: 0; right: 0; background: #1a1a1a; padding: 12px 24px; display: flex; align-items: center; justify-content: center; gap: 16px; z-index: 9999; }
.print-bar button { background: #c9a96e; color: #1a1a1a; border: none; padding: 10px 28px; font-size: 12pt; font-family: Georgia, serif; cursor: pointer; letter-spacing: 1px; font-weight: 700; border-radius: 4px; }
.print-bar button:hover { background: #b8944f; }
.print-bar span { color: #c9a96e; font-family: Georgia, serif; font-size: 11pt; }
</style>
</head>
<body>

<div class="print-bar no-print">
    <span>BILLIONAIRS NDA</span>
    <button onclick="window.print()">&#x2B07; Als PDF speichern / Drucken</button>
</div>

<div style="margin-top: 60px;"></div>

<div class="header">
    <h1>BILLIONAIRS</h1>
    <h2>Mutual Non-Disclosure &amp; Membership Agreement</h2>
    <div class="gold-line"></div>
    <div class="doc-ref">Document Ref: ${docRef} &nbsp;|&nbsp; Signature ID: ${sigId} &nbsp;|&nbsp; Confidential</div>
</div>

<div class="confidential-stamp">&mdash; Strictly Confidential &mdash;</div>

<div class="meta-box">
    <strong>Signed by:</strong> ${memberName} &nbsp;|&nbsp;
    <strong>Email:</strong> ${memberEmail} &nbsp;|&nbsp;
    <strong>Company:</strong> ${memberCompany} &nbsp;|&nbsp;
    <strong>Date:</strong> ${signedAt} &nbsp;|&nbsp;
    <strong>IP:</strong> ${ipAddr}
</div>

<p>This Mutual Non-Disclosure &amp; Membership Agreement (hereinafter referred to as the <strong>&ldquo;Agreement&rdquo;</strong>) is entered into as of <strong>${signedAt}</strong> (the <strong>&ldquo;Effective Date&rdquo;</strong>) by and between:</p>

<div class="parties">
    <p><strong>Party A (the Company):</strong><br>
    BILLIONAIRS, operating under the domain billionairs.luxury, registered in Switzerland<br>
    (hereinafter referred to as <strong>&ldquo;BILLIONAIRS&rdquo;</strong> or <strong>&ldquo;the Company&rdquo;</strong>)</p>
    <br>
    <p><strong>Party B (the Member):</strong><br>
    ${memberName}${memberCompany !== 'N/A' ? ', ' + memberCompany : ''}<br>
    (hereinafter referred to as <strong>&ldquo;the Member&rdquo;</strong>)</p>
</div>

<p>BILLIONAIRS and the Member are collectively referred to as the <strong>&ldquo;Parties&rdquo;</strong> and individually as a <strong>&ldquo;Party.&rdquo;</strong></p>

<div class="gold-line"></div>

<h3><span class="sn">1.</span> Purpose &amp; Scope</h3>
<p>The purpose of this Agreement is to establish the mutual obligations, rights, and responsibilities of both Parties in connection with the Member&rsquo;s access to the exclusive BILLIONAIRS private membership platform, and to protect the confidential information exchanged between the Parties.</p>

<h3><span class="sn">2.</span> Service Description</h3>
<p>BILLIONAIRS provides the following services to accepted Members (the <strong>&ldquo;Services&rdquo;</strong>):</p>
<ol type="a">
    <li><strong>Exclusive Membership Platform:</strong> Access to a private, curated digital platform designed for high-net-worth individuals;</li>
    <li><strong>Private Networking:</strong> Access to a verified member network for direct, encrypted communication between Members;</li>
    <li><strong>Encrypted Communications:</strong> End-to-end encrypted chat functionality (AES-256-GCM) for private Member-to-Member and CEO communication;</li>
    <li><strong>Curated Content:</strong> Access to exclusive content, insights, and information shared within the platform;</li>
    <li><strong>Digital Membership Certificate:</strong> A personalized, downloadable membership certificate;</li>
    <li><strong>Ongoing Platform Maintenance:</strong> BILLIONAIRS commits to maintaining platform availability with commercially reasonable efforts, targeting 99.5% monthly uptime (excluding scheduled maintenance);</li>
    <li><strong>Security &amp; Privacy:</strong> Industry-standard security measures to protect Member data and communications.</li>
</ol>
<p>BILLIONAIRS reserves the right to enhance, modify, or add features to the platform. Material changes that significantly reduce core Services will be communicated to Members with at least 30 days&rsquo; advance notice.</p>

<h3><span class="sn">3.</span> Definition of Confidential Information</h3>
<p><strong>&ldquo;Confidential Information&rdquo;</strong> means any and all non-public information disclosed by either Party to the other Party, whether orally, in writing, electronically, or by any other means, including but not limited to:</p>
<ol type="a">
    <li>The identity, personal data, and contact details of BILLIONAIRS members;</li>
    <li>Any communications, discussions, or exchanges within the BILLIONAIRS platform, including private chats and group discussions;</li>
    <li>Business strategies, investment opportunities, financial data, and deal flow shared within the platform;</li>
    <li>Proprietary technology, software, algorithms, and platform architecture;</li>
    <li>Marketing strategies, pricing models, and membership structures;</li>
    <li>Any information explicitly marked as &ldquo;Confidential&rdquo; or &ldquo;Proprietary&rdquo;;</li>
    <li>Personal and financial information provided by the Member to BILLIONAIRS during registration and membership.</li>
</ol>
<p>The classification of information as confidential shall be based on objective criteria and the nature of the information, not solely on one Party&rsquo;s subjective designation.</p>

<h3><span class="sn">4.</span> Mutual Confidentiality Obligations</h3>
<p><strong>4.1 Obligations of the Member:</strong></p>
<ol type="a">
    <li><strong>Maintain Confidentiality:</strong> Keep all Confidential Information strictly confidential and not disclose it to any third party without the prior written consent of BILLIONAIRS;</li>
    <li><strong>Restrict Use:</strong> Use the Confidential Information solely in connection with the membership;</li>
    <li><strong>Exercise Care:</strong> Apply at least the same degree of care to protect the Confidential Information as the Member uses to protect their own confidential information, but in no event less than reasonable care;</li>
    <li><strong>No Unauthorized Reproduction:</strong> Not copy, reproduce, screenshot, record, or otherwise duplicate any Confidential Information unless expressly authorized by BILLIONAIRS;</li>
    <li><strong>Discretion:</strong> Not discuss, publish, post, or otherwise share any information about BILLIONAIRS members, conversations, or activities on social media, press, blogs, forums, or any other public platform without prior written consent;</li>
    <li><strong>Return or Destroy:</strong> Upon termination of membership or upon request, promptly return or destroy all materials containing Confidential Information.</li>
</ol>
<p><strong>4.2 Obligations of BILLIONAIRS:</strong></p>
<ol type="a">
    <li><strong>Protect Member Data:</strong> BILLIONAIRS shall safeguard all personal, financial, and communication data provided by the Member using industry-standard security measures (including encryption at rest and in transit);</li>
    <li><strong>No Unauthorized Sharing:</strong> BILLIONAIRS shall not disclose, sell, rent, or share Member data with third parties for commercial purposes without the Member&rsquo;s explicit written consent;</li>
    <li><strong>Restricted Internal Access:</strong> Access to Member information within BILLIONAIRS shall be limited to authorized personnel on a need-to-know basis;</li>
    <li><strong>Breach Notification:</strong> In the event of a data breach affecting Member information, BILLIONAIRS shall notify the affected Member within 72 hours of becoming aware of the breach;</li>
    <li><strong>Compliance:</strong> BILLIONAIRS shall handle all personal data in compliance with applicable data protection laws (see Section 10).</li>
</ol>

<h3><span class="sn">5.</span> Exclusions from Confidential Information</h3>
<p>Confidential Information does not include information that:</p>
<ol type="a">
    <li>Was already in the public domain at the time of disclosure;</li>
    <li>Becomes publicly available through no breach of this Agreement;</li>
    <li>Was already known to the receiving Party prior to disclosure, as evidenced by written records;</li>
    <li>Is independently developed by the receiving Party without reference to the Confidential Information;</li>
    <li>Is required to be disclosed by law, regulation, or court order, provided the disclosing Party is given prompt written notice and reasonable opportunity to seek protective measures.</li>
</ol>

<h3><span class="sn">6.</span> Duration of Confidentiality</h3>
<p>The confidentiality obligations under this Agreement shall remain in effect for the duration of the Member&rsquo;s membership and for a period of <strong>three (3) years</strong> following the termination or expiration of such membership, unless a longer period is required by applicable law.</p>

<h3><span class="sn">7.</span> Remedies for Breach</h3>
<p><strong>7.1</strong> Both Parties acknowledge that any breach of the confidentiality obligations may cause irreparable harm. Accordingly, the non-breaching Party shall be entitled to seek injunctive relief, specific performance, and any other equitable remedies available under Swiss law, in addition to damages.</p>
<p><strong>7.2</strong> Prior to initiating legal proceedings, the Parties agree to attempt to resolve disputes through good-faith negotiation for a period of 30 days (see Section 14).</p>

<h3><span class="sn">8.</span> Membership Fee &amp; Refund Policy</h3>
<p>The Member acknowledges and agrees that:</p>
<ol type="a">
    <li>The one-time membership fee of <strong>CHF 500,000</strong> is generally <strong>non-refundable</strong> once access to the platform has been granted, as the Service is deemed rendered upon provision of access credentials;</li>
    <li>The membership fee constitutes payment for <strong>exclusive access</strong> to the BILLIONAIRS platform and the Services described in Section 2;</li>
    <li>The Member agrees not to initiate chargebacks or payment disputes without first following the dispute resolution process outlined in Section 14. Any chargeback initiated without prior good-faith resolution attempt shall constitute a material breach of this Agreement;</li>
    <li>In the event of a confirmed NDA breach by the Member, BILLIONAIRS reserves the right to terminate the membership without refund.</li>
</ol>
<p><strong>8.2 Exceptions &mdash; Refund Entitlement:</strong></p>
<p>Notwithstanding Section 8(a), the Member shall be entitled to a full or partial refund in the following circumstances:</p>
<ol type="a">
    <li><strong>Material Non-Performance:</strong> If BILLIONAIRS fails to provide the core Services described in Section 2 for a continuous period exceeding 30 days (excluding force majeure events), the Member may request a pro-rata refund;</li>
    <li><strong>Fraudulent Misrepresentation:</strong> If it is established that BILLIONAIRS made materially false statements to induce the Member&rsquo;s payment, the Member is entitled to a full refund under Swiss law (Art. 28 OR);</li>
    <li><strong>Cooling-Off Period:</strong> The Member may cancel within <strong>14 days</strong> of payment if platform access has not yet been used, in accordance with applicable consumer protection principles;</li>
    <li><strong>Statutory Rights:</strong> Nothing in this Agreement shall exclude or limit any refund rights that cannot be waived under mandatory Swiss law (including Art. 8 UWG).</li>
</ol>
<p>By signing this Agreement, the Member confirms understanding and voluntary acceptance of this fee structure <strong>prior to making payment</strong>.</p>

<h3><span class="sn">9.</span> Company Liability &amp; Obligations</h3>
<p><strong>9.1</strong> BILLIONAIRS undertakes to provide the Services with commercially reasonable skill and care.</p>
<p><strong>9.2</strong> BILLIONAIRS shall be liable for:</p>
<ol type="a">
    <li>Damages caused by intentional misconduct or gross negligence of BILLIONAIRS or its agents;</li>
    <li>Breach of its confidentiality obligations under Section 4.2;</li>
    <li>Breach of applicable data protection laws;</li>
    <li>Any bodily injury or death caused by BILLIONAIRS&rsquo;s negligence.</li>
</ol>
<p><strong>9.3</strong> BILLIONAIRS shall not be liable for:</p>
<ol type="a">
    <li>Investment decisions made based on information or discussions within the platform &mdash; all investment decisions remain the sole responsibility of the Member;</li>
    <li>Actions, statements, or conduct of other Members on the platform;</li>
    <li>Temporary platform unavailability due to maintenance, updates, or circumstances beyond BILLIONAIRS&rsquo;s reasonable control (force majeure);</li>
    <li>Indirect, consequential, or speculative damages, except where exclusion is prohibited by mandatory Swiss law.</li>
</ol>
<p><strong>9.4</strong> The total aggregate liability of BILLIONAIRS under this Agreement (excluding cases of intentional misconduct) shall not exceed the membership fee paid by the Member (CHF 500,000).</p>

<h3><span class="sn">10.</span> Data Protection &amp; Privacy</h3>
<p><strong>10.1</strong> BILLIONAIRS processes personal data in accordance with the Swiss Federal Act on Data Protection (<strong>nDSG</strong>, effective 1 September 2023) and, where applicable, the EU General Data Protection Regulation (<strong>GDPR</strong>).</p>
<p><strong>10.2</strong> The Member has the following data rights:</p>
<ol type="a">
    <li><strong>Right of Access:</strong> The Member may request information about what personal data is stored;</li>
    <li><strong>Right to Rectification:</strong> The Member may request correction of inaccurate data;</li>
    <li><strong>Right to Deletion:</strong> The Member may request deletion of personal data, subject to legal retention obligations;</li>
    <li><strong>Right to Data Portability:</strong> The Member may request their data in a structured, machine-readable format;</li>
    <li><strong>Right to Object:</strong> The Member may object to specific data processing activities.</li>
</ol>
<p><strong>10.3</strong> Data protection requests can be submitted to: <strong>privacy@billionairs.luxury</strong></p>
<p><strong>10.4</strong> BILLIONAIRS shall not transfer Member data to countries without adequate data protection standards unless appropriate safeguards are in place (e.g., Standard Contractual Clauses).</p>

<h3><span class="sn">11.</span> Membership Termination</h3>
<p><strong>11.1 Termination by the Member:</strong></p>
<ol type="a">
    <li>The Member may terminate their membership at any time by providing written notice to BILLIONAIRS;</li>
    <li>Termination does not entitle the Member to a refund except as specified in Section 8.2;</li>
    <li>Upon termination, the Member&rsquo;s access to the platform will be revoked within 7 business days;</li>
    <li>The Member may request export of their personal data prior to termination.</li>
</ol>
<p><strong>11.2 Termination by BILLIONAIRS:</strong></p>
<ol type="a">
    <li>BILLIONAIRS may terminate membership for material breach of this Agreement, including NDA violations, after providing written notice and a 14-day cure period (except in cases of severe breach where immediate termination is justified);</li>
    <li>BILLIONAIRS may terminate membership if the Member engages in illegal activities on the platform;</li>
    <li>In the event BILLIONAIRS permanently ceases operations, Members shall receive a pro-rata refund for any remaining membership term, if applicable.</li>
</ol>

<h3><span class="sn">12.</span> No License</h3>
<p>Nothing in this Agreement grants either Party any license or right in any intellectual property or proprietary rights of the other Party.</p>

<h3><span class="sn">13.</span> Governing Law &amp; Jurisdiction</h3>
<p>This Agreement shall be governed by the substantive laws of <strong>Switzerland</strong> (excluding conflict-of-law provisions). Any disputes shall be subject to the exclusive jurisdiction of the courts of <strong>Zurich, Switzerland</strong>.</p>

<h3><span class="sn">14.</span> Dispute Resolution</h3>
<p><strong>14.1</strong> Before initiating any legal proceedings, both Parties agree to attempt to resolve disputes through good-faith negotiation within <strong>30 days</strong> of written notice of the dispute.</p>
<p><strong>14.2</strong> If negotiation fails, either Party may submit the dispute to <strong>mediation</strong> under the Swiss Rules of Commercial Mediation administered by the Swiss Chambers&rsquo; Arbitration Institution. Mediation costs shall be shared equally.</p>
<p><strong>14.3</strong> If mediation fails within 60 days, either Party may pursue litigation before the courts of Zurich, Switzerland, or initiate arbitration under the Swiss Rules of International Arbitration, at the claimant&rsquo;s election.</p>

<h3><span class="sn">15.</span> Severability</h3>
<p>If any provision of this Agreement is found to be invalid, unenforceable, or contrary to mandatory law, the remaining provisions shall continue in full force and effect. The invalid provision shall be replaced by a valid provision that most closely reflects the Parties&rsquo; original intent.</p>

<h3><span class="sn">16.</span> Entire Agreement</h3>
<p>This Agreement constitutes the entire agreement between the Parties with respect to its subject matter and supersedes all prior negotiations, representations, and agreements. Amendments to this Agreement must be made in writing and signed by both Parties.</p>

<h3><span class="sn">17.</span> Electronic Signature</h3>
<p>The Parties agree that this Agreement may be executed electronically. Electronic signatures shall have the same legal effect as handwritten signatures in accordance with the Swiss Federal Act on Electronic Signatures (ZertES) and the EU eIDAS Regulation.</p>

<div class="gold-line"></div>

<div class="sig-section">
    <p><strong>IN WITNESS WHEREOF,</strong> the Parties have executed this Non-Disclosure Agreement as of the Effective Date.</p>
    <div class="sig-block">
        <div class="sig-party">
            <h4>The Company</h4>
            <div class="ees-badge">
                <img src="https://billionairs.luxury/assets/images/logo.png" alt="BILLIONAIRS Logo">
                <div class="ees-info">
                    <strong>billionairs.luxury</strong>
                    ${eesDate}<br>
                    <span class="ees-note">${eesText}</span>
                </div>
            </div>
            <div class="sig-label" style="margin-top:.5rem;">BILLIONAIRS &mdash; Authorized Representative</div>
        </div>
        <div class="sig-party">
            <h4>The Member</h4>
            <div class="member-sig-line">
                ${sigData ? '<img class="sig-img" src="' + sigData + '" alt="Signature" />' : ''}
            </div>
            <div class="sig-label">Signature</div>
            <p style="font-size:10pt;"><strong>${memberName}</strong>${memberCompany !== 'N/A' ? '<br>' + memberCompany : ''}</p>
            <div class="sig-label">Date: ${signedAt}</div>
        </div>
    </div>
</div>

<div class="meta-box" style="margin-top:2rem;">
    <strong>Verification Details:</strong><br>
    Signature ID: ${sigId} &nbsp;|&nbsp;
    Document Ref: ${docRef} &nbsp;|&nbsp;
    IP Address: ${ipAddr} &nbsp;|&nbsp;
    Email: ${memberEmail} &nbsp;|&nbsp;
    Phone: ${memberPhone}
</div>

<div class="footer">
    <p>BILLIONAIRS &nbsp;|&nbsp; billionairs.luxury &nbsp;|&nbsp; Confidential Document</p>
    <p>This document is subject to copyright protection. Unauthorized reproduction is prohibited.</p>
    <p style="margin-top:.5rem;font-size:8pt;">Electronically signed &mdash; ${signedAt}</p>
</div>

<script>
// Auto-trigger print dialog after short delay
setTimeout(function() { window.print(); }, 800);
</script>
</body>
</html>`;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
        } else {
            this.toast('Popup-Blocker aktiv. Bitte erlauben Sie Popups.', 'error');
        }
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
            if (res.ok) { this.toast('Notizen gespeichert', 'success'); }
            else { this.toast('Fehler beim Speichern', 'error'); }
        } catch (e) {
            console.error('Save notes error:', e);
            this.toast('Fehler', 'error');
        }
    }

    // ========== EMAIL COMPOSER ==========
    sendEmailToUser(email) {
        const modal = document.getElementById('emailComposerModal');
        const toField = document.getElementById('emailTo');
        const subjectField = document.getElementById('emailSubject');
        const bodyField = document.getElementById('emailBody');
        const templateSelect = document.getElementById('emailTemplate');
        const charCount = document.getElementById('emailCharCount');
        const sendBtn = document.getElementById('emailSendBtn');

        // Detect member's language from loaded user data
        const user = this.users.find(u => u.email === email);
        const memberLang = user?.preferred_language || 'en';
        const memberName = user?.name || user?.full_name || 'Member';

        // Show detected language hint
        const langLabels = { en:'English', de:'Deutsch', fr:'Français', es:'Español', it:'Italiano', ru:'Русский', zh:'中文', ja:'日本語', ar:'العربية' };
        const langHint = document.getElementById('emailLangHint');
        if (langHint) {
            langHint.textContent = `🌐 ${langLabels[memberLang] || memberLang}`;
            langHint.title = `Email wird in ${langLabels[memberLang] || memberLang} gesendet`;
        }

        // ── Multilingual email templates ──
        const allTemplates = {
            en: {
                welcome: {
                    subject: 'Welcome to BILLIONAIRS',
                    body: `Dear ${memberName},\n\nWe warmly welcome you to BILLIONAIRS.\n\nYour exclusive access has been activated and is now available to you. As a member of our private network, you benefit from unique privileges and connections.\n\nShould you have any questions, we are at your disposal at any time.\n\nBest regards,\nBILLIONAIRS Management`
                },
                'payment-reminder': {
                    subject: 'Payment Reminder — BILLIONAIRS Membership',
                    body: `Dear ${memberName},\n\nWe would like to kindly remind you that your membership fee is still outstanding.\n\nPlease complete your payment through your dashboard to continue enjoying full access to all exclusive features.\n\nFor questions, contact us at support@billionairs.luxury.\n\nBest regards,\nBILLIONAIRS Management`
                },
                'account-issue': {
                    subject: 'Important Information About Your Account — BILLIONAIRS',
                    body: `Dear ${memberName},\n\nWe would like to inform you about a matter concerning your BILLIONAIRS account.\n\n[Please describe the issue here]\n\nPlease contact us promptly so we can resolve this matter.\n\nBest regards,\nBILLIONAIRS Management`
                },
                'membership-update': {
                    subject: 'Update to Your BILLIONAIRS Membership',
                    body: `Dear ${memberName},\n\nWe would like to inform you about an update to your membership.\n\n[Update details]\n\nThese changes take effect immediately.\n\nBest regards,\nBILLIONAIRS Management`
                }
            },
            de: {
                welcome: {
                    subject: 'Willkommen bei BILLIONAIRS',
                    body: `Sehr geehrte/r ${memberName},\n\nWir heissen Sie herzlich willkommen bei BILLIONAIRS.\n\nIhr exklusiver Zugang wurde aktiviert und steht Ihnen ab sofort zur Verfügung. Als Mitglied unseres privaten Netzwerks profitieren Sie von einzigartigen Privilegien und Verbindungen.\n\nSollten Sie Fragen haben, stehen wir Ihnen jederzeit zur Verfügung.\n\nMit besten Grüssen,\nBILLIONAIRS Management`
                },
                'payment-reminder': {
                    subject: 'Zahlungserinnerung — BILLIONAIRS Mitgliedschaft',
                    body: `Sehr geehrte/r ${memberName},\n\nWir möchten Sie höflich daran erinnern, dass Ihre Mitgliedschaftsgebühr noch aussteht.\n\nBitte vervollständigen Sie die Zahlung über Ihr Dashboard, um weiterhin vollen Zugang zu allen exklusiven Funktionen zu geniessen.\n\nBei Fragen kontaktieren Sie uns unter support@billionairs.luxury.\n\nMit besten Grüssen,\nBILLIONAIRS Management`
                },
                'account-issue': {
                    subject: 'Wichtige Information zu Ihrem Account — BILLIONAIRS',
                    body: `Sehr geehrte/r ${memberName},\n\nWir möchten Sie über ein Anliegen bezüglich Ihres BILLIONAIRS-Accounts informieren.\n\n[Bitte beschreiben Sie hier das Problem]\n\nBitte kontaktieren Sie uns zeitnah, damit wir die Angelegenheit klären können.\n\nMit besten Grüssen,\nBILLIONAIRS Management`
                },
                'membership-update': {
                    subject: 'Update Ihrer BILLIONAIRS Mitgliedschaft',
                    body: `Sehr geehrte/r ${memberName},\n\nWir möchten Sie über eine Aktualisierung Ihrer Mitgliedschaft informieren.\n\n[Details zum Update]\n\nDiese Änderungen treten ab sofort in Kraft.\n\nMit besten Grüssen,\nBILLIONAIRS Management`
                }
            },
            fr: {
                welcome: {
                    subject: 'Bienvenue chez BILLIONAIRS',
                    body: `Cher/Chère ${memberName},\n\nNous vous souhaitons chaleureusement la bienvenue chez BILLIONAIRS.\n\nVotre accès exclusif a été activé et est désormais disponible. En tant que membre de notre réseau privé, vous bénéficiez de privilèges et de connexions uniques.\n\nSi vous avez des questions, nous sommes à votre disposition à tout moment.\n\nCordialement,\nBILLIONAIRS Management`
                },
                'payment-reminder': {
                    subject: 'Rappel de paiement — Adhésion BILLIONAIRS',
                    body: `Cher/Chère ${memberName},\n\nNous vous rappelons aimablement que votre cotisation d'adhésion est encore en attente.\n\nVeuillez compléter le paiement via votre tableau de bord pour continuer à profiter de l'accès complet à toutes les fonctionnalités exclusives.\n\nPour toute question, contactez-nous à support@billionairs.luxury.\n\nCordialement,\nBILLIONAIRS Management`
                },
                'account-issue': {
                    subject: 'Information importante concernant votre compte — BILLIONAIRS',
                    body: `Cher/Chère ${memberName},\n\nNous souhaitons vous informer d'un sujet concernant votre compte BILLIONAIRS.\n\n[Veuillez décrire le problème ici]\n\nVeuillez nous contacter rapidement afin que nous puissions résoudre cette affaire.\n\nCordialement,\nBILLIONAIRS Management`
                },
                'membership-update': {
                    subject: 'Mise à jour de votre adhésion BILLIONAIRS',
                    body: `Cher/Chère ${memberName},\n\nNous souhaitons vous informer d'une mise à jour de votre adhésion.\n\n[Détails de la mise à jour]\n\nCes modifications prennent effet immédiatement.\n\nCordialement,\nBILLIONAIRS Management`
                }
            },
            es: {
                welcome: {
                    subject: 'Bienvenido/a a BILLIONAIRS',
                    body: `Estimado/a ${memberName},\n\nLe damos una cálida bienvenida a BILLIONAIRS.\n\nSu acceso exclusivo ha sido activado y ya está disponible. Como miembro de nuestra red privada, usted se beneficia de privilegios y conexiones únicos.\n\nSi tiene alguna pregunta, estamos a su disposición en todo momento.\n\nAtentamente,\nBILLIONAIRS Management`
                },
                'payment-reminder': {
                    subject: 'Recordatorio de pago — Membresía BILLIONAIRS',
                    body: `Estimado/a ${memberName},\n\nLe recordamos amablemente que su cuota de membresía aún está pendiente.\n\nPor favor, complete el pago a través de su panel de control para seguir disfrutando del acceso completo a todas las funciones exclusivas.\n\nPara preguntas, contáctenos en support@billionairs.luxury.\n\nAtentamente,\nBILLIONAIRS Management`
                },
                'account-issue': {
                    subject: 'Información importante sobre su cuenta — BILLIONAIRS',
                    body: `Estimado/a ${memberName},\n\nDeseamos informarle sobre un asunto relacionado con su cuenta BILLIONAIRS.\n\n[Por favor, describa el problema aquí]\n\nPor favor, póngase en contacto con nosotros lo antes posible para resolver este asunto.\n\nAtentamente,\nBILLIONAIRS Management`
                },
                'membership-update': {
                    subject: 'Actualización de su membresía BILLIONAIRS',
                    body: `Estimado/a ${memberName},\n\nDeseamos informarle sobre una actualización de su membresía.\n\n[Detalles de la actualización]\n\nEstos cambios entran en vigor de inmediato.\n\nAtentamente,\nBILLIONAIRS Management`
                }
            },
            it: {
                welcome: {
                    subject: 'Benvenuto/a in BILLIONAIRS',
                    body: `Gentile ${memberName},\n\nLe diamo il benvenuto in BILLIONAIRS.\n\nIl Suo accesso esclusivo è stato attivato ed è ora disponibile. Come membro della nostra rete privata, Lei beneficia di privilegi e connessioni unici.\n\nPer qualsiasi domanda, siamo a Sua disposizione in qualsiasi momento.\n\nCordiali saluti,\nBILLIONAIRS Management`
                },
                'payment-reminder': {
                    subject: 'Promemoria di pagamento — Abbonamento BILLIONAIRS',
                    body: `Gentile ${memberName},\n\nDesideriamo ricordarLe gentilmente che la quota di abbonamento è ancora in sospeso.\n\nLa preghiamo di completare il pagamento tramite la Sua dashboard per continuare a godere dell'accesso completo a tutte le funzionalità esclusive.\n\nPer domande, ci contatti a support@billionairs.luxury.\n\nCordiali saluti,\nBILLIONAIRS Management`
                },
                'account-issue': {
                    subject: 'Informazione importante sul Suo account — BILLIONAIRS',
                    body: `Gentile ${memberName},\n\nDesideriamo informarLa riguardo una questione relativa al Suo account BILLIONAIRS.\n\n[Descrivere il problema qui]\n\nLa preghiamo di contattarci tempestivamente per risolvere la questione.\n\nCordiali saluti,\nBILLIONAIRS Management`
                },
                'membership-update': {
                    subject: 'Aggiornamento del Suo abbonamento BILLIONAIRS',
                    body: `Gentile ${memberName},\n\nDesideriamo informarLa di un aggiornamento del Suo abbonamento.\n\n[Dettagli dell'aggiornamento]\n\nQueste modifiche hanno effetto immediato.\n\nCordiali saluti,\nBILLIONAIRS Management`
                }
            },
            ru: {
                welcome: {
                    subject: 'Добро пожаловать в BILLIONAIRS',
                    body: `Уважаемый/ая ${memberName},\n\nМы сердечно приветствуем Вас в BILLIONAIRS.\n\nВаш эксклюзивный доступ активирован и доступен для использования. Как участник нашей частной сети, Вы пользуетесь уникальными привилегиями и связями.\n\nЕсли у Вас есть вопросы, мы к Вашим услугам в любое время.\n\nС наилучшими пожеланиями,\nBILLIONAIRS Management`
                },
                'payment-reminder': {
                    subject: 'Напоминание об оплате — Членство BILLIONAIRS',
                    body: `Уважаемый/ая ${memberName},\n\nНапоминаем Вам, что Ваш членский взнос ещё не оплачен.\n\nПожалуйста, завершите оплату через Вашу панель управления, чтобы продолжить пользоваться полным доступом ко всем эксклюзивным функциям.\n\nПо вопросам обращайтесь по адресу support@billionairs.luxury.\n\nС наилучшими пожеланиями,\nBILLIONAIRS Management`
                },
                'account-issue': {
                    subject: 'Важная информация о Вашем аккаунте — BILLIONAIRS',
                    body: `Уважаемый/ая ${memberName},\n\nМы хотим сообщить Вам о вопросе, касающемся Вашего аккаунта BILLIONAIRS.\n\n[Описание проблемы]\n\nПожалуйста, свяжитесь с нами в ближайшее время для решения этого вопроса.\n\nС наилучшими пожеланиями,\nBILLIONAIRS Management`
                },
                'membership-update': {
                    subject: 'Обновление Вашего членства BILLIONAIRS',
                    body: `Уважаемый/ая ${memberName},\n\nМы хотим сообщить Вам об обновлении Вашего членства.\n\n[Детали обновления]\n\nЭти изменения вступают в силу немедленно.\n\nС наилучшими пожеланиями,\nBILLIONAIRS Management`
                }
            },
            zh: {
                welcome: {
                    subject: '欢迎加入 BILLIONAIRS',
                    body: `尊敬的 ${memberName}：\n\n我们热忱欢迎您加入 BILLIONAIRS。\n\n您的专属权限已激活，现可立即使用。作为我们私人网络的成员，您将享有独特的特权和人脉。\n\n如有任何问题，请随时联系我们。\n\n此致敬礼，\nBILLIONAIRS Management`
                },
                'payment-reminder': {
                    subject: '付款提醒 — BILLIONAIRS 会员资格',
                    body: `尊敬的 ${memberName}：\n\n我们温馨提醒您，您的会员费尚未支付。\n\n请通过您的仪表板完成支付，以继续享受所有专属功能的完整访问权限。\n\n如有疑问，请联系 support@billionairs.luxury。\n\n此致敬礼，\nBILLIONAIRS Management`
                },
                'account-issue': {
                    subject: '关于您账户的重要信息 — BILLIONAIRS',
                    body: `尊敬的 ${memberName}：\n\n我们希望就您的 BILLIONAIRS 账户相关事宜通知您。\n\n[请在此描述问题]\n\n请尽快与我们联系，以便解决此事。\n\n此致敬礼，\nBILLIONAIRS Management`
                },
                'membership-update': {
                    subject: 'BILLIONAIRS 会员资格更新',
                    body: `尊敬的 ${memberName}：\n\n我们希望通知您会员资格的更新。\n\n[更新详情]\n\n这些变更即时生效。\n\n此致敬礼，\nBILLIONAIRS Management`
                }
            },
            ja: {
                welcome: {
                    subject: 'BILLIONAIRS へようこそ',
                    body: `${memberName} 様\n\nBILLIONAIRS へようこそ。心より歓迎申し上げます。\n\nお客様の限定アクセスが有効になり、ただいまよりご利用いただけます。プライベートネットワークの会員として、独自の特権とコネクションをお楽しみいただけます。\n\nご質問がございましたら、いつでもお気軽にお問い合わせください。\n\n敬具\nBILLIONAIRS Management`
                },
                'payment-reminder': {
                    subject: 'お支払いのご案内 — BILLIONAIRS メンバーシップ',
                    body: `${memberName} 様\n\n会員費のお支払いがまだ完了していないことをお知らせいたします。\n\nすべての限定機能への完全なアクセスを引き続きお楽しみいただくために、ダッシュボードからお支払いをお済ませください。\n\nご不明な点がございましたら、support@billionairs.luxury までご連絡ください。\n\n敬具\nBILLIONAIRS Management`
                },
                'account-issue': {
                    subject: 'アカウントに関する重要なお知らせ — BILLIONAIRS',
                    body: `${memberName} 様\n\nBILLIONAIRS アカウントに関する件についてお知らせいたします。\n\n[ここに問題を記述してください]\n\n本件の解決のため、お早めにご連絡ください。\n\n敬具\nBILLIONAIRS Management`
                },
                'membership-update': {
                    subject: 'BILLIONAIRS メンバーシップの更新',
                    body: `${memberName} 様\n\nメンバーシップの更新についてお知らせいたします。\n\n[更新の詳細]\n\nこれらの変更は即座に有効となります。\n\n敬具\nBILLIONAIRS Management`
                }
            },
            ar: {
                welcome: {
                    subject: 'مرحباً بك في BILLIONAIRS',
                    body: `${memberName} العزيز/ة،\n\nنرحب بك ترحيباً حاراً في BILLIONAIRS.\n\nتم تفعيل وصولك الحصري وهو متاح لك الآن. بصفتك عضواً في شبكتنا الخاصة، تستمتع بامتيازات واتصالات فريدة.\n\nإذا كان لديك أي أسئلة، نحن في خدمتك في أي وقت.\n\nمع أطيب التحيات،\nإدارة BILLIONAIRS`
                },
                'payment-reminder': {
                    subject: 'تذكير بالدفع — عضوية BILLIONAIRS',
                    body: `${memberName} العزيز/ة،\n\nنود تذكيرك بلطف بأن رسوم عضويتك لا تزال معلقة.\n\nيرجى إتمام الدفع عبر لوحة التحكم الخاصة بك لمواصلة الاستمتاع بالوصول الكامل إلى جميع الميزات الحصرية.\n\nللاستفسارات، تواصل معنا على support@billionairs.luxury.\n\nمع أطيب التحيات،\nإدارة BILLIONAIRS`
                },
                'account-issue': {
                    subject: 'معلومات مهمة حول حسابك — BILLIONAIRS',
                    body: `${memberName} العزيز/ة،\n\nنود إبلاغك بشأن مسألة تتعلق بحسابك في BILLIONAIRS.\n\n[يرجى وصف المشكلة هنا]\n\nيرجى التواصل معنا في أقرب وقت ممكن لحل هذه المسألة.\n\nمع أطيب التحيات،\nإدارة BILLIONAIRS`
                },
                'membership-update': {
                    subject: 'تحديث عضويتك في BILLIONAIRS',
                    body: `${memberName} العزيز/ة،\n\nنود إبلاغك بتحديث على عضويتك.\n\n[تفاصيل التحديث]\n\nتسري هذه التغييرات فوراً.\n\nمع أطيب التحيات،\nإدارة BILLIONAIRS`
                }
            }
        };

        const templates = allTemplates[memberLang] || allTemplates.en;

        // Reset fields
        toField.value = email;
        subjectField.value = '';
        bodyField.value = '';
        templateSelect.value = '';
        charCount.textContent = '0 Zeichen';
        sendBtn.querySelector('span').textContent = 'Senden';
        sendBtn.disabled = false;

        // Character counter
        bodyField.oninput = () => {
            const len = bodyField.value.length;
            charCount.textContent = `${len} Zeichen`;
        };

        // Store reference for global access
        window._adminEmailComposer = {
            applyTemplate: () => {
                const tpl = templateSelect.value;
                if (templates[tpl]) {
                    subjectField.value = templates[tpl].subject;
                    bodyField.value = templates[tpl].body;
                    bodyField.oninput();
                }
            },
            send: async () => {
                const subject = subjectField.value.trim();
                const message = bodyField.value.trim();

                if (!subject) { this.toast('Bitte Betreff eingeben', 'error'); subjectField.focus(); return; }
                if (!message) { this.toast('Bitte Nachricht eingeben', 'error'); bodyField.focus(); return; }

                sendBtn.disabled = true;
                sendBtn.querySelector('span').textContent = 'Senden...';

                await this.doSendEmail(email, subject, message);

                sendBtn.querySelector('span').textContent = 'Gesendet ✓';
                setTimeout(() => {
                    modal.classList.add('hidden');
                }, 1200);
            }
        };

        // Show modal
        modal.classList.remove('hidden');
        setTimeout(() => subjectField.focus(), 100);
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
            if (res.ok && data.success) { this.toast('Email gesendet!', 'success'); }
            else { this.toast(data.error || 'Fehler', 'error'); }
        } catch (e) {
            console.error('Send email error:', e);
            this.toast('Fehler', 'error');
        }
    }

    // ========== STATUS UPDATE ==========
    async updateMemberStatus(email, newStatus, selectEl) {
        const labels = { paid:'Paid', pending:'Pending', free:'Free' };
        if (!(await this.confirmDialog(`Status von ${email} auf "${labels[newStatus]}" ändern?`))) { this.loadUsersData(); return; }

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
            } else { this.toast(data.error||'Fehler', 'error'); this.loadUsersData(); }
        } catch (e) { console.error(e); this.toast('Fehler', 'error'); this.loadUsersData(); }
    }

    // ========== DELETE / BLOCK ==========
    async deleteUser(email) {
        if (!(await this.confirmDialog(`User ${email} wirklich löschen?`, '🗑️'))) return;
        try {
            const s = this.getSession();
            const res = await fetch('/api/admin-delete-user', {
                method: 'DELETE',
                headers: { 'Content-Type':'application/json', 'x-admin-email':s.email, 'x-admin-password':s.password },
                body: JSON.stringify({ email })
            });
            if (res.ok) { this.toast('User gelöscht', 'success'); this.loadUsersData(); }
            else { const d = await res.json(); this.toast(d.error, 'error'); }
        } catch (e) { console.error(e); this.toast('Fehler', 'error'); }
    }

    async blockUser(email) {
        if (!(await this.confirmDialog(`${email} blockieren?`))) return;
        try {
            const s = this.getSession();
            const res = await fetch('/api/admin-block-user', {
                method: 'POST',
                headers: { 'Content-Type':'application/json', 'x-admin-email':s.email, 'x-admin-password':s.password },
                body: JSON.stringify({ email, action:'block' })
            });
            const d = await res.json();
            if (res.ok && d.success) { this.toast(d.message, 'success'); this.loadUsersData(); }
            else { this.toast(d.error, 'error'); }
        } catch (e) { console.error(e); this.toast('Fehler', 'error'); }
    }

    async unblockUser(email) {
        if (!(await this.confirmDialog(`${email} entsperren?`))) return;
        try {
            const s = this.getSession();
            const res = await fetch('/api/admin-block-user', {
                method: 'POST',
                headers: { 'Content-Type':'application/json', 'x-admin-email':s.email, 'x-admin-password':s.password },
                body: JSON.stringify({ email, action:'unblock' })
            });
            const d = await res.json();
            if (res.ok && d.success) { this.toast(d.message, 'success'); this.loadUsersData(); }
            else { this.toast(d.error, 'error'); }
        } catch (e) { console.error(e); this.toast('Fehler', 'error'); }
    }

    // ========== 2FA RESET ==========
    async reset2FA(email) {
        if (!(await this.confirmDialog(`2FA fuer ${email} zuruecksetzen? Der User muss 2FA danach neu einrichten.`, '🔐'))) return;
        try {
            const s = this.getSession();
            const res = await fetch('/api/admin-reset-2fa', {
                method: 'POST',
                headers: { 'Content-Type':'application/json', 'x-admin-email':s.email, 'x-admin-password':s.password },
                body: JSON.stringify({ email })
            });
            const d = await res.json();
            if (res.ok && d.success) { this.toast('2FA zurueckgesetzt', 'success'); this.loadUsersData(); }
            else { this.toast(d.error || 'Fehler', 'error'); }
        } catch (e) { console.error(e); this.toast('Fehler beim 2FA-Reset', 'error'); }
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
                                <button class="feature-toggle-btn unlock" data-action="toggle" data-email="${this.safeAttr(u.email)}" data-feature="${feat}" data-unlock="true" ${unlocked?'disabled':''}>On</button>
                                <button class="feature-toggle-btn lock" data-action="toggle" data-email="${this.safeAttr(u.email)}" data-feature="${feat}" data-unlock="false" ${!unlocked?'disabled':''}>Off</button>
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            `;
            container.appendChild(card);
        });

        // Event delegation for toggle buttons
        container.addEventListener('click', e => {
            const btn = e.target.closest('[data-action="toggle"]');
            if (!btn || btn.disabled) return;
            this.toggleFeature(btn.dataset.email, btn.dataset.feature, btn.dataset.unlock === 'true');
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
            else { const d = await res.json(); this.toast(d.error||'Fehler', 'error'); }
        } catch (e) { console.error(e); this.toast('Fehler', 'error'); }
    }

    setupBulkEasterEggControls() {
        document.querySelectorAll('.bulk-unlock-btn, .bulk-lock-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handleBulkAction(btn.dataset.action, btn.dataset.feature));
        });
    }

    async handleBulkAction(action, feature) {
        const names = { pyramid:'Pyramid', eye:'Eye', chat:'Chat', all:'Alle Features' };
        if (!(await this.confirmDialog(`${action==='unlock-all'?'UNLOCK':'LOCK'} ${names[feature]} für ALLE Members?`))) return;
        try {
            const s = this.getSession();
            const res = await fetch('/api/admin-toggle-easter-eggs', {
                method: 'POST',
                headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${s.email}` },
                body: JSON.stringify({ action, feature })
            });
            const d = await res.json();
            if (res.ok) { this.toast(`${d.message} (${d.affectedUsers} User)`, 'success'); this.loadUsersData(); }
            else { this.toast(d.error, 'error'); }
        } catch (e) { console.error(e); this.toast('Fehler', 'error'); }
    }

    // ========== CHAT ==========
    async loadChatData() {
        const main = document.querySelector('main');
        this.showLoading(main, 'Lade Chat...');
        try {
            const s = this.getSession();
            const res = await fetch('/api/chat?ceo=true', {
                headers: { 'X-Admin-Email': s.email, 'X-Admin-Password': s.password }
            });
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
                    <button class="delete-msg-btn" data-action="delete-msg" data-id="${msg.id}">Löschen</button>
                `;
                container.appendChild(div);
            });

            // Attach refresh button
            const refBtn = document.getElementById('refreshChat');
            if (refBtn) {
                const newBtn = refBtn.cloneNode(true);
                refBtn.parentNode.replaceChild(newBtn, refBtn);
                newBtn.addEventListener('click', () => { this._cacheInvalidate('chat'); this.loadChatData(); });
            }

            // Event delegation for delete buttons
            container.addEventListener('click', e => {
                const btn = e.target.closest('[data-action="delete-msg"]');
                if (btn) this.deleteMessage(parseInt(btn.dataset.id));
            });
            this._cacheSet('chat', true);
        } catch (e) { console.error('Chat error:', e); } finally { this.hideLoading(document.querySelector('main')); }
    }

    async deleteMessage(id) {
        if (!(await this.confirmDialog('Nachricht löschen?', '🗑️'))) return;
        try {
            const s = this.getSession();
            const res = await fetch('/api/admin-delete-message', {
                method: 'DELETE',
                headers: { 'Content-Type':'application/json', 'X-Admin-Email': s.email, 'X-Admin-Password': s.password },
                body: JSON.stringify({ messageId: id })
            });
            if (res.ok) this.loadChatData();
        } catch (e) { console.error(e); }
    }

    // ========== PAYMENTS ==========
    async loadPaymentsData() {
        const main = document.querySelector('main');
        this.showLoading(main, 'Lade Zahlungen...');
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
                        <td data-label="Datum">${new Date(p.created_at).toLocaleDateString('de-CH')}</td>
                        <td data-label="Email">${this.escapeHtml(p.email)}</td>
                        <td data-label="Betrag">${fmt(p.amount)}</td>
                        <td data-label="Methode"><span class="payment-method-badge ${p.method}">${p.method}</span></td>
                        <td data-label="Status"><span class="status-badge ${p.status==='refunded'?'refunded':'paid'}">${p.status}</span></td>
                    `;
                    tbody.appendChild(tr);
                });
            } else {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#888;">Keine Zahlungen</td></tr>';
            }
            this._cacheSet('payments', true);
        } catch (e) {
            console.error('Payments error:', e);
            document.getElementById('totalRevenue').textContent = 'CHF 0';
        } finally {
            this.hideLoading(document.querySelector('main'));
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
        if (!(await this.confirmDialog(msg, isActive ? '✅' : '🚨'))) return;
        try {
            const session = this.getSession();
            const res = await fetch('/api/admin-emergency', {
                method: 'POST',
                headers: { 'Content-Type':'application/json' },
                body: JSON.stringify({ email: this.ceoEmail, password: session?.password || '', mode: isActive ? 'deactivate' : 'activate' })
            });
            if (res.ok) {
                this.updateEmergencyButton(!isActive);
                this.toast(isActive ? 'Website ONLINE' : 'Emergency Mode AKTIV', isActive ? 'success' : 'warning');
            }
        } catch (e) { console.error(e); }
    }

    // ========== 2FA LOGIN MODAL ==========
    show2FAPrompt(email, password) {
        this._pending2FA = { email, password };
        const form = document.getElementById('adminLoginForm');
        const modal = document.getElementById('admin2FAModal');
        if (form) form.style.display = 'none';
        if (modal) {
            modal.style.display = 'block';
            // Clear previous state
            document.querySelectorAll('.admin-2fa-digit').forEach(d => { d.value = ''; d.classList.remove('filled'); });
            const errEl = document.getElementById('admin2FAError');
            if (errEl) errEl.style.display = 'none';
            document.getElementById('adminBackupSection').style.display = 'none';
            document.getElementById('admin2FADigits').style.display = 'flex';
            document.getElementById('admin2FAVerifyBtn').style.display = 'block';
            // Focus first digit
            const first = modal.querySelector('.admin-2fa-digit[data-index="0"]');
            if (first) setTimeout(() => first.focus(), 150);
        }
        this._init2FAModalHandlers();
    }

    _init2FAModalHandlers() {
        if (this._2faHandlersInit) return;
        this._2faHandlersInit = true;

        const digits = document.querySelectorAll('.admin-2fa-digit');
        digits.forEach((input, idx) => {
            input.addEventListener('input', (e) => {
                const val = e.target.value.replace(/\D/g, '');
                e.target.value = val;
                if (val.length === 1) {
                    e.target.classList.add('filled');
                    if (idx < 5) digits[idx + 1].focus();
                    if (idx === 5) {
                        const code = Array.from(digits).map(d => d.value).join('');
                        if (code.length === 6) setTimeout(() => this._submit2FACode(), 200);
                    }
                } else {
                    e.target.classList.remove('filled');
                }
            });
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !e.target.value && idx > 0) {
                    digits[idx - 1].focus();
                    digits[idx - 1].value = '';
                    digits[idx - 1].classList.remove('filled');
                }
            });
            input.addEventListener('paste', (e) => {
                e.preventDefault();
                const paste = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
                if (paste.length >= 6) {
                    for (let i = 0; i < 6; i++) {
                        digits[i].value = paste[i];
                        digits[i].classList.add('filled');
                    }
                    setTimeout(() => this._submit2FACode(), 300);
                }
            });
        });

        // Verify button
        document.getElementById('admin2FAVerifyBtn')?.addEventListener('click', () => this._submit2FACode());

        // Backup code link toggle
        document.getElementById('adminBackupCodeLink')?.addEventListener('click', (e) => {
            e.preventDefault();
            const section = document.getElementById('adminBackupSection');
            const digitsWrap = document.getElementById('admin2FADigits');
            const verifyBtn = document.getElementById('admin2FAVerifyBtn');
            if (section.style.display === 'none') {
                section.style.display = 'block';
                digitsWrap.style.display = 'none';
                verifyBtn.style.display = 'none';
                e.target.textContent = 'Authenticator Code verwenden';
                document.getElementById('adminBackupCodeInput').focus();
            } else {
                section.style.display = 'none';
                digitsWrap.style.display = 'flex';
                verifyBtn.style.display = 'block';
                e.target.textContent = 'Backup Code verwenden';
                document.querySelector('.admin-2fa-digit[data-index="0"]').focus();
            }
        });

        // Backup verify button
        document.getElementById('adminBackupVerifyBtn')?.addEventListener('click', () => this._submitBackupCode());

        // Back to login
        document.getElementById('admin2FABack')?.addEventListener('click', (e) => {
            e.preventDefault();
            this._hide2FAModal();
        });
    }

    _hide2FAModal() {
        const form = document.getElementById('adminLoginForm');
        const modal = document.getElementById('admin2FAModal');
        if (form) form.style.display = 'block';
        if (modal) modal.style.display = 'none';
        this._pending2FA = null;
    }

    _show2FAError(msg) {
        const errEl = document.getElementById('admin2FAError');
        if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; }
    }

    async _submit2FACode() {
        const digits = document.querySelectorAll('.admin-2fa-digit');
        const code = Array.from(digits).map(d => d.value).join('');
        if (code.length !== 6) { this._show2FAError('6-stelliger Code erforderlich'); return; }
        if (!this._pending2FA) return;
        await this.verify2FAAndLogin(this._pending2FA.email, this._pending2FA.password, code);
    }

    async _submitBackupCode() {
        const code = document.getElementById('adminBackupCodeInput')?.value.trim();
        if (!code) { this._show2FAError('Backup Code eingeben'); return; }
        if (!this._pending2FA) return;
        await this.verify2FAAndLogin(this._pending2FA.email, this._pending2FA.password, code);
    }

    async verify2FAAndLogin(email, password, code) {
        // Disable button during request
        const btn = document.getElementById('admin2FAVerifyBtn');
        const backupBtn = document.getElementById('adminBackupVerifyBtn');
        if (btn) btn.disabled = true;
        if (backupBtn) backupBtn.disabled = true;
        try {
            const res = await fetch('/api/admin-auth', {
                method: 'POST',
                headers: { 'Content-Type':'application/json' },
                body: JSON.stringify({ email, password, twoFactorCode: code })
            });
            if (res.ok) {
                const data = await res.json();
                this.setSession(data.email, password);
                this._hide2FAModal();
                this.showDashboard(data.email);
            } else {
                this._show2FAError('Ungueltiger Code - erneut versuchen');
                // Clear digits for retry
                document.querySelectorAll('.admin-2fa-digit').forEach(d => { d.value = ''; d.classList.remove('filled'); });
                const first = document.querySelector('.admin-2fa-digit[data-index="0"]');
                if (first) first.focus();
            }
        } catch (e) {
            console.error(e);
            this._show2FAError('Verbindungsfehler');
        } finally {
            if (btn) btn.disabled = false;
            if (backupBtn) backupBtn.disabled = false;
        }
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
            const res = await fetch('/api/admin-2fa-setup', {
                method: 'POST',
                headers: { 'Content-Type':'application/json' },
                body: JSON.stringify({ email: this.ceoEmail, password: s?.password||'', action:'status' })
            });
            const data = await res.json();
            if (data.enabled) {
                document.getElementById('2faStatusText').textContent = '2FA: Aktiviert ✅';
                document.getElementById('enable2FA').classList.add('hidden');
                document.getElementById('disable2FA').classList.remove('hidden');
            } else {
                document.getElementById('2faStatusText').textContent = '2FA: Deaktiviert';
                document.getElementById('enable2FA').classList.remove('hidden');
                document.getElementById('disable2FA').classList.add('hidden');
            }
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
        } catch (e) { console.error(e); this.toast('2FA Setup fehlgeschlagen', 'error'); }
    }

    async verify2FASetup() {
        const code = document.getElementById('verificationCode').value;
        if (!code || code.length !== 6) { this.toast('6-stelliger Code erforderlich', 'warning'); return; }
        try {
            const s = this.getSession();
            const res = await fetch('/api/admin-2fa-setup', {
                method: 'POST',
                headers: { 'Content-Type':'application/json' },
                body: JSON.stringify({ email: this.ceoEmail, password: s?.password||'', action:'verify', code })
            });
            const data = await res.json();
            if (data.success) { this.toast('2FA aktiviert!', 'success'); location.reload(); }
            else { this.toast('Ungültiger Code', 'error'); }
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
            if (data.success) { this.toast('2FA deaktiviert', 'success'); location.reload(); }
            else { this.toast('Ungültiger Code', 'error'); }
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
        if (!ip) { this.toast('IP-Adresse eingeben', 'warning'); return; }
        try {
            const res = await fetch('/api/block-ip', {
                method: 'POST',
                headers: { 'Content-Type':'application/json' },
                body: JSON.stringify({ ip, reason, duration: duration?parseInt(duration):null, adminEmail: this.ceoEmail })
            });
            const d = await res.json();
            if (d.success) { this.toast('IP blockiert', 'success'); document.getElementById('blockIpAddress').value = ''; document.getElementById('blockReason').value = ''; this.loadBlockedIPs(); }
        } catch (e) { console.error(e); }
    }

    async loadBlockedIPs() {
        try {
            const s = this.getSession();
            const res = await fetch('/api/admin-blocked-ips', { headers: { 'x-admin-email':s.email, 'x-admin-password':s.password } });
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
                        ${i.is_active?`<button class="btn-sm btn-green" data-action="unblock-ip" data-ip="${this.safeAttr(i.ip)}">Unblock</button>`:''}
                    </div>
                `).join('');

                // Event delegation for unblock IP
                list.addEventListener('click', e => {
                    const btn = e.target.closest('[data-action="unblock-ip"]');
                    if (btn) this.unblockIP(btn.dataset.ip);
                });
            }
        } catch (e) { console.error(e); }
    }

    async unblockIP(ip) {
        if (!(await this.confirmDialog(`IP ${ip} entsperren?`))) return;
        try {
            const res = await fetch('/api/block-ip', {
                method: 'POST',
                headers: { 'Content-Type':'application/json' },
                body: JSON.stringify({ ip, action:'unblock', adminEmail: this.ceoEmail })
            });
            if ((await res.json()).success) { this.toast('IP entsperrt', 'success'); this.loadBlockedIPs(); }
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
            const s = this.getSession();
            const res = await fetch(url, { headers: { 'x-admin-email':s.email, 'x-admin-password':s.password } });
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
        const addExport = (tabSel, type, format, label) => {
            const tab = document.querySelector(tabSel);
            if (tab && !tab.querySelector('.export-buttons')) {
                const div = document.createElement('div');
                div.className = 'export-buttons';
                const btn = document.createElement('button');
                btn.className = 'export-btn';
                btn.textContent = label;
                btn.addEventListener('click', () => this.exportData(type, format));
                div.appendChild(btn);
                tab.insertBefore(div, tab.firstChild);
            }
        };
        addExport('#tab-payments', 'payments', 'csv', 'CSV Export');
        addExport('#auditTab', 'audit-logs', 'json', 'JSON Export');
    }

    async exportData(type, format) {
        const s = this.getSession();
        if (!s) { this.toast('Session abgelaufen', 'error'); location.reload(); return; }
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
        } catch (e) { console.error(e); this.toast('Export fehlgeschlagen', 'error'); }
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
                        <button type="button" class="btn-secondary" id="broadcastCancel">Abbrechen</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        document.getElementById('broadcastForm').addEventListener('submit', e => { e.preventDefault(); this.sendBroadcast(); });
        document.getElementById('broadcastCancel').addEventListener('click', () => modal.remove());
    }

    async sendBroadcast() {
        const s = this.getSession();
        const title = document.getElementById('broadcastTitle').value.trim();
        const message = document.getElementById('broadcastMessage').value.trim();
        const audience = document.getElementById('broadcastAudience').value;
        if (!(await this.confirmDialog(`Broadcast an "${audience}" senden?`))) return;
        try {
            const res = await fetch('/api/admin-broadcast', {
                method: 'POST',
                headers: { 'Content-Type':'application/json', 'x-admin-email':s.email, 'x-admin-password':s.password },
                body: JSON.stringify({ title, message, url:'/', icon:'/assets/images/icon-192x192.png', targetAudience: audience })
            });
            const d = await res.json();
            if (res.ok && d.success) { this.toast(`Gesendet: ${d.sent}/${d.total}`, 'success'); document.getElementById('broadcastModal').remove(); }
            else { this.toast(d.error, 'error'); }
        } catch (e) { console.error(e); this.toast('Fehler', 'error'); }
    }

    // ========== DELETE ALL / TEST USERS ==========
    async deleteAllUsers() {
        const c = prompt('⚠️ ALLE User löschen (ausser CEO)?\n\nTippe "DELETE ALL":');
        if (c !== 'DELETE ALL') { if (c !== null) this.toast('Abgebrochen', 'info'); return; }
        if (!(await this.confirmDialog('LETZTE WARNUNG!\nAlle User permanent löschen?', '🚨'))) return;
        try {
            const s = this.getSession();
            const res = await fetch('/api/admin-delete-users', {
                method: 'POST',
                headers: { 'Content-Type':'application/json' },
                body: JSON.stringify({ adminEmail:s.email, adminPassword:s.password })
            });
            const d = await res.json();
            if (res.ok && d.success) { this.toast(`${d.deleted_count} User gelöscht`, 'success'); this.loadUsersData(); }
            else { this.toast(d.error, 'error'); }
        } catch (e) { console.error(e); this.toast('Fehler', 'error'); }
    }

    async createTestUsers() {
        if (!(await this.confirmDialog('2 Test-User erstellen?'))) return;
        try {
            const s = this.getSession();
            const res = await fetch('/api/create-test-users', {
                headers: { 'x-admin-email':s.email, 'x-admin-password':s.password }
            });
            const d = await res.json();
            if (res.ok && d.success) { this.toast(d.message, 'success'); this.loadUsersData(); }
            else { this.toast(d.error, 'error'); }
        } catch (e) { console.error(e); this.toast('Fehler', 'error'); }
    }
}

// Init
const adminPanel = new AdminPanel();
window.admin = adminPanel;

