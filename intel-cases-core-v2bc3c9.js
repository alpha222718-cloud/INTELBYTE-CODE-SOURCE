var __cfpActiveCaseId = null;
/* Case files from panel-old.html — functions only */
(function () {
  if (typeof window.escapeHtml !== 'function') {
    window.escapeHtml = function (x) {
      return String(x == null ? '' : x).replace(/[&<>"']/g, function (c) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
      });
    };
  }
  if (typeof window.dispMV !== 'function') window.dispMV = window.escapeHtml;
  if (typeof window.showToast !== 'function') {
    window.showToast = function (msg) {
      var el = document.getElementById('casesToast');
      if (!el) {
        el = document.createElement('div');
        el.id = 'casesToast';
        el.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:99999;padding:10px 16px;border-radius:10px;background:rgba(20,20,24,.92);border:1px solid rgba(255,255,255,.14);color:#fff;font-size:13px;opacity:0;transition:opacity .2s;pointer-events:none';
        document.body.appendChild(el);
      }
      el.textContent = String(msg || '');
      el.style.opacity = '1';
      clearTimeout(el._t);
      el._t = setTimeout(function () { el.style.opacity = '0'; }, 2200);
    };
  }
  if (typeof window.triggerPanelDecryption !== 'function') window.triggerPanelDecryption = function () {};
})();

const INTEL_CASES_KEY = 'intel_cases_v1';
const INTEL_CASES_ACTIVE_KEY = 'intel_cases_active_v1';
const INTEL_CASES_EXPORT_MAGIC = 'INTELBYTE_CASES_V1';


let __intel_modalOnOk = null;

function intelCasesLoad() {
    try {
        const raw = localStorage.getItem(INTEL_CASES_KEY);
        const a = raw ? JSON.parse(raw) : [];
        return Array.isArray(a) ? a : [];
    } catch (e) {
        return [];
    }
}

function intelCasesSave(a) {
    localStorage.setItem(INTEL_CASES_KEY, JSON.stringify(a));
}

function intelCasesGetActiveId() {
    return localStorage.getItem(INTEL_CASES_ACTIVE_KEY) || '';
}

function intelCasesSetActiveId(id) {
    localStorage.setItem(INTEL_CASES_ACTIVE_KEY, String(id || ''));
}

function normalizeImportedCase(raw, idx) {
    const id = raw && raw.id ? String(raw.id) : `imp_${Date.now()}_${idx}`;
    const title = raw && raw.title ? String(raw.title) : `Imported case ${idx + 1}`;
    const notes = raw && raw.notes ? String(raw.notes) : '';
    const notesUpdatedAt = raw && raw.notesUpdatedAt ? String(raw.notesUpdatedAt) : '';
    const itemsIn = raw && Array.isArray(raw.items) ? raw.items : [];
    const items = itemsIn
        .map((it, j) => {
            if (!it || typeof it !== 'object') return null;
            return {
                id: it.id ? String(it.id) : `i_${Date.now()}_${idx}_${j}`,
                at: it.at ? String(it.at) : new Date().toISOString(),
                label: it.label ? String(it.label) : 'Imported item',
                payload: it.payload !== undefined ? it.payload : null
            };
        })
        .filter(Boolean);
    const out = { id, title, items, notes, notesUpdatedAt };
    // Keep the board (graph positions/links/entities), subject, brief and AI chat —
    // the export carries them and dropping them is what made imported boards empty.
    const keepObj = (v) => {
        if (!v || typeof v !== 'object' || Array.isArray(v)) return undefined;
        try { return JSON.parse(JSON.stringify(v)); } catch (e) { return undefined; }
    };
    const board = keepObj(raw && raw.board); if (board) out.board = board;
    const subject = keepObj(raw && raw.subject); if (subject) out.subject = subject;
    const brief = keepObj(raw && raw.brief); if (brief) out.brief = brief;
    if (raw && raw.ai && typeof raw.ai === 'object') {
        try { out.ai = JSON.parse(JSON.stringify(raw.ai)); } catch (e) {}
    }
    if (raw && raw.status) out.status = String(raw.status);
    if (raw && raw.createdAt) out.createdAt = raw.createdAt;
    return out;
}

/** Slugify a case title into a filesystem-safe filename fragment. */
function cfSlug(s) {
    return String(s || 'case')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40) || 'case';
}

/** Always ask which case to export — the picker fires every time. */
function casefilesExport() {
    const cases = intelCasesLoad();
    if (!cases.length) {
        showToast('No cases to export', true);
        return;
    }
    cfPickCaseModal({
        title: 'Export which case?',
        subtitle: 'Pick the case you want to save as a .intelcase file.',
        cases,
        okLabel: 'Export',
        onPick: (c) => _cfWriteCaseFile(c)
    });
}

function _cfWriteCaseFile(c) {
    const payload = {
        magic: INTEL_CASES_EXPORT_MAGIC,
        version: 1,
        exportedAt: new Date().toISOString(),
        source: 'IntelByte Panel',
        // For backward-compat with the older importer, still ship `cases` as an
        // array (of length 1). The single-case field is a convenience.
        activeCaseId: c.id,
        cases: [c]
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `intelbyte_case_${cfSlug(c.title)}_${new Date().toISOString().slice(0, 10)}.intelcase`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 400);
    showToast('Exported case: ' + (c.title || 'Case'));
}

function casefilesImportClick() {
    const el = document.getElementById('casefilesImportInput');
    if (!el) return;
    el.value = '';
    el.click();
}

/** Bring a single case into the workspace as a fresh entry — never overwrites. */
function _cfImportSingleCase(c) {
    // Always assign a fresh ID so we can't collide with an existing case.
    const now = Date.now();
    const rand = Math.random().toString(36).slice(2, 7);
    const fresh = Object.assign({}, c, {
        id: 'imp_' + now + '_' + rand,
        createdAt: now,
        status: cfNormalizeStatus(c.status)
    });
    const existing = intelCasesLoad();
    existing.push(fresh);
    intelCasesSave(existing);
    intelCasesSetActiveId(fresh.id);
    casefilesRender();
    showToast('Imported case: ' + (fresh.title || 'Case'));
}

function casefilesImportHandle(input) {
    const file = input && input.files && input.files[0];
    if (!file) return;
    const rd = new FileReader();
    rd.onload = () => {
        try {
            const raw = JSON.parse(String(rd.result || '{}'));
            if (!raw || raw.magic !== INTEL_CASES_EXPORT_MAGIC || Number(raw.version) !== 1 || !Array.isArray(raw.cases)) {
                showToast('Invalid IntelByte case file', true);
                return;
            }
            const imported = raw.cases.map((c, i) => normalizeImportedCase(c, i)).filter(Boolean);
            if (!imported.length) {
                showToast('No valid cases in file', true);
                return;
            }
            if (imported.length === 1) {
                _cfImportSingleCase(imported[0]);
                return;
            }
            // File has more than one case → ask the user to pick ONE.
            cfPickCaseModal({
                title: 'Import which case?',
                subtitle: 'This file contains ' + imported.length + ' cases. Pick the one you want to add.',
                cases: imported,
                okLabel: 'Import',
                onPick: (c) => _cfImportSingleCase(c)
            });
        } catch (e) {
            showToast('Could not import file', true);
        }
    };
    rd.readAsText(file);
}

/* -------------------------------------------------------------
   Case picker modal — reusable list picker for import/export.
   Lightweight: builds a temporary overlay on demand, wires
   click-outside-to-close, cleans up after selection.
   ------------------------------------------------------------- */
