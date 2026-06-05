"use strict";
(function () {
    const actionToCommand = {
        about: "about",
        projects: "projects",
        contact: "contact",
        // home / settings はコマンド無し
    };

    function isMobile() {
        return !window.matchMedia("(min-width: 768px)").matches;
    }

    const navButtons = document.querySelectorAll("nav button[data-action]");
    navButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            // PC では何もしない
            if (!isMobile()) return;

            const command = actionToCommand[button.dataset.action];
            if (!command) return;

            // タイプ演出付き。無ければ即実行
            if (window.Terminal && typeof window.Terminal.runTyped === "function") {
                window.Terminal.runTyped(command);
            } else if (
                window.Terminal &&
                typeof window.Terminal.run === "function"
            ) {
                window.Terminal.run(command);
            } else {
                console.warn("Terminal API not available");
            }
        });
    });
})();
