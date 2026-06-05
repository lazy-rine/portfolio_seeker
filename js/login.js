"use strict";
(function () {
    const screen = document.getElementById("login-screen");
    if (!screen) {
        return;
    }

    // sessionStorage = タブを閉じるまで保持
    const SESSION_KEY = "seekerLoginShown";

    const USERNAME = "seeker";
    const PASSWORD_LENGTH = 8;
    const MASK_CHAR = "\u2022"; // •

    const TYPE_INTERVAL = 90;
    const STEP_PAUSE = 450;
    const FADE_AFTER = 700; // access granted からフェードまで

    const userEl = document.getElementById("login-user");
    const passLine = document.getElementById("login-pass-line");
    const passEl = document.getElementById("login-pass");
    const statusEl = document.getElementById("login-status");

    function isMobile() {
        return !window.matchMedia("(min-width: 768px)").matches;
    }
    function prefersReducedMotion() {
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }

    function markShown() {
        // プライベートモードだと投げる
        try {
            sessionStorage.setItem(SESSION_KEY, "1");
        } catch (e) {}
    }

    // pre-login を外すと #command が出て boot アニメが頭から走る
    function revealBoot() {
        document.documentElement.classList.remove("pre-login");
    }

    function focusTerminal() {
        if (isMobile()) return;
        const input = document.getElementById("terminal-input");
        if (input) {
            input.focus({ preventScroll: true });
        }
    }

    function finish() {
        markShown();
        revealBoot();

        screen.classList.add("login-done");

        // transitionend が来ない場合の保険
        let done = false;
        function hideOverlay() {
            if (done) return;
            done = true;
            screen.hidden = true;
            focusTerminal();
        }
        screen.addEventListener("transitionend", hideOverlay, { once: true });
        setTimeout(hideOverlay, 800);
    }

    function typeInto(el, text, done) {
        el.classList.add("typing");
        let i = 0;
        const timer = setInterval(function () {
            i += 1;
            el.textContent = text.slice(0, i);
            if (i >= text.length) {
                clearInterval(timer);
                el.classList.remove("typing");
                done();
            }
        }, TYPE_INTERVAL);
    }

    // user → password → 認証 → フェード
    function runSequence() {
        typeInto(userEl, USERNAME, function () {
            setTimeout(function () {
                passLine.hidden = false;
                const masked = MASK_CHAR.repeat(PASSWORD_LENGTH);
                typeInto(passEl, masked, function () {
                    setTimeout(function () {
                        statusEl.hidden = false;
                        statusEl.textContent = "authenticating...";
                        setTimeout(function () {
                            // 固定文字列なので innerHTML で問題ない
                            statusEl.innerHTML =
                                '[<span class="ok">OK</span>] access granted';
                            setTimeout(finish, FADE_AFTER);
                        }, STEP_PAUSE);
                    }, STEP_PAUSE);
                });
            }, STEP_PAUSE);
        });
    }

    // 要素が欠けていたら演出せず素通し
    if (!userEl || !passLine || !passEl || !statusEl) {
        revealBoot();
        screen.hidden = true;
        return;
    }

    let alreadyShown = false;
    try {
        alreadyShown = !!sessionStorage.getItem(SESSION_KEY);
    } catch (e) {
        alreadyShown = false;
    }

    // 表示済みならスキップ
    if (alreadyShown) {
        focusTerminal();
        return;
    }

    // reduced-motion: 完成形だけ出して即フェード
    if (prefersReducedMotion()) {
        userEl.textContent = USERNAME;
        passLine.hidden = false;
        passEl.textContent = MASK_CHAR.repeat(PASSWORD_LENGTH);
        statusEl.hidden = false;
        statusEl.innerHTML = '[<span class="ok">OK</span>] access granted';
        finish();
        return;
    }

    runSequence();
})();