function cfPickCaseModal(opts) {
    opts = opts || {};
    const list = Array.isArray(opts.cases) ? opts.cases : [];
    if (!list.length) return;

    // Kill any earlier picker so double-clicks don't stack.
    const old = document.getElementById('cfPickCaseOverlay');
    if (old) old.remove();

    const isExport = /export/i.test(opts.title || '');
    const headIcon = opts.icon || (isExport ? 'fa-file-export' : 'fa-file-import');

    const overlay = document.createElement('div');
    overlay.id = 'cfPickCaseOverlay';
    overlay.className = 'cf-picker-overlay';

    const showSearch = list.length >= 4;
    overlay.innerHTML =
        '<div class="cf-picker" role="dialog" aria-modal="true" aria-labelledby="cfPickCaseTitle">' +
            '<div class="cf-picker-head">' +
                '<div class="cf-picker-head-icon"><i class="fas ' + headIcon + '"></i></div>' +
                '<div class="cf-picker-head-text">' +
                    '<div class="cf-picker-title" id="cfPickCaseTitle">' + escapeHtml(opts.title || 'Pick a case') + '</div>' +
                    (opts.subtitle ? '<div class="cf-picker-subtitle">' + escapeHtml(opts.subtitle) + '</div>' : '') +
                '</div>' +
                '<button type="button" class="cf-picker-x" id="cfPickCaseXBtn" aria-label="Close"><i class="fas fa-times"></i></button>' +
            '</div>' +
            (showSearch
                ? '<div class="cf-picker-search"><i class="fas fa-search"></i>' +
                  '<input id="cfPickCaseSearch" type="text" placeholder="Filter cases…" autocomplete="off" spellcheck="false"></div>'
                : '') +
            '<div class="cf-picker-list" id="cfPickCaseList"></div>' +
            '<div class="cf-picker-foot">' +
                '<span class="cf-picker-foot-hint">↑↓ navigate · Enter select · Esc close</span>' +
                '<button type="button" class="cf-picker-cancel" id="cfPickCaseCancel">Cancel</button>' +
            '</div>' +
        '</div>';
    document.body.appendChild(overlay);

    const listEl = overlay.querySelector('#cfPickCaseList');
    const searchEl = overlay.querySelector('#cfPickCaseSearch');

    function renderList(filter) {
        const q = String(filter || '').trim().toLowerCase();
        const items = q ? list.filter((c) => String(c.title || '').toLowerCase().includes(q)) : list;
        if (!items.length) {
            listEl.innerHTML = '<div class="cf-picker-empty">— no matches —</div>';
            return;
        }
        listEl.innerHTML = items.map((c) => {
            const originalIdx = list.indexOf(c);
            const cnt = (c.items || []).length;
            const upd = (typeof cfLastUpdate === 'function') ? cfLastUpdate(c) : 0;
            const when = upd && typeof cfRelativeTime === 'function' ? cfRelativeTime(upd) : '';
            const metaBits = [];
            metaBits.push(cnt + ' item' + (cnt === 1 ? '' : 's'));
            if (when) metaBits.push(when);
            if (c.notes && String(c.notes).trim()) metaBits.push('has notes');
            const metaHtml = metaBits.map(function (p, i) {
                return (i > 0 ? '<span class="dot"></span>' : '') + escapeHtml(p);
            }).join('');
            return (
                '<button type="button" class="cf-picker-row" data-i="' + originalIdx + '" tabindex="0">' +
                    '<span class="cf-picker-av">' + escapeHtml(cfCaseInitials(c.title)) + '</span>' +
                    '<span class="cf-picker-info">' +
                        '<span class="cf-picker-name">' + escapeHtml(c.title || 'Case') + '</span>' +
                        '<span class="cf-picker-meta">' + metaHtml + '</span>' +
                    '</span>' +
                    '<i class="fas fa-arrow-right cf-picker-arrow"></i>' +
                '</button>'
            );
        }).join('');
    }
    renderList('');

    function close() {
        document.removeEventListener('keydown', onKey);
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }
    function pick(c) {
        close();
        if (c && typeof opts.onPick === 'function') opts.onPick(c);
    }
    function focusableRows() { return listEl.querySelectorAll('.cf-picker-row'); }
    function onKey(e) {
        if (e.key === 'Escape') { e.preventDefault(); close(); return; }
        const rows = focusableRows();
        if (!rows.length) return;
        const active = document.activeElement;
        let i = -1;
        for (let k = 0; k < rows.length; k++) if (rows[k] === active) { i = k; break; }
        if (e.key === 'ArrowDown') { e.preventDefault(); rows[Math.min(rows.length - 1, i + 1) || 0].focus(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); rows[Math.max(0, i - 1)].focus(); }
        else if (e.key === 'Enter' && i >= 0) {
            e.preventDefault();
            const idx = Number(rows[i].getAttribute('data-i'));
            pick(list[idx]);
        }
    }

    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    overlay.querySelector('#cfPickCaseXBtn').addEventListener('click', close);
    overlay.querySelector('#cfPickCaseCancel').addEventListener('click', close);
    listEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.cf-picker-row');
        if (!btn) return;
        pick(list[Number(btn.getAttribute('data-i'))]);
    });
    if (searchEl) searchEl.addEventListener('input', function () { renderList(searchEl.value); });
    document.addEventListener('keydown', onKey);

    // Focus first row (or the search box if present) so arrow-nav works immediately.
    setTimeout(function () {
        if (searchEl) searchEl.focus();
        else { const first = listEl.querySelector('.cf-picker-row'); if (first) first.focus(); }
    }, 0);
}

function casefilesOpenCase(id) {
    if (!id) return;
    intelCasesSetActiveId(id);
    casefilesRender();
    openCaseFolderPopup(id);
}

function casefilesSaveNotes() {
    const activeId = intelCasesGetActiveId();
    if (!activeId) return;
    const box = document.getElementById('casefilesNotes');
    const status = document.getElementById('casefilesNotesStatus');
    const txt = box ? String(box.value || '') : '';
    const cases = intelCasesLoad();
    const c = cases.find((x) => x.id === activeId);
    if (!c) return;
    c.notes = txt;
    c.notesUpdatedAt = new Date().toISOString();
    intelCasesSave(cases);
    if (status) status.textContent = 'Saved at ' + new Date().toLocaleTimeString();
    showToast('Case notes saved');
}

function casefilesRemoveItem(itemId) {
    if (!itemId) return;
    const activeId = intelCasesGetActiveId();
    if (!activeId) return;
    const cases = intelCasesLoad();
    const c = cases.find((x) => x.id === activeId);
    if (!c || !Array.isArray(c.items)) return;
    c.items = c.items.filter((it) => String(it.id) !== String(itemId));
    intelCasesSave(cases);
    casefilesRender();
    showToast('Removed from case');
}

function renderCaseItemBody(it) {
    const p = it && it.payload;
    if (p && typeof p === 'object' && p.kind === 'footprint_card') {
        return renderFootprintCardsHtml([{ title: p.title || 'Card', subtitle: p.subtitle || '', rows: Array.isArray(p.rows) ? p.rows : [] }]);
    }
    if (p && typeof p === 'object' && p.kind === 'footprint_index_row') {
        const cat = String(p.category || 'row');
        const st = String(p.sectionTitle || '');
        const svc = p.service != null ? String(p.service) : '';
        const id1 = p.identifier != null ? String(p.identifier) : '';
        const id2 = p.full_id != null ? String(p.full_id) : '';
        const href = p.href ? String(p.href) : '';
        const kv =
            dlKv('CATEGORY', cat.toUpperCase()) +
            (st ? dlKv('SECTION', st) : '') +
            (svc ? dlKv('SERVICE', svc) : '') +
            (id1 ? dlKv('IDENTIFIER', id1) : '') +
            (id2 && id2 !== id1 ? dlKv('FULL ID', id2) : '');
        const link =
            href && /^https?:\/\//i.test(href)
                ? '<a class="dl-cta" href="' +
                  escapeHtml(href) +
                  '" target="_blank" rel="noopener noreferrer" style="margin-top:12px"><i class="fas fa-external-link-alt"></i> Open link</a>'
                : '';
        return (
            '<div class="dl-section"><div class="dl-section-head"><div class="dl-section-head-left"><div class="dl-section-icon"><i class="fas fa-fingerprint"></i></div><div><div class="dl-section-title">Footprint index row</div><div class="dl-section-sub">' +
            escapeHtml(cat) +
            '</div></div></div></div><div style="padding:16px 18px 18px"><div class="dl-kv-grid">' +
            kv +
            '</div>' +
            link +
            '</div></div>'
        );
    }
    if (p && typeof p === 'object' && p.kind === 'discord_block') {
        const t = String(p.title || '');
        const block = { title: t, summary: p.summary || '', data: p.data || null };
        if (t === 'Discord (REST)')
            return renderDiscordRestCard(block, block.data && block.data.id != null ? String(block.data.id) : '');
        if (t === 'Guild member') return renderDiscordGuildCard(block);
        if (t === 'Platform link' || t.indexOf('discord→roblox') !== -1 || t.indexOf('discord-to-roblox') !== -1) return renderDiscordRobloxLinkCard(block);
        if (t === 'Stealer logs' || (block.data && block.data._intelbyteStealer)) return renderDiscordStealerBlock(block);
        if (t === 'Data breaches' || t === 'Exposure check' || t.indexOf('breach') !== -1) return renderDiscordBreachCard(block);
        return renderDiscordGenericBlock(block);
    }
    if (p && typeof p === 'object' && !Array.isArray(p)) {
        const entry = formatLogEntryHtml(p, 0);
        if (entry) return entry;
        return '<div class="result-json" style="margin:0;border-radius:10px">' + escapeHtml(JSON.stringify(p, null, 2)) + '</div>';
    }
    return '<div class="result-json" style="margin:0;border-radius:10px">' + escapeHtml(typeof p === 'string' ? p : JSON.stringify(p, null, 2)) + '</div>';
}

/* -------------------------------------------------------------
   Case Files v2 — kanban render + drag-drop status + search.
   Legacy hidden holders (#casefilesItems, #casefilesNotes) are
   still populated so any old code path keeps working. Case data
   shape gains an optional `status` field ('active' | 'investigating'
   | 'archived'), defaulted to 'active' on first render.
   ------------------------------------------------------------- */
