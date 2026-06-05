"use strict";
(function () {
    const workspace = document.getElementById("workspace");
    if (!workspace) {
        return;
    }

    // data-panel → 窓タイトル
    const titleMap = {
        about: "profile",
        projects: "featured",
        contact: "contacts",
    };

    // 開いてる窓。1セクション1つ
    const openWindows = new Map();

    let cascadeIndex = 0;

    // 初期位置。右端基準で下＋少し左に重ねる
    const RIGHT_MARGIN = 24;
    const TOP_BASE = 24;
    const CASCADE_STEP = 28;

    // タイトルバーでドラッグ。workspace 内に収める
    function makeDraggable(win, handle) {
        let startX = 0;
        let startY = 0;
        let startLeft = 0;
        let startTop = 0;
        let dragging = false;

        handle.addEventListener("pointerdown", function (event) {
            if (event.target.closest(".window-close")) return;

            dragging = true;
            startX = event.clientX;
            startY = event.clientY;
            startLeft = win.offsetLeft;
            startTop = win.offsetTop;
            handle.setPointerCapture(event.pointerId);
        });

        handle.addEventListener("pointermove", function (event) {
            if (!dragging) return;

            const dx = event.clientX - startX;
            const dy = event.clientY - startY;

            const maxLeft = Math.max(0, workspace.clientWidth - win.offsetWidth);
            const maxTop = Math.max(0, workspace.clientHeight - win.offsetHeight);

            const left = Math.min(Math.max(0, startLeft + dx), maxLeft);
            const top = Math.min(Math.max(0, startTop + dy), maxTop);

            win.style.left = left + "px";
            win.style.top = top + "px";
        });

        function endDrag(event) {
            if (!dragging) return;
            dragging = false;
            if (handle.hasPointerCapture(event.pointerId)) {
                handle.releasePointerCapture(event.pointerId);
            }
        }

        handle.addEventListener("pointerup", endDrag);
        handle.addEventListener("pointercancel", endDrag);
    }

    // DOM 追加後に呼ぶこと。追加前は offsetWidth=0 で右端計算がずれる
    function positionWindow(win) {
        const step = (cascadeIndex % 5) * CASCADE_STEP;

        // 収まらなければ左端
        const left = Math.max(
            0,
            workspace.clientWidth - win.offsetWidth - RIGHT_MARGIN - step
        );
        const top = TOP_BASE + step;

        win.style.left = left + "px";
        win.style.top = top + "px";
        cascadeIndex += 1;
    }

    function createWindow(name) {
        const panel = document.querySelector('[data-panel="' + name + '"]');
        if (!panel) {
            console.warn("panel not found for window: " + name);
            return null;
        }

        const win = document.createElement("section");
        win.className = "window";
        win.dataset.window = name;

        const titlebar = document.createElement("div");
        titlebar.className = "window-titlebar";

        const title = document.createElement("span");
        title.className = "window-title";
        title.textContent = titleMap[name] || name;

        const close = document.createElement("button");
        close.className = "window-close";
        close.type = "button";
        close.setAttribute("aria-label", "閉じる");
        close.textContent = "✕";

        titlebar.appendChild(title);
        titlebar.appendChild(close);

        const body = document.createElement("div");
        body.className = "window-body";

        // パネルを複製して中身だけ移す。タイトルは捨てる
        const clone = panel.cloneNode(true);
        const cloneTitle = clone.querySelector(".panel-title");
        if (cloneTitle) {
            cloneTitle.remove();
        }
        while (clone.firstChild) {
            body.appendChild(clone.firstChild);
        }

        win.appendChild(titlebar);
        win.appendChild(body);

        // 位置決めは openWindow 側

        close.addEventListener("click", function () {
            win.remove();
            openWindows.delete(name);
        });

        makeDraggable(win, titlebar);

        return win;
    }

    function openWindow(name) {
        if (openWindows.has(name)) {
            return;
        }
        const win = createWindow(name);
        if (!win) return;
        workspace.appendChild(win);
        positionWindow(win);
        openWindows.set(name, win);
    }

    function closeAllWindows() {
        openWindows.forEach(function (win) {
            win.remove();
        });
        openWindows.clear();
        cascadeIndex = 0;
    }

    // スマホ幅では全部閉じる。CSS で隠れても DOM には残るので
    const mql = window.matchMedia("(min-width: 768px)");
    mql.addEventListener("change", function (event) {
        if (!event.matches) {
            closeAllWindows();
        }
    });

    window.Windows = {
        open: openWindow,
        closeAll: closeAllWindows,
    };
})();
