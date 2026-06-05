"use strict";
(function () {
    const container = document.getElementById("command");
    if (!container) {
        return;
    }

    // contacts は contact の別名
    const panelMap = {
        about: "about",
        projects: "projects",
        contact: "contact",
        contacts: "contact",
    };

    const MAX_PANELS = 3;

    // 表示中パネル(先頭=古い)
    const shownPanels = [];

    // スマホのボタン用タイプ演出
    const TYPE_INTERVAL = 60;
    const SUBMIT_DELAY = 150;
    let isTyping = false;

    // コマンド履歴(古い→新しい)と ↑↓ のナビ位置(null=ナビ中でない)
    const commandHistory = [];
    let historyIndex = null;

    function isMobile() {
        return !window.matchMedia("(min-width: 768px)").matches;
    }

    function prefersReducedMotion() {
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }

    // スマホはキーボードを出したくないのでフォーカスしない
    function focusInput(input) {
        if (isMobile()) return;
        if (input) input.focus({ preventScroll: true });
    }

    function createInputLine() {
        const line = document.createElement("p");
        line.className = "boot-content-muted";

        const promptSpan = document.createElement("span");
        promptSpan.className = "prompt entered";
        promptSpan.textContent = "$";

        const input = document.createElement("input");
        input.type = "text";
        input.id = "terminal-input";
        input.className = "terminal-input";
        input.autocomplete = "off";
        input.spellcheck = false;
        input.setAttribute("aria-label", "コマンド入力");

        line.appendChild(promptSpan);
        line.appendChild(document.createTextNode(" "));
        line.appendChild(input);
        return line;
    }

    // textContent なのでタグは文字として入る
    function createOutputLine(text) {
        const line = document.createElement("p");
        line.className = "boot-content-muted";
        line.textContent = text;
        return line;
    }

    // boot の高さに収まるよう、はみ出している間は古い行(先頭)から削る。
    // 入力行は末尾なので最低1行は残す。clientHeight が 0(非表示など)のときは触らない。
    function trimScrollback() {
        if (isMobile()) return;

        if (container.clientHeight <= 0) return;
        while (
            container.scrollHeight > container.clientHeight &&
            container.children.length > 1
        ) {
            container.removeChild(container.firstElementChild);
        }
    }

    // side-area の末尾に移して表示。上限超過分は古い方から隠す
    function revealPanel(name) {
        const panel = document.querySelector('[data-panel="' + name + '"]');
        if (!panel) {
            console.warn("panel not found: " + name);
            return;
        }

        if (shownPanels.includes(name)) {
            return;
        }

        const sideArea = document.querySelector(".side-area");
        if (!sideArea) {
            console.warn("side-area not found");
            return;
        }

        sideArea.appendChild(panel);
        panel.hidden = false;
        shownPanels.push(name);

        while (shownPanels.length > MAX_PANELS) {
            const oldestName = shownPanels.shift();
            const oldest = document.querySelector(
                '[data-panel="' + oldestName + '"]',
            );
            if (oldest) {
                oldest.hidden = true;
            }
        }
    }

    // PC 幅に変わったとき、スマホで開いたパネルを畳む用
    function hideAllPanels() {
        shownPanels.forEach(function (name) {
            const panel = document.querySelector('[data-panel="' + name + '"]');
            if (panel) {
                panel.hidden = true;
            }
        });
        shownPanels.length = 0;
    }

    // テキスト出力系コマンド。出力行(string)の配列を返す
    function runCommand(command) {
        const cmd = command.toLowerCase();

        if (cmd === "help" || cmd === "?") {
            return [
                "available commands:",
                "about, projects, contact - open sections",
                "ls - list sections",
                "whoami - print user",
                "pwd - print path",
                "date - print date/time",
                "clear - clear the terminal",
                "help, ? - show this help",
            ];
        }

        if (cmd === "ls") {
            return ["about  projects  contact"];
        }

        if (cmd === "whoami") {
            return ["seeker"];
        }

        if (cmd === "pwd") {
            return ["~/"];
        }

        if (cmd === "date") {
            const d = new Date();
            const p = function (n) {
                return String(n).padStart(2, "0");
            };
            return [
                d.getFullYear() +
                    "/" +
                    p(d.getMonth() + 1) +
                    "/" +
                    p(d.getDate()) +
                    " " +
                    p(d.getHours()) +
                    ":" +
                    p(d.getMinutes()) +
                    ":" +
                    p(d.getSeconds()),
            ];
        }

        return [
            "command not found: " + command,
            "type 'help' to see available commands.",
        ];
    }

    // ↑↓ で履歴を呼び戻す
    function navigateHistory(input, dir) {
        if (commandHistory.length === 0) return;

        if (dir < 0) {
            // 古い方へ
            if (historyIndex === null) {
                historyIndex = commandHistory.length - 1;
            } else {
                historyIndex = Math.max(0, historyIndex - 1);
            }
        } else {
            // 新しい方へ。末尾を超えたら空に戻す
            if (historyIndex === null) return;
            historyIndex += 1;
            if (historyIndex >= commandHistory.length) {
                historyIndex = null;
                input.value = "";
                return;
            }
        }

        input.value = commandHistory[historyIndex];
        const end = input.value.length;
        input.setSelectionRange(end, end);
    }

    // Enter / ボタン共通。入力欄を確定 → 対応処理 → 新しい入力行
    function submitCommand(commandText) {
        const command = commandText.trim();
        if (command === "") return;

        // 履歴に積む(直前と同じなら積まない)。ナビ位置はリセット
        if (commandHistory[commandHistory.length - 1] !== command) {
            commandHistory.push(command);
        }
        historyIndex = null;

        const input = document.getElementById("terminal-input");
        if (!input) return;
        const inputLine = input.closest("p");
        if (!inputLine) return;

        // 入力欄を確定テキストに差し替え
        const commandSpan = document.createElement("span");
        commandSpan.textContent = command;
        input.replaceWith(commandSpan);

        const lower = command.toLowerCase();

        // ターミナルだけ消す。パネルは残す
        if (lower === "clear") {
            container.textContent = "";
            const freshLine = createInputLine();
            container.appendChild(freshLine);
            focusInput(freshLine.querySelector("input"));
            return;
        }

        // スマホ=パネル展開 / PC=窓
        if (Object.prototype.hasOwnProperty.call(panelMap, lower)) {
            const name = panelMap[lower];
            if (isMobile()) {
                revealPanel(name);
            } else if (
                window.Windows &&
                typeof window.Windows.open === "function"
            ) {
                window.Windows.open(name);
            } else {
                // window.js 未読み込み時のフォールバック
                revealPanel(name);
            }
        } else {
            const outputs = runCommand(command);
            for (const text of outputs) {
                container.appendChild(createOutputLine(text));
            }
        }

        const newLine = createInputLine();
        container.appendChild(newLine);
        trimScrollback();
        focusInput(newLine.querySelector("input"));
    }

    // スマホのボタン用。入力欄ではなく専用 span に打ち、カーソルを文字末尾に追従させる。
    // 打ち終わったら submitCommand に渡す
    function runWithTyping(commandText) {
        const command = (commandText || "").trim();
        if (command === "") return;

        if (prefersReducedMotion()) {
            submitCommand(command);
            return;
        }

        if (isTyping) return;

        const input = document.getElementById("terminal-input");
        if (!input) {
            submitCommand(command);
            return;
        }
        const line = input.closest("p");
        if (!line) {
            submitCommand(command);
            return;
        }

        isTyping = true;

        // typing クラスで $ 直後の固定カーソルを止める
        line.classList.add("typing");
        const typed = document.createElement("span");
        typed.className = "terminal-typed";
        line.insertBefore(typed, input);

        let i = 0;

        function cleanup() {
            if (typed.parentNode) {
                typed.remove();
            }
            line.classList.remove("typing");
        }

        const timer = setInterval(function () {
            // clear や幅変更で入力欄が消えたら中断
            if (!document.body.contains(input)) {
                clearInterval(timer);
                cleanup();
                isTyping = false;
                return;
            }

            i += 1;
            typed.textContent = command.slice(0, i);

            if (i >= command.length) {
                clearInterval(timer);
                setTimeout(function () {
                    isTyping = false;
                    if (document.body.contains(input)) {
                        // span を消してから確定。同期なのでちらつかない
                        cleanup();
                        submitCommand(command);
                    } else {
                        cleanup();
                    }
                }, SUBMIT_DELAY);
            }
        }, TYPE_INTERVAL);
    }

    const firstInput = document.getElementById("terminal-input");
    focusInput(firstInput);

    // ターミナル領域内のクリックだけ入力欄にフォーカスを戻す。
    // パネル側で奪うと、スマホで上にスクロールしてしまう
    document.addEventListener("click", function (event) {
        if (!event.target.closest(".terminal-area")) {
            return;
        }
        focusInput(document.getElementById("terminal-input"));
    });

    // 入力欄は作り直されるのでイベント委譲
    container.addEventListener("keydown", function (event) {
        const input = event.target;

        if (!input.classList.contains("terminal-input")) return;
        if (event.isComposing) return;

        if (event.key === "ArrowUp") {
            event.preventDefault();
            navigateHistory(input, -1);
            return;
        }
        if (event.key === "ArrowDown") {
            event.preventDefault();
            navigateHistory(input, 1);
            return;
        }

        if (event.key !== "Enter") return;

        event.preventDefault();

        const command = input.value.trim();

        if (command === "") {
            input.value = "";
            return;
        }

        submitCommand(command);
    });

    // PC 幅に変わったらスマホで開いたパネルを畳む
    const mql = window.matchMedia("(min-width: 768px)");
    mql.addEventListener("change", function (event) {
        if (event.matches) {
            hideAllPanels();
        }
    });

    // 高さが変わったとき(リサイズ・表示開始・行追加)に収まるよう詰め直す。
    // rAF でまとめて、削除→再計測のループが暴れないようにする。
    let trimScheduled = false;
    function scheduleTrim() {
        if (trimScheduled) return;
        trimScheduled = true;
        requestAnimationFrame(function () {
            trimScheduled = false;
            trimScrollback();
        });
    }
    if (typeof ResizeObserver === "function") {
        new ResizeObserver(scheduleTrim).observe(container);
    } else {
        window.addEventListener("resize", scheduleTrim);
    }

    // 外部(nav.js)用。run=即確定 / runTyped=タイプ演出付き
    window.Terminal = {
        run: submitCommand,
        runTyped: runWithTyping,
    };
})();