const CF_STATUS_ORDER = ['active', 'investigating', 'archived'];
const CF_STATUS_LABEL = { active: 'Active', investigating: 'Investigating', archived: 'Archived' };
function cfNormalizeStatus(v) {
    const s = String(v || '').toLowerCase();
    return CF_STATUS_ORDER.includes(s) ? s : 'active';
}
function cfRelativeTime(ts) {
    const n = Number(ts);
    if (!Number.isFinite(n) || n <= 0) return '';
    const diff = Math.max(0, Date.now() - n);
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return m + 'm ago';
    const h = Math.floor(m / 60);
    if (h < 24) return h + 'h ago';
    const d = Math.floor(h / 24);
    if (d < 7) return d + 'd ago';
    const w = Math.floor(d / 7);
    if (w < 5) return w + 'w ago';
    const mo = Math.floor(d / 30);
    if (mo < 12) return mo + 'mo ago';
    return Math.floor(d / 365) + 'y ago';
}
function cfCaseStats(c) {
    const items = Array.isArray(c && c.items) ? c.items : [];
    const s = { items: items.length, emails: 0, users: 0, passwords: 0, ips: 0, machines: 0 };
    for (const it of items) {
        const label = String((it && it.label) || '').toLowerCase();
        const p = (it && it.payload) || {};
        if (p.email || /@/.test(label)) s.emails++;
        if (p.username || /^user[:\s]/.test(label)) s.users++;
        if (p.password || p.hash) s.passwords++;
        if (p.ip || /\bip[:\s]/.test(label)) s.ips++;
        if (p.machine || p.log_id || p.hwid || /machine|infected pc/i.test(label)) s.machines++;
    }
    return s;
}
function cfLastUpdate(c) {
    let t = 0;
    if (c && c.notesUpdatedAt) { const n = Date.parse(c.notesUpdatedAt); if (!isNaN(n)) t = n; }
    const items = Array.isArray(c && c.items) ? c.items : [];
    for (const it of items) {
        if (!it) continue;
        const n = Number(it.at) || Date.parse(it.at || '');
        if (Number.isFinite(n) && n > t) t = n;
    }
    return t || (Number(c && c.createdAt) || 0);
}
function cfCaseInitials(title) {
    const s = String(title || 'Case').trim();
    const parts = s.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'CS';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
/* Case avatar: subject photo when the wizard captured one, initials otherwise.
   Initials sit underneath so a broken image URL degrades instead of going blank. */
function cfAvatarHtml(c) {
    const photo = (c && c.subject && c.subject.photo) ? c.subject.photo : '';
    const initials = escapeHtml(cfCaseInitials(c && c.title));
    if (!photo) return '<div class="cf-card-avatar">' + initials + '</div>';
    return '<div class="cf-card-avatar has-photo">' + initials +
           '<img src="' + escapeHtml(photo) + '" alt="" onerror="this.remove()"></div>';
}

function cfRenderCard(c, activeId) {
    const st = cfCaseStats(c);
    const upd = cfLastUpdate(c);
    const isActive = c.id === activeId;
    // Monochrome, reference-aligned card: avatar + name + when on top,
    // then a summary line, then a meta strip. No coloured accents.
    const summaryBits = [];
    if (st.emails) summaryBits.push(st.emails + ' email' + (st.emails === 1 ? '' : 's'));
    if (st.users) summaryBits.push(st.users + ' user' + (st.users === 1 ? '' : 's'));
    if (st.passwords) summaryBits.push(st.passwords + ' password' + (st.passwords === 1 ? '' : 's'));
    if (st.ips) summaryBits.push(st.ips + ' IP' + (st.ips === 1 ? '' : 's'));
    if (st.machines) summaryBits.push(st.machines + ' machine' + (st.machines === 1 ? '' : 's'));
    const summary = summaryBits.length ? summaryBits.join(', ') : (st.items ? (st.items + ' item' + (st.items === 1 ? '' : 's')) : 'Empty case');
    // Second line: item count · notes flag
    const metaParts = [];
    metaParts.push(st.items + ' item' + (st.items === 1 ? '' : 's'));
    if (c.notes && String(c.notes).trim()) metaParts.push('has notes');
    const metaHtml = metaParts.map(function (p, i) {
        return (i > 0 ? '<span class="dot"></span>' : '') + escapeHtml(p);
    }).join('');
    return (
        '<div class="cf-card' + (isActive ? ' is-active' : '') + '"' +
        ' draggable="true" data-case-id="' + escapeHtml(c.id) + '"' +
        ' onclick="casefilesOpenCase(\'' + escapeHtml(c.id) + '\')">' +
        '<div class="cf-card-head">' +
        cfAvatarHtml(c) +
        '<div class="cf-card-title">' + escapeHtml(c.title || 'Case') + '</div>' +
        (upd ? '<div class="cf-card-when">' + escapeHtml(cfRelativeTime(upd)) + '</div>' : '') +
        '</div>' +
        '<span class="cf-card-line">' + escapeHtml(summary) + '</span>' +
        '<div class="cf-card-meta">' + metaHtml + '</div>' +
        '</div>'
    );
}

function casefilesRender() {
    const foldersEl = document.getElementById('casefilesFolders');
    if (!foldersEl) return;

    let cases = intelCasesLoad();
    if (!cases.length) {
        cases = [{ id: 'default', title: 'Default case', items: [], status: 'active', createdAt: Date.now() }];
        intelCasesSave(cases);
    }
    // Backfill missing status field (one-time silent migration)
    let migrated = false;
    for (const c of cases) {
        if (!c.status) { c.status = 'active'; migrated = true; }
        else if (c.status !== cfNormalizeStatus(c.status)) { c.status = cfNormalizeStatus(c.status); migrated = true; }
    }
    if (migrated) intelCasesSave(cases);

    let activeId = intelCasesGetActiveId();
    if (!activeId || !cases.some((x) => x.id === activeId)) {
        activeId = cases[0].id;
        intelCasesSetActiveId(activeId);
    }

    // Search filter — matches title or notes.
    const searchEl = document.getElementById('casesSearchInput');
    const q = String((searchEl && searchEl.value) || '').trim().toLowerCase();
    const filtered = q
        ? cases.filter((c) => String(c.title || '').toLowerCase().includes(q) || String(c.notes || '').toLowerCase().includes(q))
        : cases;

    // Group by status; each column sorted newest-activity first.
    const groups = { active: [], investigating: [], archived: [] };
    for (const c of filtered) groups[cfNormalizeStatus(c.status)].push(c);
    for (const s of CF_STATUS_ORDER) groups[s].sort((a, b) => cfLastUpdate(b) - cfLastUpdate(a));

    foldersEl.innerHTML = CF_STATUS_ORDER.map((status) => {
        const list = groups[status];
        const isEmpty = list.length === 0;
        // Empty column → one centered placeholder that reads "No cases" and turns
        // into "Create case" on hover (clickable). No separate add button below.
        const bodyHtml = isEmpty
            ? '<button type="button" class="cf-col-empty-add" data-cf-new-status="' + status + '">' +
                  '<span class="cf-empty-label">No cases</span>' +
                  '<span class="cf-empty-hover"><i class="fas fa-plus"></i> Create case</span>' +
              '</button>'
            : list.map((c) => cfRenderCard(c, activeId)).join('');
        // Monochrome column: title + count, optional trash on hover, add button at BOTTOM.
        return (
            '<div class="cf-col" data-status="' + status + '">' +
            '<div class="cf-col-head">' +
            '<span class="cf-col-title">' + escapeHtml(CF_STATUS_LABEL[status]) + '</span>' +
            '<span class="cf-col-count">' + list.length + '</span>' +
            (list.length
                ? '<button type="button" class="cf-col-trash" data-cf-clear-status="' + status + '" title="Archive all cases in this column"><i class="fas fa-trash-can"></i></button>'
                : '') +
            '</div>' +
            '<div class="cf-col-body">' + bodyHtml + '</div>' +
            (isEmpty
                ? ''
                : '<button type="button" class="cf-col-add" data-cf-new-status="' + status + '">' +
                  '<i class="fas fa-plus"></i> Add new case' +
                  '</button>') +
            '</div>'
        );
    }).join('');

    // Meta counter
    const meta = document.getElementById('casesCountMeta');
    if (meta) {
        const total = cases.length;
        const shown = filtered.length;
        meta.textContent = (q ? shown + ' of ' + total : total) + ' case' + (total === 1 ? '' : 's');
    }

    // Wire drag/drop + per-column add + search once.
    if (!foldersEl._cfV2Wired) {
        foldersEl._cfV2Wired = true;
        foldersEl.addEventListener('dragstart', function (e) {
            const card = e.target && e.target.closest ? e.target.closest('.cf-card') : null;
            if (!card) return;
            card.classList.add('is-dragging');
            const id = card.getAttribute('data-case-id') || '';
            try { e.dataTransfer.setData('text/case-id', id); e.dataTransfer.effectAllowed = 'move'; } catch (_) {}
        });
        foldersEl.addEventListener('dragend', function (e) {
            const card = e.target && e.target.closest ? e.target.closest('.cf-card') : null;
            if (card) card.classList.remove('is-dragging');
            foldersEl.querySelectorAll('.cf-col.is-drop').forEach((el) => el.classList.remove('is-drop'));
        });
        foldersEl.addEventListener('dragover', function (e) {
            const col = e.target && e.target.closest ? e.target.closest('.cf-col') : null;
            if (!col) return;
            e.preventDefault();
            try { e.dataTransfer.dropEffect = 'move'; } catch (_) {}
            foldersEl.querySelectorAll('.cf-col.is-drop').forEach((el) => { if (el !== col) el.classList.remove('is-drop'); });
            col.classList.add('is-drop');
        });
        foldersEl.addEventListener('dragleave', function (e) {
            const col = e.target && e.target.closest ? e.target.closest('.cf-col') : null;
            if (col && !col.contains(e.relatedTarget)) col.classList.remove('is-drop');
        });
        foldersEl.addEventListener('drop', function (e) {
            const col = e.target && e.target.closest ? e.target.closest('.cf-col') : null;
            if (!col) return;
            e.preventDefault();
            col.classList.remove('is-drop');
            let id = '';
            try { id = e.dataTransfer.getData('text/case-id') || ''; } catch (_) {}
            if (!id) return;
            const target = col.getAttribute('data-status') || 'active';
            const arr = intelCasesLoad();
            let changed = false;
            for (const c of arr) {
                if (c.id === id && c.status !== target) {
                    c.status = target;
                    changed = true;
                    break;
                }
            }
            if (changed) { intelCasesSave(arr); casefilesRender(); }
        });
        foldersEl.addEventListener('click', function (e) {
            const trg = e.target && e.target.closest ? e.target : null;
            if (!trg) return;
            const addBtn = trg.closest('.cf-col-add, .cf-col-empty-add');
            if (addBtn) {
                e.preventDefault();
                e.stopPropagation();
                if (typeof casefilesNewCase === 'function') casefilesNewCase(addBtn.getAttribute('data-cf-new-status') || 'active');
                return;
            }
            const trashBtn = trg.closest('.cf-col-trash');
            if (trashBtn) {
                e.preventDefault();
                e.stopPropagation();
                const s = trashBtn.getAttribute('data-cf-clear-status') || 'active';
                if (s === 'archived') return;
                // Non-destructive: sends every case in this column to Archived.
                if (!confirm('Move all "' + (CF_STATUS_LABEL[s] || s) + '" cases to Archived?')) return;
                const arr = intelCasesLoad();
                let n = 0;
                for (const c of arr) {
                    if (cfNormalizeStatus(c.status) === s) { c.status = 'archived'; n++; }
                }
                if (n) { intelCasesSave(arr); casefilesRender(); showToast('Archived ' + n + ' case' + (n === 1 ? '' : 's')); }
            }
        });
    }
    if (searchEl && !searchEl._cfV2Wired) {
        searchEl._cfV2Wired = true;
        searchEl.addEventListener('input', function () { casefilesRender(); });
    }

    // Populate the legacy hidden holders so ancient callers keep working.
    const itemsEl = document.getElementById('casefilesItems');
    const notesEl = document.getElementById('casefilesNotes');
    const notesStatus = document.getElementById('casefilesNotesStatus');
    const active = cases.find((x) => x.id === activeId) || cases[0];
    if (notesEl) notesEl.value = active.notes || '';
    if (notesStatus) {
        notesStatus.textContent = active.notesUpdatedAt
            ? ('Last saved ' + new Date(active.notesUpdatedAt).toLocaleString())
            : 'Notes are saved locally in this browser.';
    }
    if (itemsEl) itemsEl.innerHTML = '';
}

function casefilesOnSelectChange() {
    casefilesRender();
}

/* ============================================================
   NEW CASE FILE WIZARD
   Step-by-step case opening. Identifiers entered here are not
   decoration: each becomes a typed board node wired to the case
   hub, and anything IntelByte can look up gets a one-click search.
   ============================================================ */
const CFW_TYPES = [
    { key: 'username', label: 'Username',        search: 'username',      node: 'username',  icon: 'fa-user' },
    { key: 'email',    label: 'Email',           search: 'email',         node: 'email',     icon: 'fa-at' },
    { key: 'discord',  label: 'Discord ID',      search: 'discord',       node: 'discord',   icon: 'fa-hashtag' },
    { key: 'roblox',   label: 'Roblox',          search: 'roblox',        node: 'roblox',    icon: 'fa-cube' },
    { key: 'phone',    label: 'Phone',           search: 'telegram',      node: 'phone',     icon: 'fa-phone' },
    { key: 'name',     label: 'Real name',       search: 'name',          node: 'name',      icon: 'fa-id-card' },
    { key: 'password', label: 'Password / hash', search: 'password',      node: 'password',  icon: 'fa-key' },
    { key: 'ip',       label: 'IP address',      search: 'ip',            node: 'ip',        icon: 'fa-network-wired' },
    { key: 'domain',   label: 'Domain',          search: 'domain_origin', node: 'domain',    icon: 'fa-sitemap' },
    { key: 'url',      label: 'Profile URL',     search: '',              node: 'link',      icon: 'fa-link' },
    { key: 'location', label: 'Location',        search: '',              node: 'location',  icon: 'fa-location-dot' }
];
const CFW_STEPS = [
    { n: 1, label: 'Case',    icon: 'fa-folder-plus' },
    { n: 2, label: 'Subject', icon: 'fa-fingerprint' },
    { n: 3, label: 'Report',  icon: 'fa-file-lines' },
    { n: 4, label: 'Launch',  icon: 'fa-rocket' }
];
function cfwType(k) {
    for (let i = 0; i < CFW_TYPES.length; i++) if (CFW_TYPES[i].key === k) return CFW_TYPES[i];
    return CFW_TYPES[0];
}

let cfwState = null;
let cfwBound = false;

function casefilesNewCase(status) {
    const ov = document.getElementById('caseWizard');
    if (!ov) return;
    cfwState = {
        step: 1,
        status: cfNormalizeStatus(status),
        title: '', alias: '', photo: '',
        ids: [{ type: 'username', value: '' }],
        incident: '', objective: '', facts: '',
        createdId: null
    };
    cfwBind();
    ov.style.display = 'flex';
    cfwRender();
    setTimeout(() => { const t = document.getElementById('cfwTitle'); if (t) t.focus(); }, 60);
}

function cfwClose() {
    const ov = document.getElementById('caseWizard');
    if (ov) ov.style.display = 'none';
    cfwState = null;
}

function cfwBind() {
    if (cfwBound) return;
    cfwBound = true;
    const on = (id, ev, fn) => { const e = document.getElementById(id); if (e) e.addEventListener(ev, fn); };

    on('cfwNext', 'click', () => {
        if (!cfwState) return;
        if (cfwState.step === 4) { cfwCreate(); return; }
        cfwGo(cfwState.step + 1);
    });
    on('cfwBack', 'click', () => { if (cfwState) cfwGo(cfwState.step - 1); });
    on('cfwSkip', 'click', () => { if (cfwState) cfwGo(cfwState.step + 1, true); });
    on('cfwAddId', 'click', () => {
        if (!cfwState) return;
        cfwHarvest();
        cfwState.ids.push({ type: 'username', value: '' });
        cfwRenderIds();
    });
    on('cfwPhotoFile', 'change', (e) => {
        const f = e.target && e.target.files && e.target.files[0];
        if (f) cfwReadPhoto(f);
        e.target.value = '';
    });
    on('cfwPhotoUrl', 'input', (e) => {
        if (!cfwState) return;
        const v = String(e.target.value || '').trim();
        if (v) { cfwState.photo = v; cfwPaintPhoto(); }
    });
    on('cfwPhotoClear', 'click', () => {
        if (!cfwState) return;
        cfwState.photo = '';
        const u = document.getElementById('cfwPhotoUrl'); if (u) u.value = '';
        cfwPaintPhoto();
    });
    on('cfwOpenBoard', 'click', cfwOpenBoard);

    // delegated: remove an identifier row / run a seeded search
    const body = document.querySelector('#caseWizard .cfw-body');
    if (body) body.addEventListener('click', (e) => {
        const del = e.target.closest && e.target.closest('.cfw-id-del');
        if (del) {
            cfwHarvest();
            const i = Number(del.getAttribute('data-i'));
            if (cfwState && cfwState.ids.length > 1) cfwState.ids.splice(i, 1);
            else if (cfwState) cfwState.ids = [{ type: 'username', value: '' }];
            cfwRenderIds();
            return;
        }
        const go = e.target.closest && e.target.closest('[data-cfw-search]');
        if (go) {
            const t = go.getAttribute('data-cfw-search');
            const q = go.getAttribute('data-cfw-q');
            cfwClose();
            if (typeof window.intelLaunchSearch === 'function') window.intelLaunchSearch(t, q);
        }
    });
}

/* ── state <-> DOM ── */
function cfwHarvest() {
    const s = cfwState; if (!s) return;
    const g = (id) => { const e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; };
    if (s.step === 1) {
        s.title = g('cfwTitle');
        s.alias = g('cfwAlias');
        const st = document.getElementById('cfwStatus');
        if (st) s.status = cfNormalizeStatus(st.value);
    } else if (s.step === 2) {
        const rows = document.querySelectorAll('#cfwIdList .cfw-id-row');
        if (rows.length) {
            s.ids = [];
            rows.forEach((r) => {
                const t = r.querySelector('.cfw-id-type');
                const v = r.querySelector('.cfw-id-val');
                s.ids.push({ type: t ? t.value : 'username', value: v ? String(v.value || '').trim() : '' });
            });
        }
    } else if (s.step === 3) {
        s.incident = g('cfwIncident');
        s.objective = g('cfwObjective');
        s.facts = g('cfwFacts');
    }
}

function cfwGo(step, skipping) {
    const s = cfwState; if (!s) return;
    cfwHarvest();
    if (!skipping && step > s.step && s.step === 1 && !s.title) {
        const t = document.getElementById('cfwTitle');
        if (t) { t.focus(); t.style.borderColor = 'rgba(255,120,120,0.6)'; setTimeout(() => { t.style.borderColor = ''; }, 1200); }
        return;
    }
    s.step = Math.max(1, Math.min(5, step));
    cfwRender();
}

function cfwRender() {
    const s = cfwState; if (!s) return;

    // stepper
    const stp = document.getElementById('cfwStepper');
    if (stp) {
        stp.style.display = s.step >= 5 ? 'none' : 'block';
        const cls = (x) => (s.step === x.n ? ' is-active' : (s.step > x.n ? ' is-done' : ''));
        stp.innerHTML =
            '<div class="cfw-steps-pill">' +
            '<span class="cfw-steps-fill" style="width:0"></span>' +
            CFW_STEPS.map((x) =>
                '<div class="cfw-stp-cell' + cls(x) + '">' +
                '<div class="cfw-stp-ic"><i class="fas ' + (s.step > x.n ? 'fa-check' : x.icon) + '"></i></div>' +
                '</div>').join('') + '</div>' +
            '<div class="cfw-steps-labels">' + CFW_STEPS.map((x) =>
                '<div class="cfw-stp-cell' + cls(x) + '">' +
                '<span class="cfw-stp-n">' + x.n + '</span>' +
                '<span class="cfw-stp-lb">' + escapeHtml(x.label) + '</span>' +
                '</div>').join('') + '</div>';
        // grow the track on the next frame so the width actually transitions
        const fill = stp.querySelector('.cfw-steps-fill');
        if (fill) {
            const frac = (s.step - 0.5) / CFW_STEPS.length;
            requestAnimationFrame(() => {
                fill.style.width = 'calc((100% - 16px) * ' + frac.toFixed(4) + ')';
            });
        }
    }

    // panels
    document.querySelectorAll('#caseWizard .cfw-step').forEach((el) => {
        el.classList.toggle('is-on', Number(el.getAttribute('data-step')) === s.step);
    });

    // fill inputs
    const set = (id, v) => { const e = document.getElementById(id); if (e && e.value !== v) e.value = v; };
    if (s.step === 1) {
        set('cfwTitle', s.title); set('cfwAlias', s.alias);
        const st = document.getElementById('cfwStatus'); if (st) st.value = s.status;
        cfwPaintPhoto();
    } else if (s.step === 2) {
        cfwRenderIds();
    } else if (s.step === 3) {
        set('cfwIncident', s.incident); set('cfwObjective', s.objective); set('cfwFacts', s.facts);
    } else if (s.step === 4) {
        cfwRenderReview();
    } else if (s.step === 5) {
        const l = document.getElementById('cfwLaunchList');
        if (l) l.innerHTML = cfwLaunchHtml();
        const t = document.getElementById('cfwDoneTitle');
        if (t) t.textContent = s.title + ' — opened';
    }

    // footer
    const foot = document.getElementById('cfwFoot');
    if (foot) foot.style.display = s.step >= 5 ? 'none' : 'flex';
    const back = document.getElementById('cfwBack');
    if (back) back.disabled = s.step <= 1;
    const skip = document.getElementById('cfwSkip');
    if (skip) skip.style.display = (s.step === 2 || s.step === 3) ? 'inline-flex' : 'none';
    const next = document.getElementById('cfwNext');
    if (next) {
        next.innerHTML = s.step === 4
            ? '<i class="fas fa-folder-plus"></i> Create case file'
            : 'Continue <i class="fas fa-arrow-right"></i>';
    }
}

function cfwRenderIds() {
    const s = cfwState; if (!s) return;
    const host = document.getElementById('cfwIdList'); if (!host) return;
    host.innerHTML = s.ids.map((it, i) => {
        const opts = CFW_TYPES.map((t) =>
            '<option value="' + t.key + '"' + (t.key === it.type ? ' selected' : '') + '>' + escapeHtml(t.label) + '</option>'
        ).join('');
        const m = cfwType(it.type);
        return '<div class="cfw-id-row">' +
               '<select class="cfw-input cfw-id-type">' + opts + '</select>' +
               '<input class="cfw-input cfw-id-val" type="text" autocomplete="off" placeholder="' + escapeHtml(m.label) + '…" value="' + escapeHtml(it.value) + '">' +
               '<button type="button" class="cfw-id-del" data-i="' + i + '" title="Remove"><i class="fas fa-xmark"></i></button>' +
               '</div>';
    }).join('');
    // keep the placeholder in sync when the type changes
    host.querySelectorAll('.cfw-id-type').forEach((sel) => {
        sel.addEventListener('change', () => {
            const row = sel.closest('.cfw-id-row');
            const val = row && row.querySelector('.cfw-id-val');
            if (val) val.placeholder = cfwType(sel.value).label + '…';
        });
    });
}

function cfwRenderReview() {
    const s = cfwState; if (!s) return;
    const host = document.getElementById('cfwReview'); if (!host) return;
    const ids = s.ids.filter((x) => x.value);
    const out = [];

    out.push('<div class="cfw-rev-sec"><div class="cfw-rev-lb">Case</div>' +
        '<div class="cfw-rev-row">' +
        (s.photo ? '<img class="cfw-rev-avatar" src="' + escapeHtml(s.photo) + '" alt="" onerror="this.remove()">' : '<i class="fas fa-folder-open"></i>') +
        '<span class="cfw-rev-v"><b>' + escapeHtml(s.title || 'Untitled case') + '</b>' +
        (s.alias ? ' · ' + escapeHtml(s.alias) : '') + '</span>' +
        '<span class="cfw-rev-k">' + escapeHtml(CF_STATUS_LABEL[s.status] || s.status) + '</span>' +
        '</div></div>');

    out.push('<div class="cfw-rev-sec"><div class="cfw-rev-lb">Identifiers · ' + ids.length + ' node' + (ids.length === 1 ? '' : 's') + ' on the board</div>' +
        (ids.length
            ? ids.map((it) => {
                const m = cfwType(it.type);
                return '<div class="cfw-rev-row"><i class="fas ' + m.icon + '"></i>' +
                       '<span class="cfw-rev-k">' + escapeHtml(m.label) + '</span>' +
                       '<span class="cfw-rev-v">' + escapeHtml(it.value) + '</span></div>';
              }).join('')
            : '<div class="cfw-hint">No identifiers — the board will open with just the case hub.</div>') +
        '</div>');

    const sec = (lb, txt) => txt
        ? '<div class="cfw-rev-sec"><div class="cfw-rev-lb">' + lb + '</div><div class="cfw-rev-txt">' + escapeHtml(txt) + '</div></div>'
        : '';
    out.push(sec('Incident', s.incident));
    out.push(sec('Objective', s.objective));
    out.push(sec('Confirmed facts', s.facts));

    host.innerHTML = out.join('');
}

function cfwLaunchHtml() {
    const s = cfwState; if (!s) return '';
    const ids = s.ids.filter((x) => x.value);
    if (!ids.length) return '<div class="cfw-hint">No identifiers were added — open the board and add nodes as you find them.</div>';
    return ids.map((it) => {
        const m = cfwType(it.type);
        const btn = m.search
            ? '<button type="button" class="cfw-btn cfw-btn--sm" data-cfw-search="' + escapeHtml(m.search) + '" data-cfw-q="' + escapeHtml(it.value) + '"><i class="fas fa-magnifying-glass"></i> Search</button>'
            : '<span class="cfw-nosearch">no source</span>';
        return '<div class="cfw-launch-row"><i class="fas ' + m.icon + '"></i>' +
               '<span class="cfw-launch-k">' + escapeHtml(m.label) + '</span>' +
               '<span class="cfw-launch-v">' + escapeHtml(it.value) + '</span>' + btn + '</div>';
    }).join('');
}

/* ── photo: resize to a small thumbnail so localStorage survives ── */
function cfwPaintPhoto() {
    const box = document.getElementById('cfwPhoto'); if (!box) return;
    const s = cfwState;
    box.innerHTML = (s && s.photo)
        ? '<img src="' + escapeHtml(s.photo) + '" alt="" onerror="this.parentNode.innerHTML=\'<i class=&quot;fas fa-camera&quot;></i>\'">'
        : '<i class="fas fa-camera"></i>';
}
function cfwReadPhoto(file) {
    const r = new FileReader();
    r.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const max = 384;   // the photo is the case hub's whole disc — keep it crisp
            const sc = Math.min(1, max / Math.max(img.width, img.height));
            const cw = Math.max(1, Math.round(img.width * sc));
            const ch = Math.max(1, Math.round(img.height * sc));
            const cv = document.createElement('canvas');
            cv.width = cw; cv.height = ch;
            cv.getContext('2d').drawImage(img, 0, 0, cw, ch);
            try {
                if (cfwState) cfwState.photo = cv.toDataURL('image/jpeg', 0.82);
            } catch (err) { if (cfwState) cfwState.photo = ''; }
            cfwPaintPhoto();
        };
        img.onerror = () => { showToast('Could not read that image'); };
        img.src = e.target.result;
    };
    r.readAsDataURL(file);
}

