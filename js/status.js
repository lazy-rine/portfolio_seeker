"use strict";
(function () {
    const uptimeEl = document.getElementById("stat-uptime");
    const cpuEl = document.getElementById("stat-cpu");
    const memEl = document.getElementById("stat-mem");

    if (!uptimeEl && !cpuEl && !memEl) {
        return;
    }

    const start = Date.now();

    // ダミー値。実測じゃない
    let cpu = 8;
    let mem = 42;

    function pad2(n) {
        return String(n).padStart(2, "0");
    }

    function clamp(v, lo, hi) {
        return Math.min(hi, Math.max(lo, v));
    }

    function tick() {
        if (uptimeEl) {
            const sec = Math.floor((Date.now() - start) / 1000);
            const h = Math.floor(sec / 3600);
            const m = Math.floor((sec % 3600) / 60);
            const s = sec % 60;
            uptimeEl.textContent = pad2(h) + ":" + pad2(m) + ":" + pad2(s);
        }

        // ランダムウォークで揺らす
        cpu = clamp(cpu + (Math.random() * 8 - 4), 2, 55);
        mem = clamp(mem + (Math.random() * 4 - 2), 28, 72);

        if (cpuEl) cpuEl.textContent = Math.round(cpu) + "%";
        if (memEl) memEl.textContent = Math.round(mem) + "%";
    }

    tick();
    setInterval(tick, 1000);
})();