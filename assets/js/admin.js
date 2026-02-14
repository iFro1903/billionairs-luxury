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
                <div style="margin-top:.5rem;text-align:right;">
                    <button class="btn-sm btn-gold" onclick="window.open('${nda.signature_data}','_blank')" style="font-size:.7rem;padding:.25rem .5rem;">🔍 Vollbild</button>
                </div>
            `;
        } catch (err) {
            if (spinner) spinner.style.display = 'none';
            container.innerHTML = '<span style="color:#ff6b6b;">Fehler beim Laden der NDA</span>';
            console.error('NDA load error:', err);
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
                const user = this.users.find(u => u.email === email);
                const name = user?.name || user?.full_name || 'Mitglied';
                const tpl = templateSelect.value;
                const templates = {
                    'welcome': {
                        subject: 'Willkommen bei BILLIONAIRS',
                        body: `Sehr geehrte/r ${name},\n\nWir heissen Sie herzlich willkommen bei BILLIONAIRS.\n\nIhr exklusiver Zugang wurde aktiviert und steht Ihnen ab sofort zur Verfügung. Als Mitglied unseres privaten Netzwerks profitieren Sie von einzigartigen Privilegien und Verbindungen.\n\nSollten Sie Fragen haben, stehen wir Ihnen jederzeit zur Verfügung.\n\nMit besten Grüssen,\nBILLIONAIRS Management`
                    },
                    'payment-reminder': {
                        subject: 'Zahlungserinnerung — BILLIONAIRS Mitgliedschaft',
                        body: `Sehr geehrte/r ${name},\n\nWir möchten Sie höflich daran erinnern, dass Ihre Mitgliedschaftsgebühr noch aussteht.\n\nBitte vervollständigen Sie die Zahlung über Ihr Dashboard, um weiterhin vollen Zugang zu allen exklusiven Funktionen zu geniessen.\n\nBei Fragen kontaktieren Sie uns unter support@billionairs.luxury.\n\nMit besten Grüssen,\nBILLIONAIRS Management`
                    },
                    'account-issue': {
                        subject: 'Wichtige Information zu Ihrem Account — BILLIONAIRS',
                        body: `Sehr geehrte/r ${name},\n\nWir möchten Sie über ein Anliegen bezüglich Ihres BILLIONAIRS-Accounts informieren.\n\n[Bitte beschreiben Sie hier das Problem]\n\nBitte kontaktieren Sie uns zeitnah, damit wir die Angelegenheit klären können.\n\nMit besten Grüssen,\nBILLIONAIRS Management`
                    },
                    'membership-update': {
                        subject: 'Update Ihrer BILLIONAIRS Mitgliedschaft',
                        body: `Sehr geehrte/r ${name},\n\nWir möchten Sie über eine Aktualisierung Ihrer Mitgliedschaft informieren.\n\n[Details zum Update]\n\nDiese Änderungen treten ab sofort in Kraft.\n\nMit besten Grüssen,\nBILLIONAIRS Management`
                    }
                };

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
            const res = await fetch('/api/admin-emergency', {
                method: 'POST',
                headers: { 'Content-Type':'application/json' },
                body: JSON.stringify({ email: this.ceoEmail, mode: isActive ? 'deactivate' : 'activate' })
            });
            if (res.ok) {
                this.updateEmergencyButton(!isActive);
                this.toast(isActive ? 'Website ONLINE' : 'Emergency Mode AKTIV', isActive ? 'success' : 'warning');
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
                this.setSession(data.email, password);
                this.showDashboard(data.email);
            } else { this.toast('Ungültiger Code', 'error'); this.show2FAPrompt(email, password); }
        } catch (e) { console.error(e); this.toast('2FA Fehler', 'error'); }
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