/* ── the police-report style brief written into case notes ── */
function cfwReport(s, ids) {
    const L = [];
    L.push('CASE FILE — ' + String(s.title || '').toUpperCase());
    L.push('Opened: ' + new Date().toLocaleString());
    if (s.alias) L.push('Subject: ' + s.alias);
    L.push('');
    if (ids.length) {
        L.push('KNOWN IDENTIFIERS');
        ids.forEach((it) => L.push('  - ' + cfwType(it.type).label + ': ' + it.value));
        L.push('');
    }
    if (s.incident) { L.push('INCIDENT'); L.push(s.incident); L.push(''); }
    if (s.objective) { L.push('OBJECTIVE'); L.push(s.objective); L.push(''); }
    if (s.facts) { L.push('CONFIRMED FACTS'); L.push(s.facts); L.push(''); }
    return L.join('\n');
}

function cfwCreate() {
    cfwHarvest();
    const s = cfwState; if (!s) return;
    if (!s.title) { s.step = 1; cfwRender(); return; }

    const ids = s.ids.filter((x) => x.value);
    const stamp = Date.now();

    // Pre-wire the board: subject + one typed entity per identifier, each linked to it.
    // No positions for the entities: the board lays them out on their type's side.
    const board = { pos: {}, links: [], custom: [] };
    board.pos['__hub'] = { x: 520, y: 240 };
    ids.forEach((it, i) => {
        const m = cfwType(it.type);
        const nid = 'cn_' + stamp + '_' + i;
        board.custom.push({ id: nid, type: m.node, label: it.value, detail: '' });
        board.links.push(['__hub', nid, { label: '' }]);
    });

    const id = 'c_' + stamp;
    const cases = intelCasesLoad();
    cases.push({
        id: id,
        title: s.title,
        items: [],
        status: s.status,
        createdAt: stamp,
        subject: { alias: s.alias, photo: s.photo, identifiers: ids },
        brief: { incident: s.incident, objective: s.objective, facts: s.facts },
        notes: cfwReport(s, ids),
        notesUpdatedAt: new Date().toISOString(),
        board: board
    });

    try {
        intelCasesSave(cases);
    } catch (err) {
        showToast('Could not save — storage full. Try without a photo.');
        return;
    }
    intelCasesSetActiveId(id);
    casefilesRender();

    s.createdId = id;
    s.step = 5;
    cfwRender();
    showToast('Case file opened');
}

