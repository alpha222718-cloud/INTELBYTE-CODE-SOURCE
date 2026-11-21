/* Case graph — a case's investigation board as a link graph: entity cards
   around a subject card, labelled links, an inspector, and an API Intelbyte AI
   uses to edit the board live (animated, undoable). Replaces the older circle
   board (intel-cases-board-v2b.js) and keeps its window.intelBoard API.

   Board data (inside the case object, localStorage):
     pos     { id: {x, y} }                  — '__hub' is the subject card
     links   [ [a, b, {label, suspected, ai}] ]  (old [a, b] pairs still work)
     custom  [ {id, type, label, detail} ]   — entities added on the board
     types / labels / details { itemId: … }  — overrides for pinned case items
     meta    { id: {status, flag, note, ai} } */
(function () {
    var NS = {};

    /* ── entity types ── */
    var TYPES = {
        person:    { label: 'Person',        icon: 'fas fa-user',            group: 'identity' },
        username:  { label: 'Alias',         icon: 'fas fa-fingerprint',     group: 'identity' },
        email:     { label: 'Email',         icon: 'fas fa-envelope',        group: 'identity' },
        phone:     { label: 'Phone',         icon: 'fas fa-phone',           group: 'identity' },
        name:      { label: 'Real name',     icon: 'fas fa-id-card',         group: 'identity' },
        password:  { label: 'Password',      icon: 'fas fa-key',             group: 'identity' },
        location:  { label: 'Location',      icon: 'fas fa-location-dot',    group: 'identity' },
        account:   { label: 'Account',       icon: 'fas fa-user',            group: 'identity' },
        ip:        { label: 'IP address',    icon: 'fas fa-server',          group: 'infra' },
        domain:    { label: 'Domain',        icon: 'fas fa-globe',           group: 'infra' },
        link:      { label: 'URL',           icon: 'fas fa-link',            group: 'infra' },
        device:    { label: 'Device',        icon: 'fas fa-mobile-screen',   group: 'infra' },
        vpn:       { label: 'VPN / proxy',   icon: 'fas fa-shield-halved',   group: 'infra' },
        discord:   { label: 'Discord',       icon: 'fab fa-discord',         group: 'social' },
        roblox:    { label: 'Roblox',        icon: 'svg:roblox',             group: 'social' },
        telegram:  { label: 'Telegram',      icon: 'fab fa-telegram',        group: 'social' },
        instagram: { label: 'Instagram',     icon: 'fab fa-instagram',       group: 'social' },
        x:         { label: 'X / Twitter',   icon: 'fab fa-x-twitter',       group: 'social' },
        steam:     { label: 'Steam',         icon: 'fab fa-steam',           group: 'social' },
        github:    { label: 'GitHub',        icon: 'fab fa-github',          group: 'social' },
        tiktok:    { label: 'TikTok',        icon: 'fab fa-tiktok',          group: 'social' },
        btc:       { label: 'Bitcoin wallet',  icon: 'fab fa-bitcoin',       group: 'finance' },
        eth:       { label: 'Ethereum wallet', icon: 'fab fa-ethereum',      group: 'finance' },
        important: { label: 'Key fact',      icon: 'fas fa-star',            group: 'other' },
        note:      { label: 'Note',          icon: 'fas fa-note-sticky',     group: 'other' }
    };
    var GROUP_LABEL = { identity: 'Identity', infra: 'Infrastructure', social: 'Social', finance: 'Finance', other: 'Other' };
    var STATUSES = [
        { key: 'none', label: 'None' }, { key: 'clear', label: 'Clear' },
        { key: 'caution', label: 'Caution' }, { key: 'risk', label: 'Risk' }
    ];
    function typeMeta(t) { return TYPES[t] || TYPES.account; }

    var SVG_ICONS = {
        roblox: '<svg class="cg-svg-ic" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M5.28.37 23.64 5.28 18.72 23.64.37 18.72ZM10.16 8.82l-1.34 5.02 5.02 1.34 1.34-5.02Z"/></svg>',
        netflix: '<svg class="cg-svg-ic" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6.2 2h3.5l4.6 12.1V2h3.5v20h-3.3L9.7 9.6V22H6.2z"/></svg>'
    };
    function iconHtml(spec) {
        if (String(spec).indexOf('svg:') === 0) return SVG_ICONS[spec.slice(4)] || '<i class="fas fa-circle"></i>';
        return '<i class="' + spec + '"></i>';
    }
    // Recognise well-known services in a value ("roblox.com/users/1", "t.me/x"…).
    var BRANDS = [
        { re: /\broblox\b/, label: 'Roblox', icon: 'svg:roblox' },
        { re: /\bdiscord(app)?\b|discord\.gg/, label: 'Discord', icon: 'fab fa-discord' },
        { re: /\btelegram\b|\bt\.me\//, label: 'Telegram', icon: 'fab fa-telegram' },
        { re: /\binstagram\b/, label: 'Instagram', icon: 'fab fa-instagram' },
        { re: /\btwitter\b|(^|[^a-z0-9])x\.com\b/, label: 'X', icon: 'fab fa-x-twitter' },
        { re: /\bsteam(community|powered)?\b/, label: 'Steam', icon: 'fab fa-steam' },
        { re: /\bgithub\b/, label: 'GitHub', icon: 'fab fa-github' },
        { re: /\btiktok\b/, label: 'TikTok', icon: 'fab fa-tiktok' },
        { re: /\byoutube\b|\byoutu\.be\b/, label: 'YouTube', icon: 'fab fa-youtube' },
        { re: /\btwitch\b/, label: 'Twitch', icon: 'fab fa-twitch' },
        { re: /\breddit\b/, label: 'Reddit', icon: 'fab fa-reddit-alien' },
        { re: /\bfacebook\b|(^|[^a-z0-9])fb\.com\b/, label: 'Facebook', icon: 'fab fa-facebook-f' },
        { re: /\bsnapchat\b/, label: 'Snapchat', icon: 'fab fa-snapchat' },
        { re: /\bspotify\b/, label: 'Spotify', icon: 'fab fa-spotify' },
        { re: /\bnetflix\b/, label: 'Netflix', icon: 'svg:netflix' },
        { re: /\bwhatsapp\b|\bwa\.me\b/, label: 'WhatsApp', icon: 'fab fa-whatsapp' },
        { re: /\blinkedin\b/, label: 'LinkedIn', icon: 'fab fa-linkedin-in' },
        { re: /\bpaypal\b/, label: 'PayPal', icon: 'fab fa-paypal' },
        { re: /\bminecraft\b/, label: 'Minecraft', icon: 'fas fa-cube' },
        { re: /\bgoogle\b|\bgmail\b/, label: 'Google', icon: 'fab fa-google' },
        { re: /\bapple\b|\bicloud\b/, label: 'Apple', icon: 'fab fa-apple' },
        { re: /\bmicrosoft\b|\boutlook\b|\bhotmail\b/, label: 'Microsoft', icon: 'fab fa-microsoft' }
    ];
    // Types whose icon always says what they ARE (an email at gmail is still an email).
    var NO_BRAND = { email: 1, phone: 1, ip: 1, password: 1, location: 1, note: 1, name: 1, btc: 1, eth: 1, vpn: 1, device: 1, person: 1, important: 1 };
    function brandFor(type, value, detail) {
        if (NO_BRAND[type]) return null;
        var t = (String(value || '') + ' ' + String(detail || '')).toLowerCase();
        for (var i = 0; i < BRANDS.length; i++) if (BRANDS[i].re.test(t)) return BRANDS[i];
        return null;
    }
    /* ── site logo for where a handle / password / account came from ──
       The first real domain in the card's Source (`detail`, e.g. "canva.com, x.com"),
       or the value itself for domains / URLs, shown as that site's favicon (Google's
       favicon index — same source as the search results' site logos). Unknown sites
       return a 16px globe, which is dropped so the type icon stays. */
    var CG_SLD = { com: 1, co: 1, org: 1, net: 1, gov: 1, edu: 1, ac: 1, gen: 1, web: 1, biz: 1, info: 1, bel: 1, k12: 1 };
    var CG_GTLD = { com: 1, net: 1, org: 1, io: 1, gg: 1, co: 1, me: 1, tv: 1, xyz: 1, info: 1, biz: 1, app: 1, dev: 1, club: 1, online: 1, site: 1,
        store: 1, shop: 1, top: 1, live: 1, pro: 1, cc: 1, ws: 1, to: 1, so: 1, ai: 1, game: 1, games: 1, fun: 1, network: 1, cloud: 1, link: 1,
        space: 1, world: 1, edu: 1, gov: 1, mobi: 1, name: 1, asia: 1, tech: 1, social: 1, gay: 1, lol: 1, wtf: 1, one: 1, team: 1, zone: 1 };
    function hostFromText(s) {
        var toks = String(s || '').toLowerCase().split(/[\s,;|()\[\]]+/);
        for (var i = 0; i < toks.length; i++) {
            var t = toks[i];
            if (!t || t.indexOf('@') !== -1) continue;              // an email is not a site
            t = t.replace(/^[a-z][a-z0-9+.\-]*:\/\//, '')
                 .split('/')[0].split('?')[0].split('#')[0]
                 .replace(/:\d+$/, '').replace(/^www\./, '').replace(/\.+$/, '');
            if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(t) || /^\d+(\.\d+){3}$/.test(t)) continue;
            var p = t.split('.'), tld = p[p.length - 1];
            if (tld.length !== 2 && !CG_GTLD[tld]) continue;
            if (p.length > 2) t = (tld.length === 2 && CG_SLD[p[p.length - 2]]) ? p.slice(-3).join('.') : p.slice(-2).join('.');
            return t;
        }
        return '';
    }
    var FAV_FROM = { username: 'detail', account: 'detail', password: 'detail', domain: 'value', link: 'value' };
    function faviconHost(n) {
        var from = n && FAV_FROM[n.type];
        return from ? hostFromText(from === 'value' ? n.value : n.detail) : '';
    }
    function favHtml(host, fallback) {
        return '<span class="cg-fav"><img src="https://www.google.com/s2/favicons?sz=64&amp;domain=' + encodeURIComponent(host) + '" alt="" loading="lazy" referrerpolicy="no-referrer"' +
               ' onload="if(this.naturalWidth<32){this.remove()}else{this.classList.add(\'ok\')}" onerror="this.remove()">' + fallback + '</span>';
    }
    function nodeIcon(n) {
        var b = brandFor(n.type, n.value, n.detail);
        if (b) return iconHtml(b.icon);
        var ic = iconHtml(typeMeta(n.type).icon);
        var host = faviconHost(n);
        return host ? favHtml(host, ic) : ic;
    }
    // What to call it under the value: the brand for generic links/handles, else the type.
    function nodeKind(n) {
        var b = brandFor(n.type, n.value, n.detail);
        var meta = typeMeta(n.type);
        if (b && (n.type === 'link' || n.type === 'domain' || n.type === 'account' || n.type === 'username')) return b.label + (n.type === 'username' ? ' handle' : '');
        return meta.label;
    }
    var SEARCHABLE = { email: 1, username: 1, name: 1, ip: 1, password: 1, account: 1, discord: 1, roblox: 1, telegram: 1, instagram: 1, x: 1, steam: 1, github: 1, tiktok: 1 };

    // Older boards stored most identifiers as type "account" with the kind in
    // `detail` (the new-case wizard did this) — show them as what they are.
    function effectiveType(type, detail) {
        var d = String(detail || '').toLowerCase();
        if (type === 'important') {
            if (/real name|^name$/.test(d)) return 'name';
            if (/password|hash/.test(d)) return 'password';
            return 'important';
        }
        if (type === 'link' && /domain/.test(d)) return 'domain';
        if (TYPES[type] && type !== 'account') return type;
        if (/e-?mail/.test(d)) return 'email';
        if (/phone/.test(d)) return 'phone';
        if (/discord/.test(d)) return 'discord';
        if (/roblox/.test(d)) return 'roblox';
        if (/telegram/.test(d)) return 'telegram';
        if (/instagram/.test(d)) return 'instagram';
        if (/twitter|^x$/.test(d)) return 'x';
        if (/steam/.test(d)) return 'steam';
        if (/user|handle|alias/.test(d)) return 'username';
        return 'account';
    }
    // The wizard put the kind name into detail ("Email", "Username"…): don't repeat it under the value.
    function cleanDetail(detail, type) {
        var d = String(detail || '').trim();
        if (!d) return '';
        var lab = typeMeta(type).label.toLowerCase();
        var dl = d.toLowerCase();
        if (dl === lab || dl === type || /^(email|username|phone|discord id|roblox|ip address|domain|profile url|real name|password \/ hash|location)$/.test(dl)) return '';
        return d;
    }

    /* ── state ── */
    var curId = null, curBoard = null;
    var pan = { x: 0, y: 0 }, zoom = 1;
    var elMap = {};
    var selected = null;           // { kind: 'node', id } | { kind: 'edge', key }
    var connectMode = false, linkSrc = null;
    var undoStack = [];
    var lastFitId = null;
    var pendingNodeAnim = {};      // id -> 'enter' | 'pulse'
    var pendingEdgeAnim = {};      // edgeKey -> true
    var ZOOM_MIN = 0.3, ZOOM_MAX = 2.2;

    /* ── grouping (view only — the case data is untouched) ──
       When one card has ≥ GROUP_MIN cards of the same type hanging off it that link
       to nothing else (e.g. 12 passwords that only connect to an alias), they're
       drawn as ONE compact card ("Passwords · 12"). Clicking it lists them in the
       inspector, each with its site logo; picking one opens that card's sheet.
       Cards with more than one link carry correlations, so they always stay visible. */
    var GROUP_MIN = 4;
    var NO_GROUP = { note: 1, person: 1, device: 1, important: 1 };
    var groupOf = {};              // memberId -> groupId
    var groupList = [];            // [{ gid, parent, type, members: [node] }]
    function isGroupId(id) { return String(id || '').indexOf('grp:') === 0; }
    function visId(id) { return groupOf[id] || id; }   // the card that actually shows `id`
    function groupById(gid) { return groupList.find(function (g) { return g.gid === gid; }) || null; }
    var replayFresh = {};          // cards the running AI turn just added (their links may still be coming)
    function computeGroups(nodes, b) {
        var deg = {}, other = {};
        b.links.forEach(function (l) {
            deg[l[0]] = (deg[l[0]] || 0) + 1; deg[l[1]] = (deg[l[1]] || 0) + 1;
            other[l[0]] = l[1]; other[l[1]] = l[0];
        });
        var buckets = {};
        nodes.forEach(function (n) {
            if (NO_GROUP[n.type] || n.pc) return;
            var d = deg[n.id] || 0, p, k;
            if (d === 1) { p = other[n.id]; k = p + '|' + n.type; }
            else if (d === 0 && n.ai && !replayFresh[n.id]) { p = null; k = '_|' + n.type; }   // AI cards left unlinked
            else return;
            (buckets[k] = buckets[k] || { parent: p, type: n.type, members: [] }).members.push(n);
        });
        var byMember = {}, list = [];
        Object.keys(buckets).forEach(function (k) {
            var g = buckets[k];
            if (g.members.length < GROUP_MIN) return;
            g.gid = 'grp:' + (g.parent || '_') + ':' + g.type;
            list.push(g);
            g.members.forEach(function (n) { byMember[n.id] = g.gid; });
        });
        return { byMember: byMember, list: list };
    }
    function pluralKind(type, k) {
        var l = typeMeta(type).label || 'Item';
        if (k === 1) return l;
        if (/ss$/i.test(l)) return l + 'es';
        if (/s$/i.test(l)) return l;
        if (/[^aeiou]y$/i.test(l)) return l.slice(0, -1) + 'ies';
        return l + 's';
    }
    function worstStatus(list) {
        var rank = { risk: 3, caution: 2, clear: 1, none: 0 }, w = 'none';
        list.forEach(function (n) { if ((rank[n.status] || 0) > rank[w]) w = n.status; });
        return w;
    }

    /* ── live-change animations (AI adds / links / updates) ──
       Driven by the Web Animations API, not CSS animation/transition: the theme's
       "Reduce motion" (`body.reduce-motion * { …-duration: 0.001ms !important }`)
       and similar global CSS overrides were zeroing the CSS versions, so AI changes
       popped in "tak tak" with no motion. WAAPI timing is immune to those rules.
       Nodes are positioned with left/top, so animating `transform` is safe. */
    var CG_EASE = 'cubic-bezier(0.23, 1, 0.32, 1)';
    var CAN_ANIM = typeof Element !== 'undefined' && typeof Element.prototype.animate === 'function';
    function animateNode(el, kind) {
        if (!el) return;
        if (!CAN_ANIM) {   // very old browser: fall back to the CSS classes
            var cls = kind === 'enter' ? 'cg-enter' : 'cg-pulse';
            el.classList.remove('cg-enter', 'cg-pulse'); void el.offsetWidth; el.classList.add(cls);
            clearTimeout(el._cgAnimT);
            el._cgAnimT = setTimeout(function () { el.classList.remove('cg-enter', 'cg-pulse'); }, 1900);
            return;
        }
        try { if (el._cgAnim) el._cgAnim.cancel(); } catch (e) {}
        if (kind === 'enter') {
            el._cgAnim = el.animate([
                { opacity: 0, transform: 'scale(0.82) translateY(8px)' },
                { opacity: 1, offset: 0.6 },
                { opacity: 1, transform: 'none' }
            ], { duration: 600, easing: CG_EASE, fill: 'backwards' });
            // soft white ring that fades out around the new card
            el.classList.add('cg-glow');
            try {
                el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 1800, easing: 'ease-out', fill: 'forwards', pseudoElement: '::before' });
            } catch (e) {}
            clearTimeout(el._cgGlowT);
            el._cgGlowT = setTimeout(function () { el.classList.remove('cg-glow'); }, 1850);
        } else if (el.classList.contains('cg-group')) {
            // a group's stacked-card shadow must stay put: bump the scale instead
            el._cgAnim = el.animate([
                { transform: 'scale(1)' }, { transform: 'scale(1.06)', offset: 0.35 }, { transform: 'scale(1)' }
            ], { duration: 520, easing: CG_EASE });
        } else {
            el._cgAnim = el.animate([
                { boxShadow: '0 0 0 0 rgba(255, 255, 255, 0.5), 0 18px 34px -22px rgba(0, 0, 0, 0.95)' },
                { boxShadow: '0 0 0 18px rgba(255, 255, 255, 0), 0 18px 34px -22px rgba(0, 0, 0, 0.95)' }
            ], { duration: 950, easing: CG_EASE });
        }
    }
    // A card absorbed into its category group: it collapses into a small white dot that
    // arcs over to the group card, then the group bumps and its count pops.
    function easeInOut(u) { return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; }
    function flyIntoGroup(card, gid, i) {
        var layer = card.parentNode, target = elMap[gid];
        if (!layer || !target) { card.remove(); return; }
        delete card.dataset.nid;
        card.classList.add('cg-flying');
        card.classList.remove('is-selected', 'cg-glow');
        try { if (card._cgAnim) card._cgAnim.cancel(); } catch (e) {}
        var x0 = card.offsetLeft + card.offsetWidth / 2, y0 = card.offsetTop + card.offsetHeight / 2;
        var x1 = target.offsetLeft + target.offsetWidth / 2, y1 = target.offsetTop + target.offsetHeight / 2;
        var delay = Math.min(i, 8) * 80;
        card.animate([
            { opacity: 1, transform: 'scale(1)', filter: 'blur(0px)' },
            { opacity: 0, transform: 'scale(0.1)', filter: 'blur(3px)' }
        ], { duration: 320, delay: delay, easing: 'cubic-bezier(0.5, 0, 0.75, 0)', fill: 'forwards' });

        var dot = document.createElement('div');
        dot.className = 'cg-fly-dot';
        layer.appendChild(dot);
        var dx = x1 - x0, dy = y1 - y0, dist = Math.sqrt(dx * dx + dy * dy) || 1;
        var nx = -dy / dist, ny = dx / dist;
        if (ny > 0) { nx = -nx; ny = -ny; }   // arc upwards
        var lift = Math.min(110, 24 + dist * 0.28);
        var cx = x0 + dx / 2 + nx * lift, cy = y0 + dy / 2 + ny * lift;
        function at(t) {
            var a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, c = t * t;
            return 'translate(' + (a * x0 + b * cx + c * x1).toFixed(1) + 'px,' + (a * y0 + b * cy + c * y1).toFixed(1) + 'px)';
        }
        var frames = [
            { offset: 0, transform: at(0) + ' scale(0)', opacity: 0 },
            { offset: 0.16, transform: at(0) + ' scale(1.35)', opacity: 1 }
        ];
        for (var k = 1; k <= 16; k++) {
            var u = k / 16;
            frames.push({ offset: 0.16 + 0.72 * u, transform: at(easeInOut(u)) + ' scale(' + (1.35 - 0.45 * u).toFixed(2) + ')', opacity: 1 });
        }
        frames.push({ offset: 1, transform: at(1) + ' scale(0)', opacity: 0 });
        var done = false;
        function land() {
            if (done) return;
            done = true;
            dot.remove();
            card.remove();
            var g = elMap[gid];
            if (!g || !g.isConnected) return;
            animateNode(g, 'pulse');
            var pill = g.querySelector('.cg-group-n');
            if (pill && CAN_ANIM) pill.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.55)', offset: 0.4 }, { transform: 'scale(1)' }], { duration: 420, easing: CG_EASE });
        }
        var fly = dot.animate(frames, { duration: 1050, delay: delay + 200, easing: 'linear', fill: 'both' });
        fly.onfinish = land;
        setTimeout(land, delay + 1700);   // safety net if the animation never finishes
    }
    // Draw a link line in from its start (stroke-dashoffset), WAAPI-driven.
    function animateEdgeDraw(p) {
        var len = 0;
        try { len = p.getTotalLength(); } catch (e) {}
        if (!len) return;
        try { if (p._cgDraw) p._cgDraw.cancel(); } catch (e) {}
        clearTimeout(p._cgT);
        p.style.strokeDasharray = len + ' ' + len;
        if (CAN_ANIM) {
            var a = p.animate([{ strokeDashoffset: String(len) }, { strokeDashoffset: '0' }],
                { duration: 700, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'backwards' });
            p._cgDraw = a;
            a.onfinish = a.oncancel = function () { if (p._cgDraw === a) { p.style.strokeDasharray = ''; p._cgDraw = null; } };
        }
        p._cgT = setTimeout(function () { p.style.strokeDasharray = ''; p.style.strokeDashoffset = ''; }, 820);
    }

    function esc(s) { return (typeof escapeHtml === 'function') ? escapeHtml(String(s == null ? '' : s)) : String(s == null ? '' : s).replace(/[&<>"']/g, function (m) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]; }); }
    function $(id) { return document.getElementById(id); }
    function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
    function norm(v) { return String(v || '').trim().toLowerCase(); }
    // While the AI replays a turn, every step used to JSON-parse ALL cases from localStorage
    // several times and re-write them once — dozens of full parses/stringifies per turn on
    // the main thread, which is what froze the animations. A replay now works on ONE parsed
    // copy and writes it at the end (plus a debounced save midway, and on pagehide).
    var batch = null;   // { all, timer, depth }
    function loadAll() { return (typeof intelCasesLoad === 'function') ? intelCasesLoad() : []; }
    function saveAll(all) { if (typeof intelCasesSave === 'function') intelCasesSave(all); }
    function cases() { return batch ? batch.all : loadAll(); }
    function flushBatch() {
        if (!batch) return;
        clearTimeout(batch.timer);
        batch.timer = null;
        try {
            // Only boards (and the subject) change during a replay: put those on the latest
            // stored copy so anything another part of the panel saved meanwhile survives.
            var fresh = loadAll();
            batch.all.forEach(function (bc) {
                var fc = fresh.find(function (x) { return x.id === bc.id; });
                if (fc) { fc.board = bc.board; if (bc.subject) fc.subject = bc.subject; }
            });
            saveAll(fresh);
            batch.all = fresh;
        } catch (e) {}
    }
    function beginBatch() {
        if (!batch) batch = { all: loadAll(), timer: null, depth: 0 };
        batch.depth++;
    }
    function endBatch() {
        if (!batch || --batch.depth > 0) return;
        flushBatch();
        batch = null;
    }
    window.addEventListener('pagehide', flushBatch);
    function activeId() { return (typeof __cfpActiveCaseId !== 'undefined' && __cfpActiveCaseId) ? __cfpActiveCaseId : ((typeof intelCasesGetActiveId === 'function') ? intelCasesGetActiveId() : null); }
    function getCase() { var id = curId; return cases().find(function (c) { return c.id === id; }); }
    function getBoard(c) {
        if (!c.board || typeof c.board !== 'object') c.board = {};
        var b = c.board;
        if (!b.pos || typeof b.pos !== 'object') b.pos = {};
        if (!Array.isArray(b.links)) b.links = [];
        if (!Array.isArray(b.custom)) b.custom = [];
        if (!b.meta || typeof b.meta !== 'object') b.meta = {};
        return b;
    }
    function boardVisible() { var w = $('cfpBoardWrap'); return !!(w && w.style.display !== 'none'); }
    function edgeKey(a, b) { return [a, b].sort().join('|'); }
    function linkInfo(l) { return (l && l[2] && typeof l[2] === 'object') ? l[2] : {}; }

    // Load-modify-save on the live case; returns the saved board.
    function mutate(fn) {
        var all = cases();
        var c = all.find(function (x) { return x.id === curId; });
        if (!c) return null;
        var b = getBoard(c);
        fn(b, c);
        if (batch && fn.length < 2) {
            // board-only change during an AI replay: written when the replay ends
            if (!batch.timer) batch.timer = setTimeout(flushBatch, 4000);
        } else {
            saveAll(all);   // case-level edits (subject photo…) save now: callers check the result
        }
        curBoard = b;
        return b;
    }

    /* ── undo ── */
    function snapshot() { var c = getCase(); return c ? JSON.stringify(getBoard(c)) : null; }
    function pushUndo() {
        var s = snapshot();
        if (!s) return;
        undoStack.push({ caseId: curId, board: s });
        if (undoStack.length > 30) undoStack.shift();
        syncUndoBtn();
    }
    function syncUndoBtn() {
        var b = $('cgUndoBtn');
        if (b) b.disabled = !undoStack.some(function (u) { return u.caseId === curId; });
    }
    NS.restore = function (boardJson) {
        if (!boardJson) return;
        mutate(function (b, c) { c.board = JSON.parse(boardJson); });
        selected = null;
        render();
        renderInspector();
    };
    NS.undo = function () {
        for (var i = undoStack.length - 1; i >= 0; i--) {
            if (undoStack[i].caseId === curId) {
                var u = undoStack.splice(i, 1)[0];
                NS.restore(u.board);
                syncUndoBtn();
                return true;
            }
        }
        return false;
    };
    NS.snapshot = snapshot;

    /* ── reading saved case items (pinned onto the board) ── */
    function fieldFrom(obj, names, exclude) {
        if (!obj || typeof obj !== 'object') return '';
        for (var k in obj) {
            if (!obj.hasOwnProperty(k)) continue;
            var lk = k.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (exclude && exclude.some(function (x) { return lk.indexOf(x) !== -1; })) continue;
            for (var i = 0; i < names.length; i++) {
                if (lk === names[i] || lk.indexOf(names[i]) !== -1) {
                    var v = obj[k];
                    if (v != null && typeof v !== 'object') {
                        var s = String(v).trim();
                        if (s && s !== 'null' && s !== 'undefined') return s;
                    }
                }
            }
        }
        return '';
    }
    function hostOf(v) {
        var s = String(v || '').trim().replace(/^https?:\/\//i, '').split(/[\/\s",\]]+/)[0].replace(/^www\./i, '');
        return /[a-z0-9-]+\.[a-z]{2,}/i.test(s) ? s : '';
    }
    function describeItem(it) {
        var p = (it && it.payload) || {};
        var kind = (it && it.label) || 'Item';
        if (p.kind === 'discord_block' || p.kind === 'discord_user') {
            var d = p.data || p;
            return { type: 'discord', value: d.global_name || d.username || p.title || kind, detail: d.username ? '@' + d.username : (p.title || '') };
        }
        if (p.kind === 'footprint_card') return { type: 'link', value: p.title || kind, detail: p.subtitle || '' };
        if (p.kind === 'footprint_index_row') return { type: 'link', value: p.identifier || p.service || kind, detail: p.service || '' };
        var email = fieldFrom(p, ['email', 'mail'], []);
        var user = fieldFrom(p, ['username', 'user', 'login', 'nick', 'handle'], ['useragent']);
        var ip = fieldFrom(p, ['ipaddress', 'ip'], []);
        var origin = '';
        ['origin', 'source', 'url', 'domain', 'website', 'site', 'database', 'breach'].some(function (n) {
            var h = hostOf(fieldFrom(p, [n], []));
            if (h) { origin = h; return true; }
            return false;
        });
        if (email) return { type: 'email', value: email, detail: origin || (user ? '@' + user : '') };
        if (user) return { type: 'username', value: user, detail: origin };
        if (ip) return { type: 'ip', value: ip, detail: origin };
        return { type: 'account', value: kind, detail: origin };
    }
    function itemEvidence(it) {
        var p = (it && it.payload) || {};
        var src = p.kind === 'discord_block' ? (p.data || {}) : p;
        var parts = [];
        if (src && typeof src === 'object') {
            Object.keys(src).forEach(function (k) {
                if (k.charAt(0) === '_' || k === 'kind') return;
                var v = src[k];
                if (v == null || v === '' || typeof v === 'object') return;
                parts.push(k + '=' + String(v).slice(0, 80));
            });
        }
        return (it.label || 'Item') + ': ' + parts.slice(0, 14).join(', ');
    }

    /* ── node model ── */
    function nodeList(c) {
        var b = getBoard(c);
        var items = (c.items || []).filter(function (it) { return b.pos[String(it.id)]; }).map(function (it) {
            var id = String(it.id);
            var d = describeItem(it);
            var m = b.meta[id] || {};
            var type = (b.types && b.types[id]) ? effectiveType(b.types[id], b.details && b.details[id]) : d.type;
            return {
                id: id, kind: 'item', type: type,
                value: (b.labels && b.labels[id]) || d.value,
                detail: (b.details && b.details[id] != null) ? b.details[id] : d.detail,
                status: m.status || 'none', flag: m.flag || '', note: m.note || '', ai: !!m.ai, confidence: m.confidence, pc: m.pc || null
            };
        });
        var customs = b.custom.map(function (cn) {
            var m = b.meta[cn.id] || {};
            var type = effectiveType(cn.type || cn.kind || 'note', cn.detail);
            return {
                id: cn.id, kind: 'custom', type: type,
                value: cn.label || '',
                detail: type === 'note' ? (cn.detail || cn.note || '') : cleanDetail(cn.detail || cn.url || '', type),
                status: m.status || 'none', flag: m.flag || '', note: m.note || '', ai: !!m.ai, confidence: m.confidence, pc: m.pc || null
            };
        });
        return items.concat(customs);
    }
    function nodeById(c, id) { return nodeList(c).find(function (n) { return n.id === id; }) || null; }
    // Anything that came off an infected PC (the PC itself, logins/emails/IPs saved on it)
    // is compromised by definition: "risk", never "clear" — whatever the model said.
    var PC_EXPOSED_RE = /infecteds*pc|stealers*log|saved on (the )?pc/i;
    function pcExposed(type, detail, pc, flag) {
        return !!pc || PC_EXPOSED_RE.test(String(detail || '')) || PC_EXPOSED_RE.test(String(flag || ''));
    }
    function pcRiskStatus(type, detail, pc, status, flag) {
        return (pcExposed(type, detail, pc, flag) && (!status || status === 'none' || status === 'clear')) ? 'risk' : status;
    }
    // Unlinked AI cards (e.g. stealer passwords): the case's saved search rows say which
    // email/username each value came with — link it there so it groups under that account.
    function linkOrphansFromFindings(c) {
        var b = getBoard(c);
        var rows = [];
        ((c.ai && Array.isArray(c.ai.findings)) ? c.ai.findings : []).forEach(function (fd) {
            (fd && Array.isArray(fd.rows) ? fd.rows : []).forEach(function (r) { if (r && typeof r === 'object') rows.push(r); });
        });
        if (!rows.length) return;
        var deg = {};
        b.links.forEach(function (l) { deg[l[0]] = 1; deg[l[1]] = 1; });
        var nodes = nodeList(c), byVal = {};
        nodes.forEach(function (n) { if (n.value) byVal[norm(n.value)] = n.id; });
        var add = [];
        nodes.forEach(function (n) {
            if (deg[n.id] || !n.ai || NO_GROUP[n.type] || n.pc) return;
            var v = norm(n.value); if (!v || v.length < 3) return;
            for (var i = 0; i < rows.length; i++) {
                var r = rows[i], hit = false;
                for (var key in r) { if (typeof r[key] === 'string' && norm(r[key]) === v) { hit = true; break; } }
                if (!hit) continue;
                var to = null;
                ['email', 'username', 'login', 'user'].some(function (k) {
                    var id = r[k] && byVal[norm(r[k])];
                    if (id && id !== n.id) { to = id; return true; }
                    return false;
                });
                if (to) { add.push([n.id, to, { label: n.type === 'password' ? 'password' : 'found with', ai: true }]); break; }
            }
        });
        if (add.length) mutate(function (bb) { add.forEach(function (l) { bb.links.push(l); }); });
    }
    // One-time fix for boards the AI already filled: its infected-PC nodes marked clear/none → risk
    // (only AI-set statuses; a status the analyst picked by hand is left alone).
    function fixPcRisk(c) {
        var b = getBoard(c);
        if (b.pcRisk) return;
        var fix = nodeList(c).filter(function (n) {
            var m = b.meta[n.id] || {};
            return n.ai && !m.userStatus && (n.status === 'clear' || n.status === 'none') && pcExposed(n.type, n.detail, n.pc, n.flag);
        }).map(function (n) { return n.id; });
        mutate(function (bb) {
            bb.pcRisk = 1;
            fix.forEach(function (id) { var m = bb.meta[id] || (bb.meta[id] = {}); m.status = 'risk'; });
        });
    }
    function subjectName(c) { return (c.subject && c.subject.alias) || c.title || 'Subject'; }
    function initials(s) {
        var parts = String(s || '?').trim().split(/[\s._-]+/).filter(Boolean);
        if (!parts.length) return '?';
        return (parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }

    /* ── geometry ── */
    var DEF_W = 200, DEF_H = 54;
    function box(id) {
        var el = elMap[id];
        if (el) return { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight };
        var p = curBoard && curBoard.pos[id];
        return { x: p ? p.x : 0, y: p ? p.y : 0, w: id === '__hub' ? 124 : DEF_W, h: id === '__hub' ? 124 : DEF_H };
    }
    function center(bx) { return { x: bx.x + bx.w / 2, y: bx.y + bx.h / 2 }; }
    // Leave/enter each card on the side facing the other one.
    function endpoints(aId, bId) {
        var A = box(aId), B = box(bId);
        var ca = center(A), cb = center(B);
        var dx = cb.x - ca.x, dy = cb.y - ca.y;
        if (Math.abs(dx) > Math.abs(dy) * 0.8) {
            var sa = dx > 0 ? 1 : -1;
            return [{ x: sa > 0 ? A.x + A.w : A.x, y: ca.y, dx: sa, dy: 0 }, { x: sa > 0 ? B.x : B.x + B.w, y: cb.y, dx: -sa, dy: 0 }];
        }
        var sv = dy > 0 ? 1 : -1;
        return [{ x: ca.x, y: sv > 0 ? A.y + A.h : A.y, dx: 0, dy: sv }, { x: cb.x, y: sv > 0 ? B.y : B.y + B.h, dx: 0, dy: -sv }];
    }
    function curve(p, q) {
        var k = Math.max(40, Math.min(220, (Math.abs(q.x - p.x) + Math.abs(q.y - p.y)) * 0.42));
        var c1 = { x: p.x + p.dx * k, y: p.y + p.dy * k }, c2 = { x: q.x + q.dx * k, y: q.y + q.dy * k };
        var at = function (t) {
            var u = 1 - t;
            return { x: u * u * u * p.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * q.x,
                     y: u * u * u * p.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * q.y };
        };
        // The label goes at the middle unless that spot is hidden behind the subject orb.
        var hub = curBoard && elMap.__hub ? box('__hub') : null;
        var mid = at(0.5);
        if (hub) {
            var hc = center(hub), r = hub.w / 2 + 34;
            var clear = function (pt) { return Math.hypot(pt.x - hc.x, pt.y - hc.y) > r; };
            var tries = [0.5, 0.35, 0.65, 0.25, 0.75, 0.18, 0.82];
            for (var i = 0; i < tries.length; i++) { var pt = at(tries[i]); if (clear(pt)) { mid = pt; break; } }
        }
        return { d: 'M ' + p.x + ',' + p.y + ' C ' + c1.x + ',' + c1.y + ' ' + c2.x + ',' + c2.y + ' ' + q.x + ',' + q.y, mid: mid };
    }
    function overlaps(x, y, w, h, skip) {
        var M = 26;
        for (var id in elMap) {
            if (id === skip) continue;
            var o = box(id);
            if (x < o.x + o.w + M && x + w + M > o.x && y < o.y + o.h + M && y + h + M > o.y) return true;
        }
        return false;
    }
    var GROUP_ANGLE = { infra: -90, identity: 180, social: 0, finance: 90, other: 50 };
    // A free spot for a new card: out from `nearId` (away from the subject),
    // or on its type's side of the subject.
    function placeNear(nearId, type, w, h) {
        w = w || DEF_W; h = h || DEF_H;
        if (nearId && nearId !== '__hub') nearId = visId(nearId);
        var hub = center(box('__hub'));
        var origin, base, dist;
        if (nearId && nearId !== '__hub' && elMap[nearId]) {
            origin = center(box(nearId));
            base = Math.atan2(origin.y - hub.y, origin.x - hub.x) * 180 / Math.PI;
            dist = 250;
        } else {
            origin = hub;
            base = GROUP_ANGLE[typeMeta(type).group] || 0;
            dist = 330;
        }
        var offs = [0, 24, -24, 48, -48, 72, -72, 100, -100, 130, -130, 165, -165, 180];
        for (var ring = 1; ring <= 3.5; ring += 0.5) {
            for (var i = 0; i < offs.length; i++) {
                var a = (base + offs[i]) * Math.PI / 180;
                var cx = origin.x + Math.cos(a) * dist * ring;
                var cy = origin.y + Math.sin(a) * dist * ring * 0.62;
                var x = Math.round(cx - w / 2), y = Math.round(cy - h / 2);
                if (!overlaps(x, y, w, h)) return { x: x, y: y };
            }
        }
        return { x: Math.round(hub.x + 400), y: Math.round(hub.y + 300 + Object.keys(elMap).length * 70) };
    }

    /* ── view: pan / zoom / fit ── */
    function applyPan() {
        var layer = $('cfpBoardLayer');
        if (layer) layer.style.transform = 'translate(' + pan.x + 'px,' + pan.y + 'px) scale(' + zoom + ')';
        var zl = $('cgZoomLabel');
        if (zl) zl.textContent = Math.round(zoom * 100) + '%';
    }
    function smoothView(fn) {
        var layer = $('cfpBoardLayer');
        if (layer) layer.classList.add('cg-smooth');
        fn();
        applyPan();
        setTimeout(function () { if (layer) layer.classList.remove('cg-smooth'); }, 560);
    }
    NS.fit = function (smooth) {
        var canvas = $('cfpBoardCanvas');
        if (!canvas) return;
        var r = canvas.getBoundingClientRect();
        if (!r.width || !r.height) return;
        var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (var id in elMap) {
            var b = box(id);
            minX = Math.min(minX, b.x); minY = Math.min(minY, b.y);
            maxX = Math.max(maxX, b.x + b.w); maxY = Math.max(maxY, b.y + b.h);
        }
        if (!isFinite(minX)) return;
        var pad = 70;
        var fit = function () {
            zoom = Math.max(ZOOM_MIN, Math.min(1, (r.width - pad * 2) / (maxX - minX), (r.height - pad * 2) / (maxY - minY)));
            pan.x = (r.width - (maxX - minX) * zoom) / 2 - minX * zoom;
            pan.y = (r.height - (maxY - minY) * zoom) / 2 - minY * zoom;
        };
        if (smooth) smoothView(fit); else { fit(); applyPan(); }
    };
    NS.zoomBy = function (dir) {
        var canvas = $('cfpBoardCanvas'); if (!canvas) return;
        var r = canvas.getBoundingClientRect();
        smoothView(function () { zoomAround(zoom * (dir > 0 ? 1.2 : 1 / 1.2), r.width / 2, r.height / 2, true); });
    };
    function zoomAround(nz, mx, my, noApply) {
        nz = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, nz));
        var ratio = nz / zoom;
        pan.x = mx - (mx - pan.x) * ratio;
        pan.y = my - (my - pan.y) * ratio;
        zoom = nz;
        if (!noApply) applyPan();
    }
    // Bring a card into view if it's outside (or near the edge of) the canvas.
    function ensureVisible(id) {
        id = visId(id);   // a card inside a group: bring the group into view
        var canvas = $('cfpBoardCanvas'); if (!canvas || !elMap[id]) return;
        var r = canvas.getBoundingClientRect();
        var b = box(id), m = 80;
        var sx = b.x * zoom + pan.x, sy = b.y * zoom + pan.y;
        if (sx > m && sy > m && sx + b.w * zoom < r.width - m && sy + b.h * zoom < r.height - m) return;
        smoothView(function () {
            pan.x = r.width / 2 - (b.x + b.w / 2) * zoom;
            pan.y = r.height / 2 - (b.y + b.h / 2) * zoom;
        });
    }

    /* ── render ── */
    function cardHtml(n) {
        var meta = typeMeta(n.type);
        if (n.type === 'note') {
            return '<div class="cg-note-head">' + iconHtml(meta.icon) + '<span>' + esc(n.value || 'Note') + '</span></div>' +
                   (n.detail ? '<div class="cg-note-body">' + esc(n.detail) + '</div>' : '') +
                   (n.ai ? '<span class="cg-node-ai" data-byte data-byte-static title="Added by Intelbyte AI"></span>' : '');
        }
        var sub = '<span class="cg-node-type">' + esc(nodeKind(n)) + '</span>';
        if (n.detail && n.detail !== n.value) sub += '<span class="cg-node-sep"></span><span class="cg-node-detail">' + esc(n.detail) + '</span>';
        return '<div class="cg-node-ic">' + nodeIcon(n) + '</div>' +
               '<div class="cg-node-txt">' +
                   '<div class="cg-node-val">' + esc(n.value || meta.label) + '</div>' +
                   '<div class="cg-node-sub">' + sub + '</div>' +
               '</div>' +
               (n.flag ? '<span class="cg-node-flag">' + esc(n.flag) + '</span>' : '') +
               (n.ai ? '<span class="cg-node-ai" data-byte data-byte-static title="Added by Intelbyte AI"></span>' : '');
    }
    // A grouped stack: same footprint as a normal card so Arrange/placement still fit.
    function groupCardHtml(g) {
        var flagged = g.members.filter(function (m) { return m.status === 'risk' || m.status === 'caution'; }).length;
        var preview = g.members.slice(0, 3).map(function (m) { return m.value; }).join(' · ') + (g.members.length > 3 ? ' …' : '');
        return '<div class="cg-node-ic">' + iconHtml(typeMeta(g.type).icon) + '</div>' +
               '<div class="cg-node-txt">' +
                   '<div class="cg-node-val">' + esc(pluralKind(g.type, g.members.length)) + '<span class="cg-group-n">' + g.members.length + '</span></div>' +
                   '<div class="cg-node-sub"><span class="cg-node-detail">' + esc(preview) + '</span></div>' +
               '</div>' +
               (flagged ? '<span class="cg-node-flag">' + flagged + ' flagged</span>' : '');
    }
    // The ring around the subject shows the board's risk balance at a glance.
    function riskRing(nodes) {
        var tot = nodes.filter(function (n) { return n.type !== 'note'; }).length;
        if (!tot) return 'conic-gradient(rgba(255,255,255,0.16) 0 360deg)';
        var cnt = { risk: 0, caution: 0, clear: 0 };
        nodes.forEach(function (n) { if (cnt[n.status] != null) cnt[n.status]++; });
        var a = cnt.risk / tot * 360, b = a + cnt.caution / tot * 360, c = b + cnt.clear / tot * 360;
        return 'conic-gradient(from -90deg, var(--cg-risk) 0 ' + a + 'deg, var(--cg-caution) ' + a + 'deg ' + b + 'deg, var(--cg-clear) ' + b + 'deg ' + c + 'deg, rgba(255,255,255,0.16) ' + c + 'deg 360deg)';
    }
    function subjectHtml(c, nodes, b) {
        var photo = c.subject && c.subject.photo;
        var name = subjectName(c);
        var flagged = nodes.filter(function (n) { return n.status === 'risk' || n.status === 'caution'; }).length;
        var meta = nodes.length + ' entit' + (nodes.length === 1 ? 'y' : 'ies') + (flagged ? ' · ' + flagged + ' flagged' : '');
        return '<div class="cg-subject-orb">' +
                   (photo ? '<img src="' + esc(photo) + '" alt="" onerror="this.remove()">' : '') +
                   '<span>' + esc(initials(name)) + '</span>' +
               '</div>' +
               '<div class="cg-subject-label"><div class="cg-subject-name">' + esc(name) + '</div><div class="cg-subject-meta">' + esc(meta) + '</div></div>';
    }

    // Classes the board toggles on live cards (animations, drag, selection) survive a re-render.
    var LIVE_CLASSES = ['cg-enter', 'cg-pulse', 'is-dragging', 'is-selected', 'is-link-src'];
    function setClass(el, cls) {
        var keep = LIVE_CLASSES.filter(function (k) { return el.classList.contains(k); });
        var next = keep.length ? cls + ' ' + keep.join(' ') : cls;
        if (el.className !== next) el.className = next;
    }
    function setHtml(el, html) {
        if (el._cgHtml === html) return;
        el.innerHTML = html;
        el._cgHtml = html;
    }

    function render() {
        var c = getCase(); if (!c) return;
        var layer = $('cfpBoardLayer'); if (!layer) return;
        var b = getBoard(c);
        curBoard = b;
        if (!b.pos.__hub) b.pos.__hub = { x: 520, y: 220 };
        var nodes = nodeList(c);

        // Keyed: reuse the cards already on screen and only touch what changed. Rebuilding
        // every card on each change (the AI replays dozens per turn) cut the running
        // enter/pulse animations short and re-laid out the whole board every step.
        var prev = {};
        Array.prototype.slice.call(layer.querySelectorAll('.cg-node:not(.cg-flying), .cg-subject')).forEach(function (e) {
            var nid = e.dataset.nid;
            if (nid && !prev[nid]) prev[nid] = e; else e.remove();
        });
        elMap = {};
        function take(id) {
            var el = prev[id];
            if (el) { delete prev[id]; return el; }
            el = document.createElement('div');
            el.dataset.nid = id;
            layer.appendChild(el);
            return el;
        }
        function place(el, p) {
            var l = p.x + 'px', t = p.y + 'px';
            if (el.style.left !== l) el.style.left = l;
            if (el.style.top !== t) el.style.top = t;
        }

        var hub = take('__hub');
        setClass(hub, 'cg-subject');
        place(hub, b.pos.__hub);
        var ring = riskRing(nodes);
        if (hub._cgRing !== ring) { hub.style.setProperty('--cg-ring', ring); hub._cgRing = ring; }
        setHtml(hub, subjectHtml(c, nodes, b));
        elMap.__hub = hub;

        var grp = computeGroups(nodes, b);
        groupOf = grp.byMember;
        groupList = grp.list;
        var freshGroup = {};

        var missing = [];
        nodes.forEach(function (n) {
            if (groupOf[n.id]) return;   // drawn inside its group card
            var d = take(n.id);
            setClass(d, 'cg-node cg-t-' + n.type + (n.type === 'note' ? ' cg-note' : '') + (n.status !== 'none' ? ' is-' + n.status : ''));
            setHtml(d, cardHtml(n));
            var p = b.pos[n.id];
            if (p) place(d, p); else missing.push(n);
            elMap[n.id] = d;
        });
        groupList.forEach(function (g) {
            if (!prev[g.gid]) freshGroup[g.gid] = 1;
            var d = take(g.gid);
            var w = worstStatus(g.members);
            setClass(d, 'cg-node cg-group cg-t-' + g.type + (w !== 'none' ? ' is-' + w : ''));
            setHtml(d, groupCardHtml(g));
            if (!b.pos[g.gid]) {
                // take over the spot of one of its cards (already a free place on the board)
                var spot = null;
                g.members.some(function (m) { spot = b.pos[m.id] || null; return !!spot; });
                b.pos[g.gid] = spot ? { x: spot.x, y: spot.y } : placeNear(g.parent, g.type);
            }
            place(d, b.pos[g.gid]);
            elMap[g.gid] = d;
        });
        var flyers = [], flyInto = {};
        for (var gone in prev) {
            var gEl = prev[gone], into = groupOf[gone];
            if (into && !isGroupId(gone) && elMap[into] && CAN_ANIM && boardVisible() && gEl.offsetWidth) {
                flyers.push({ el: gEl, gid: into });
                flyInto[into] = 1;
            } else gEl.remove();
        }
        // custom entities without a position yet get a free spot on their side
        if (missing.length) {
            mutate(function (bb) {
                missing.forEach(function (n) {
                    var el = elMap[n.id];
                    var pp = placeNear(null, n.type, el.offsetWidth, el.offsetHeight);
                    bb.pos[n.id] = pp;
                    el.style.left = pp.x + 'px'; el.style.top = pp.y + 'px';
                });
            });
        }
        // drop links whose ends are gone
        var alive = {};
        for (var k in elMap) if (!isGroupId(k)) alive[k] = 1;
        for (var gm in groupOf) alive[gm] = 1;   // grouped cards still exist (just not drawn alone)
        if (b.links.some(function (l) { return !alive[l[0]] || !alive[l[1]]; })) {
            mutate(function (bb) { bb.links = bb.links.filter(function (l) { return alive[l[0]] && alive[l[1]]; }); });
        }

        var animatedGroup = {};
        for (var id in pendingNodeAnim) {
            if (elMap[id]) animateNode(elMap[id], pendingNodeAnim[id]);
            else if (groupOf[id] && elMap[groupOf[id]] && !animatedGroup[groupOf[id]]) {
                // a card that landed inside a group: grow the group in, or pulse it
                animatedGroup[groupOf[id]] = 1;
                // cards flying in pulse the group when they land
                if (freshGroup[groupOf[id]] || !flyInto[groupOf[id]]) animateNode(elMap[groupOf[id]], freshGroup[groupOf[id]] ? 'enter' : 'pulse');
            }
        }
        pendingNodeAnim = {};
        flyers.forEach(function (fl, i) { flyIntoGroup(fl.el, fl.gid, i); });

        drawEdges();
        markSelection();
        try { if (window.IBByte) window.IBByte.mountAll(layer); } catch (e) {}
        var empty = $('cfpBoardEmpty');
        if (empty) empty.style.display = nodes.length ? 'none' : 'flex';
        syncUndoBtn();
    }

    // Keyed like the cards: each link keeps its <path> and label between draws and only its
    // geometry/classes are updated. followEdges() calls this every frame while cards glide,
    // and recreating every line each frame (plus each AI step) is what made it stutter.
    var edgeEls = {};   // edgeKey -> { path, hit, label, d, cls, lcls, text, x, y }
    function dropEdge(k) {
        var r = edgeEls[k];
        if (r) { r.path.remove(); r.hit.remove(); if (r.label) r.label.remove(); }
        delete edgeEls[k];
    }
    function drawEdges() {
        if (!curBoard) return;
        var svg = $('cfpBoardSvg'); var layer = $('cfpBoardLayer');
        if (!svg || !layer) return;
        var selNode = selected && selected.kind === 'node' ? selected.id : (selected && selected.kind === 'group' ? selected.gid : null);
        var selVis = selNode ? visId(selNode) : null;
        var selEdge = selected && selected.kind === 'edge' ? selected.key : null;
        var seen = {};
        // A line drawn to a card inside a group is drawn to the group: carry its pending
        // draw-in animation over to that combined line.
        curBoard.links.forEach(function (l) {
            var ok = edgeKey(l[0], l[1]);
            if (!pendingEdgeAnim[ok]) return;
            var vk = edgeKey(visId(l[0]), visId(l[1]));
            if (vk !== ok) { delete pendingEdgeAnim[ok]; pendingEdgeAnim[vk] = true; }
        });
        curBoard.links.forEach(function (l) {
            var a = visId(l[0]), z = visId(l[1]);
            if (!elMap[a] || !elMap[z] || a === z) return;
            var key = edgeKey(a, z);
            if (seen[key]) return;
            seen[key] = 1;
            var grouped = a !== l[0] || z !== l[1];
            // one clean unlabeled line per group (the group card already says what it holds)
            var info = grouped ? { ai: !!linkInfo(l).ai } : linkInfo(l);
            var e = endpoints(a, z);
            var cv = curve(e[0], e[1]);
            var hot = key === selEdge || a === selVis || z === selVis;
            var r = edgeEls[key];
            if (r && (r.path.parentNode !== svg || (r.label && r.label.parentNode !== layer))) { dropEdge(key); r = null; }
            if (!r) {
                var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                var hit = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                hit.setAttribute('class', 'cg-edge-hit');
                hit.dataset.edge = key;
                path._cgEdge = hit._cgEdge = true;
                svg.appendChild(path);
                svg.appendChild(hit);
                r = edgeEls[key] = { path: path, hit: hit, label: null };
            }
            var cls = 'cg-edge' + (info.suspected ? ' is-suspected' : '') + (hot ? ' is-hot' : '') + (info.ai ? ' is-ai' : '');
            if (r.cls !== cls) { r.path.setAttribute('class', cls); r.cls = cls; }
            if (r.d !== cv.d) { r.path.setAttribute('d', cv.d); r.hit.setAttribute('d', cv.d); r.d = cv.d; }
            if (pendingEdgeAnim[key]) {
                delete pendingEdgeAnim[key];
                animateEdgeDraw(r.path);   // WAAPI: unaffected by reduce-motion CSS overrides
            }
            if (info.label) {
                if (!r.label) {
                    r.label = document.createElement('div');
                    r.label.dataset.edge = key;
                    layer.appendChild(r.label);
                }
                var lcls = 'cg-edge-label' + (hot ? ' is-hot' : '') + (info.suspected ? ' is-suspected' : '');
                if (r.lcls !== lcls) { r.label.className = lcls; r.lcls = lcls; }
                if (r.x !== cv.mid.x) { r.label.style.left = cv.mid.x + 'px'; r.x = cv.mid.x; }
                if (r.y !== cv.mid.y) { r.label.style.top = cv.mid.y + 'px'; r.y = cv.mid.y; }
                if (r.text !== info.label) { r.label.textContent = info.label; r.text = info.label; }
            } else if (r.label) {
                r.label.remove();
                r.label = null; r.lcls = r.text = r.x = r.y = undefined;
            }
        });
        for (var k in edgeEls) if (!seen[k]) dropEdge(k);
        // strays drawn outside this map (none expected) — cheap count check first
        var all = svg.querySelectorAll('.cg-edge, .cg-edge-hit');
        if (all.length !== Object.keys(seen).length * 2) {
            Array.prototype.slice.call(all).forEach(function (p) { if (!p._cgEdge) p.remove(); });
        }
    }
    // Lines follow cards while they animate (arrange) — redraw each frame for `ms`.
    function followEdges(ms) {
        var until = Date.now() + ms;
        (function tick() { drawEdges(); if (Date.now() < until) requestAnimationFrame(tick); })();
    }
    function markSelection() {
        for (var id in elMap) {
            elMap[id].classList.toggle('is-selected', !!(selected && selected.kind === 'node' && selected.id === id));
            elMap[id].classList.toggle('is-link-src', linkSrc === id);
        }
        // a group is "selected" when it's open in the inspector or one of its cards is
        groupList.forEach(function (g) {
            var el = elMap[g.gid]; if (!el) return;
            el.classList.toggle('is-selected', !!(selected && ((selected.kind === 'group' && selected.gid === g.gid) ||
                (selected.kind === 'node' && groupOf[selected.id] === g.gid))));
        });
    }

    /* ── selection + inspector ── */
    function select(sel) {
        selected = sel;
        markSelection();
        drawEdges();
        renderInspector();
    }
    NS.select = function (id) { if (elMap[visId(id)]) { select({ kind: 'node', id: id }); ensureVisible(id); } };
    NS.focus = function (id) {
        var v = visId(id);
        if (!elMap[v]) return;
        select({ kind: 'node', id: id });
        ensureVisible(id);
        animateNode(elMap[v], 'pulse');
    };

    function setInspectorOpen(open) {
        var insp = $('cgInspector');
        var pop = document.querySelector('#caseFolderPopup .case-folder-popup');
        if (insp) insp.classList.toggle('is-open', open);
        if (pop) pop.classList.toggle('cg-insp-open', open);
    }
    function typeOptions(cur) {
        var groups = {};
        Object.keys(TYPES).forEach(function (k) {
            if (k === 'person' || k === 'account') return;
            var g = TYPES[k].group;
            (groups[g] = groups[g] || []).push(k);
        });
        if (cur === 'account' || cur === 'person') (groups.identity = groups.identity || []).unshift(cur);
        return Object.keys(groups).map(function (g) {
            return '<optgroup label="' + GROUP_LABEL[g] + '">' + groups[g].map(function (k) {
                return '<option value="' + k + '"' + (k === cur ? ' selected' : '') + '>' + esc(TYPES[k].label) + '</option>';
            }).join('') + '</optgroup>';
        }).join('');
    }
    function linksOf(id) {
        return (curBoard ? curBoard.links : []).filter(function (l) { return l[0] === id || l[1] === id; });
    }

    function updateNode(id, patch) {
        mutate(function (b) {
            var cn = b.custom.find(function (x) { return x.id === id; });
            if ('type' in patch || 'value' in patch || 'detail' in patch) {
                if (cn) {
                    if ('type' in patch) cn.type = patch.type;
                    if ('value' in patch) cn.label = patch.value;
                    if ('detail' in patch) cn.detail = patch.detail;
                } else {
                    if (!b.types) b.types = {}; if (!b.labels) b.labels = {}; if (!b.details) b.details = {};
                    if ('type' in patch) b.types[id] = patch.type;
                    if ('value' in patch) b.labels[id] = patch.value;
                    if ('detail' in patch) b.details[id] = patch.detail;
                }
            }
            if ('status' in patch || 'flag' in patch || 'note' in patch) {
                var m = b.meta[id] || (b.meta[id] = {});
                if ('status' in patch) m.status = patch.status;
                if ('flag' in patch) m.flag = patch.flag;
                if ('note' in patch) m.note = patch.note;
            }
        });
    }
    function removeNode(id) {
        if (!id || id === '__hub') return;
        pushUndo();
        mutate(function (b) {
            delete b.pos[id];
            delete b.meta[id];
            b.links = b.links.filter(function (l) { return l[0] !== id && l[1] !== id; });
            b.custom = b.custom.filter(function (x) { return x.id !== id; });   // pinned items just leave the board
        });
        if (selected && selected.id === id) selected = null;
        render();
        renderInspector();
        if (typeof showToast === 'function') showToast('Removed — Ctrl+Z to undo');
    }
    function removeEdge(key) {
        pushUndo();
        mutate(function (b) { b.links = b.links.filter(function (l) { return edgeKey(l[0], l[1]) !== key; }); });
        if (selected && selected.key === key) selected = null;
        render();
        renderInspector();
    }

    var EDGE_PRESETS = ['same handle', 'same password', 'recovery email', 'registrant', 'login ip', 'alt account', 'owns', 'mentions'];
    var FLAG_PRESETS = ['Breach', 'Stealer log', 'Reused password', 'Alt account', 'VPN', 'Confirmed'];

    function typeGridHtml(cur) {
        var groups = {};
        Object.keys(TYPES).forEach(function (k) {
            if (k === 'person' || (k === 'account' && cur !== 'account')) return;
            (groups[TYPES[k].group] = groups[TYPES[k].group] || []).push(k);
        });
        return '<div class="cg-type-grid" hidden>' + Object.keys(groups).map(function (g) {
            return '<div class="cg-type-group"><div class="cg-type-glabel">' + GROUP_LABEL[g] + '</div><div class="cg-type-opts">' +
                groups[g].map(function (k) {
                    return '<button type="button" class="cg-type-opt' + (k === cur ? ' is-on' : '') + '" data-node-type="' + k + '">' + iconHtml(TYPES[k].icon) + '<span>' + esc(TYPES[k].label) + '</span></button>';
                }).join('') + '</div></div>';
        }).join('') + '</div>';
    }
    function sheet(head, body, foot) {
        return '<div class="cg-sheet">' + head + '<div class="cg-sheet-body">' + body + '</div>' + (foot ? '<div class="cg-sheet-foot">' + foot + '</div>' : '') + '</div>';
    }
    function closeBtn() { return '<button type="button" class="cg-sheet-x" data-insp="close" aria-label="Close"><i class="fas fa-xmark"></i></button>'; }
    function aiBtn(label, kind) {
        return '<button type="button" class="cg-sheet-ai" data-insp="' + kind + '"><span class="cg-sheet-ai-byte" data-byte data-byte-static></span><span>' + esc(label) + '</span></button>';
    }

    function renderInspector() {
        var insp = $('cgInspector');
        if (!insp) return;
        var c = getCase();
        if (!c || !selected) { setInspectorOpen(false); insp.innerHTML = ''; return; }
        var b = getBoard(c);
        var html = '';
        if (selected.kind === 'group') {
            var g = groupById(selected.gid);
            if (!g) { selected = null; setInspectorOpen(false); insp.innerHTML = ''; return; }
            var parentName = !g.parent ? '' : g.parent === '__hub' ? subjectName(c) : ((nodeById(c, g.parent) || {}).value || '');
            var gw = worstStatus(g.members);
            var rows = g.members.map(function (m) {
                var src = (m.detail && m.detail !== m.value) ? '<span class="cg-conn-lab">' + esc(m.detail) + '</span>' : '';
                return '<button type="button" class="cg-conn cg-grp-row' + (m.status !== 'none' ? ' is-' + m.status : '') + '" data-pick-node="' + esc(m.id) + '">' +
                       '<span class="cg-conn-ic">' + nodeIcon(m) + '</span><span class="cg-conn-val">' + esc(m.value) + '</span>' + src + '</button>';
            }).join('');
            insp.innerHTML = sheet(
                '<div class="cg-sheet-head">' +
                    '<div class="cg-sheet-ic' + (gw !== 'none' ? ' is-' + gw : '') + '">' + iconHtml(typeMeta(g.type).icon) + '</div>' +
                    '<div class="cg-sheet-title"><div class="cg-grp-title">' + esc(pluralKind(g.type, g.members.length)) + '</div>' +
                    '<div class="cg-sheet-kind">' + g.members.length + (g.parent ? ' linked only to ' + esc(parentName) : ' not linked to anything yet') + '</div></div>' + closeBtn() +
                '</div>',
                '<div class="cg-sec"><div class="cg-sec-label">Grouped<em>' + g.members.length + '</em></div><div class="cg-conns cg-grp-list">' + rows + '</div></div>',
                ''
            );
            try { if (window.IBByte) window.IBByte.mountAll(insp); } catch (e) {}
            setInspectorOpen(true);
            return;
        }
        if (selected.kind === 'edge') {
            var l = b.links.find(function (x) { return edgeKey(x[0], x[1]) === selected.key; });
            if (!l) { selected = null; setInspectorOpen(false); return; }
            var info = linkInfo(l);
            var A = l[0] === '__hub' ? { value: subjectName(c), type: 'person', detail: '' } : nodeById(c, l[0]);
            var B = l[1] === '__hub' ? { value: subjectName(c), type: 'person', detail: '' } : nodeById(c, l[1]);
            html = sheet(
                '<div class="cg-sheet-head cg-sheet-head--edge">' +
                    '<div class="cg-edge-ends">' +
                        '<span class="cg-edge-end">' + (A ? nodeIcon(A) : '') + '<b>' + esc(A ? A.value : '?') + '</b></span>' +
                        '<span class="cg-edge-arrow"><i class="fas fa-arrow-down-long"></i></span>' +
                        '<span class="cg-edge-end">' + (B ? nodeIcon(B) : '') + '<b>' + esc(B ? B.value : '?') + '</b></span>' +
                    '</div>' + closeBtn() +
                '</div>',
                (info.ai && (info.reason || info.confidence != null)
                    ? '<div class="cg-sec cg-ai-why"><div class="cg-sec-label">Why Intelbyte AI linked them' + (info.confidence != null ? '<em>~' + info.confidence + '% sure</em>' : '') + '</div>' +
                      (info.reason ? '<div class="cg-ai-why-txt">' + esc(info.reason) + '</div>' : '') + '</div>'
                    : '') +
                '<div class="cg-sec"><div class="cg-sec-label">How are they connected?' + (info.ai ? '<em>linked by Intelbyte AI</em>' : '') + '</div>' +
                    '<input type="text" class="cg-input" data-edge-field="label" maxlength="40" placeholder="Describe the relationship" value="' + esc(info.label || '') + '">' +
                    '<div class="cg-chips">' + EDGE_PRESETS.map(function (pz) {
                        return '<button type="button" class="cg-chip' + (info.label === pz ? ' is-on' : '') + '" data-edge-preset="' + esc(pz) + '">' + esc(pz) + '</button>';
                    }).join('') + '</div></div>' +
                '<div class="cg-sec"><div class="cg-sec-label">Confidence</div><div class="cg-chips">' +
                    '<button type="button" class="cg-chip cg-chip--solid' + (!info.suspected ? ' is-on' : '') + '" data-edge-conf="0"><i class="cg-line-ic"></i>Confirmed</button>' +
                    '<button type="button" class="cg-chip cg-chip--dashed' + (info.suspected ? ' is-on' : '') + '" data-edge-conf="1"><i class="cg-line-ic"></i>Suspected</button>' +
                '</div></div>',
                '<span class="cg-sheet-spacer"></span><button type="button" class="cg-icon-btn cg-icon-btn--danger" data-insp="unlink" title="Remove link"><i class="fas fa-link-slash"></i></button>'
            );
        } else if (selected.id === '__hub') {
            var nodes = nodeList(c);
            var byType = {};
            nodes.forEach(function (n) { byType[n.type] = (byType[n.type] || 0) + 1; });
            var risk = nodes.filter(function (n) { return n.status === 'risk'; }).length;
            var caution = nodes.filter(function (n) { return n.status === 'caution'; }).length;
            var photo = c.subject && c.subject.photo;
            html = sheet(
                '<div class="cg-sheet-head">' +
                    '<label class="cg-sheet-av is-editable" title="Change photo">' + (photo ? '<img src="' + esc(photo) + '" alt="" onerror="this.remove()">' : '') + '<span>' + esc(initials(subjectName(c))) + '</span>' +
                        '<i class="cg-av-cam fas fa-camera"></i><input type="file" accept="image/*" data-subj-upload hidden></label>' +
                    '<div class="cg-sheet-title"><input class="cg-sheet-value" data-subj-field="alias" maxlength="80" placeholder="Name the subject" value="' + esc((c.subject && c.subject.alias) || '') + '">' +
                    '<div class="cg-sheet-kind">Subject of ' + esc(c.title || 'this case') + '</div></div>' + closeBtn() +
                '</div>',
                '<div class="cg-stats">' +
                    '<div><b>' + nodes.length + '</b><span>entities</span></div>' +
                    '<div><b>' + b.links.length + '</b><span>links</span></div>' +
                    '<div class="is-risk"><b>' + risk + '</b><span>at risk</span></div>' +
                    '<div class="is-caution"><b>' + caution + '</b><span>caution</span></div>' +
                '</div>' +
                (nodes.length ? '<div class="cg-sec"><div class="cg-sec-label">On the board</div><div class="cg-chips">' + Object.keys(byType).map(function (t) {
                    return '<span class="cg-chip cg-chip--static">' + iconHtml(typeMeta(t).icon) + esc(typeMeta(t).label) + '<b>' + byType[t] + '</b></span>';
                }).join('') + '</div></div>' : '') +
                '<div class="cg-sec"><div class="cg-sec-label">Photo</div><div class="cg-photo-row">' +
                    '<label class="cg-photo-btn"><i class="fas fa-arrow-up-from-bracket"></i>Upload<input type="file" accept="image/*" data-subj-upload hidden></label>' +
                    '<input type="text" class="cg-input" data-subj-field="photo" maxlength="2000" placeholder="or paste an image URL" value="' + esc(photo && String(photo).indexOf('data:') !== 0 ? photo : '') + '">' +
                    (photo ? '<button type="button" class="cg-icon-btn cg-icon-btn--danger" data-insp="photo-clear" title="Remove photo"><i class="fas fa-xmark"></i></button>' : '') +
                '</div></div>',
                aiBtn('Map this case with AI', 'ai-map')
            );
        } else {
            var n = nodeById(c, selected.id);
            if (!n) { selected = null; setInspectorOpen(false); return; }
            var meta = typeMeta(n.type);
            var isNote = n.type === 'note';
            var lk = linksOf(n.id);
            var conn = lk.map(function (l) {
                var other = l[0] === n.id ? l[1] : l[0];
                var o = other === '__hub' ? { value: subjectName(c), type: 'person', detail: '' } : nodeById(c, other);
                if (!o) return '';
                var info = linkInfo(l);
                return '<button type="button" class="cg-conn' + (info.suspected ? ' is-suspected' : '') + '" data-select-edge="' + esc(edgeKey(l[0], l[1])) + '">' +
                       '<span class="cg-conn-ic">' + nodeIcon(o) + '</span><span class="cg-conn-val">' + esc(o.value) + '</span>' +
                       '<span class="cg-conn-lab">' + esc(info.label || 'linked') + '</span></button>';
            }).join('');
            var preset = FLAG_PRESETS.indexOf(n.flag) !== -1;
            html = sheet(
                '<div class="cg-sheet-head">' +
                    '<div class="cg-sheet-ic' + (n.status !== 'none' ? ' is-' + n.status : '') + '">' + nodeIcon(n) + '</div>' +
                    '<div class="cg-sheet-title">' +
                        '<input class="cg-sheet-value" data-node-field="value" maxlength="140" placeholder="' + (isNote ? 'Title' : 'Value') + '" value="' + esc(n.value) + '">' +
                        '<button type="button" class="cg-sheet-kind cg-sheet-kind--btn" data-insp="types">' + esc(nodeKind(n)) + (n.ai ? ' · by AI' + (n.confidence != null ? ' · ~' + n.confidence + '%' : '') : '') + '<i class="fas fa-chevron-down"></i></button>' +
                    '</div>' + closeBtn() +
                '</div>' + typeGridHtml(n.type),
                (isNote
                    ? '<div class="cg-sec"><div class="cg-sec-label">Note</div><textarea class="cg-input" data-node-field="detail" rows="5" placeholder="What did you notice?">' + esc(n.detail) + '</textarea></div>'
                    : '<div class="cg-sec"><div class="cg-sec-label">Status</div><div class="cg-status">' + STATUSES.map(function (st) {
                          return '<button type="button" class="cg-st cg-st--' + st.key + (n.status === st.key ? ' is-on' : '') + '" data-node-status="' + st.key + '"><i></i>' + st.label + '</button>';
                      }).join('') + '</div></div>' +
                      '<div class="cg-sec"><div class="cg-sec-label">Flag</div><div class="cg-chips">' + FLAG_PRESETS.map(function (f) {
                          return '<button type="button" class="cg-chip cg-chip--flag' + (n.flag === f ? ' is-on' : '') + '" data-node-flag="' + esc(f) + '">' + esc(f) + '</button>';
                      }).join('') +
                      '<input type="text" class="cg-chip-input" data-node-field="flag" maxlength="32" placeholder="+ custom" value="' + esc(preset ? '' : n.flag) + '"></div></div>' +
                      '<div class="cg-sec"><div class="cg-sec-label">Source</div><input type="text" class="cg-input" data-node-field="detail" maxlength="140" placeholder="Where it came from" value="' + esc(n.detail) + '"></div>' +
                      '<div class="cg-sec"><div class="cg-sec-label">Notes</div><textarea class="cg-input" data-node-field="note" rows="3" placeholder="Why it matters">' + esc(n.note) + '</textarea></div>') +
                (conn ? '<div class="cg-sec"><div class="cg-sec-label">Connections<em>' + lk.length + '</em></div><div class="cg-conns">' + conn + '</div></div>' : ''),
                (n.pc
                    ? '<button type="button" class="cg-sheet-ai cg-sheet-ai--pc" data-insp="open-pc"><i class="fas fa-desktop"></i><span>Open infected PC</span></button>'
                    : SEARCHABLE[n.type] && !isNote ? aiBtn('Investigate with AI', 'ai-search') : '<span class="cg-sheet-spacer"></span>') +
                (n.kind === 'item' ? '<button type="button" class="cg-icon-btn" data-insp="open-item" title="Open the saved item"><i class="fas fa-file-lines"></i></button>' : '') +
                '<button type="button" class="cg-icon-btn cg-icon-btn--danger" data-insp="delete" title="' + (n.kind === 'item' ? 'Unpin from the board' : 'Delete entity') + '"><i class="fas fa-trash"></i></button>'
            );
        }
        insp.innerHTML = html;
        try { if (window.IBByte) window.IBByte.mountAll(insp); } catch (e) {}
        setInspectorOpen(true);
    }

    /* ── infected PC: the node opens the same Machine View the Search tab shows ──
       The payload is only metadata (file listing, victim info) — the actual files
       lazy-load from the server on click, free. So we keep it in IndexedDB (not
       localStorage, which the cases themselves fill): it survives a reload, and a PC
       the analyst already paid to open reopens for free. In-memory pcStore fronts it. */
    var pcStore = {};
    var PC_DB = null, PC_DB_TRIED = false;
    function pcDbOpen() {
        return new Promise(function (resolve) {
            if (PC_DB) return resolve(PC_DB);
            if (PC_DB_TRIED) return resolve(null);
            try {
                if (!window.indexedDB) { PC_DB_TRIED = true; return resolve(null); }
                var rq = indexedDB.open('intelbyte_pc_v1.html', 1);
                rq.onupgradeneeded = function () { try { rq.result.createObjectStore('pc'); } catch (e) {} };
                rq.onsuccess = function () { PC_DB = rq.result; PC_DB_TRIED = true; resolve(PC_DB); };
                rq.onerror = function () { PC_DB_TRIED = true; resolve(null); };
            } catch (e) { PC_DB_TRIED = true; resolve(null); }
        });
    }
    function pcDbPut(keys, data) {
        pcDbOpen().then(function (db) {
            if (!db) return;
            try {
                var st = db.transaction('pc', 'readwrite').objectStore('pc');
                keys.forEach(function (k) { if (k) { try { st.put(data, String(k)); } catch (e) {} } });
            } catch (e) {}
        });
    }
    // Try each key in turn against IndexedDB; resolve the first stored payload (or null).
    function pcDbGet(keys) {
        return pcDbOpen().then(function (db) {
            var list = (keys || []).filter(Boolean).map(String);
            if (!db || !list.length) return null;
            return new Promise(function (resolve) {
                var st;
                try { st = db.transaction('pc', 'readonly').objectStore('pc'); }
                catch (e) { return resolve(null); }
                var i = 0;
                (function next() {
                    if (i >= list.length) return resolve(null);
                    var r = st.get(list[i++]);
                    r.onsuccess = function () { if (r.result) resolve(r.result); else next(); };
                    r.onerror = function () { next(); };
                })();
            });
        });
    }
    function pcKeys(panelData) {
        var m = (panelData.result && panelData.result.machine) || panelData.result || {};
        return [m.primaryLogId, panelData.queryValue]
            .concat((m.logs || []).map(function (l) { return l && (l.logId || (l.victim && l.victim.log_id)); }))
            .filter(Boolean).map(String);
    }
    NS.keepPc = function (panelData) {
        if (!panelData || !panelData.result) return;
        var keys = pcKeys(panelData);
        if (!keys.length) return;
        keys.forEach(function (k) { pcStore[k] = panelData; });
        pcDbPut(keys, panelData);   // persist so it reopens after a reload (files reload free)
    };
    function pcData(pc) {
        if (!pc) return null;
        return pcStore[String(pc.logId || '')] || pcStore[String(pc.query || '')] || null;
    }
    // For Intelbyte AI: the few files of each infected PC on this board that tell which sites
    // are on it (saved logins, cookies, history) — ids only, from the stored Machine View
    // payload. The server reads them (free, like opening them here) when the AI looks inside.
    function siteFiles(panelData, logId) {
        var m = (panelData && panelData.result && panelData.result.machine) || {};
        var logs = Array.isArray(m.logs) ? m.logs : [];
        var log = logs.find(function (l) { return l && String(l.logId || (l.victim && l.victim.log_id) || '') === String(logId); }) || null;
        var tree = log && log.manifest && !log.manifest.error ? log.manifest.victimTree
            : (String(m.primaryLogId || '') === String(logId) && m.manifest && !m.manifest.error ? m.manifest.victimTree : null);
        var out = [];
        (function walk(node, path) {
            if (!node || out.length >= 40) return;
            var p = path ? path + '/' + (node.name || '') : (node.name || '');
            if (node.type === 'file') {
                var lp = p.toLowerCase(), base = lp.split('/').pop() || '';
                if (node.id && (base.indexOf('.') < 0 || /\.(txt|json|csv|tsv|log)$/.test(base)) && /cookie|histor|passw|login|credential/.test(lp) && !/autofill|card|wallet/.test(lp)) {
                    out.push({ id: String(node.id).slice(0, 220), path: p.slice(-200), size: Number(node.size_bytes) || 0 });
                }
                return;
            }
            (node.children || []).forEach(function (ch) { walk(ch, p); });
        })(tree, '');
        return out;
    }
    NS.pcFiles = function () {
        var c = getCase(); if (!c) return Promise.resolve([]);
        var pcs = nodeList(c).filter(function (n) { return n.pc && n.pc.logId; }).slice(0, 3);
        return Promise.all(pcs.map(function (n) {
            var mem = pcData(n.pc);
            return (mem ? Promise.resolve(mem) : pcDbGet([n.pc.logId, n.pc.query])).then(function (pd) {
                var files = pd ? siteFiles(pd, n.pc.logId) : [];
                return files.length ? { logId: String(n.pc.logId).slice(0, 120), files: files } : null;
            }, function () { return null; });
        })).then(function (list) { return list.filter(Boolean); });
    };
    function closePc() {
        var ov = $('cgPcOverlay');
        if (ov) ov.remove();
        document.removeEventListener('keydown', pcEsc, true);
    }
    function pcEsc(e) {
        if (!$('cgPcOverlay')) { document.removeEventListener('keydown', pcEsc, true); return; }   // never swallow Escape once it's gone
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closePc(); }
    }
    function openPc(id) {
        var c = getCase();
        var n = c && nodeById(c, id);
        if (!n || !n.pc) return;
        var d = pcData(n.pc);
        if (d) { pcRender(n, d); return; }
        // Memory miss (fresh tab after a reload): pull the saved payload from IndexedDB.
        pcDbGet([n.pc.logId, n.pc.query]).then(function (stored) {
            if (!stored) {
                if (typeof showToast === 'function') showToast('These PC files could not be found — run the lookup again to reopen them');
                return;
            }
            NS.keepPc(stored);   // refill memory so the next open is instant
            pcRender(n, stored);
        });
    }
    function pcRender(n, d) {
        var host = document.querySelector('#caseFolderPopup .case-folder-popup');
        if (!host) return;
        closePc();
        var ov = document.createElement('div');
        ov.id = 'cgPcOverlay';
        ov.className = 'cg-pc-ov';
        ov.innerHTML =
            '<div class="cg-pc-head">' +
                '<span class="cg-pc-ic"><i class="fas fa-desktop"></i></span>' +
                '<div class="cg-pc-title"><div class="cg-pc-name">' + esc(n.value) + '</div>' +
                '<div class="cg-pc-sub">' + esc(n.detail || 'Infected PC') + '</div></div>' +
                '<button type="button" class="cg-sheet-x" data-pc="close" aria-label="Close"><i class="fas fa-xmark"></i></button>' +
            '</div><div class="cg-pc-body" id="cgPcBody"></div>';
        host.appendChild(ov);
        ov.addEventListener('click', function (e) {
            if (e.target === ov || (e.target.closest && e.target.closest('[data-pc="close"]'))) closePc();
        });
        document.addEventListener('keydown', pcEsc, true);
        try {
            // Open just THIS PC. A machine result can carry several logs; rendering all
            // of them stacks every PC "sıra sıra", so scope to this node's logId.
            var result = d.result;
            var wantLog = (n.pc && n.pc.logId) ? String(n.pc.logId) : '';
            var mach = result && result.machine;
            if (wantLog && mach && Array.isArray(mach.logs) && mach.logs.length > 1) {
                var one = mach.logs.filter(function (l) {
                    return l && (String(l.logId) === wantLog || (l.victim && String(l.victim.log_id) === wantLog));
                });
                if (one.length) {
                    result = Object.assign({}, result, {
                        machine: Object.assign({}, mach, { logs: one, logCount: one.length, primaryLogId: wantLog })
                    });
                }
            }
            window.renderMachine(result, d.queryValue || n.value, $('cgPcBody'));
        } catch (err) {
            $('cgPcBody').innerHTML = '<div class="cg-pc-empty">Could not open this PC.</div>';
        }
    }

    function askAI(text) {
        if (window.intelBoardAI && typeof window.intelBoardAI.ask === 'function') window.intelBoardAI.ask(text);
    }

    /* ── subject photo: upload (resized like the case wizard) or URL ── */
    function paintHeaderPhoto(photo) {
        var ico = document.querySelector('#caseFolderPopup .cfp-header-icon');
        if (!ico) return;
        ico.innerHTML = photo
            ? '<img src="' + esc(photo) + '" alt="" onerror="this.parentNode.innerHTML=\'<i class=&quot;fas fa-folder-open&quot;></i>\'">'
            : '<i class="fas fa-folder-open"></i>';
        ico.classList.toggle('has-photo', !!photo);
    }
    function setSubjectPhoto(photo, typing) {
        var prev = (getCase() || {}).subject;
        prev = prev && prev.photo;
        try {
            mutate(function (b, c) {
                if (!c.subject || typeof c.subject !== 'object') c.subject = { alias: '', photo: '', identifiers: [] };
                c.subject.photo = photo;
            });
        } catch (e) {
            if (typeof showToast === 'function') showToast('Could not save the photo — storage is full');
            return;
        }
        var saved = ((getCase() || {}).subject || {}).photo;
        if (photo && saved !== photo) {   // the save was refused (storage full)
            if (typeof showToast === 'function') showToast('Could not save the photo — storage is full');
            return;
        }
        render();
        paintHeaderPhoto(photo);
        if (typing) {   // keep the URL field focused: only repaint the avatar
            var av = document.querySelector('#cgInspector .cg-sheet-av');
            if (av) {
                var old = av.querySelector('img'); if (old) old.remove();
                if (photo) { var im = document.createElement('img'); im.alt = ''; im.onerror = function () { im.remove(); }; im.src = photo; av.insertBefore(im, av.firstChild); }
            }
        } else {
            renderInspector();
        }
        if (!typing && (photo || prev) && typeof showToast === 'function') showToast(photo ? 'Photo updated' : 'Photo removed');
    }
    function readPhotoFile(file) {
        if (!file || !/^image\//.test(file.type)) { if (typeof showToast === 'function') showToast('Pick an image file'); return; }
        var r = new FileReader();
        r.onload = function (e) {
            var img = new Image();
            img.onload = function () {
                var max = 384;
                var sc = Math.min(1, max / Math.max(img.width, img.height));
                var cv = document.createElement('canvas');
                cv.width = Math.max(1, Math.round(img.width * sc));
                cv.height = Math.max(1, Math.round(img.height * sc));
                cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
                var url = '';
                try { url = cv.toDataURL('image/jpeg', 0.82); } catch (err) {}
                if (url) setSubjectPhoto(url);
            };
            img.onerror = function () { if (typeof showToast === 'function') showToast('Could not read that image'); };
            img.src = e.target.result;
        };
        r.readAsDataURL(file);
    }

    var inspTimer = null;
    function bindInspector() {
        var insp = $('cgInspector');
        if (!insp || insp._bound) return;
        insp._bound = true;
        insp.addEventListener('change', function (e) {
            var t = e.target;
            if (!t || !t.hasAttribute || !t.hasAttribute('data-subj-upload')) return;
            readPhotoFile(t.files && t.files[0]);
            t.value = '';
        });
        insp.addEventListener('input', function (e) {
            var t = e.target;
            var f = t.getAttribute('data-node-field');
            var ef = t.getAttribute('data-edge-field');
            var sf = t.getAttribute('data-subj-field');
            if (!f && !ef && !sf) return;
            clearTimeout(inspTimer);
            inspTimer = setTimeout(function () {
                if (f && selected && selected.kind === 'node') {
                    var patch = {}; patch[f] = t.value;
                    updateNode(selected.id, patch);
                    if (f === 'flag') insp.querySelectorAll('[data-node-flag]').forEach(function (x) { x.classList.toggle('is-on', x.getAttribute('data-node-flag') === t.value); });
                    if (f === 'value' || f === 'detail') {   // brand icon follows what you type (roblox.com → Roblox)
                        var nn = nodeById(getCase(), selected.id);
                        var ic = insp.querySelector('.cg-sheet-ic');
                        var kb = insp.querySelector('.cg-sheet-kind--btn');
                        if (nn && ic) ic.innerHTML = nodeIcon(nn);
                        if (nn && kb) kb.firstChild.textContent = nodeKind(nn) + (nn.ai ? ' · by AI' : '');
                    }
                } else if (ef && selected && selected.kind === 'edge') {
                    mutate(function (b) {
                        var l = b.links.find(function (x) { return edgeKey(x[0], x[1]) === selected.key; });
                        if (l) { if (!l[2] || typeof l[2] !== 'object') l[2] = {}; l[2].label = t.value.trim().toLowerCase(); }
                    });
                    insp.querySelectorAll('[data-edge-preset]').forEach(function (x) { x.classList.toggle('is-on', x.getAttribute('data-edge-preset') === t.value.trim().toLowerCase()); });
                } else if (sf === 'photo') {
                    setSubjectPhoto(t.value.trim(), true);
                    return;
                } else if (sf) {
                    mutate(function (b, c) {
                        if (!c.subject || typeof c.subject !== 'object') c.subject = { alias: '', photo: '', identifiers: [] };
                        c.subject[sf] = t.value.trim();
                    });
                }
                render();
            }, 200);
        });
        insp.addEventListener('click', function (e) {
            var t = e.target.closest ? e.target : null; if (!t) return;
            var sel = selected;
            var ty = t.closest('[data-node-type]');
            if (ty && sel && sel.kind === 'node') { updateNode(sel.id, { type: ty.getAttribute('data-node-type') }); render(); renderInspector(); return; }
            var st = t.closest('[data-node-status]');
            if (st && sel && sel.kind === 'node') {
                var sid = sel.id;
                updateNode(sid, { status: st.getAttribute('data-node-status') });
                mutate(function (b) { (b.meta[sid] = b.meta[sid] || {}).userStatus = true; });   // analyst's call wins over the PC→risk rule
                render(); renderInspector(); return;
            }
            var fl = t.closest('[data-node-flag]');
            if (fl && sel && sel.kind === 'node') {
                var cur = (nodeById(getCase(), sel.id) || {}).flag;
                var v = fl.getAttribute('data-node-flag');
                updateNode(sel.id, { flag: cur === v ? '' : v });
                render(); renderInspector(); return;
            }
            var ep = t.closest('[data-edge-preset]');
            if (ep && sel && sel.kind === 'edge') {
                var lab = ep.getAttribute('data-edge-preset');
                mutate(function (b) {
                    var l = b.links.find(function (x) { return edgeKey(x[0], x[1]) === sel.key; });
                    if (l) { if (!l[2] || typeof l[2] !== 'object') l[2] = {}; l[2].label = lab; }
                });
                render(); renderInspector(); return;
            }
            var conf = t.closest('[data-edge-conf]');
            if (conf && sel && sel.kind === 'edge') {
                mutate(function (b) {
                    var l = b.links.find(function (x) { return edgeKey(x[0], x[1]) === sel.key; });
                    if (l) { if (!l[2] || typeof l[2] !== 'object') l[2] = {}; l[2].suspected = conf.getAttribute('data-edge-conf') === '1'; }
                });
                render(); renderInspector(); return;
            }
            var pk = t.closest('[data-pick-node]');   // a row in a group's list → that card's sheet
            if (pk) { select({ kind: 'node', id: pk.getAttribute('data-pick-node') }); return; }
            var se = t.closest('[data-select-edge]');
            if (se) { select({ kind: 'edge', key: se.getAttribute('data-select-edge') }); return; }
            var act = t.closest('[data-insp]');
            if (!act) return;
            var a = act.getAttribute('data-insp');
            if (a === 'close') select(null);
            else if (a === 'photo-clear') setSubjectPhoto('');
            else if (a === 'open-pc' && sel) openPc(sel.id);
            else if (a === 'types') { var g = insp.querySelector('.cg-type-grid'); if (g) { g.hidden = !g.hidden; act.classList.toggle('is-open', !g.hidden); } }
            else if (a === 'delete' && sel) removeNode(sel.id);
            else if (a === 'unlink' && sel) removeEdge(sel.key);
            else if (a === 'open-item' && sel && typeof openCaseItemPopup === 'function') openCaseItemPopup(sel.id);
            else if (a === 'ai-search' && sel) {
                var n = nodeById(getCase(), sel.id);
                if (n) askAI('Search ' + nodeKind(n).toLowerCase() + ' "' + n.value + '" in IntelByte and map what you find on the board.');
            } else if (a === 'ai-map') askAI('Map this case: look at everything on the board and in the evidence, connect what belongs together and flag what looks risky.');
        });
    }

    /* ── show / hide ── */
    NS.show = function (view) {
        var split = document.querySelector('#caseFolderPopup .cfp-split');
        var wrap = $('cfpBoardWrap');
        var bi = $('cfpViewItems'), bb = $('cfpViewBoard');
        if (view === 'board') {
            curId = activeId();
            setConnect(false);
            if (split) split.style.display = 'none';
            if (wrap) wrap.style.display = 'flex';
            if (bi) bi.classList.remove('active'); if (bb) bb.classList.add('active');
            bindInspector();
            var first = curId !== lastFitId;
            if (first) { selected = null; renderInspector(); }
            render();
            if (first) {
                lastFitId = curId;
                var c = getCase();
                if (c) { try { fixPcRisk(c); linkOrphansFromFindings(getCase()); render(); c = getCase(); } catch (e) {} }
                // Boards from the circle era (or fresh from the wizard) were never laid out
                // for cards: tidy them once, around the subject. Ctrl+Z restores the old layout.
                if (c && !getBoard(c).v) {
                    var hasNodes = nodeList(c).length > 0;
                    mutate(function (b) { b.v = 2; });
                    if (hasNodes) { requestAnimationFrame(function () { NS.arrange(); }); return; }
                }
                requestAnimationFrame(function () { NS.fit(); });
            }
        } else {
            setInspectorOpen(false);
            if (split) split.style.display = '';
            if (wrap) wrap.style.display = 'none';
            if (bi) bi.classList.add('active'); if (bb) bb.classList.remove('active');
        }
    };
    NS.refresh = function () { if (boardVisible()) { curId = activeId(); render(); renderInspector(); } };

    /* ── link mode ── */
    function setConnect(on) {
        connectMode = !!on; linkSrc = null;
        var btn = $('cfpConnectBtn'); if (btn) btn.classList.toggle('active', connectMode);
        var canvas = $('cfpBoardCanvas'); if (canvas) canvas.classList.toggle('cfp-connecting', connectMode);
        var hint = $('cfpBoardHint');
        if (hint) { hint.textContent = connectMode ? 'Pick the first entity, then the second' : ''; hint.classList.toggle('is-on', connectMode); }
        markSelection();
    }
    NS.toggleConnect = function () { setConnect(!connectMode); };
    NS.isConnecting = function () { return connectMode; };
    function connectClick(nid) {
        if (!linkSrc) { linkSrc = nid; markSelection(); var h = $('cfpBoardHint'); if (h) h.textContent = 'Now pick the entity to link it to'; return; }
        if (linkSrc === nid) { linkSrc = null; markSelection(); return; }
        var a = linkSrc, t = nid, key = edgeKey(a, t);
        var dup = curBoard.links.some(function (l) { return edgeKey(l[0], l[1]) === key; });
        if (!dup) {
            pushUndo();
            mutate(function (b) { b.links.push([a, t, { label: '' }]); });
            pendingEdgeAnim[key] = true;
        }
        setConnect(false);
        render();
        select({ kind: 'edge', key: key });   // name the relationship right away
        setTimeout(function () { var i = document.querySelector('#cgInspector [data-edge-field="label"]'); if (i) i.focus(); }, 30);
    }

    /* ── pointer: drag cards, pan, select ── */
    var mode = null, dragId = null, grabX = 0, grabY = 0, startX = 0, startY = 0, moved = false;
    var panStartX = 0, panStartY = 0, panOrigX = 0, panOrigY = 0;
    // Shared by mouse and touch. Returns true when the press was taken by the board.
    function boardDown(target, x, y) {
        var canvas = $('cfpBoardCanvas');
        if (!canvas || !boardVisible() || !canvas.contains(target)) return false;
        if (target.closest('.cg-dock, .cg-empty-card, .cg-inspector, .cg-hint')) return false;
        var edge = target.closest('[data-edge]');
        var card = target.closest('.cg-node, .cg-subject');
        moved = false;
        if (card) {
            if (connectMode) { if (!isGroupId(card.dataset.nid)) connectClick(card.dataset.nid); return true; }
            var p = curBoard && curBoard.pos[card.dataset.nid];
            if (!p) return false;
            mode = 'node'; dragId = card.dataset.nid;
            startX = p.x; startY = p.y; grabX = x; grabY = y;
            card.classList.add('is-dragging');
            return true;
        }
        if (edge && !connectMode) { select({ kind: 'edge', key: edge.getAttribute('data-edge') }); return true; }
        mode = 'pan'; panStartX = x; panStartY = y; panOrigX = pan.x; panOrigY = pan.y;
        canvas.classList.add('is-panning');
        return true;
    }
    function boardMove(x, y, slop) {
        if (!mode) return;
        if (Math.abs(x - (mode === 'node' ? grabX : panStartX)) + Math.abs(y - (mode === 'node' ? grabY : panStartY)) > slop) moved = true;
        if (mode === 'node') {
            if (!moved) return;   // a finger jitters: don't nudge the card on a tap
            var p = curBoard && curBoard.pos[dragId]; if (!p) return;
            p.x = Math.round(startX + (x - grabX) / zoom);
            p.y = Math.round(startY + (y - grabY) / zoom);
            var el = elMap[dragId]; if (el) { el.style.left = p.x + 'px'; el.style.top = p.y + 'px'; }
            drawEdges();
        } else if (mode === 'pan') {
            pan.x = panOrigX + (x - panStartX); pan.y = panOrigY + (y - panStartY);
            applyPan();
        }
    }
    function boardUp(target, cancelled) {
        if (!mode) return;
        var canvas = $('cfpBoardCanvas');
        if (mode === 'node') {
            var id = dragId;
            if (elMap[id]) elMap[id].classList.remove('is-dragging');
            if (moved) {
                var p = curBoard.pos[id];
                mutate(function (b) { b.pos[id] = { x: p.x, y: p.y }; });
            } else if (!cancelled) {
                var row = target && target.closest && target.closest('[data-focus]');
                if (row) NS.focus(row.getAttribute('data-focus'));
                else if (isGroupId(id)) select({ kind: 'group', gid: id });
                else select({ kind: 'node', id: id });
            }
        } else if (mode === 'pan') {
            if (canvas) canvas.classList.remove('is-panning');
            if (!moved && !connectMode && !cancelled) select(null);
        }
        mode = null; dragId = null;
    }

    var lastTouchAt = 0;   // phones fire emulated mouse events after a touch; ignore them
    document.addEventListener('mousedown', function (e) {
        if (e.button !== 0 || Date.now() - lastTouchAt < 800) return;
        if (boardDown(e.target, e.clientX, e.clientY) && mode !== 'pan') e.preventDefault();
    });
    document.addEventListener('mousemove', function (e) { boardMove(e.clientX, e.clientY, 3); });
    document.addEventListener('mouseup', function (e) { boardUp(e.target); });

    /* ── touch: one finger pans / drags a card, two fingers pinch-zoom ── */
    var pinch = null, lastTap = { id: null, at: 0 };
    function touchMid(t) {
        var r = $('cfpBoardCanvas').getBoundingClientRect();
        return {
            x: (t[0].clientX + t[1].clientX) / 2 - r.left,
            y: (t[0].clientY + t[1].clientY) / 2 - r.top,
            d: Math.max(1, Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY))
        };
    }
    document.addEventListener('touchstart', function (e) {
        var canvas = $('cfpBoardCanvas');
        if (!canvas || !boardVisible() || !canvas.contains(e.target)) return;
        if (e.target.closest('.cg-dock, .cg-empty-card, .cg-inspector, .cg-hint, a[href], button, input, textarea, select')) return;
        lastTouchAt = Date.now();
        if (e.touches.length >= 2) {
            e.preventDefault();
            boardUp(null, true);   // a second finger turns any drag into a pinch
            pinch = touchMid(e.touches);
            return;
        }
        var t = e.touches[0];
        if (boardDown(e.target, t.clientX, t.clientY)) e.preventDefault();
    }, { passive: false });
    document.addEventListener('touchmove', function (e) {
        if (!pinch && !mode) return;
        e.preventDefault();
        lastTouchAt = Date.now();
        if (pinch && e.touches.length >= 2) {
            var m = touchMid(e.touches);
            pan.x += m.x - pinch.x; pan.y += m.y - pinch.y;
            zoomAround(zoom * (m.d / pinch.d), m.x, m.y);
            pinch = m;
        } else if (!pinch) {
            boardMove(e.touches[0].clientX, e.touches[0].clientY, 8);
        }
    }, { passive: false });
    function touchEnd(e) {
        if (!pinch && !mode) return;
        lastTouchAt = Date.now();
        if (pinch) {
            if (e.touches.length < 2) pinch = null;
            return;   // lifting out of a pinch never counts as a tap
        }
        var tappedId = (mode === 'node' && !moved) ? dragId : null;
        boardUp(e.target, e.type === 'touchcancel');
        if (!tappedId) return;
        // double-tap a card = double-click (opens the full saved row)
        if (lastTap.id === tappedId && Date.now() - lastTap.at < 350) {
            lastTap.id = null;
            var c = getCase(); var n = c && nodeById(c, tappedId);
            if (n && n.kind === 'item' && typeof openCaseItemPopup === 'function') openCaseItemPopup(n.id);
        } else {
            lastTap = { id: tappedId, at: Date.now() };
        }
    }
    document.addEventListener('touchend', touchEnd);
    document.addEventListener('touchcancel', touchEnd);
    document.addEventListener('dblclick', function (e) {
        if (!boardVisible()) return;
        var card = e.target.closest && e.target.closest('.cg-node');
        if (!card) return;
        var c = getCase(); var n = c && nodeById(c, card.dataset.nid);
        if (n && n.kind === 'item' && typeof openCaseItemPopup === 'function') openCaseItemPopup(n.id);
    });
    document.addEventListener('wheel', function (e) {
        var canvas = $('cfpBoardCanvas');
        if (!canvas || !boardVisible() || !canvas.contains(e.target)) return;
        if (e.target.closest('.cg-inspector, .cg-dock')) return;   // let the sheet scroll
        e.preventDefault();
        var r = canvas.getBoundingClientRect();
        zoomAround(zoom * (e.deltaY > 0 ? 1 / 1.12 : 1.12), e.clientX - r.left, e.clientY - r.top);
    }, { passive: false });
    document.addEventListener('keydown', function (e) {
        if (!boardVisible()) return;
        var pop = $('caseFolderPopup');
        if (!pop || pop.style.display === 'none') return;
        if (document.querySelector('.cfp-nm-overlay.open') || ($('caseItemPopup') && $('caseItemPopup').style.display !== 'none')) return;
        var t = e.target, typing = t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
        if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z') && !typing) { if (NS.undo()) e.preventDefault(); return; }
        if (typing) return;
        if (e.key === 'Escape') {
            if (connectMode) { setConnect(false); e.preventDefault(); }
            else if (selected) { select(null); e.preventDefault(); }
        } else if ((e.key === 'Delete' || e.key === 'Backspace') && selected) {
            e.preventDefault();
            if (selected.kind === 'edge') removeEdge(selected.key);
            else if (selected.kind === 'node' && selected.id !== '__hub') removeNode(selected.id);
        }
    });

    /* ── arrange: each kind of entity on its own side of the subject ── */
    NS.arrange = function () {
        var c = getCase(); if (!c) return;
        pushUndo();
        // grouped cards aren't on the board on their own — lay out their group card instead
        var nodes = nodeList(c).filter(function (n) { return !groupOf[n.id]; });
        groupList.forEach(function (g) { nodes.push({ id: g.gid, type: g.type }); });
        var S = box('__hub');
        var cx = S.x + S.w / 2, cy = S.y + S.h / 2;
        var buckets = { infra: [], identity: [], social: [], finance: [], other: [] };
        nodes.forEach(function (n) { buckets[typeMeta(n.type).group].push(n); });
        var GAP_X = 250, GAP_Y = 78, COL = 6;
        var pos = {};
        function column(list, side) {          // side -1 = left, 1 = right
            list.forEach(function (n, i) {
                var colIdx = Math.floor(i / COL), row = i % COL;
                var inCol = Math.min(COL, list.length - colIdx * COL);
                var b = box(n.id);
                var x = side < 0 ? S.x - 140 - b.w - colIdx * GAP_X : S.x + S.w + 140 + colIdx * GAP_X;
                pos[n.id] = { x: Math.round(x), y: Math.round(cy - (inCol * GAP_Y) / 2 + row * GAP_Y + (GAP_Y - b.h) / 2) };
            });
        }
        function row(list, side, extra) {      // side -1 = above, 1 = below
            var per = 5;
            list.forEach(function (n, i) {
                var rowIdx = Math.floor(i / per), col = i % per;
                var inRow = Math.min(per, list.length - rowIdx * per);
                var b = box(n.id);
                var y = side < 0 ? S.y - 120 - b.h - rowIdx * 96 - (extra || 0) : S.y + S.h + 110 + rowIdx * 96 + (extra || 0);
                pos[n.id] = { x: Math.round(cx - (inRow * GAP_X) / 2 + col * GAP_X + (GAP_X - b.w) / 2), y: Math.round(y) };
            });
        }
        row(buckets.infra, -1);
        column(buckets.identity, -1);
        column(buckets.social, 1);
        row(buckets.finance, 1);
        row(buckets.other, 1, buckets.finance.length ? Math.ceil(buckets.finance.length / 5) * 96 + 10 : 0);
        mutate(function (b) { for (var id in pos) b.pos[id] = pos[id]; });
        var layer = $('cfpBoardLayer');
        if (layer) layer.classList.add('cg-arranging');
        for (var id in pos) { if (elMap[id]) { elMap[id].style.left = pos[id].x + 'px'; elMap[id].style.top = pos[id].y + 'px'; } }
        followEdges(650);
        setTimeout(function () { if (layer) layer.classList.remove('cg-arranging'); NS.fit(true); }, 620);
    };

    /* ── add entity (modal) ── */
    function fillTypeSelect() {
        var sel = $('cfpNmType');
        if (!sel || sel._cgFilled) return;
        sel._cgFilled = true;
        sel.innerHTML = typeOptions('email');
        // the visible picker: grouped text options (the <select> just holds the value)
        var host = $('cgNmTypes');
        if (host) {
            var groups = {};
            Object.keys(TYPES).forEach(function (k) {
                if (k === 'person' || k === 'account') return;
                (groups[TYPES[k].group] = groups[TYPES[k].group] || []).push(k);
            });
            host.innerHTML = Object.keys(groups).map(function (g) {
                return '<div class="cg-nm-group"><span class="cg-nm-glabel">' + GROUP_LABEL[g] + '</span><div class="cg-nm-opts">' +
                    groups[g].map(function (k) {
                        return '<button type="button" class="cg-nm-opt" data-nm-type="' + k + '">' + iconHtml(TYPES[k].icon) + '<span>' + esc(TYPES[k].label) + '</span></button>';
                    }).join('') + '</div></div>';
            }).join('');
            host.addEventListener('click', function (e) {
                var o = e.target.closest && e.target.closest('[data-nm-type]');
                if (!o) return;
                sel.value = o.getAttribute('data-nm-type');
                NS.onTypeChange();
                $('cfpNmLabel').focus();
            });
        }
        var val = $('cfpNmLabel'), ex = $('cfpNmExtra');
        var keys = function (e) {
            if (e.key === 'Enter') { e.preventDefault(); NS.commitModal(); }
            else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); NS.closeModal(); }
        };
        if (val) { val.addEventListener('keydown', keys); val.addEventListener('input', syncNmIcon); }
        if (ex) { ex.addEventListener('keydown', keys); ex.addEventListener('input', syncNmIcon); }
    }
    // the icon beside the value follows the type and what's typed (roblox.com → Roblox)
    function syncNmIcon() {
        var ic = $('cgNmIc'), t = $('cfpNmType').value;
        if (ic) ic.innerHTML = nodeIcon({ type: t, value: $('cfpNmLabel').value, detail: $('cfpNmExtra').value });
    }
    NS.onTypeChange = function () {
        var t = $('cfpNmType').value;
        Array.prototype.forEach.call(document.querySelectorAll('#cgNmTypes [data-nm-type]'), function (b) {
            b.classList.toggle('is-on', b.getAttribute('data-nm-type') === t);
        });
        setTimeout(syncNmIcon, 0);
        var lab = $('cfpNmLabelLbl'), exLab = $('cfpNmExtraLabel'), ex = $('cfpNmExtra'), val = $('cfpNmLabel');
        if (t === 'note') {
            if (lab) lab.textContent = 'Title'; val.placeholder = 'Short title';
            exLab.textContent = 'Text'; ex.placeholder = 'What you noticed…';
        } else {
            if (lab) lab.textContent = 'Value';
            val.placeholder = ({ email: 'name@example.com', username: 'handle', phone: '+1 555 010 0142', ip: '192.0.2.44', domain: 'example.com', link: 'https://…', btc: 'bc1q…', eth: '0x…', location: 'City, country' })[t] || typeMeta(t).label;
            exLab.textContent = 'Detail (optional)'; ex.placeholder = 'Source, site, context…';
        }
    };
    NS.openAdd = function () {
        curId = activeId();
        fillTypeSelect();
        $('cfpNmTitle').textContent = 'Add entity';
        $('cfpNmType').value = $('cfpNmType').value || 'email';
        $('cfpNmLabel').value = '';
        $('cfpNmExtra').value = '';
        NS.onTypeChange();
        $('cfpNmOverlay').classList.add('open');
        setTimeout(function () { $('cfpNmLabel').focus(); }, 30);
    };
    NS.closeModal = function () { $('cfpNmOverlay').classList.remove('open'); };
    NS.commitModal = function () {
        var type = $('cfpNmType').value;
        var value = $('cfpNmLabel').value.trim();
        var detail = $('cfpNmExtra').value.trim();
        if (!value && !detail) { NS.closeModal(); return; }
        if (!TYPES[type]) type = 'account';
        var near = selected && selected.kind === 'node' ? selected.id : null;
        var id = 'cn_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        pushUndo();
        mutate(function (b) {
            b.custom.push({ id: id, type: type, label: value || typeMeta(type).label, detail: detail });
            var pp = placeNear(near, type);
            b.pos[id] = pp;
            if (near) b.links.push([near, id, { label: '' }]);
        });
        if (near) pendingEdgeAnim[edgeKey(near, id)] = true;
        pendingNodeAnim[id] = 'enter';
        NS.closeModal();
        render();
        select({ kind: 'node', id: id });
        ensureVisible(id);
    };

    /* ── pin saved case items ── */
    function renderPickList() {
        var c = getCase(); var list = $('cfpPickList'); if (!list) return;
        if (!c) { list.innerHTML = ''; return; }
        var b = getBoard(c);
        var rows = (c.items || []).map(function (it) {
            var id = String(it.id), on = !!b.pos[id];
            var d = describeItem(it);
            return '<div class="cfp-pick-row' + (on ? ' is-on' : '') + '">' +
                '<span class="cfp-pick-label"><i class="' + typeMeta(d.type).icon + '"></i> <span class="cfp-pick-main">' + esc(d.value) + '</span>' +
                (d.detail ? '<span class="cfp-pick-sub">' + esc(d.detail) + '</span>' : '') + '</span>' +
                (on ? '<span class="cfp-pick-on">On board</span>'
                    : '<button type="button" class="cfp-board-btn" onclick="intelBoard.pickAdd(\'' + esc(id) + '\')">Pin</button>') +
                '</div>';
        });
        list.innerHTML = rows.length ? rows.join('') : '<div class="cfp-pick-empty">No saved items yet. Use “Add to case” on search results.</div>';
    }
    NS.openPick = function () { curId = activeId(); renderPickList(); $('cfpPickOverlay').classList.add('open'); };
    NS.closePick = function () { $('cfpPickOverlay').classList.remove('open'); };
    NS.pickAdd = function (itemId) {
        var c = getCase(); if (!c) return;
        var it = (c.items || []).find(function (x) { return String(x.id) === String(itemId); });
        if (!it) return;
        pushUndo();
        mutate(function (b) { if (!b.pos[itemId]) b.pos[itemId] = placeNear(null, describeItem(it).type); });
        pendingNodeAnim[itemId] = 'enter';
        render();
        renderPickList();
    };

    NS.exportCase = function () {
        var c = getCase();
        if (c && typeof _cfWriteCaseFile === 'function') _cfWriteCaseFile(c);
    };

    /* ── API for Intelbyte AI ── */
    // Compact board the AI reasons over.
    NS.context = function () {
        var c = getCase(); if (!c) return null;
        var b = getBoard(c);
        var nodes = [{ id: '__hub', type: 'person', value: subjectName(c), detail: 'case subject', status: 'none', flag: '', note: '' }]
            .concat(nodeList(c).map(function (n) {
                var o = { id: n.id, type: n.type, value: n.value, detail: n.detail, status: n.status, flag: n.flag, note: n.note };
                if (n.pc && n.pc.logId) o.pcLogId = String(n.pc.logId).slice(0, 80);   // the AI can search inside this PC
                return o;
            }));
        return {
            board: {
                nodes: nodes,
                links: b.links.map(function (l) { var i = linkInfo(l); return { from: l[0], to: l[1], label: i.label || '', suspected: !!i.suspected }; })
            },
            case: {
                title: c.title || '', alias: (c.subject && c.subject.alias) || '',
                incident: (c.brief && c.brief.incident) || '', objective: (c.brief && c.brief.objective) || '', facts: (c.brief && c.brief.facts) || '',
                notes: String(c.notes || '').slice(0, 2000)
            },
            evidence: (c.items || []).slice(-30).map(itemEvidence)
        };
    };
    // Replay AI ops one by one with animation. Returns what was applied.
    NS.applyOps = function (ops, onStep) {
        if (!Array.isArray(ops) || !ops.length) return Promise.resolve([]);
        if (!boardVisible()) NS.show('board');
        curId = activeId();
        pushUndo();   // one Ctrl+Z reverts the whole AI turn
        beginBatch();
        var refMap = {};
        var applied = [];
        var c0 = getCase();
        var resolve = function (id) {
            if (refMap[id]) return refMap[id];
            if (id === '__hub' || elMap[id] || groupOf[id]) return id;   // grouped cards are real cards
            return null;
        };
        var chain = Promise.resolve();
        ops.forEach(function (op) {
            chain = chain.then(function () {
                var c = getCase(); if (!c || !op) return;
                var nodes = nodeList(c);
                var out = null, wait = 0;
                if (op.op === 'add') {
                    var type = TYPES[op.type] ? op.type : 'account';
                    var dupe = nodes.find(function (n) { return norm(n.value) && norm(n.value) === norm(op.value); });
                    if (dupe) {
                        refMap[op.ref] = dupe.id;
                        if (op.pc) mutate(function (b) {
                            var dm = b.meta[dupe.id] || (b.meta[dupe.id] = {});
                            dm.pc = op.pc;
                            if (!dm.userStatus && (!dm.status || dm.status === 'none' || dm.status === 'clear')) dm.status = 'risk';
                        });
                        return;
                    }
                    var id = 'cn_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
                    refMap[op.ref] = id;
                    replayFresh[id] = 1;
                    var near = op.near ? resolve(op.near) : null;
                    mutate(function (b) {
                        b.custom.push({ id: id, type: type, label: String(op.value || '').slice(0, 140), detail: String(op.detail || '').slice(0, 140) });
                        b.meta[id] = { status: pcRiskStatus(type, op.detail, op.pc, op.status, op.flag) || 'none', flag: op.flag || '', note: op.note || op.reason || '', ai: true };
                        if (op.pc) b.meta[id].pc = op.pc;   // infected PC: the node opens the full Machine View
                        if (op.confidence != null) b.meta[id].confidence = op.confidence;
                        b.pos[id] = placeNear(near, type);
                    });
                    pendingNodeAnim[id] = 'enter';
                    render();
                    ensureVisible(id);
                    out = { op: 'add', id: id, type: type, text: op.value + (op.confidence != null ? ' · ~' + op.confidence + '%' : ''), suspected: op.confidence != null && op.confidence < 60 };
                    wait = 560;
                } else if (op.op === 'link') {
                    var a = resolve(op.from), t = resolve(op.to);
                    if (!a || !t || a === t) return;
                    var key = edgeKey(a, t);
                    if (getBoard(c).links.some(function (l) { return edgeKey(l[0], l[1]) === key; })) return;
                    mutate(function (b) {
                        var info = { label: String(op.label || '').slice(0, 40), suspected: !!op.suspected, ai: true };
                        if (op.confidence != null) info.confidence = op.confidence;
                        if (op.reason) info.reason = String(op.reason).slice(0, 200);
                        b.links.push([a, t, info]);
                    });
                    pendingEdgeAnim[key] = true;
                    render();
                    var na = a === '__hub' ? subjectName(c) : (nodeById(c, a) || {}).value;
                    var nt = t === '__hub' ? subjectName(c) : (nodeById(c, t) || {}).value;
                    out = { op: 'link', id: t, key: key, text: (na || '?') + ' → ' + (nt || '?') + (op.label ? ' · ' + op.label : '') + (op.confidence != null ? ' · ~' + op.confidence + '%' : ''), suspected: !!op.suspected };
                    wait = 720;
                } else if (op.op === 'update') {
                    var uid = resolve(op.id);
                    if (!uid || uid === '__hub') return;
                    var patch = {};
                    if (op.status) {
                        var cur = nodeById(c, uid);
                        var um = getBoard(c).meta[uid] || {};
                        patch.status = (cur && !um.userStatus) ? pcRiskStatus(cur.type, cur.detail, cur.pc, op.status, op.flag != null ? op.flag : cur.flag) : op.status;
                    }
                    if (op.flag != null) patch.flag = op.flag;
                    if (op.note != null) patch.note = op.note;
                    updateNode(uid, patch);
                    mutate(function (b) { var m = b.meta[uid] || (b.meta[uid] = {}); m.touched = true; });
                    pendingNodeAnim[uid] = 'pulse';
                    render();
                    ensureVisible(uid);
                    var un = nodeById(getCase(), uid);
                    out = { op: 'update', id: uid, text: (un ? un.value : uid) + (op.status && op.status !== 'none' ? ' · ' + op.status : '') + (op.flag ? ' · ' + op.flag : ''), status: op.status };
                    wait = 460;
                } else if (op.op === 'unlink') {
                    var ua = resolve(op.from), ub = resolve(op.to);
                    if (!ua || !ub) return;
                    var k2 = edgeKey(ua, ub);
                    mutate(function (b) { b.links = b.links.filter(function (l) { return edgeKey(l[0], l[1]) !== k2; }); });
                    render();
                    out = { op: 'unlink', id: ua, text: ((nodeById(getCase(), ua) || {}).value || '?') + ' ✕ ' + ((nodeById(getCase(), ub) || {}).value || '?') };
                    wait = 300;
                }
                if (out) { applied.push(out); if (typeof onStep === 'function') onStep(out); }
                renderInspector();
                return sleep(wait);
            });
        });
        function settle() {
            endBatch();
            if (Object.keys(replayFresh).length) { replayFresh = {}; try { render(); } catch (e) {} }
        }
        return chain.then(function () { settle(); return applied; }, function (e) { settle(); throw e; });
    };
    NS.hasNode = function (id) { return !!(elMap[id] || groupOf[id]); };

    /* ── open hook: a freshly opened case starts on its board ── */
    function wireOpenWrap() {
        if (typeof window.openCaseFolderPopup !== 'function') return false;
        if (window.openCaseFolderPopup._boardWrapped) return true;
        var _open = window.openCaseFolderPopup;
        window.openCaseFolderPopup = function () {
            var r = _open.apply(this, arguments);
            try { NS.show('board'); } catch (e) {}
            return r;
        };
        window.openCaseFolderPopup._boardWrapped = true;
        return true;
    }
    if (!wireOpenWrap()) {
        document.addEventListener('DOMContentLoaded', wireOpenWrap);
        setTimeout(wireOpenWrap, 0);
    }

    NS.TYPES = TYPES;
    window.intelBoard = NS;
})();
