"use strict";
(function () {
    const canvas = document.getElementById("bg-net");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // const COLOR = "78, 201, 255"; // cyan の RGB
    const COLOR = "31, 102, 255"; // cyan の RGB

    const LINK_DIST = 130; // ノード同士を線で結ぶ距離
    const MOUSE_DIST = 160; // カーソルと結ぶ距離
    const SPEED = 0.15; // 1フレームの最大移動量
    const FRAME_MS = 1000 / 40; // ~40fps

    // マウス連動は fine pointer の端末だけ
    const useMouse = window.matchMedia(
        "(hover: hover) and (pointer: fine)",
    ).matches;

    let nodes = [];
    let raf = null;
    let lastTs = 0;
    let w = 0;
    let h = 0;
    const mouse = { x: 0, y: 0, active: false };

    function reducedMotion() {
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }

    function rand(min, max) {
        return min + Math.random() * (max - min);
    }

    // 画面サイズからノード数を決める
    function nodeCount() {
        return Math.min(80, Math.max(24, Math.round((w * h) / 22000)));
    }

    function makeNodes() {
        const n = nodeCount();
        nodes = [];
        for (let i = 0; i < n; i++) {
            nodes.push({
                x: rand(0, w),
                y: rand(0, h),
                vx: rand(-SPEED, SPEED),
                vy: rand(-SPEED, SPEED),
            });
        }
    }

    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = window.innerWidth;
        h = window.innerHeight;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        canvas.style.width = w + "px";
        canvas.style.height = h + "px";
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        makeNodes();
    }

    function draw() {
        ctx.clearRect(0, 0, w, h);

        // 近いノード同士
        for (let i = 0; i < nodes.length; i++) {
            const a = nodes[i];
            for (let j = i + 1; j < nodes.length; j++) {
                const b = nodes[j];
                const dx = a.x - b.x;
                const dy = a.y - b.y;
                const dist = Math.hypot(dx, dy);
                if (dist < LINK_DIST) {
                    const alpha = (1 - dist / LINK_DIST) * 0.9;
                    ctx.strokeStyle = "rgba(" + COLOR + "," + alpha + ")";
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.stroke();
                }
            }
        }

        // カーソルと近いノード
        if (useMouse && mouse.active) {
            for (let i = 0; i < nodes.length; i++) {
                const p = nodes[i];
                const dist = Math.hypot(p.x - mouse.x, p.y - mouse.y);
                if (dist < MOUSE_DIST) {
                    const alpha = (1 - dist / MOUSE_DIST) * 0.9;
                    ctx.strokeStyle = "rgba(" + COLOR + "," + alpha + ")";
                    ctx.beginPath();
                    ctx.moveTo(mouse.x, mouse.y);
                    ctx.lineTo(p.x, p.y);
                    ctx.stroke();
                }
            }
            ctx.fillStyle = "rgba(" + COLOR + ",0.8)";
            ctx.beginPath();
            ctx.arc(mouse.x, mouse.y, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // ノード本体
        ctx.fillStyle = "rgba(" + COLOR + ",0.5)";
        for (let i = 0; i < nodes.length; i++) {
            const p = nodes[i];
            ctx.beginPath();
            ctx.arc(p.x, p.y, 1.3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function step(ts) {
        raf = requestAnimationFrame(step);
        // フレームレート制限
        if (ts - lastTs < FRAME_MS) return;
        lastTs = ts;

        for (let i = 0; i < nodes.length; i++) {
            const p = nodes[i];
            p.x += p.vx;
            p.y += p.vy;
            if (p.x <= 0 || p.x >= w) p.vx *= -1;
            if (p.y <= 0 || p.y >= h) p.vy *= -1;
        }
        draw();
    }

    function start() {
        if (raf === null) {
            raf = requestAnimationFrame(step);
        }
    }
    function stop() {
        if (raf !== null) {
            cancelAnimationFrame(raf);
            raf = null;
        }
    }

    if (useMouse) {
        window.addEventListener("pointermove", function (event) {
            mouse.x = event.clientX;
            mouse.y = event.clientY;
            mouse.active = true;
        });
        document.addEventListener("mouseleave", function () {
            mouse.active = false;
        });
        window.addEventListener("blur", function () {
            mouse.active = false;
        });
    }

    // リサイズはデバウンスして作り直す
    let resizeTimer = null;
    window.addEventListener("resize", function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            resize();
            if (reducedMotion()) draw();
        }, 200);
    });

    // タブが隠れている間は止める
    document.addEventListener("visibilitychange", function () {
        if (document.hidden) {
            stop();
        } else if (!reducedMotion()) {
            start();
        }
    });

    resize();
    if (reducedMotion()) {
        draw(); // 1枚だけ描いて止める
    } else {
        start();
    }
})();