function cfwOpenBoard() {
    const id = cfwState && cfwState.createdId;
    cfwClose();
    if (!id) return;
    if (typeof openCaseFolderPopup === 'function') {
        openCaseFolderPopup(id);
        setTimeout(() => { try { if (window.intelBoard) window.intelBoard.show('board'); } catch (e) {} }, 140);
    }
}

window.cfwClose = cfwClose;

/** Delete button: pick a case first, then confirm it by name. */
function casefilesDeleteCase() {
    const cases = intelCasesLoad();
    if (!cases.length) return;
    if (cases.length <= 1) {
        showToast('Keep at least one case', true);
        return;
    }
    cfPickCaseModal({
        title: 'Delete which case?',
        subtitle: 'Pick the case you want to delete.',
        icon: 'fa-trash',
        cases,
        okLabel: 'Delete',
        onPick: (c) => cfConfirmDeleteCase(c)
    });
}

/** Styled yes/no confirm: Do you want to delete case named "<title>"? */
function cfConfirmDeleteCase(c) {
    if (!c || !c.id) return;
    const old = document.getElementById('cfDelCaseOverlay');
    if (old) old.remove();
    const title = String(c.title || 'Untitled case');
    const cnt = (c.items || []).length;
    const overlay = document.createElement('div');
    overlay.id = 'cfDelCaseOverlay';
    overlay.className = 'cf-picker-overlay';
    overlay.innerHTML =
        '<div class="cf-picker cf-confirm" role="alertdialog" aria-modal="true" aria-labelledby="cfDelCaseTitle" style="max-width:440px">' +
            '<div class="cf-picker-head">' +
                '<div class="cf-picker-head-icon" style="color:#ff6b6b"><i class="fas fa-trash"></i></div>' +
                '<div class="cf-picker-head-text">' +
                    '<div class="cf-picker-title" id="cfDelCaseTitle">Delete case</div>' +
                    '<div class="cf-picker-subtitle">This removes the case, its board and its ' + cnt + ' saved item' + (cnt === 1 ? '' : 's') + '. It can\'t be undone.</div>' +
                '</div>' +
                '<button type="button" class="cf-picker-x" data-cfdel="no" aria-label="Close"><i class="fas fa-times"></i></button>' +
            '</div>' +
            '<div style="padding:18px 20px;font-size:14px;line-height:1.5">' +
                'Do you want to delete case named <b>&quot;' + escapeHtml(title) + '&quot;</b>?' +
            '</div>' +
            '<div class="cf-picker-foot" style="justify-content:flex-end;gap:8px">' +
                '<button type="button" class="cf-picker-cancel" data-cfdel="no">Cancel</button>' +
                '<button type="button" class="cf-picker-cancel" data-cfdel="yes" style="background:rgba(255,80,80,.18);border-color:rgba(255,90,90,.55);color:#ff8a8a">Delete</button>' +
            '</div>' +
        '</div>';
    document.body.appendChild(overlay);

    function close() {
        document.removeEventListener('keydown', onKey, true);
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }
    function onKey(e) {
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
        else if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); close(); cfDeleteCaseById(c.id); }
    }
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) { close(); return; }
        const btn = e.target.closest && e.target.closest('[data-cfdel]');
        if (!btn) return;
        const yes = btn.getAttribute('data-cfdel') === 'yes';
        close();
        if (yes) cfDeleteCaseById(c.id);
    });
    document.addEventListener('keydown', onKey, true);
    const cancelBtn = overlay.querySelector('[data-cfdel="no"].cf-picker-cancel');
    if (cancelBtn) setTimeout(() => cancelBtn.focus(), 0);
}

