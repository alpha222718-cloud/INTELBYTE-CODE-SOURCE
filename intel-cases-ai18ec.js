/* Intelbyte AI on the case board — a floating assistant that rises from the
   right side of the case window. It reads the board (intelBoard.context()),
   talks with the analyst, can run free leak searches server-side, and edits
   the board: every change is replayed with animation (intelBoard.applyOps)
   and can be undone. The conversation is kept per case in case.ai. */
(function () {
    var API_BASE = (location.port === '3001' || location.protocol === 'panel.html') ? '' : 'http://localhost:3001';
    var SEARCHABLE = ['username', 'email', 'account', 'name', 'discord', 'roblox', 'telegram', 'instagram', 'x', 'steam', 'github', 'tiktok', 'ip'];
    // Suggestions read the board: offer to search the first identifier on it.
    function suggestions() {
        var out = [];
        var ctx = window.intelBoard && window.intelBoard.context ? window.intelBoard.context() : null;
        var nodes = ctx && ctx.board ? ctx.board.nodes : [];
        var target = nodes.find(function (n) { return n.id !== '__hub' && n.value && SEARCHABLE.indexOf(n.type) !== -1; });
        if (target) out.push({ icon: 'fas fa-magnifying-glass', text: 'Search "' + target.value + '" and map what you find' });
        if (nodes.length > 2) out.push({ icon: 'fas fa-share-nodes', text: 'Which of these accounts belong to the same person?' });
        out.push({ icon: 'fas fa-eye', text: nodes.length > 1 ? 'What stands out on this board?' : 'How should I start this case?' });
        out.push({ icon: 'fas fa-route', text: 'What should I search next?' });
        return out.slice(0, 4);
    }
    var busy = false, built = false, pollTimer = null;
    var undoSnaps = {};          // message id -> board JSON before that AI turn (this session)
    var pendingImages = [];
    var sessionImgs = {};        // uid -> images array kept in memory (never stored in localStorage)

    function $(id) { return document.getElementById(id); }
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (m) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]; }); }
    function headers(extra) {
        var h = Object.assign({}, extra || {});
        var csrf = String((window.__INTEL_SESSION && window.__INTEL_SESSION.panelCsrf) || '').trim();
        if (csrf) h['X-Panel-CSRF'] = csrf;
        return h;
    }
    // Small, safe markdown: **bold**, `code`, "- " bullets, paragraphs.
    function md(text) {
        var lines = esc(text).split(/\n/);
        var html = '', inList = false;
        lines.forEach(function (ln) {
            if (/^\s*\|?\s*:?-{2,}/.test(ln)) return;                       // table divider row
            if (/^\s*\|.*\|\s*$/.test(ln)) {                                 // table row → "a · b · c"
                ln = '- ' + ln.replace(/^\s*\||\|\s*$/g, '').split('|').map(function (c) { return c.trim(); }).filter(Boolean).join(' · ');
            }
            ln = ln.replace(/^#{1,6}\s+/, '');                                // headings → plain lines
            var t = ln.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`([^`]+)`/g, '<code>$1</code>');
            var m = t.match(/^\s*(?:[-*•]|\d+\.)\s+(.*)$/);
            if (m) { if (!inList) { html += '<ul>'; inList = true; } html += '<li>' + m[1] + '</li>'; return; }
            if (inList) { html += '</ul>'; inList = false; }
            if (t.trim()) html += '<p>' + t + '</p>';
        });
        if (inList) html += '</ul>';
        return html;
    }

    /* ── per-case conversation ── */
    function caseId() { return (typeof __cfpActiveCaseId !== 'undefined' && __cfpActiveCaseId) || null; }
    function loadConv() {
        var id = caseId();
        var c = id && typeof intelCasesLoad === 'function' ? intelCasesLoad().find(function (x) { return x.id === id; }) : null;
        var ai = c && c.ai && typeof c.ai === 'object' ? c.ai : {};
        return { chat: Array.isArray(ai.chat) ? ai.chat : [], findings: Array.isArray(ai.findings) ? ai.findings : [] };
    }
    function saveConv(conv) {
        var id = caseId(); if (!id) return;
        var all = intelCasesLoad();
        var c = all.find(function (x) { return x.id === id; }); if (!c) return;
        var chat = conv.chat.slice(-40).map(function (m) {
            if (!m || !m.images) return m;
            var clone = Object.assign({}, m);
            if (!clone.imgTag) clone.imgTag = 'i' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
            sessionImgs[clone.imgTag] = clone.images;
            clone.imgCount = clone.images.length;
            delete clone.images;
            return clone;
        });
        var keepTh = 0;
        for (var ci = chat.length - 1; ci >= 0; ci--) {
            if (!chat[ci] || !chat[ci].thoughts) continue;
            if (++keepTh > 10) { chat[ci] = Object.assign({}, chat[ci]); delete chat[ci].thoughts; }
        }
        c.ai = {
            chat: chat,
            // keep searches compact so localStorage doesn't balloon
            // (infected-PC rows always stay: they carry the PC's site list the AI answers from)
            findings: conv.findings.slice(-12).map(function (f) {
                var rows = f.rows || [];
                var pcs = rows.slice(15).filter(function (r) { return r && r.type === 'infected_pc'; }).slice(0, 3);
                return Object.assign({}, f, { rows: rows.slice(0, 15).concat(pcs) });
            })
        };
        try { intelCasesSave(all); } catch (e) {}
    }

    /* ── DOM ── */
    function build() {
        if (built) return true;
        var host = document.querySelector('#caseFolderPopup .case-folder-popup');
        if (!host) return false;
        built = true;
        var launch = document.createElement('button');
        launch.type = 'button';
        launch.id = 'cgaiLaunch';
        launch.className = 'cgai-launch';
        launch.innerHTML = '<span class="cgai-launch-orb"><span class="cgai-byte" data-byte data-byte-look="pointer" data-byte-float></span></span><span class="cgai-launch-txt">Ask Intelbyte AI</span>';
        launch.addEventListener('click', openPanel);
        // Byte smiles when you hover him (same mood as the rest of the site)
        launch.addEventListener('mouseenter', function () { smile(launch, true); });
        launch.addEventListener('mouseleave', function () { smile(launch, false); });
        host.appendChild(launch);

        var panel = document.createElement('section');
        panel.id = 'cgaiPanel';
        panel.className = 'cgai';
        panel.setAttribute('aria-label', 'Intelbyte AI');
        panel.innerHTML =
            '<header class="cgai-head">' +
                '<span class="cgai-orb"><span class="cgai-byte" id="cgaiByte" data-byte data-byte-look="pointer" data-byte-float></span></span>' +
                '<div class="cgai-head-txt"><div class="cgai-title">Intelbyte AI</div><div class="cgai-status" id="cgaiStatus">Watching this case</div></div>' +
                '<button type="button" class="cgai-icon" data-cgai="reset" title="New conversation"><i class="fas fa-rotate-right"></i></button>' +
                '<button type="button" class="cgai-icon" data-cgai="close" title="Minimize"><i class="fas fa-chevron-down"></i></button>' +
            '</header>' +
            '<div class="cgai-thread" id="cgaiThread"></div>' +
            '<div class="cgai-attach-strip" id="cgaiAttachStrip" hidden></div>' +
            '<form class="cgai-compose" id="cgaiForm" autocomplete="off">' +
                '<input type="file" id="cgaiFile" accept="image/*,.svg" multiple hidden>' +
                '<button type="button" class="cgai-attach" id="cgaiAttachBtn" title="Attach image/screenshot (EXIF, metadata &amp; visual OSINT) or Ctrl+V" aria-label="Attach image"><i class="fas fa-paperclip"></i></button>' +
                '<textarea id="cgaiInput" rows="1" placeholder="Ask about this case…" spellcheck="false"></textarea>' +
                '<button type="submit" class="cgai-send" id="cgaiSend" aria-label="Send"><i class="fas fa-arrow-up"></i></button>' +
            '</form>' +
            '<div class="cgai-foot" id="cgaiFoot">Searches IntelByte for you · paid lookups always ask first</div>';
        host.appendChild(panel);
        mountBytes(host);

        panel.addEventListener('click', function (e) {
            var t = e.target.closest ? e.target : null; if (!t) return;
            var a = t.closest('[data-cgai]');
            if (a) {
                var k = a.getAttribute('data-cgai');
                if (k === 'close') closePanel();
                else if (k === 'reset') resetConv();
                return;
            }
            var sug = t.closest('[data-suggest]');
            if (sug) { send(sug.getAttribute('data-suggest')); return; }
            var chip = t.closest('[data-focus]');
            if (chip && window.intelBoard) { intelBoard.show('board'); intelBoard.focus(chip.getAttribute('data-focus')); return; }
            var undo = t.closest('[data-undo]');
            if (undo) { undoTurn(undo.getAttribute('data-undo')); return; }
            var ask = t.closest('[data-ask]');
            if (ask && !ask.disabled) { runSuggestion(ask.getAttribute('data-ask')); return; }
            var pd = t.closest('[data-paid]');
            if (pd) { runPaid(pd.getAttribute('data-paid')); return; }
            var pn = t.closest('[data-paid-no]');
            if (pn) setPaidState(pn.getAttribute('data-paid-no'), 'no');
        });
        var input = $('cgaiInput');
        input.addEventListener('input', autosize);
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('cgaiForm').requestSubmit ? $('cgaiForm').requestSubmit() : submit(); }
            else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closePanel(); }
        });
        input.addEventListener('paste', function (e) {
            var items = e.clipboardData && e.clipboardData.items ? e.clipboardData.items : [];
            var files = [];
            for (var i = 0; i < items.length; i++) {
                if (items[i].kind === 'file' && /^image\//i.test(items[i].type)) {
                    var f = items[i].getAsFile(); if (f) files.push(f);
                }
            }
            if (files.length) { e.preventDefault(); addImageFiles(files); }
        });
        $('cgaiAttachBtn').addEventListener('click', function () { $('cgaiFile').click(); });
        $('cgaiFile').addEventListener('change', function () {
            var f = $('cgaiFile');
            if (f && f.files && f.files.length) addImageFiles(f.files);
            if (f) f.value = '';
        });
        panel.addEventListener('dragover', function (e) {
            if (e.dataTransfer && Array.prototype.some.call(e.dataTransfer.types || [], function (t) { return t === 'Files'; })) {
                e.preventDefault(); panel.classList.add('is-dragover');
            }
        });
        panel.addEventListener('dragleave', function () { panel.classList.remove('is-dragover'); });
        panel.addEventListener('drop', function (e) {
            panel.classList.remove('is-dragover');
            if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
                var imgs = Array.prototype.filter.call(e.dataTransfer.files, function (f) { return /^image\//i.test(f.type); });
                if (imgs.length) { e.preventDefault(); addImageFiles(imgs); }
            }
        });
        $('cgaiForm').addEventListener('submit', function (e) { e.preventDefault(); submit(); });
        return true;
    }
    function extractRawMeta(buf, mime, name) {
        return typeof window.ibExtractClientMeta === 'function' ? window.ibExtractClientMeta(buf, mime, name) : '';
    }
    function readCaseImage(file) {
        if (typeof window.ibReadForensicImage === 'function') return window.ibReadForensicImage(file);
        return Promise.resolve(null);
    }
    function renderAttachStrip() {
        var box = $('cgaiAttachStrip'); if (!box) return;
        if (!pendingImages.length) { box.hidden = true; box.innerHTML = ''; return; }
        box.hidden = false;
        box.innerHTML = pendingImages.map(function (im, i) {
            return '<div class="cgai-attach-chip"><img src="' + esc(im.dataUrl) + '" alt="attached"><span>' + esc(im.name || ('Image ' + (i + 1))) + '</span>' +
                '<button type="button" data-cgrm="' + i + '" aria-label="Remove"><i class="fas fa-xmark"></i></button></div>';
        }).join('');
        box.querySelectorAll('[data-cgrm]').forEach(function (b) {
            b.addEventListener('click', function () { pendingImages.splice(Number(b.getAttribute('data-cgrm')), 1); renderAttachStrip(); });
        });
    }
    function addImageFiles(fileList) {
        var arr = Array.prototype.slice.call(fileList || []).slice(0, Math.max(0, 3 - pendingImages.length));
        if (!arr.length) return;
        Promise.all(arr.map(readCaseImage)).then(function (list) {
            list.forEach(function (r) { if (r && r.dataUrl && pendingImages.length < 3) pendingImages.push(r); });
            renderAttachStrip();
        });
    }
    function smile(root, on) {
        var b = root && root.querySelector('.cgai-byte, [data-byte]');
        if (b && window.IBByte) { try { window.IBByte.mood(b, on ? 'happy' : ''); } catch (e) {} }
    }
    function mountBytes(root) { try { if (window.IBByte) window.IBByte.mountAll(root); } catch (e) {} }
    function bytes() { return document.querySelectorAll('#cgaiLaunch .cgai-byte, #cgaiPanel .cgai-head .cgai-byte'); }
    function autosize() {
        var i = $('cgaiInput'); if (!i) return;
        i.style.height = 'auto';
        i.style.height = Math.min(140, i.scrollHeight) + 'px';
    }
    function submit() {
        var i = $('cgaiInput');
        var v = String(i.value || '').trim();
        var imgs = pendingImages.slice();
        if ((!v && !imgs.length) || busy) return;
        i.value = '';
        autosize();
        pendingImages = [];
        renderAttachStrip();
        send(v || 'Analyze the attached image(s) and its forensic metadata for this case.', undefined, undefined, imgs);
    }

    function openPanel() {
        if (!build()) return;
        renderThread();
        $('cgaiPanel').classList.add('is-open');
        $('cgaiLaunch').classList.add('is-hidden');
        setTimeout(function () { var i = $('cgaiInput'); if (i) i.focus(); }, 260);
    }
    function closePanel() {
        var p = $('cgaiPanel'); if (p) p.classList.remove('is-open');
        var l = $('cgaiLaunch'); if (l) l.classList.remove('is-hidden');
    }
    function setStatus(text, thinking) {
        var s = $('cgaiStatus'); if (!s) return;
        s.textContent = text;
        var p = $('cgaiPanel'); if (p) p.classList.toggle('is-thinking', !!thinking);
        var l = $('cgaiLaunch'); if (l) l.classList.toggle('is-thinking', !!thinking);
        // Byte reads the board while it works
        bytes().forEach(function (b) {
            if (thinking) b.setAttribute('data-byte-state', 'think'); else b.removeAttribute('data-byte-state');
        });
    }
    function cheer() {
        bytes().forEach(function (b) { try { window.IBByte.mood(b, 'happy', 1600); } catch (e) {} });
    }

    function opIcon(a) {
        if (a.op === 'add') return '<i class="fas fa-plus"></i>';
        if (a.op === 'link') return '<i class="fas fa-share-nodes"></i>';
        if (a.op === 'unlink') return '<i class="fas fa-link-slash"></i>';
        return '<i class="cg-dot cg-dot--' + esc(a.status || 'none') + '"></i>';
    }
    function chipHtml(a, fresh) {
        return '<button type="button" class="cgai-chip' + (fresh ? ' is-fresh' : '') + (a.suspected ? ' is-suspected' : '') + '" data-focus="' + esc(a.id) + '" title="Show on the board">' +
               opIcon(a) + '<span>' + esc(a.text) + '</span></button>';
    }
    function msgHtml(m) {
        if (m.role === 'user') {
            var imgs = Array.isArray(m.images) ? m.images : (m.imgTag && sessionImgs[m.imgTag] ? sessionImgs[m.imgTag] : []);
            var imgsHtml = imgs.length
                ? '<div class="cgai-msg-imgs">' + imgs.map(function (im) { return '<img src="' + esc(typeof im === 'string' ? im : im.dataUrl) + '" alt="attached">'; }).join('') + '</div>'
                : (m.imgCount ? '<div class="cgai-undone">[' + m.imgCount + ' attached image(s)]</div>' : '');
            return '<div class="cgai-msg cgai-msg--user"><div class="cgai-bubble">' + imgsHtml + esc(m.content).replace(/\n/g, '<br>') + '</div></div>';
        }
        var chips = (m.actions || []).map(function (a) { return chipHtml(a); }).join('');
        var canUndo = m.id && undoSnaps[m.id] && !m.undone && (m.actions || []).length;
        return '<div class="cgai-msg cgai-msg--ai' + (m.error ? ' is-error' : '') + '" data-msg="' + esc(m.id || '') + '">' +
               '<span class="cgai-av" data-byte data-byte-static></span>' +
               '<div class="cgai-col">' +
                   thoughtsHtml(m) +
                   '<div class="cgai-bubble">' + md(m.content) + '</div>' +
                   '<div class="cgai-chips">' + chips + '</div>' +
                   suggestHtml(m) +
                   paidHtml(m) +
                   (canUndo ? '<button type="button" class="cgai-undo" data-undo="' + esc(m.id) + '"><i class="fas fa-rotate-left"></i> Undo these changes</button>' : '') +
                   (m.undone ? '<div class="cgai-undone">Changes undone</div>' : '') +
               '</div>' +
               '</div>';
    }
    /* ── "What I thought": the model's reasoning + its actions, live while it works, kept after ── */
    function thoughtItemHtml(e) {
        if (!e || !e.text) return '';
        if (e.k === 'thought') return '<div class="cgai-th-thought">' + esc(e.text).replace(/\n/g, '<br>') + '</div>';
        return '<div class="cgai-th-step"><span class="cgai-th-dot"></span><span>' + esc(e.text) + '</span></div>';
    }
    function fmtSecs(ms) {
        var sec = Math.max(1, Math.round((Number(ms) || 0) / 1000));
        return sec < 60 ? sec + 's' : Math.floor(sec / 60) + 'm ' + (sec % 60) + 's';
    }
    function thoughtsHtml(m) {
        var list = Array.isArray(m.thoughts) ? m.thoughts : [];
        if (!list.length) return '';
        var nTh = list.filter(function (e) { return e && e.k === 'thought'; }).length;
        var meta = (nTh ? nTh + ' thought' + (nTh === 1 ? '' : 's') : list.length + ' step' + (list.length === 1 ? '' : 's')) +
                   (m.thinkMs ? ' · ' + fmtSecs(m.thinkMs) : '');
        return '<details class="cgai-thoughts" data-th="' + esc(m.id || '') + '">' +
                   '<summary><i class="fas fa-brain"></i><span class="cgai-th-title">What I thought</span>' +
                   '<span class="cgai-th-meta">' + esc(meta) + '</span><i class="fas fa-chevron-down cgai-th-chev"></i></summary>' +
                   '<div class="cgai-th-list">' + list.map(thoughtItemHtml).join('') + '</div>' +
               '</details>';
    }
    // Keep the log compact in localStorage: ~9k chars per reply.
    function packThoughts(list) {
        var out = [], total = 0;
        (Array.isArray(list) ? list : []).forEach(function (e) {
            if (!e || !e.text || total > 9000) return;
            var t = String(e.text).slice(0, e.k === 'thought' ? 2000 : 160);
            total += t.length;
            out.push({ k: e.k === 'thought' ? 'thought' : 'step', text: t });
        });
        return out;
    }
    /* Motion here runs on the Web Animations API: the theme's "Reduce motion" CSS zeroes
       every CSS animation/transition, which made the text pop in "tak". */
    var CAN_ANIM = typeof Element !== 'undefined' && typeof Element.prototype.animate === 'function';
    // Follow new text only while the reader is at the bottom; scrolling up detaches.
    function nearBottom(el, px) { return el.scrollHeight - el.scrollTop - el.clientHeight < (px || 32); }
    function watchStick(el) {
        if (!el || el._stickWired) return;
        el._stickWired = true;
        el._stick = true;
        el.addEventListener('scroll', function () { el._stick = nearBottom(el, 32); }, { passive: true });
    }
    function stickTo(el) { if (el && el._stick !== false) el.scrollTop = el.scrollHeight; }
    function fadeIn(el) {
        if (!el || !CAN_ANIM) return;
        el.animate([{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }],
            { duration: 420, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'backwards' });
    }
    // Words appear one after another, each easing in from a soft blur.
    function revealWords(root, wps, follow) {
        var spans = [];
        var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
        var texts = [];
        while (walker.nextNode()) texts.push(walker.currentNode);
        texts.forEach(function (tn) {
            var parts = String(tn.nodeValue || '').split(/(\s+)/);
            var frag = document.createDocumentFragment();
            parts.forEach(function (p) {
                if (!p) return;
                if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
                var sp = document.createElement('span');
                sp.className = 'cgai-w';
                sp.textContent = p;
                sp.style.opacity = '0';
                frag.appendChild(sp);
                spans.push(sp);
            });
            if (tn.parentNode) tn.parentNode.replaceChild(frag, tn);
        });
        return new Promise(function (resolve) {
            if (!spans.length || !CAN_ANIM) { spans.forEach(function (sp) { sp.style.opacity = ''; }); resolve(); return; }
            var i = 0, acc = 1, last = performance.now();
            root._revealFast = false;
            (function frame(now) {
                if (!root.isConnected) { spans.forEach(function (sp) { sp.style.opacity = ''; }); resolve(); return; }
                acc += Math.max(0, now - last) / 1000 * (root._revealFast ? wps * 5 : wps);
                last = now;
                while (acc >= 1 && i < spans.length) {
                    acc -= 1;
                    var sp = spans[i++];
                    sp.style.opacity = '';
                    sp.animate([{ opacity: 0, filter: 'blur(5px)' }, { opacity: 1, filter: 'blur(0px)' }],
                        { duration: 520, easing: 'cubic-bezier(0.25, 0.6, 0.3, 1)', fill: 'backwards' });
                }
                (follow || []).forEach(stickTo);
                if (i < spans.length) requestAnimationFrame(frame);
                else resolve();
            })(last);
        });
    }
    // Live feed inside the "thinking" bubble: thoughts reveal word by word, steps fade in.
    function liveAppend(node, e) {
        var box = node && node.querySelector('.cgai-live'); if (!box || !e || !e.text) return;
        var thread = $('cgaiThread');
        watchStick(box);
        node.classList.add('has-live');
        var wrap = document.createElement('div');
        wrap.innerHTML = thoughtItemHtml(e);
        var el = wrap.firstChild; if (!el) return;
        // a new entry arrived: let the previous thought finish quickly so the feed keeps up
        if (box._lastThought) box._lastThought._revealFast = true;
        box.appendChild(el);
        if (e.k === 'thought') { box._lastThought = el; revealWords(el, 34, [box, thread]); }
        else fadeIn(el);
        while (box.children.length > 80) box.removeChild(box.firstChild);
        stickTo(box);
        stickTo(thread);
    }

    // Searches the AI wanted to run but asked about first (generic / ambiguous values).
    function suggestHtml(m) {
        var list = Array.isArray(m.suggestions) ? m.suggestions : [];
        if (!list.length) return '';
        return '<div class="cgai-ask"><div class="cgai-ask-label">Want me to search?</div>' + list.map(function (s, i) {
            var used = m.used && m.used[i];
            return '<button type="button" class="cgai-ask-row' + (used ? ' is-used' : '') + '" data-ask="' + esc(m.id) + '|' + i + '"' + (used ? ' disabled' : '') + '>' +
                   '<span class="cgai-ask-q"><i class="fas fa-magnifying-glass"></i>' + esc(s.type) + ' <b>' + esc(s.value) + '</b></span>' +
                   (s.why ? '<span class="cgai-ask-why">' + esc(s.why) + '</span>' : '') +
                   '<span class="cgai-ask-go">' + (used ? 'Asked' : 'Search') + '</span></button>';
        }).join('') + '</div>';
    }
    function runSuggestion(ref) {
        var parts = String(ref).split('|');
        var conv = loadConv();
        var m = conv.chat.find(function (x) { return x.id === parts[0]; });
        var s = m && m.suggestions && m.suggestions[Number(parts[1])];
        if (!s || busy) return;
        m.used = m.used || {};
        m.used[parts[1]] = true;
        saveConv(conv);
        send('Go ahead: search ' + s.type + ' "' + s.value + '". Only put on the board what clearly belongs to this subject; list the rest as a count.');
    }
    // Paid lookups (Discord ID / Machine View) the AI offered: they cost a daily credit, so it asks first.
    var PAID = {
        discord: { label: 'Discord ID lookup', credit: 'Discord ID', icon: 'fab fa-discord', tr: 'Discord ID araması' },
        machine: { label: 'Machine View', credit: 'Machine View', icon: 'fas fa-desktop', tr: 'Machine View' }
    };
    function paidHtml(m) {
        var list = Array.isArray(m.paid) ? m.paid : [];
        if (!list.length) return '';
        return '<div class="cgai-paid">' + list.map(function (p, i) {
            var meta = PAID[p.kind]; if (!meta) return '';
            var st = m.paidState && m.paidState[i];
            var q = m.quota && m.quota[p.kind];
            var left = q && !q.ownerExempt && q.limit
                ? ' · ' + Math.max(0, q.remaining != null ? q.remaining : q.limit - (q.used || 0)) + ' of ' + q.limit + ' left today'
                : '';
            return '<div class="cgai-paid-card' + (st ? ' is-' + st : '') + '">' +
                       '<div class="cgai-paid-top"><span class="cgai-paid-kind"><i class="' + meta.icon + '"></i>' + meta.label + '</span><span class="cgai-paid-cost">1 credit</span></div>' +
                       '<div class="cgai-paid-val">' + esc(p.value) + '</div>' +
                       (p.why ? '<div class="cgai-paid-why">' + esc(p.why) + '</div>' : '') +
                       '<div class="cgai-paid-note">Uses 1 of your daily ' + meta.credit + ' credits' + left + '.</div>' +
                       (st
                           ? '<div class="cgai-paid-done">' + (st === 'run' ? 'Approved · 1 credit' : 'Skipped') + '</div>'
                           : '<div class="cgai-paid-btns">' +
                                 '<button type="button" class="cgai-paid-go" data-paid="' + esc(m.id) + '|' + i + '">Use 1 credit</button>' +
                                 '<button type="button" class="cgai-paid-no" data-paid-no="' + esc(m.id) + '|' + i + '">Not now</button>' +
                             '</div>') +
                   '</div>';
        }).join('') + '</div>';
    }
    function setPaidState(ref, state) {
        var parts = String(ref).split('|');
        var conv = loadConv();
        var m = conv.chat.find(function (x) { return x.id === parts[0]; });
        if (!m || !m.paid || !m.paid[Number(parts[1])]) return null;
        m.paidState = m.paidState || {};
        if (state) m.paidState[parts[1]] = state; else delete m.paidState[parts[1]];
        saveConv(conv);
        renderThread();
        return m.paid[Number(parts[1])];
    }
    function runPaid(ref) {
        if (busy) return;
        var p = setPaidState(ref, 'run');
        if (!p || !PAID[p.kind]) return;
        var lastUser = loadConv().chat.filter(function (x) { return x.role === 'user'; }).pop();
        var tr = /[çğıöşüÇĞİÖŞÜ]|\b(ve|bu|bir|için|ne|mi|bak|ara)\b/i.test(lastUser ? lastUser.content : '');
        var text = tr
            ? 'Onaylıyorum: ' + PAID[p.kind].tr + ' "' + p.value + '" (1 hak). Sonucu boarda işle.'
            : 'Approved: ' + PAID[p.kind].label + ' for "' + p.value + '" (1 credit). Map the result on the board.';
        send(text, { kind: p.kind, value: p.value }, ref);
    }

    function renderThread() {
        var th = $('cgaiThread'); if (!th) return;
        var conv = loadConv();
        if (!conv.chat.length) {
            th.innerHTML =
                '<div class="cgai-hello">' +
                    '<span class="cgai-hello-byte" data-byte data-byte-look="pointer" data-byte-float></span>' +
                    '<div class="cgai-hello-title">Let’s work this case.</div>' +
                    '<div class="cgai-hello-text">I see the board, your notes and saved items. Ask me to search a name, email or handle — I’ll look it up in IntelByte, connect the dots and update the board as we go.</div>' +
                    '<div class="cgai-suggest">' + suggestions().map(function (s) {
                        return '<button type="button" data-suggest="' + esc(s.text) + '"><i class="' + s.icon + '"></i><span>' + esc(s.text) + '</span></button>';
                    }).join('') + '</div>' +
                '</div>';
            mountBytes(th);
            return;
        }
        var openTh = {};
        Array.prototype.forEach.call(th.querySelectorAll('details.cgai-thoughts[open]'), function (d) { openTh[d.getAttribute('data-th')] = 1; });
        watchStick(th);
        var keepScroll = th.scrollTop;
        th.innerHTML = conv.chat.map(msgHtml).join('');
        Array.prototype.forEach.call(th.querySelectorAll('details.cgai-thoughts'), function (d) { if (openTh[d.getAttribute('data-th')]) d.open = true; });
        mountBytes(th);
        th.scrollTop = th._stick !== false ? th.scrollHeight : keepScroll;
    }
    function thinkingNode() {
        var d = document.createElement('div');
        d.className = 'cgai-msg cgai-msg--ai cgai-thinking';
        d.innerHTML = '<span class="cgai-av" data-byte data-byte-state="think"></span>' +
            '<div class="cgai-col"><div class="cgai-bubble"><span class="ai-orb cgai-think-orb"></span><span class="cgai-step">Reading the board</span></div>' +
            '<div class="cgai-live" aria-live="polite"></div></div>';
        mountBytes(d);
        try { if (window.ThinkingOrb) d._orb = window.ThinkingOrb.mount(d.querySelector('.cgai-think-orb'), { state: 'solving', size: 20 }); } catch (e) {}
        return d;
    }
    function resetConv() {
        if (busy) return;
        saveConv({ chat: [], findings: [] });
        renderThread();
        setStatus('Watching this case');
    }
    function undoTurn(mid) {
        var snap = undoSnaps[mid];
        if (!snap || !window.intelBoard) return;
        intelBoard.show('board');
        intelBoard.restore(snap);
        delete undoSnaps[mid];
        var conv = loadConv();
        conv.chat.forEach(function (m) { if (m.id === mid) m.undone = true; });
        saveConv(conv);
        renderThread();
    }

    /* ── a turn ── */
    function send(text, confirm, paidRef, images) {
        if (busy || !window.intelBoard || !caseId()) return;
        busy = true;
        var imgs = Array.isArray(images) && images.length ? images : [];
        var conv = loadConv();
        conv.chat.push({ role: 'user', content: text, images: imgs.length ? imgs : undefined });
        saveConv(conv);
        renderThread();
        var th = $('cgaiThread');
        var thinking = thinkingNode();
        th.appendChild(thinking);
        watchStick(th);
        th._stick = true;
        th.scrollTop = th.scrollHeight;
        fadeIn(thinking);
        var revealP = null;
        $('cgaiSend').disabled = true;
        setStatus('Thinking…', true);

        var ctx = intelBoard.context() || {};
        var progressId = 'b' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        var liveLog = [], lastN = 0, t0 = Date.now();
        clearInterval(pollTimer);
        pollTimer = setInterval(function () {
            fetch(API_BASE + '/api/panel/ai/agent/progress?id=' + encodeURIComponent(progressId), { credentials: 'include', headers: headers() })
                .then(function (r) { return r.json(); })
                .then(function (j) {
                    var steps = (j && Array.isArray(j.steps) ? j.steps : []).filter(function (s) { return s && s.msg && s.msg !== 'Done'; });
                    steps.forEach(function (s, si) {
                        var n = s.n != null ? s.n : si + 1;
                        if (n <= lastN) return;
                        lastN = n;
                        var e = s.thought ? { k: 'thought', text: s.thought } : { k: 'step', text: s.msg };
                        liveLog.push(e);
                        liveAppend(thinking, e);
                        stickTo(th);
                    });
                    steps = steps.filter(function (s) { return !s.thought; });
                    if (steps.length) {
                        var msg = steps[steps.length - 1].msg;
                        var st = thinking.querySelector('.cgai-step');
                        if (st && st.textContent !== msg) { st.textContent = msg; fadeIn(st); }
                        setStatus(msg, true);
                        try { if (thinking._orb && window.ThinkingOrb) thinking._orb.setState(window.ThinkingOrb.stateForStep(msg)); } catch (e) {}
                    }
                }).catch(function () {});
        }, 800);

        var chat = conv.chat.slice(0, -1).filter(function (m) { return !m.error; }).slice(-12).map(function (m) { return { role: m.role, content: m.content }; });
        // ids of the infected PCs' saved-login / cookie / history files, so the AI can look inside them
        var pcFilesP = (intelBoard.pcFiles ? intelBoard.pcFiles() : Promise.resolve([])).catch(function () { return []; });
        pcFilesP.then(function (pcFiles) {
            return fetch(API_BASE + '/api/panel/ai/board', {
                method: 'POST', credentials: 'include',
                headers: headers({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({
                    message: text,
                    images: imgs.length ? imgs : undefined,
                    chat: chat, board: ctx.board, case: ctx.case, evidence: ctx.evidence,
                    findings: conv.findings, progressId: progressId,
                    confirm: confirm || undefined,
                    pcFiles: pcFiles && pcFiles.length ? pcFiles : undefined
                })
            });
        }).then(function (r) { return r.json().then(function (j) { return { status: r.status, json: j || {} }; }, function () { return { status: r.status, json: {} }; }); })
            .then(function (res) {
                clearInterval(pollTimer);
                try { if (thinking._orb) thinking._orb.destroy(); } catch (e) {}
                thinking.remove();
                var d = res.json;
                if (res.status >= 400 || d.ok === false) {
                    var err = d.error || d.message || (res.status === 429 ? 'Slow down a little and try again.' : 'Intelbyte AI did not respond.');
                    if (paidRef) setPaidState(paidRef, null);   // not charged: let them try again
                    var c1 = loadConv();
                    var em = { role: 'assistant', content: err, error: true, id: 'm' + Date.now() };
                    if (liveLog.length) { em.thoughts = packThoughts(liveLog); em.thinkMs = Date.now() - t0; }
                    c1.chat.push(em);
                    saveConv(c1);
                    renderThread();
                    return;
                }
                if (d.quota && d.quota.agent && d.quota.agent.limit && !d.quota.agent.ownerExempt) {
                    var left = Math.max(0, d.quota.agent.limit - (d.quota.agent.used || 0));
                    var f = $('cgaiFoot'); if (f) f.textContent = left + ' AI message' + (left === 1 ? '' : 's') + ' left today · paid lookups ask first';
                }
                var mid = 'm' + Date.now().toString(36);
                var ops = Array.isArray(d.ops) ? d.ops : [];
                // Infected PC payload (files, screenshot): kept in memory for this tab, like the Search tab's.
                if (d.panelData && d.panelData.result && window.intelBoard && intelBoard.keepPc) {
                    intelBoard.keepPc(d.panelData);
                }
                var c2 = loadConv();
                if (ops.length) undoSnaps[mid] = intelBoard.snapshot();
                c2.chat.push({
                    role: 'assistant', content: String(d.reply || ''), id: mid, actions: [],
                    suggestions: Array.isArray(d.suggestions) ? d.suggestions.slice(0, 3) : [],
                    paid: Array.isArray(d.paid) ? d.paid.slice(0, 2) : [],
                    quota: d.quota ? { discord: d.quota.discord, machine: d.quota.machine } : null,
                    thoughts: packThoughts(Array.isArray(d.thoughts) && d.thoughts.length ? d.thoughts : liveLog),
                    thinkMs: d.thinkMs || (Date.now() - t0)
                });
                c2.findings = c2.findings.concat(Array.isArray(d.findings) ? d.findings : []);
                saveConv(c2);
                renderThread();
                var bub = document.querySelector('#cgaiThread [data-msg="' + mid + '"] .cgai-bubble');
                revealP = bub ? revealWords(bub, 26, [th]) : null;
                if (!ops.length) { cheer(); return; }
                setStatus('Updating the board…', true);
                var actions = [];
                return intelBoard.applyOps(ops, function (a) {
                    actions.push(a);
                    var box = document.querySelector('#cgaiThread [data-msg="' + mid + '"] .cgai-chips');
                    if (box) { box.insertAdjacentHTML('beforeend', chipHtml(a, true)); fadeIn(box.lastElementChild); stickTo(th); }
                }).then(function () {
                    var c3 = loadConv();
                    c3.chat.forEach(function (m) { if (m.id === mid) m.actions = actions; });
                    saveConv(c3);
                    cheer();
                    // re-render (undo button, final chips) only once the reply has finished appearing
                    (revealP || Promise.resolve()).then(function () { if (!busy) renderThread(); });
                });
            })
            .catch(function () {
                if (paidRef) setPaidState(paidRef, null);
                clearInterval(pollTimer);
                try { if (thinking._orb) thinking._orb.destroy(); } catch (e) {}
                thinking.remove();
                var c4 = loadConv();
                c4.chat.push({ role: 'assistant', content: 'Can’t reach Intelbyte right now. Check your connection and try again.', error: true, id: 'm' + Date.now() });
                saveConv(c4);
                renderThread();
            })
            .then(function () {
                busy = false;
                var sb = $('cgaiSend'); if (sb) sb.disabled = false;
                setStatus('Watching this case');
            });
    }

    /* ── keep the panel in sync with the open case ── */
    function wire() {
        if (typeof window.openCaseFolderPopup !== 'function' || !window.openCaseFolderPopup._boardWrapped) return false;
        if (window.openCaseFolderPopup._aiWrapped) return true;
        var _open = window.openCaseFolderPopup;
        window.openCaseFolderPopup = function () {
            var r = _open.apply(this, arguments);
            if (build()) { closePanel(); renderThread(); setStatus('Watching this case'); }
            return r;
        };
        window.openCaseFolderPopup._boardWrapped = true;
        window.openCaseFolderPopup._aiWrapped = true;
        return true;
    }
    (function tryWire(n) { if (!wire() && n < 40) setTimeout(function () { tryWire(n + 1); }, 50); })(0);

    // Open the panel and send a prepared question (the board's "Investigate with AI").
    function ask(text) {
        openPanel();
        if (busy) { var i = $('cgaiInput'); if (i) { i.value = text; autosize(); } return; }
        setTimeout(function () { send(text); }, 180);
    }
    window.intelBoardAI = { open: openPanel, close: closePanel, send: send, ask: ask };
})();
