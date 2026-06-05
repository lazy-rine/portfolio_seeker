"use strict";
(function () {
    // ヘッダーは PC のみ
    const dateEl = document.querySelector(".header-date p");
    const timeEl = document.querySelector(".header-time p");

    if (!dateEl && !timeEl) {
        return;
    }

    const TIME_SEP = ":";

    function pad2(n) {
        return String(n).padStart(2, "0");
    }

    function update() {
        const now = new Date();

        if (dateEl) {
            const year = now.getFullYear();
            const month = pad2(now.getMonth() + 1);
            const day = pad2(now.getDate());
            dateEl.textContent = year + "/" + month + "/" + day;
        }

        if (timeEl) {
            const hours = pad2(now.getHours());
            const minutes = pad2(now.getMinutes());
            const seconds = pad2(now.getSeconds());
            timeEl.textContent = hours + TIME_SEP + minutes + TIME_SEP + seconds;
        }
    }

    update();
    setInterval(update, 1000);
})();