function cfDeleteCaseById(id) {
    const cases = intelCasesLoad();
    const victim = cases.find((c) => c.id === id);
    if (!victim) { showToast('Case not found', true); return; }
    if (cases.length <= 1) { showToast('Keep at least one case', true); return; }
    const next = cases.filter((c) => c.id !== id);
    intelCasesSave(next);
    if (intelCasesGetActiveId() === id || !next.some((c) => c.id === intelCasesGetActiveId())) {
        intelCasesSetActiveId(next[0] ? next[0].id : 'default');
    }
    if (typeof __cfpActiveCaseId !== 'undefined' && __cfpActiveCaseId === id && typeof closeCaseFolderPopup === 'function') {
        try { closeCaseFolderPopup(); } catch (e) {}
    }
    casefilesRender();
    showToast('Case deleted: ' + (victim.title || 'Case'));
}

function intelJsonFromCaseB64(b64) {
    if (!b64) return null;
    try {
        return JSON.parse(decodeURIComponent(escape(atob(b64))));
    } catch (e) {
        return null;
    }
}

function intelAddRowToCaseFromBtn(btn) {
    const b64 = btn && btn.getAttribute('data-b64');
    const payload = intelJsonFromCaseB64(b64);
    if (!payload) {
        showToast('Could not read row', true);
        return;
    }
    intelOpenChooseCaseModal(payload, 'Log row');
}

function intelAddCaseFromFpB64(b64) {
    const payload = intelJsonFromCaseB64(b64);
    if (!payload) {
        showToast('Could not read card', true);
        return;
    }
    const label =
        payload && payload.kind === 'discord_block'
            ? 'Discord · ' + (payload.title || 'Block')
            : payload && payload.kind === 'footprint_index_row'
              ? 'Footprint · ' +
                (payload.category || 'row') +
                (payload.identifier ? ' · ' + String(payload.identifier).slice(0, 48) : '')
              : 'Card · ' + (payload.title || '');
    intelOpenChooseCaseModal(payload, label);
}

function intelEnsureChooseCaseModal() {
    if (document.getElementById('intelChooseCaseModal')) return;
    
    const style = document.createElement('style');
    style.id = 'intelChooseCaseModalStyles';
    style.textContent = `
        #intelChooseCaseModal {
            position: fixed;
            inset: 0;
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .choose-case-backdrop {
            position: absolute;
            inset: 0;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: none;
            -webkit-backdrop-filter: none;
            animation: chooseCaseFadeIn 0.2s ease-out forwards;
        }
        .choose-case-card {
            position: relative;
            width: 100%;
            max-width: 440px;
            max-height: 80vh;
            display: flex;
            flex-direction: column;
            background: linear-gradient(135deg, rgba(20, 26, 38, 0.97) 0%, rgba(10, 14, 20, 0.99) 100%) !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 16px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.1);
            padding: 20px;
            z-index: 10001;
            animation: chooseCaseSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes chooseCaseFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes chooseCaseSlideUp {
            from { opacity: 0; transform: translateY(20px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .choose-case-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 16px;
        }
        .choose-case-title {
            color: var(--text-bright);
            font-size: 15px;
            font-weight: 700;
            letter-spacing: 0.3px;
        }
        .choose-case-close {
            background: transparent;
            border: none;
            color: var(--text-dim);
            cursor: pointer;
            font-size: 16px;
            padding: 4px 8px;
            border-radius: 8px;
            transition: all 0.2s;
        }
        .choose-case-close:hover {
            color: var(--text-bright);
            background: rgba(255, 255, 255, 0.05);
        }
        .choose-case-list {
            flex: 1;
            overflow-y: auto;
            margin-bottom: 16px;
            max-height: 250px;
            padding-right: 4px;
        }
        .choose-case-list::-webkit-scrollbar {
            width: 6px;
        }
        .choose-case-list::-webkit-scrollbar-track {
            background: transparent;
        }
        .choose-case-list::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.12);
            border-radius: 3px;
        }
        .choose-case-list::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.2);
        }
        .choose-case-item {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 14px;
            margin-bottom: 8px;
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.04);
            border-radius: 10px;
            color: var(--text-bright);
            cursor: pointer;
            text-align: left;
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .choose-case-item:hover {
            background: rgba(255, 255, 255, 0.06);
            border-color: var(--border-hover);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .choose-case-item-info {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .choose-case-item-icon {
            color: var(--primary);
            font-size: 14px;
        }
        .choose-case-item-name {
            font-size: 13px;
            font-weight: 550;
        }
        .choose-case-item-meta {
            font-size: 11px;
            color: var(--text-dim);
            margin-left: 4px;
        }
        .choose-case-item-arrow {
            color: var(--text-dim);
            font-size: 11px;
            transition: transform 0.2s;
        }
        .choose-case-item:hover .choose-case-item-arrow {
            transform: translateX(2px);
            color: var(--text-bright);
        }
        .choose-case-new-title {
            color: var(--text-dim);
            font-size: 10px;
            margin-bottom: 8px;
            font-weight: 600;
            letter-spacing: 0.5px;
        }
        .choose-case-input-group {
            display: flex;
            gap: 8px;
            margin-bottom: 12px;
        }
        .choose-case-input {
            flex: 1;
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid var(--border);
            border-radius: 8px;
            color: var(--text-bright);
            padding: 9px 12px;
            font-size: 13px;
            outline: none;
            transition: border-color 0.2s;
        }
        .choose-case-input:focus {
            border-color: var(--primary);
        }
        .choose-case-add-btn {
            background: var(--primary);
            border: none;
            border-radius: 8px;
            color: #000;
            font-weight: 600;
            padding: 9px 16px;
            font-size: 13px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: opacity 0.2s;
        }
        .choose-case-add-btn:hover {
            opacity: 0.9;
        }
        .choose-case-footer {
            display: flex;
            justify-content: flex-end;
            margin-top: 8px;
        }
        .choose-case-cancel {
            background: transparent;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            color: var(--text-bright);
            padding: 8px 16px;
            font-size: 13px;
            cursor: pointer;
            transition: all 0.2s;
        }
        .choose-case-cancel:hover {
            background: rgba(255, 255, 255, 0.05);
            border-color: rgba(255, 255, 255, 0.2);
        }
    `;
    document.head.appendChild(style);

    const el = document.createElement('div');
    el.id = 'intelChooseCaseModal';
    el.style.display = 'none';
    document.body.appendChild(el);
}

