/* Thinking-orb loading indicators for the AI panel.
 *
 * `thinking-orbs` (MIT) ships a React component, but this panel is vanilla
 * HTML/JS with no bundler — so we drive the package's framework-agnostic
 * `engine` export directly. The loop below mirrors the official component:
 * DPR clamped to 2, t = performance.now()/1000 * preset speed, clear+repaint
 * each frame, and a single static frame when reduced motion is requested.
 *
 * Usage (markup):   <span class="ai-orb" data-orb="searching" data-orb-size="20"></span>
 * then:             ThinkingOrb.mountAll(container)
 */
import { resolvePreset, MODE_DRAWS } from 'thinking-orbs-engine.js';

var VALID_STATES = {
    working: 1, searching: 1, solving: 1, listening: 1, connecting: 1,
    weaving: 1, composing: 1, breathing: 1, shaping: 1
};

function reducedMotion() {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
    catch (e) { return false; }
}

/* Map a live agent step message onto the closest shipped orb state. */
function stateForStep(msg) {
    var m = String(msg || '').toLowerCase();
    if (/search|look ?up|query|scan|probe|fetch/.test(m)) return 'searching';
    if (/connect|pivot|link|correlat|cross|match/.test(m)) return 'connecting';
    if (/read|pars|analy|review|inspect|verify|check/.test(m)) return 'solving';
    if (/writ|compos|draft|report|summar|assembl/.test(m)) return 'composing';
    return 'working';
}

function mount(el, o) {
    if (!el) return null;
    o = o || {};
    var state = VALID_STATES[o.state] ? o.state : 'working';
    // Only two tuned sizes ship; they are separate designs, not a scale factor.
    var size = (Number(o.size) === 64) ? 64 : 20;
    var dark = o.dark !== false;

    var ctx;
    var canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    canvas.style.display = 'block';

    var dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);

    try { ctx = canvas.getContext('2d'); } catch (e) { return null; }
    if (!ctx) return null;

    el.innerHTML = '';
    el.appendChild(canvas);

    var raf = 0, running = false, cur = null;

    function use(st) {
        var r = resolvePreset(st, size);
        cur = { draw: MODE_DRAWS[r.mode], speed: r.speed, opts: r.opts };
    }
    function frame(t) {
        if (!cur || !cur.draw) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, size, size);
        cur.draw(ctx, size, t, dark, cur.opts);
    }
    function loop() {
        // The AI thread rebuilds its innerHTML as steps arrive, orphaning old
        // orbs — self-terminate instead of leaking a rAF loop per step.
        if (!el.isConnected) { stop(); return; }
        frame(performance.now() / 1000 * cur.speed);
        if (running) raf = requestAnimationFrame(loop);
    }
    function start() {
        if (running) return;
        if (reducedMotion()) { frame(0.6); return; }
        running = true;
        raf = requestAnimationFrame(loop);
    }
    function stop() {
        running = false;
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
    }

    use(state);
    start();

    var handle = {
        el: el,
        state: state,
        setState: function (st) {
            if (!VALID_STATES[st] || st === handle.state) return;
            handle.state = st;
            use(st);
            start();
        },
        destroy: function () {
            stop();
            try { el.removeChild(canvas); } catch (e) {}
            try { delete el.__orb; } catch (e) { el.__orb = null; }
        }
    };
    el.__orb = handle;
    return handle;
}

/* Mount every [data-orb] under `root` that isn't already running. */
function mountAll(root) {
    var scope = root && root.querySelectorAll ? root : document;
    var list = scope.querySelectorAll('[data-orb]');
    for (var i = 0; i < list.length; i++) {
        var el = list[i];
        if (el.__orb) continue;
        mount(el, {
            state: el.getAttribute('data-orb'),
            size: Number(el.getAttribute('data-orb-size')) || 20
        });
    }
}

window.ThinkingOrb = { mount: mount, mountAll: mountAll, stateForStep: stateForStep };
