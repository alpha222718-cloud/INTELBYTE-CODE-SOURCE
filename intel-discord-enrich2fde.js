/* Discord → auto email scan + website signup logos (VPS panel parity) */
(function (global) {
  function esc(x) {
    if (typeof global.escapeHtml === 'function') return global.escapeHtml(x);
    return String(x == null ? '' : x).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  var INTEL_PLATFORM_MAP = [
    { re: /amazon/i, name: 'Amazon', icon: 'fab fa-amazon', color: '#ff9900' },
    { re: /office\s*365|outlook|microsoft|live\.com|hotmail|msn/i, name: 'Office365', icon: 'fab fa-microsoft', color: '#2f7fe0' },
    { re: /spotify/i, name: 'Spotify', icon: 'fab fa-spotify', color: '#1db954' },
    { re: /twitter|twitter\.com|^x$|x\.com|\bx 20/i, name: 'Twitter (X)', icon: 'fab fa-x-twitter', color: '#e6e6e6' },
    { re: /facebook|fb\.com/i, name: 'Facebook', icon: 'fab fa-facebook-f', color: '#1877f2' },
    { re: /instagram/i, name: 'Instagram', icon: 'fab fa-instagram', color: '#e1306c' },
    { re: /linkedin/i, name: 'LinkedIn', icon: 'fab fa-linkedin-in', color: '#0a66c2' },
    { re: /tiktok/i, name: 'TikTok', icon: 'fab fa-tiktok', color: '#e6e6e6' },
    { re: /snapchat/i, name: 'Snapchat', icon: 'fab fa-snapchat', color: '#f7d000' },
    { re: /discord/i, name: 'Discord', icon: 'fab fa-discord', color: '#5865f2' },
    { re: /telegram/i, name: 'Telegram', icon: 'fab fa-telegram', color: '#2aabee' },
    { re: /steam/i, name: 'Steam', icon: 'fab fa-steam', color: '#c7d5e0' },
    { re: /github/i, name: 'GitHub', icon: 'fab fa-github', color: '#e6e6e6' },
    { re: /google|gmail/i, name: 'Google', icon: 'fab fa-google', color: '#ea4335' },
    { re: /apple|icloud/i, name: 'Apple', icon: 'fab fa-apple', color: '#e6e6e6' },
    { re: /netflix/i, name: 'Netflix', icon: 'fas fa-clapperboard', color: '#e50914' },
    { re: /paypal/i, name: 'PayPal', icon: 'fab fa-paypal', color: '#0070ba' },
    { re: /reddit/i, name: 'Reddit', icon: 'fab fa-reddit-alien', color: '#ff4500' },
    { re: /twitch/i, name: 'Twitch', icon: 'fab fa-twitch', color: '#9146ff' },
    { re: /pinterest/i, name: 'Pinterest', icon: 'fab fa-pinterest-p', color: '#e60023' },
    { re: /dropbox/i, name: 'Dropbox', icon: 'fab fa-dropbox', color: '#0061ff' },
    { re: /adobe/i, name: 'Adobe', icon: 'fas fa-bezier-curve', color: '#ed2224' },
    { re: /roblox/i, name: 'Roblox', icon: 'fas fa-cube', color: '#e6e6e6' },
    { re: /yahoo/i, name: 'Yahoo', icon: 'fab fa-yahoo', color: '#6001d2' },
    { re: /canva/i, name: 'Canva', icon: 'fas fa-palette', color: '#00c4cc' },
    { re: /myspace/i, name: 'MySpace', icon: 'fas fa-square-rss', color: '#1199e6' },
    { re: /wattpad/i, name: 'Wattpad', icon: 'fab fa-wattpad', color: '#ff500a' },
    { re: /deezer/i, name: 'Deezer', icon: 'fab fa-deezer', color: '#a238ff' }
  ];

  function stripHostish(s) {
    return String(s).trim().replace(/^https?:\/\//i, '').split(/[/\s?#]/)[0].replace(/^www\./i, '');
  }

  var INTEL_COMPOUND_TLDS = {
    'com.tr': 1, 'com.br': 1, 'co.uk': 1, 'com.au': 1, 'co.jp': 1, 'com.tw': 1,
    'org.tr': 1, 'gov.tr': 1, 'net.tr': 1, 'co.kr': 1, 'com.mx': 1, 'com.ar': 1,
    'co.in': 1, 'com.ua': 1, 'co.za': 1
  };

  function intelDomainLabel(domain) {
    var d = String(domain || '').replace(/^www\./i, '').toLowerCase();
    if (!d) return String(domain || '');
    var parts = d.split('.').filter(Boolean);
    var core = d;
    if (parts.length >= 2) {
      var lastTwo = parts.slice(-2).join('.');
      if (parts.length >= 3 && INTEL_COMPOUND_TLDS[lastTwo]) core = parts[parts.length - 3];
      else core = parts[parts.length - 2];
    } else core = parts[0] || d;
    return core.charAt(0).toUpperCase() + core.slice(1);
  }

  function intelFaviconFallback(img) {
    if (!img) return;
    img.onerror = null;
    var emoji = img.getAttribute('data-emoji') || '🗄️';
    var span = document.createElement('span');
    span.className = 'intel-platform-emoji';
    span.textContent = emoji;
    if (img.parentNode) img.parentNode.replaceChild(span, img);
  }

  function intelExtractDomains(str) {
    var out = [];
    var raw = String(str || '').replace(/^\[|\]$/g, '');
    var parts = raw.split(/[,;\n]+/);
    for (var i = 0; i < parts.length; i++) {
      var part = parts[i].trim().replace(/^["']|["']$/g, '');
      if (!part) continue;
      var m = /^android-app:(.+)$/i.exec(part);
      if (m) {
        var pkg = m[1].trim();
        var segs = pkg.split('.').filter(function (x) { return x && x !== 'android' && x !== 'app'; });
        var generic = { com: 1, www: 1, net: 1, org: 1, mobile: 1, client: 1, main: 1 };
        var pick = '';
        for (var gi = segs.length - 1; gi >= 0; gi--) {
          if (!generic[segs[gi]]) { pick = segs[gi]; break; }
        }
        if (!pick) pick = segs[segs.length - 1] || pkg;
        out.push({ key: pkg.toLowerCase(), domain: pick.toLowerCase(), label: pick.charAt(0).toUpperCase() + pick.slice(1), match: pkg });
        continue;
      }
      var host = stripHostish(part).toLowerCase();
      if (!host || !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(host)) continue;
      out.push({ key: host, domain: host, label: intelDomainLabel(host), match: host });
    }
    return out;
  }

  function intelRowSourceStrings(row) {
    if (!row || typeof row !== 'object') return [];
    var out = [];
    var keys = ['source', 'origin', 'database', 'breach', 'url', 'domain', 'name', '_domain', 'db'];
    for (var i = 0; i < keys.length; i++) {
      var v = row[keys[i]];
      if (v == null) continue;
      if (typeof v === 'object') {
        if (v.name != null) out.push(String(v.name));
        else { try { out.push(JSON.stringify(v)); } catch (e) {} }
      } else out.push(String(v));
    }
    return out;
  }

  function intelDerivePlatforms(logs) {
    var found = {};
    function brandFor(text) {
      for (var p = 0; p < INTEL_PLATFORM_MAP.length; p++) {
        if (INTEL_PLATFORM_MAP[p].re.test(text)) return INTEL_PLATFORM_MAP[p];
      }
      return null;
    }
    function addHit(key, def, row) {
      if (!found[key]) found[key] = { def: def, rows: [], _seen: [] };
      if (found[key]._seen.indexOf(row) === -1) {
        found[key]._seen.push(row);
        found[key].rows.push(row);
      }
    }
    for (var i = 0; i < logs.length; i++) {
      var strs = intelRowSourceStrings(logs[i]);
      var domains = [];
      for (var s = 0; s < strs.length; s++) {
        var ds = intelExtractDomains(strs[s]);
        for (var d = 0; d < ds.length; d++) domains.push(ds[d]);
        // Bare host-like source titles (e.g. GameSprite.me) when extractor misses
        var bare = String(strs[s] || '').trim();
        if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(bare)) {
          domains.push({ key: bare.toLowerCase(), domain: bare.toLowerCase(), label: intelDomainLabel(bare), match: bare });
        }
      }
      // Fallback: brand match on source string, or generic "Stealer / breach" bucket
      if (!domains.length) {
        var joined = strs.join(' ');
        var brandOnly = brandFor(joined);
        if (brandOnly) {
          addHit('brand:' + brandOnly.name, {
            name: brandOnly.name, icon: brandOnly.icon, color: brandOnly.color, emoji: null
          }, logs[i]);
        } else if (joined) {
          var label = joined.length > 28 ? joined.slice(0, 27) + '…' : joined;
          addHit('src:' + joined.toLowerCase(), {
            name: label, icon: null, color: '#e6e6e6', emoji: '🗄️', domain: '', favicon: null
          }, logs[i]);
        }
      }
      for (var k = 0; k < domains.length; k++) {
        var dom = domains[k];
        var brand = brandFor(dom.match) || brandFor(dom.domain);
        var key, def;
        if (brand) {
          key = 'brand:' + brand.name;
          def = { name: brand.name, icon: brand.icon, color: brand.color, emoji: null };
        } else {
          key = 'dom:' + dom.key;
          var fav = /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(dom.domain)
            ? 'https://www.google.com/s2/favicons?sz=64&domain=' + encodeURIComponent(dom.domain)
            : null;
          def = { name: dom.label, icon: null, color: '#e6e6e6', emoji: '🗄️', domain: dom.domain, favicon: fav };
        }
        addHit(key, def, logs[i]);
      }
    }
    return Object.keys(found).map(function (k) { return { def: found[k].def, rows: found[k].rows }; });
  }

  function intelPickEmailFromLogs(logs) {
    var counts = {};
    for (var i = 0; i < logs.length; i++) {
      var row = logs[i];
      if (!row || typeof row !== 'object') continue;
      for (var k in row) {
        if (!Object.prototype.hasOwnProperty.call(row, k)) continue;
        if (!/mail/i.test(k) && k !== 'email') continue;
        var v = String(row[k] || '').trim();
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
          var ek = v.toLowerCase();
          counts[ek] = (counts[ek] || 0) + 1;
        }
      }
    }
    var best = '', bestN = 0;
    for (var e in counts) { if (counts[e] > bestN) { bestN = counts[e]; best = e; } }
    return best;
  }

  function intelCollectObjects(node, out, depth) {
    if (depth > 6 || node == null) return out;
    if (Array.isArray(node)) {
      for (var i = 0; i < node.length; i++) intelCollectObjects(node[i], out, depth + 1);
    } else if (typeof node === 'object') {
      out.push(node);
      for (var k in node) {
        if (!Object.prototype.hasOwnProperty.call(node, k)) continue;
        var v = node[k];
        if (v && typeof v === 'object') intelCollectObjects(v, out, depth + 1);
      }
    }
    return out;
  }

  function pickDiscordEmail(payload) {
    if (!payload) return '';
    if (Array.isArray(payload.stolenEmails) && payload.stolenEmails[0]) {
      var e0 = String(payload.stolenEmails[0]).trim();
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e0)) return e0;
    }
    return intelPickEmailFromLogs(intelCollectObjects(payload, [], 0));
  }

  var CRED_KEY_ORDER = [
    /^e-?mail/i, /^user(name)?$/i, /^login$/i, /^nick(name)?$/i, /^password|^pass(wd)?$/i,
    /^ip(address|_address)?$/i, /^origin|^url|^domain|^source|^database|^breach/i
  ];

  function flattenRowFields(row) {
    if (!row || typeof row !== 'object') return [];
    var pairs = [];
    function push(k, v) {
      if (v == null || v === '') return;
      if (typeof v === 'object') return;
      pairs.push([String(k), String(v)]);
    }
    if (Array.isArray(row.fields)) {
      for (var i = 0; i < row.fields.length; i++) {
        var f = row.fields[i];
        if (Array.isArray(f) && f.length >= 2) push(f[0], f[1]);
        else if (f && typeof f === 'object' && (f.key != null || f.name != null)) push(f.key || f.name, f.value != null ? f.value : f.val);
      }
    }
    for (var k in row) {
      if (!Object.prototype.hasOwnProperty.call(row, k)) continue;
      if (k === 'fields' || k === '_seen') continue;
      push(k, row[k]);
    }
    var seen = {};
    var out = [];
    for (var p = 0; p < pairs.length; p++) {
      var key = pairs[p][0];
      var lk = key.toLowerCase();
      if (seen[lk]) continue;
      seen[lk] = 1;
      out.push(pairs[p]);
    }
    out.sort(function (a, b) {
      function rank(name) {
        for (var i = 0; i < CRED_KEY_ORDER.length; i++) if (CRED_KEY_ORDER[i].test(name)) return i;
        return 50;
      }
      return rank(a[0]) - rank(b[0]);
    });
    return out;
  }

  function rowDetailHtml(row) {
    var fields = flattenRowFields(row).slice(0, 20);
    if (!fields.length) return '';
    return '<div class="signup-row">' + fields.map(function (f) {
      return '<div class="signup-kv"><span class="signup-k">' + esc(f[0]) + '</span><span class="signup-v">' + esc(f[1]) +
        '</span><button type="button" class="rec-copy mv-copy" data-copy="' + esc(f[1]) + '" title="Copy"><i class="fas fa-copy"></i></button></div>';
    }).join('') + '</div>';
  }

  function usernameFromRow(row) {
    var fields = flattenRowFields(row);
    for (var i = 0; i < fields.length; i++) {
      if (/^(user(name)?|login|nick(name)?|account)$/i.test(fields[i][0])) {
        var v = String(fields[i][1] || '').trim();
        if (v && v.length <= 80) return v;
      }
    }
    for (var j = 0; j < fields.length; j++) {
      if (/user|login|nick/i.test(fields[j][0]) && !/mail|pass|full.?name|display/i.test(fields[j][0])) {
        var u = String(fields[j][1] || '').trim();
        if (u && u.length <= 80 && u.indexOf('@') === -1) return u;
      }
    }
    return '';
  }

  function pickUsernamesFromLogs(logs) {
    var counts = {};
    for (var i = 0; i < logs.length; i++) {
      var u = usernameFromRow(logs[i]);
      if (!u) continue;
      var key = u.toLowerCase();
      if (!counts[key]) counts[key] = { name: u, n: 0 };
      counts[key].n++;
    }
    return Object.keys(counts).map(function (k) { return counts[k]; })
      .sort(function (a, b) { return b.n - a.n; });
  }

  function renderUsernamesCard(users) {
    if (!users || !users.length) return '';
    var chips = users.slice(0, 40).map(function (u) {
      return '<span class="chip-v">' + esc(u.name) +
        (u.n > 1 ? '<span class="intel-platform-count">' + u.n + '</span>' : '') +
        '<button type="button" class="mv-copy" data-copy="' + esc(u.name) + '" title="Copy"><i class="fas fa-copy"></i></button></span>';
    }).join('');
    return '<div class="intel-card intel-card--signups">' +
      '<div class="intel-card-head"><div class="intel-card-ico"><i class="fas fa-user"></i></div>' +
      '<div class="intel-card-titles"><div class="intel-card-title">Usernames</div>' +
      '<div class="intel-card-sub">' + users.length + ' distinct from logs</div></div></div>' +
      '<div class="intel-card-body"><div class="chips">' + chips + '</div></div></div>';
  }

  function renderClickablePlatformChips(storeId, entries) {
    global.__intelSignupStore = global.__intelSignupStore || {};
    var store = {};
    var chips = entries.map(function (entry, idx) {
      store[idx] = { name: entry.name, rows: entry.rows || [] };
      var count = (entry.rows && entry.rows.length) ? entry.rows.length : 0;
      var userHint = '';
      if (entry.rows && entry.rows[0]) {
        var un = usernameFromRow(entry.rows[0]);
        if (un) userHint = '<span class="intel-platform-count" title="' + esc(un) + '">' + esc(un.length > 16 ? un.slice(0, 15) + '…' : un) + '</span>';
      }
      var countHtml = count ? '<span class="intel-platform-count">' + count + '</span>' : '';
      var iconHtml = entry.iconHtml || '<i class="fas fa-database"></i>';
      return '<button type="button" class="intel-platform" data-signup-store="' + storeId + '" data-signup-idx="' + idx +
        '" onclick="intelShowSignupRecord(this)">' + iconHtml + '<span>' + esc(entry.name) + '</span>' + userHint + countHtml +
        '<i class="fas fa-chevron-right intel-platform-go"></i></button>';
    }).join('');
    global.__intelSignupStore[storeId] = store;
    return chips;
  }

  function platformIconHtml(def) {
    if (def.icon) return '<i class="' + def.icon + '" style="color:' + (def.color || '#e6e6e6') + '"></i>';
    if (def.favicon) {
      return '<img class="intel-platform-fav" src="' + esc(def.favicon) + '" alt="" data-emoji="' +
        esc(def.emoji || '🗄️') + '" onload="if(this.naturalWidth<32)intelFaviconFallback(this)" onerror="intelFaviconFallback(this)">';
    }
    return '<span class="intel-platform-emoji">' + (def.emoji || '🗄️') + '</span>';
  }

  function renderSignupsCard(email, platforms, title, sub) {
    if (!platforms.length) return '';
    var storeId = 'sg_' + Math.abs(String(email).split('').reduce(function (a, c) { return a * 31 + c.charCodeAt(0); }, 7)).toString(36);
    var entries = platforms.map(function (p) {
      return { name: p.def.name, rows: p.rows || [], iconHtml: platformIconHtml(p.def) };
    });
    var chips = renderClickablePlatformChips(storeId, entries);
    var n = platforms.length;
    return '<div class="intel-card intel-card--signups">' +
      '<div class="intel-card-head">' +
        '<div class="intel-card-ico"><i class="fas fa-triangle-exclamation"></i></div>' +
        '<div class="intel-card-titles">' +
          '<div class="intel-card-title">' + esc(title || 'Leaked accounts') + '</div>' +
          '<div class="intel-card-sub">' + esc(sub || ('Auto email scan · ' + email)) + '</div>' +
        '</div>' +
        '<div class="intel-card-sources">View ' + n + ' source' + (n === 1 ? '' : 's') + '</div>' +
      '</div>' +
      '<div class="intel-card-body">' +
        '<div class="intel-card-primary">' + esc(email) + '</div>' +
        '<div class="intel-platforms">' + chips + '</div>' +
        '<div class="intel-geo-label" style="margin-top:14px">' + n + ' platform' + (n === 1 ? '' : 's') + ' · tap one to see credentials</div>' +
        '<div class="intel-signup-detail" data-signup-detail="' + storeId + '"></div>' +
      '</div></div>';
  }

  function renderEmptySignups(email) {
    return '<div class="intel-card intel-card--signups"><div class="intel-card-head">' +
      '<div class="intel-card-ico"><i class="fas fa-user-check"></i></div>' +
      '<div class="intel-card-titles"><div class="intel-card-title">Website Signups</div>' +
      '<div class="intel-card-sub">Auto email scan · ' + esc(email) + '</div></div></div>' +
      '<div class="intel-card-body"><div class="intel-card-loading">No known platform signups found for ' + esc(email) + '.</div></div></div>';
  }

  function intelShowSignupRecord(btn) {
    var storeId = btn.getAttribute('data-signup-store');
    var idx = btn.getAttribute('data-signup-idx');
    var store = global.__intelSignupStore && global.__intelSignupStore[storeId];
    var entry = store && store[idx];
    var card = btn.closest('.intel-card');
    var detail = card ? card.querySelector('[data-signup-detail="' + storeId + '"]') : null;
    if (!detail || !entry) return;
    if (detail.getAttribute('data-open-idx') === String(idx)) {
      detail.innerHTML = '';
      detail.removeAttribute('data-open-idx');
      card.querySelectorAll('.intel-platform.is-active').forEach(function (b) { b.classList.remove('is-active'); });
      return;
    }
    card.querySelectorAll('.intel-platform.is-active').forEach(function (b) { b.classList.remove('is-active'); });
    btn.classList.add('is-active');
    detail.setAttribute('data-open-idx', String(idx));
    var rows = entry.rows || [];
    var inner = rows.length
      ? rows.slice(0, 12).map(rowDetailHtml).filter(Boolean).join('')
      : '<p class="intel-card-loading">No credentials for ' + esc(entry.name) + ' in these results.</p>';
    if (rows.length && !inner) {
      inner = '<p class="intel-card-loading">No credentials for ' + esc(entry.name) + ' in these results.</p>';
    }
    detail.innerHTML = '<div class="intel-signup-detail-head"><i class="fas fa-folder-open"></i> ' +
      esc(entry.name) + ' · ' + rows.length + ' record' + (rows.length === 1 ? '' : 's') + '</div>' + inner;
    try { detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) {}
    detail.querySelectorAll('.rec-copy, .mv-copy').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        try { navigator.clipboard.writeText(b.getAttribute('data-copy') || ''); } catch (err) {}
        var old = b.innerHTML; b.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(function () { b.innerHTML = old; }, 1200);
      });
    });
  }

  /** Build signup card HTML from an email search JSON (panel flattenSources helper optional). */
  function buildAutoEmailCardHtml(email, emailJson, flattenSourcesFn) {
    var logs = [];
    if (typeof flattenSourcesFn === 'function' && emailJson) {
      var fl = flattenSourcesFn(emailJson);
      logs = (fl.recs || []).map(function (r) { return r.raw || {}; }).filter(function (r) {
        return r && typeof r === 'object';
      });
    }
    var platforms = logs.length ? intelDerivePlatforms(logs) : [];
    if (platforms.length) return renderSignupsCard(email, platforms, 'Leaked accounts', 'Auto email scan · ' + email);
    return renderEmptySignups(email);
  }

  function brandForName(text) {
    var t = String(text || '');
    for (var p = 0; p < INTEL_PLATFORM_MAP.length; p++) {
      if (INTEL_PLATFORM_MAP[p].re.test(t)) return INTEL_PLATFORM_MAP[p];
    }
    return null;
  }

  function breachChipIcon(name) {
    var brand = brandForName(name);
    if (brand) return '<i class="' + brand.icon + '" style="color:' + (brand.color || '#e6e6e6') + '"></i>';
    var dom = String(name || '').indexOf('.') !== -1 ? name : (name + '.com');
    var fav = 'https://www.google.com/s2/favicons?sz=64&domain=' + encodeURIComponent(dom);
    return '<img class="intel-platform-fav" src="' + esc(fav) + '" alt="" data-emoji="🌐" onload="if(this.naturalWidth<32)intelFaviconFallback(this)" onerror="intelFaviconFallback(this)">';
  }

  function rowHaystack(row) {
    var parts = intelRowSourceStrings(row);
    var fields = flattenRowFields(row);
    for (var i = 0; i < fields.length; i++) parts.push(fields[i][0], fields[i][1]);
    return parts.join(' ').toLowerCase();
  }

  function matchLogsForBreach(logs, breach) {
    var name = String(breach.name || '').toLowerCase().trim();
    var domain = String(breach.domain || '').toLowerCase().trim();
    var nameCore = name.replace(/[^a-z0-9]+/g, ' ').trim();
    var out = [];
    for (var i = 0; i < logs.length; i++) {
      var hay = rowHaystack(logs[i]);
      if (!hay) continue;
      if (domain && domain.length > 2 && hay.indexOf(domain) !== -1) { out.push(logs[i]); continue; }
      if (name && name.length > 3 && hay.indexOf(name) !== -1) { out.push(logs[i]); continue; }
      if (nameCore && nameCore.length > 3 && hay.indexOf(nameCore) !== -1) { out.push(logs[i]); continue; }
    }
    return out;
  }

  function intelSeonChipStatic(name, sub) {
    var brand = brandForName(name);
    var iconHtml = breachChipIcon(name);
    var label = brand ? brand.name : (function () {
      var raw = String(name || '').replace(/\.(com|net|org|io|co|gg|tv)$/i, '');
      return raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : 'Site';
    })();
    var s = String(sub || '');
    var subHtml = s
      ? '<span class="intel-platform-count" title="' + esc(s) + '">' + esc(s.length > 18 ? s.slice(0, 17) + '…' : s) + '</span>'
      : '';
    return '<div class="intel-platform" style="cursor:default">' + iconHtml + '<span>' + esc(label) + '</span>' + subHtml + '</div>';
  }

  function renderSeonCards(seon, logs) {
    if (!seon) return '';
    logs = logs || [];
    var html = '';
    var reg = Array.isArray(seon.registered) ? seon.registered : [];
    if (reg.length) {
      var chips = reg.map(function (r) {
        return intelSeonChipStatic(r.platform, r.username || r.name || r.full_name || '');
      }).join('');
      html += '<div class="intel-card intel-card--signups">' +
        '<div class="intel-card-head"><div class="intel-card-ico"><i class="fas fa-user-check"></i></div>' +
        '<div class="intel-card-titles"><div class="intel-card-title">Registered accounts</div>' +
        '<div class="intel-card-sub">' + reg.length + ' platform' + (reg.length === 1 ? '' : 's') + '</div></div></div>' +
        '<div class="intel-card-body">' + (seon.email ? '<div class="intel-card-primary">' + esc(seon.email) + '</div>' : '') +
        '<div class="intel-platforms">' + chips + '</div>' +
        '<div class="intel-geo-label" style="margin-top:12px">Account presence only · credentials live in Leaked accounts / Known breaches</div></div></div>';
    }
    var breaches = Array.isArray(seon.breaches) ? seon.breaches : [];
    if (breaches.length) {
      var storeId = 'kb_' + Math.abs(String(seon.email || 'b').split('').reduce(function (a, c) { return a * 31 + c.charCodeAt(0); }, 11)).toString(36);
      var entries = breaches.slice(0, 60).map(function (b) {
        var label = b.domain || b.name || 'breach';
        var brand = brandForName(label);
        return {
          name: brand ? brand.name : intelDomainLabel(label) || label,
          rows: matchLogsForBreach(logs, b),
          iconHtml: breachChipIcon(label)
        };
      });
      var bchips = renderClickablePlatformChips(storeId, entries);
      var withCreds = entries.filter(function (e) { return e.rows && e.rows.length; }).length;
      html += '<div class="intel-card intel-card--signups">' +
        '<div class="intel-card-head"><div class="intel-card-ico"><i class="fas fa-database"></i></div>' +
        '<div class="intel-card-titles"><div class="intel-card-title">Known breaches</div>' +
        '<div class="intel-card-sub">' + (seon.breachCount != null ? seon.breachCount : breaches.length) + ' listed · ' +
        withCreds + ' with credentials in results</div></div>' +
        '<div class="intel-card-sources">Tap for creds</div></div>' +
        '<div class="intel-card-body"><div class="intel-platforms">' + bchips + '</div>' +
        '<div class="intel-geo-label" style="margin-top:14px">Tap a breach to reveal matching username / password / IP</div>' +
        '<div class="intel-signup-detail" data-signup-detail="' + storeId + '"></div></div></div>';
    }
    return html;
  }

  function pickIpsFromLogs(logs) {
    var counts = {};
    var re = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    function isPublic(ip) {
      var m = re.exec(ip);
      if (!m) return false;
      var o = [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])];
      if (o.some(function (n) { return n > 255; })) return false;
      if (o[0] === 10 || o[0] === 127 || o[0] === 0 || o[0] >= 224) return false;
      if (o[0] === 172 && o[1] >= 16 && o[1] <= 31) return false;
      if (o[0] === 192 && o[1] === 168) return false;
      if (o[0] === 169 && o[1] === 254) return false;
      return true;
    }
    for (var i = 0; i < logs.length; i++) {
      var fields = flattenRowFields(logs[i]);
      for (var f = 0; f < fields.length; f++) {
        if (!/ip/i.test(fields[f][0])) continue;
        var val = String(fields[f][1] || '').trim();
        if (isPublic(val)) counts[val] = (counts[val] || 0) + 1;
      }
    }
    return Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; });
  }

  function renderIpIntelCardShell(ip) {
    var id = 'ipintel-' + Math.abs(ip.split('.').reduce(function (a, b) { return a * 31 + Number(b); }, 7)).toString(36);
    return {
      id: id,
      html: '<div class="intel-card intel-card--ipintel" id="' + id + '">' +
        '<div class="intel-card-head">' +
          '<div class="intel-card-ico"><i class="fas fa-globe"></i></div>' +
          '<div class="intel-card-titles">' +
            '<div class="intel-card-title">IP Intelligence</div>' +
            '<div class="intel-card-sub">Geolocation + ASN + threat analysis</div>' +
          '</div>' +
          '<div class="intel-card-sources">Auto scan</div>' +
        '</div>' +
        '<div class="intel-card-body">' +
          '<div class="intel-card-primary">' + esc(ip) + '</div>' +
          '<div class="intel-card-loading" data-ipintel-body><i class="fas fa-circle-notch fa-spin"></i> Resolving geolocation…</div>' +
        '</div></div>'
    };
  }

  function intelFlagHtml(label, on) {
    return '<div class="intel-flag ' + (on ? 'is-on' : 'is-off') + '"><span class="intel-flag-dot"></span>' +
      esc(label) + ': ' + (on ? 'Yes' : 'No') + '</div>';
  }

  function apiBase() {
    try {
      if (location.port === '3001' || location.protocol === 'panel.html') return '';
    } catch (e) {}
    return 'http://localhost:3001';
  }

  function intelHydrateIpCard(cardId, ip) {
    var card = document.getElementById(cardId);
    if (!card) return;
    var body = card.querySelector('[data-ipintel-body]');
    var headers = { 'Content-Type': 'application/json' };
    var csrf = String((global.__INTEL_SESSION && global.__INTEL_SESSION.panelCsrf) || '').trim();
    if (csrf) headers['X-Panel-CSRF'] = csrf;
    fetch(apiBase() + '/api/panel/ip-intel', {
      method: 'POST',
      credentials: 'include',
      headers: headers,
      body: JSON.stringify({ ip: ip })
    }).then(function (r) { return r.json(); }).then(function (d) {
      if (!body) return;
      if (!d || !d.ok) {
        body.innerHTML = '<div class="intel-card-loading">Geolocation unavailable for this IP.</div>';
        return;
      }
      var loc = [d.city, d.region, d.country].filter(Boolean).join(', ');
      var mapLink = (d.lat != null && d.lon != null)
        ? '<a class="intel-card-map" href="https://www.openstreetmap.org/?mlat=' + encodeURIComponent(d.lat) +
          '&mlon=' + encodeURIComponent(d.lon) + '#map=11/' + encodeURIComponent(d.lat) + '/' +
          encodeURIComponent(d.lon) + '" target="_blank" rel="noopener"><i class="fas fa-map-marker-alt"></i> Map</a>'
        : '';
      var primary = card.querySelector('.intel-card-primary');
      if (primary && mapLink) primary.innerHTML = esc(ip) + mapLink;
      var items = [
        ['Location', loc || 'Unknown'],
        ['Timezone', d.timezone || 'n/a'],
        ['ISP', d.isp || 'n/a'],
        ['ASN', d.asn || 'n/a'],
        ['Org', d.org || 'n/a'],
        ['Country code', d.countryCode || 'n/a']
      ];
      var grid = items.map(function (it) {
        return '<div class="intel-geo-item"><span class="intel-geo-label">' + esc(it[0]) +
          '</span><span class="intel-geo-value">' + esc(String(it[1])) + '</span></div>';
      }).join('');
      var flags = intelFlagHtml('VPN / Proxy', !!(d.vpn || d.proxy)) +
        intelFlagHtml('Datacenter', !!d.hosting) +
        intelFlagHtml('Mobile', !!d.mobile);
      body.outerHTML = '<div class="intel-geo-grid">' + grid + '</div><div class="intel-flags">' + flags + '</div>';
      if (typeof global.intelIpMapAdd === 'function') { try { global.intelIpMapAdd(d); } catch (e2) {} }
    }).catch(function () {
      if (body) body.innerHTML = '<div class="intel-card-loading">Geolocation lookup failed.</div>';
    });
  }

  function intelFlushPendingIpCards() {
    var pending = global.__intelPendingIpCards || [];
    global.__intelPendingIpCards = [];
    for (var i = 0; i < pending.length; i++) intelHydrateIpCard(pending[i].id, pending[i].ip);
  }

  /** Full VPS-style email summary: SEON + usernames + leaked platforms + auto IP intel */
  function buildEmailSearchSummaryHtml(email, seon, recs) {
    var logs = (recs || []).map(function (r) {
      if (!r || typeof r !== 'object') return null;
      var o = {};
      if (r.raw && typeof r.raw === 'object') {
        for (var rk in r.raw) {
          if (Object.prototype.hasOwnProperty.call(r.raw, rk)) o[rk] = r.raw[rk];
        }
      } else {
        for (var k in r) {
          if (!Object.prototype.hasOwnProperty.call(r, k)) continue;
          if (k === 'fields' || k === 'raw' || k === 'src' || k === 'date') continue;
          o[k] = r[k];
        }
      }
      if (Array.isArray(r.fields)) o.fields = r.fields;
      if (r.src && !r.srcGeneric) {   // srcGeneric = no real database name, only the upstream service
        if (!o.source) o.source = r.src;
        if (!o.origin) o.origin = r.src;
        if (!o.database) o.database = r.src;
      }
      return o;
    }).filter(function (r) { return r && typeof r === 'object'; });

    var html = '';
    if (seon) html += renderSeonCards(seon, logs);
    var users = pickUsernamesFromLogs(logs);
    if (users.length) html += renderUsernamesCard(users);
    var platforms = logs.length ? intelDerivePlatforms(logs) : [];
    if (platforms.length) {
      html += renderSignupsCard(email, platforms, 'Leaked accounts', 'Platforms found in breach data · tap for credentials');
    }
    var ips = pickIpsFromLogs(logs).slice(0, 5);
    global.__intelPendingIpCards = [];
    for (var i = 0; i < ips.length; i++) {
      var shell = renderIpIntelCardShell(ips[i]);
      html += shell.html;
      global.__intelPendingIpCards.push({ id: shell.id, ip: ips[i] });
    }
    return html;
  }

  global.intelFaviconFallback = intelFaviconFallback;
  global.intelShowSignupRecord = intelShowSignupRecord;
  global.intelPickDiscordEmail = pickDiscordEmail;
  global.intelBuildAutoEmailCardHtml = buildAutoEmailCardHtml;
  global.intelDerivePlatforms = intelDerivePlatforms;
  global.intelRenderSeonCards = renderSeonCards;
  global.intelSeonChipStatic = intelSeonChipStatic;
  global.intelBuildEmailSearchSummaryHtml = buildEmailSearchSummaryHtml;
  global.intelHydrateIpCard = intelHydrateIpCard;
  global.intelFlushPendingIpCards = intelFlushPendingIpCards;
})(typeof window !== 'undefined' ? window : globalThis);