function intelOpenChooseCaseModal(payload, label) {
    intelEnsureChooseCaseModal();
    const modal = document.getElementById('intelChooseCaseModal');
    let cases = intelCasesLoad();
    if (!cases.length) {
        cases = [{ id: 'default', title: 'Default case', items: [] }];
        intelCasesSave(cases);
    }
    
    let listHtml = '';
    cases.forEach((c) => {
        const itemCount = (c.items || []).length;
        listHtml += `
            <button type="button" class="choose-case-item" onclick="intelAddRowToSpecificCase('${escapeHtml(c.id)}', '${escapeHtml(c.title)}')">
                <div class="choose-case-item-info">
                    <i class="fas fa-folder choose-case-item-icon"></i>
                    <div>
                        <span class="choose-case-item-name">${escapeHtml(c.title)}</span>
                        <span class="choose-case-item-meta">(${itemCount} items)</span>
                    </div>
                </div>
                <i class="fas fa-chevron-right choose-case-item-arrow"></i>
            </button>
        `;
    });

    modal.innerHTML = `
        <div class="choose-case-backdrop" onclick="intelCloseChooseCaseModal()"></div>
        <div class="choose-case-card">
            <div class="choose-case-header">
                <span class="choose-case-title"><i class="fas fa-folder-plus" style="color:var(--primary);margin-right:8px;"></i>Add Item to Case</span>
                <button type="button" class="choose-case-close" onclick="intelCloseChooseCaseModal()"><i class="fas fa-times"></i></button>
            </div>
            
            <div class="choose-case-list">
                ${listHtml}
            </div>

            <div class="choose-case-new-title">OR CREATE NEW CASE FOLDER</div>
            <div class="choose-case-input-group">
                <input type="text" class="choose-case-input" id="intelNewCaseInput" placeholder="Enter case folder name..." />
                <button type="button" class="choose-case-add-btn" onclick="intelCreateAndAddToNewCase()">
                    <i class="fas fa-plus"></i> Create
                </button>
            </div>

            <div class="choose-case-footer">
                <button type="button" class="choose-case-cancel" onclick="intelCloseChooseCaseModal()">Cancel</button>
            </div>
        </div>
    `;

    window.__intelPendingCasePayload = payload;
    window.__intelPendingCaseLabel = label || 'Log row';
    
    modal.style.display = 'flex';

    const input = document.getElementById('intelNewCaseInput');
    if (input) {
        input.focus();
        input.onkeydown = (e) => {
            if (e.key === 'Enter') {
                intelCreateAndAddToNewCase();
            }
        };
    }
}

function intelCloseChooseCaseModal() {
    const modal = document.getElementById('intelChooseCaseModal');
    if (modal) modal.style.display = 'none';
    window.__intelPendingCasePayload = null;
    window.__intelPendingCaseLabel = null;
}

function intelAddRowToSpecificCase(caseId, caseTitle) {
    const payload = window.__intelPendingCasePayload;
    const label = window.__intelPendingCaseLabel || 'Log row';
    if (!payload) return;

    let cases = intelCasesLoad();
    const c = cases.find((x) => x.id === caseId);
    if (!c) {
        showToast('Case folder not found', true);
        return;
    }
    if (!c.items) c.items = [];
    c.items.push({
        id: 'i_' + Date.now(),
        at: new Date().toISOString(),
        label: label,
        payload: payload
    });
    intelCasesSave(cases);
    casefilesRender();
    showToast(`Added to case "${caseTitle}"`);
    intelCloseChooseCaseModal();
}

function intelCreateAndAddToNewCase() {
    const input = document.getElementById('intelNewCaseInput');
    const title = input ? input.value.trim() : '';
    if (!title) {
        showToast('Please enter a case name', true);
        return;
    }
    
    const caseId = 'c_' + Date.now();
    let cases = intelCasesLoad();
    const newCase = {
        id: caseId,
        title: title,
        items: []
    };
    cases.push(newCase);
    intelCasesSave(cases);

    intelAddRowToSpecificCase(caseId, title);
}

function intelEnsureModal() {
    if (document.getElementById('intelModal')) return;
    const el = document.createElement('div');
    el.id = 'intelModal';
    el.style.display = 'none';
    el.innerHTML = `
      <div class="intel-modal-backdrop" onclick="intelCloseModal(true)"></div>
      <div class="intel-modal-card" role="dialog" aria-modal="true">
        <div class="intel-modal-head">
          <div class="intel-modal-title" id="intelModalTitle">Modal</div>
          <button type="button" class="intel-modal-x" onclick="intelCloseModal(true)"><i class="fas fa-times"></i></button>
        </div>
        <div class="intel-modal-body">
          <label class="intel-modal-label" id="intelModalLabel">Label</label>
          <input class="search-input" id="intelModalInput" placeholder="" />
        </div>
        <div class="intel-modal-actions">
          <button type="button" class="search-btn" style="padding:9px 14px;opacity:0.9" onclick="intelCloseModal(true)">Cancel</button>
          <button type="button" class="search-btn" style="padding:9px 14px" id="intelModalOkBtn">OK</button>
        </div>
      </div>
    `;
    document.body.appendChild(el);
}

function intelOpenModal(opts) {
    intelEnsureModal();
    const m = document.getElementById('intelModal');
    const t = document.getElementById('intelModalTitle');
    const l = document.getElementById('intelModalLabel');
    const i = document.getElementById('intelModalInput');
    const ok = document.getElementById('intelModalOkBtn');
    t.textContent = opts?.title || 'Enter value';
    l.textContent = opts?.label || 'Value';
    i.value = '';
    i.placeholder = opts?.placeholder || '';
    ok.innerHTML = `<i class="fas fa-check"></i> ${escapeHtml(opts?.okText || 'OK')}`;
    __intel_modalOnOk = typeof opts?.onOk === 'function' ? opts.onOk : null;
    ok.onclick = () => {
        const val = i.value;
        const done = __intel_modalOnOk ? __intel_modalOnOk(val) : true;
        if (done !== false) intelCloseModal(false);
    };
    i.onkeydown = (e) => {
        if (e.key === 'Enter') ok.click();
        if (e.key === 'Escape') intelCloseModal(true);
    };
    m.style.display = 'block';
    setTimeout(() => i.focus(), 0);
}

function intelCloseModal(fromUser) {
    const m = document.getElementById('intelModal');
    if (!m) return;
    m.style.display = 'none';
    __intel_modalOnOk = null;
}

