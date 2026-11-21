/*
 * Byte — IntelByte's sidekick, drawn from the spy mark (fedora, face slit, collar).
 * Panel copy; the homepage keeps an inline twin so it never depends on this file.
 *
 *   <span data-byte></span>                     idle: blinks
 *   <span data-byte data-byte-look="pointer">   pupils follow the cursor
 *   <span data-byte data-byte-float>            gentle hover bob
 *   <span data-byte data-byte-state="think">    loader: pupils scan, hat nods
 *   <span data-byte data-byte-static>           no motion at all (message avatars)
 *
 * window.IBByte.mountAll(root)  upgrades new [data-byte] nodes (call after innerHTML)
 * window.IBByte.mood(el, 'happy' | 'wow' | 'sleep' | '', ms)
 */
(function () {
    if (window.IBByte) return;

    var CSS = [
        '.ibb{display:inline-block;position:relative;line-height:0;flex:none}',
        '.ibb svg{width:100%;height:100%;overflow:visible;display:block}',
        '.ibb-float{animation:ibbBob 3.4s ease-in-out infinite;transform-box:view-box;transform-origin:50px 70px}',
        '@keyframes ibbBob{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-3.5px) rotate(-2deg)}}',
        '.ibb-eyes-open{transform-box:fill-box;transform-origin:center;transition:transform .08s,opacity .15s}',
        '.ibb.is-blink .ibb-eyes-open{transform:scaleY(.1)}',
        '.ibb-pupils{transition:transform .18s ease-out}',
        '.ibb-eyes-happy,.ibb-eyes-sleep,.ibb-eyes-wow{opacity:0;transition:opacity .15s}',
        '.ibb-eyes-happy path,.ibb-eyes-sleep path{fill:none;stroke:#0b0b0d;stroke-width:2.6;stroke-linecap:round}',
        '.ibb.is-happy .ibb-eyes-open,.ibb.is-sleep .ibb-eyes-open,.ibb.is-wow .ibb-eyes-open{opacity:0}',
        '.ibb.is-happy .ibb-eyes-happy,.ibb.is-sleep .ibb-eyes-sleep,.ibb.is-wow .ibb-eyes-wow{opacity:1}',
        '.ibb-hat{transform-box:view-box;transform-origin:18px 46px;transition:transform .5s cubic-bezier(.34,1.56,.64,1)}',
        '.ibb.is-hello .ibb-hat{transform:translate(-1px,-9px) rotate(-13deg)}',
        '.ibb-nod{transform-box:view-box;transform-origin:50px 44px}',
        /* thinking: eyes scan the case left → right, hat bobs like he is reading */
        '.ibb[data-byte-state="think"] .ibb-pupils{animation:ibbScan 1.6s ease-in-out infinite}',
        '@keyframes ibbScan{0%,100%{transform:translate(-3.2px,0)}45%,55%{transform:translate(3.2px,.4px)}}',
        '.ibb[data-byte-state="think"] .ibb-nod{animation:ibbNod .8s ease-in-out infinite alternate}',
        '@keyframes ibbNod{to{transform:translateY(-1.8px) rotate(-3deg)}}',
        '.ibb[data-byte-state="think"] .ibb-float{animation:ibbBob 1.6s ease-in-out infinite}',
        '@media (prefers-reduced-motion:reduce){.ibb *{animation:none!important}}'
    ].join('\n');

    var uid = 0;
    function svg() {
        var n = ++uid, skin = 'ibbSkin' + n, clip = 'ibbClip' + n, shade = 'ibbShade' + n;
        var eyeL = 'M32.5 50.5 Q40 43.6 47.5 50.5 Q40 57.4 32.5 50.5 Z', eyeR = 'M52.5 50.5 Q60 43.6 67.5 50.5 Q60 57.4 52.5 50.5 Z';
        return '<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">' +
            '<defs>' +
            '<linearGradient id="' + skin + '" gradientUnits="userSpaceOnUse" x1="25" y1="5" x2="75" y2="97"><stop offset="0" stop-color="#fff"/><stop offset=".6" stop-color="#ececec"/><stop offset="1" stop-color="#bdbdbd"/></linearGradient>' +
            '<linearGradient id="' + shade + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".3"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>' +
            '<clipPath id="' + clip + '"><path d="' + eyeL + '"/><path d="' + eyeR + '"/></clipPath>' +
            '</defs>' +
            '<g class="ibb-float">' +
            '<path d="M15.5 58.5 L29 55.5 L71 55 L85 56.5 L76.5 69.5 L86 77 Q73 95.5 50 95.5 Q27 95.5 13.5 79.5 L28.5 70 Z" fill="url(#' + skin + ')"/>' +
            '<rect x="27.5" y="43" width="45" height="14" fill="url(#' + skin + ')"/>' +
            '<rect x="27.5" y="43" width="45" height="4" fill="url(#' + shade + ')"/>' +
            '<g class="ibb-eyes-open">' +
            '<path d="' + eyeL + '" fill="#0b0b0d"/><path d="' + eyeR + '" fill="#0b0b0d"/>' +
            '<g clip-path="url(#' + clip + ')"><g class="ibb-pupils"><circle cx="42" cy="50.5" r="2.7" fill="#fff"/><circle cx="62" cy="50.5" r="2.7" fill="#fff"/></g></g>' +
            '</g>' +
            '<g class="ibb-eyes-happy"><path d="M33.5 52.5 Q40 45.5 46.5 52.5"/><path d="M53.5 52.5 Q60 45.5 66.5 52.5"/></g>' +
            '<g class="ibb-eyes-sleep"><path d="M34 50 Q40 53.5 46 50"/><path d="M54 50 Q60 53.5 66 50"/></g>' +
            '<g class="ibb-eyes-wow"><circle cx="40" cy="50.5" r="4.4" fill="#0b0b0d"/><circle cx="40" cy="50.5" r="1.6" fill="#fff"/><circle cx="60" cy="50.5" r="4.4" fill="#0b0b0d"/><circle cx="60" cy="50.5" r="1.6" fill="#fff"/></g>' +
            '<g class="ibb-nod"><g class="ibb-hat"><path d="M5.5 47.5 L26.5 39 L36.5 6.5 L48.5 19.5 L66.5 8.5 L73.5 38.5 L89 41.5 L73.5 45 Q50 47.8 26 46.6 Z" fill="url(#' + skin + ')"/></g></g>' +
            '</g></svg>';
    }

    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var followers = [];
    var blinkers = [];

    function mount(el) {
        if (!el || el.getAttribute('data-byte-on')) return;
        el.setAttribute('data-byte-on', '1');
        el.classList.add('ibb');
        el.innerHTML = svg();
        var still = el.hasAttribute('data-byte-static');
        if (!el.hasAttribute('data-byte-float') && el.getAttribute('data-byte-state') !== 'think') {
            var f = el.querySelector('.ibb-float');
            if (f) f.classList.remove('ibb-float');
        }
        if (still) return;
        blinkers.push(el);
        if (el.getAttribute('data-byte-look') === 'pointer') followers.push({ el: el, p: el.querySelector('.ibb-pupils') });
        var host = el.closest('a, button');
        if (host) {
            host.addEventListener('mouseenter', function () { el.classList.add('is-hello'); });
            host.addEventListener('mouseleave', function () { el.classList.remove('is-hello'); });
        }
    }
    function mountAll(root) {
        var list = (root || document).querySelectorAll('[data-byte]:not([data-byte-on])');
        for (var i = 0; i < list.length; i++) mount(list[i]);
    }
    var moodTimers = typeof WeakMap === 'function' ? new WeakMap() : null;
    function mood(el, m, ms) {
        if (!el) return;
        el.classList.remove('is-happy', 'is-wow', 'is-sleep');
        if (m) el.classList.add('is-' + m);
        if (moodTimers) {
            clearTimeout(moodTimers.get(el));
            if (m && ms) moodTimers.set(el, setTimeout(function () { el.classList.remove('is-' + m); }, ms));
        }
    }

    /* one blink clock for every live Byte on the page; detached ones are dropped */
    (function blinkLoop() {
        setTimeout(function () {
            blinkers = blinkers.filter(function (el) { return el.isConnected; });
            blinkers.forEach(function (el) {
                if (el.getAttribute('data-byte-state') === 'think' || el.offsetParent === null) return;
                if (Math.random() < 0.55) {
                    el.classList.add('is-blink');
                    setTimeout(function () { el.classList.remove('is-blink'); }, 110);
                }
            });
            blinkLoop();
        }, 2200 + Math.random() * 2600);
    })();

    /* pupils follow the pointer; at rest they glance sideways like the logo */
    if (!reduce && window.matchMedia && window.matchMedia('(hover: hover)').matches) {
        var pending = 0;
        window.addEventListener('mousemove', function (e) {
            if (pending) return;
            pending = requestAnimationFrame(function () {
                pending = 0;
                followers = followers.filter(function (f) { return f.el.isConnected; });
                followers.forEach(function (f) {
                    if (f.el.offsetParent === null || f.el.classList.contains('is-sleep')) return;
                    var r = f.el.getBoundingClientRect();
                    var x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
                    var d = Math.max(1, Math.hypot(x, y)), k = Math.min(1, d / 260);
                    f.p.style.transform = 'translate(' + (-1.5 + x / d * 3.3 * k).toFixed(2) + 'px,' + (y / d * 1.1 * k).toFixed(2) + 'px)';
                });
            });
        }, { passive: true });
    }

    function boot() {
        if (!document.getElementById('ibb-style')) {
            var st = document.createElement('style');
            st.id = 'ibb-style';
            st.textContent = CSS;
            document.head.appendChild(st);
        }
        mountAll(document);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();

    window.IBByte = { mount: mount, mountAll: mountAll, mood: mood, svg: svg };
})();