function openCaseItemPopup(itemId) {
    const activeId = intelCasesGetActiveId();
    if (!activeId) return;
    const cases = intelCasesLoad();
    const c = cases.find((x) => x.id === activeId);
    if (!c || !Array.isArray(c.items)) return;
    const it = c.items.find((x) => String(x.id) === String(itemId));
    if (!it) return;
    __casePopupCurrentItemId = itemId;
    const popup = document.getElementById('caseItemPopup');
    const titleEl = document.getElementById('casePopupTitle');
    const subtitleEl = document.getElementById('casePopupSubtitle');
    const bodyEl = document.getElementById('casePopupBody');
    const removeBtn = document.getElementById('casePopupRemoveBtn');
    if (titleEl) titleEl.textContent = it.label || 'Case Item';
    if (subtitleEl) {
        let atStr = 'n/a';
        try { atStr = it.at ? new Date(it.at).toLocaleString() : 'n/a'; } catch(_) {}
        const activeCase = cases.find((x) => x.id === activeId);
        subtitleEl.textContent = (activeCase ? activeCase.title + ' · ' : '') + atStr;
    }
    if (bodyEl) {
        bodyEl.innerHTML = '<div style="opacity:0.4;font-size:12px;margin-bottom:8px">Loading…</div>';
        requestAnimationFrame(() => {
            bodyEl.innerHTML = renderCaseItemBody(it);
            triggerPanelDecryption();
        });
    }
    if (removeBtn) {
        removeBtn.onclick = () => {
            casefilesRemoveItem(String(itemId));
            closeCaseItemPopup();
        };
    }
    if (popup) popup.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeCaseItemPopup() {
    const popup = document.getElementById('caseItemPopup');
    if (popup) popup.style.display = 'none';
    document.body.style.overflow = '';
    __casePopupCurrentItemId = null;
}

function openCaseFolderPopup(caseId) {
    const cases = intelCasesLoad();
    const c = cases.find((x) => x.id === caseId);
    if (!c) return;
    __cfpActiveCaseId = caseId;
    const popup = document.getElementById('caseFolderPopup');
    if (!popup) return;
    popup.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    // like the fullscreen AI: hide the console behind so only the wallpaper reads through the glass
    document.body.classList.add('case-open');
    renderCaseFolderPopupContent();
}

function closeCaseFolderPopup() {
    // Save notes before closing
    cfpSaveNotes(true);
    const popup = document.getElementById('caseFolderPopup');
    if (popup) popup.style.display = 'none';
    document.body.style.overflow = '';
    document.body.classList.remove('case-open');
    __cfpActiveCaseId = null;
}

function cfpSaveNotes(silent) {
    if (!__cfpActiveCaseId) return;
    const box = document.getElementById('cfpNotesTextarea');
    if (!box) return;
    const cases = intelCasesLoad();
    const c = cases.find((x) => x.id === __cfpActiveCaseId);
    if (!c) return;
    c.notes = box.value || '';
    c.notesUpdatedAt = new Date().toISOString();
    intelCasesSave(cases);
    const st = document.getElementById('cfpNotesStatus');
    if (st) st.textContent = 'Saved ' + new Date().toLocaleTimeString();
    casefilesRender();
    if (!silent) showToast('Notes saved');
}

function cfpRemoveItem(itemId) {
    if (!__cfpActiveCaseId || !itemId) return;
    const cases = intelCasesLoad();
    const c = cases.find((x) => x.id === __cfpActiveCaseId);
    if (!c || !Array.isArray(c.items)) return;
    c.items = c.items.filter((it) => String(it.id) !== String(itemId));
    intelCasesSave(cases);
    casefilesRender();
    renderCaseFolderPopupContent();
    showToast('Removed from case');
}

function renderCaseFolderPopupContent() {
    const cases = intelCasesLoad();
    const c = cases.find((x) => x.id === __cfpActiveCaseId);
    if (!c) return;

    // Header
    const titleEl = document.getElementById('cfpTitle');
    const metaEl = document.getElementById('cfpMeta');
    if (titleEl) titleEl.textContent = c.title || 'Case';
    const icoEl = document.querySelector('#caseFolderPopup .cfp-header-icon');
    if (icoEl) {
        icoEl.innerHTML = (c.subject && c.subject.photo)
            ? '<img src="' + escapeHtml(c.subject.photo) + '" alt="" onerror="this.parentNode.innerHTML=\'<i class=&quot;fas fa-folder-open&quot;></i>\'">'
            : '<i class="fas fa-folder-open"></i>';
        icoEl.classList.toggle('has-photo', !!(c.subject && c.subject.photo));
    }
    if (metaEl) {
        const cnt = (c.items || []).length;
        metaEl.textContent = cnt + ' item' + (cnt === 1 ? '' : 's') + (c.notes ? ' · has notes' : '');
    }

    // Notes (left side)
    const notesArea = document.getElementById('cfpNotesTextarea');
    const notesSt = document.getElementById('cfpNotesStatus');
    if (notesArea) notesArea.value = c.notes || '';
    if (notesSt) {
        let st = 'Notes saved locally';
        if (c.notesUpdatedAt) { try { st = 'Saved ' + new Date(c.notesUpdatedAt).toLocaleString(); } catch(_) {} }
        notesSt.textContent = st;
    }

    // Items (right side)
    const itemsBody = document.getElementById('cfpItemsBody');
    if (!itemsBody) return;

    if (!c.items || !c.items.length) {
        itemsBody.innerHTML = '<div class="cfp-empty"><i class="fas fa-inbox"></i>No items yet.<br>Use <strong>Add to case</strong> on search results.</div>';
        return;
    }
    itemsBody.innerHTML = '<div class="cfp-items-grid">' + c.items.slice().reverse().map((it) => {
        const iid = escapeHtml(String(it.id || ''));
        const label = escapeHtml(it.label || 'Item');
        let atStr = '';
        try { atStr = it.at ? new Date(it.at).toLocaleString() : ''; } catch(_) { atStr = ''; }
        return (
            '<div class="cfp-item-card">' +
            '<div class="cfp-item-card-header">' +
            '<div class="cfp-item-card-title"><i class="fas fa-file-lines"></i> ' + label + '</div>' +
            '<div class="cfp-item-card-date">' + escapeHtml(atStr) + '</div>' +
            '</div>' +
            '<div class="cfp-item-card-body">' + renderCaseItemBody(it) + '</div>' +
            '<div class="cfp-item-card-actions">' +
            '<button type="button" class="case-item-remove-sm" onclick="cfpRemoveItem(\'' + iid + '\')" title="Remove"><i class="fas fa-trash"></i> Remove</button>' +
            '</div>' +
            '</div>'
        );
    }).join('') + '</div>';
    triggerPanelDecryption();
}


function dlKv(k, v) { return '<div class="dl-kv"><span class="dl-k">' + escapeHtml(k) + '</span><span class="dl-v">' + escapeHtml(v) + '</span></div>'; }

// Humanize a raw field key ("breach_date" → "Date", "username" → "Username").
function cfItemKeyLabel(k) {
    var key = String(k).toLowerCase().replace(/^.*\./, '');
    var map = {
        url: 'Origin', origin: 'Origin', domain: 'Domain', host: 'Host', site: 'Origin', website: 'Origin',
        email: 'Email', mail: 'Email', emails: 'Email',
        username: 'Username', user: 'Username', login: 'Login', nick: 'Username', handle: 'Username',
        password: 'Password', pass: 'Password', passwd: 'Password', hash: 'Hash',
        ip: 'IP', ip_address: 'IP', ipaddress: 'IP', last_ip: 'Last IP',
        phone: 'Phone', number: 'Phone', tel: 'Phone',
        name: 'Name', full_name: 'Name', fullname: 'Name', display_name: 'Name', first_name: 'First name', last_name: 'Last name',
        discord_id: 'Discord ID', discordid: 'Discord ID', discord: 'Discord',
        database: 'Source', db: 'Source', source: 'Source', breach: 'Breach', dbname: 'Source',
        breach_date: 'Date', date: 'Date', timestamp: 'Date', added: 'Date', indexed_at: 'Indexed',
        country: 'Country', city: 'City', region: 'Region', address: 'Address', zip: 'ZIP', postal: 'ZIP'
    };
    if (map[key]) return map[key];
    return String(k).replace(/[_\-.]+/g, ' ').replace(/\b\w/g, function (m) { return m.toUpperCase(); }).trim();
}

// Flatten an object's meaningful scalar fields → [key, value] pairs (skips
// internal/empty; shallow-recurses one level into nested objects).
function cfItemPairs(obj, depth, prefix) {
    depth = depth || 0; var out = [];
    if (!obj || typeof obj !== 'object') return out;
    var keys = Object.keys(obj);
    keys.forEach(function (k) {
        if (k.charAt(0) === '_') return;
        var v = obj[k];
        if (v == null || v === '' || v === '██████') return;
        var label = prefix ? prefix + '.' + k : String(k);
        if (typeof v === 'object') {
            if (!Array.isArray(v) && depth < 1) out = out.concat(cfItemPairs(v, depth + 1, label));
            else if (Array.isArray(v) && v.length && typeof v[0] !== 'object') out.push([label, v.join(', ')]);
            return;
        }
        out.push([label, String(v)]);
    });
    return out;
}

// A clean labeled field list — replaces the old raw-JSON dump for logs/records.
function renderItemKvHtml(payload, opts) {
    opts = opts || {};
    var pairs = cfItemPairs(payload, 0, '');
    if (!pairs.length) return '<div class="cfp-kv-empty">No details.</div>';
    var order = ['origin', 'url', 'domain', 'host', 'site', 'website', 'email', 'mail', 'username', 'user', 'login', 'password', 'pass', 'hash', 'ip', 'phone', 'name', 'full_name', 'display_name', 'discord_id', 'source', 'database', 'breach', 'country', 'city', 'date', 'breach_date', 'timestamp'];
    var rank = function (k) { var i = order.indexOf(String(k).toLowerCase().replace(/^.*\./, '')); return i < 0 ? 999 : i; };
    pairs.sort(function (a, b) { return rank(a[0]) - rank(b[0]); });
    var rows = pairs.slice(0, 60).map(function (p) {
        var isPw = /pass|pwd|hash/i.test(p[0]);
        return '<div class="cfp-kv">' +
            '<span class="cfp-kv-k">' + escapeHtml(cfItemKeyLabel(p[0])) + '</span>' +
            '<span class="cfp-kv-v' + (isPw ? ' cfp-kv-pw' : '') + '">' + escapeHtml(p[1]) + '</span>' +
            '<button type="button" class="cfp-kv-copy" data-copy="' + escapeHtml(p[1]) + '" title="Copy"><i class="fas fa-copy"></i></button>' +
            '</div>';
    }).join('');
    var head = opts.summary ? '<div class="cfp-kv-summary">' + escapeHtml(opts.summary) + '</div>' : '';
    return head + '<div class="cfp-kv-list">' + rows + '</div>';
}

function renderFootprintCardsHtml(arr) {
    try {
        return (arr || []).map(function (card) {
            var rows = Array.isArray(card.rows) ? card.rows : [];
            var body = rows.map(function (r) {
                if (Array.isArray(r)) return '<div class="cfp-kv"><span class="cfp-kv-k">' + escapeHtml(cfItemKeyLabel(r[0])) + '</span><span class="cfp-kv-v">' + escapeHtml(String(r[1])) + '</span></div>';
                if (r && typeof r === 'object') return renderItemKvHtml(r).replace('<div class="cfp-kv-list">', '').replace(/<\/div>$/, '');
                return '<div class="cfp-kv"><span class="cfp-kv-v">' + escapeHtml(String(r)) + '</span></div>';
            }).join('');
            var sub = card.subtitle ? '<div class="cfp-kv-summary">' + escapeHtml(card.subtitle) + '</div>' : '';
            return sub + '<div class="cfp-kv-list">' + body + '</div>';
        }).join('');
    } catch (e) { return ''; }
}
function renderDiscordRestCard(b) {
    var data = (b && b.data && typeof b.data === 'object') ? b.data : b;
    return renderItemKvHtml(data, { summary: b && b.summary ? b.summary : '' });
}
function renderDiscordGuildCard(b) { return renderDiscordRestCard(b); }
function renderDiscordRobloxLinkCard(b) { return renderDiscordRestCard(b); }
function renderDiscordStealerBlock(b) { return renderDiscordRestCard(b); }
function renderDiscordBreachCard(b) {
    var data = b && b.data;
    if (data && Array.isArray(data.results) && data.results.length) {
        var recs = data.results.slice(0, 40).map(function (r) { return '<div class="cfp-rec">' + renderItemKvHtml(r) + '</div>'; }).join('');
        var sum = b.summary ? b.summary : (data.results.length + ' record' + (data.results.length === 1 ? '' : 's'));
        return '<div class="cfp-kv-summary">' + escapeHtml(sum) + '</div>' + recs;
    }
    return renderDiscordRestCard(b);
}
function renderDiscordGenericBlock(b) { return renderDiscordRestCard(b); }
function formatLogEntryHtml(p) { return renderItemKvHtml(p); }

// Delegated copy for the item field-list rows (one-time bind).
if (!window.__cfpKvCopyBound) {
    window.__cfpKvCopyBound = true;
    document.addEventListener('click', function (e) {
        var btn = e.target && e.target.closest ? e.target.closest('.cfp-kv-copy') : null;
        if (!btn) return;
        e.preventDefault(); e.stopPropagation();
        try { navigator.clipboard.writeText(btn.getAttribute('data-copy') || ''); } catch (_) {}
        var old = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(function () { btn.innerHTML = old; }, 1000);
    });
}

window.openCaseFolderPopup = openCaseFolderPopup;
window.closeCaseFolderPopup = closeCaseFolderPopup;
window.cfpSaveNotes = cfpSaveNotes;
window.casefilesNewCase = casefilesNewCase;
window.casefilesDeleteCase = casefilesDeleteCase;
window.casefilesExport = casefilesExport;
window.casefilesImportClick = casefilesImportClick;
window.casefilesImportHandle = casefilesImportHandle;
window.casefilesRender = casefilesRender;
window.intelAddRowToCaseFromBtn = intelAddRowToCaseFromBtn;
