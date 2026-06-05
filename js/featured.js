"use strict";
(function () {
    const list = document.querySelector(".featured-list");
    if (!list) {
        return;
    }

    const rows = list.querySelectorAll(".featured-row");

    // 最初は全部閉じた状態にする
    rows.forEach(function (row) {
        row.setAttribute("aria-expanded", "false");
    });

    // 行クリックで開閉
    document.addEventListener("click", function (event) {
        // 行(またはその中)のクリックだけ拾う。detail 内のリンクは対象外
        const row = event.target.closest(".featured-row");
        if (!row || !row.closest(".featured-list")) {
            return;
        }

        const item = row.closest(".featured-item");
        if (!item) {
            return;
        }

        const isOpen = item.classList.contains("open");
        if (isOpen) {
            item.classList.remove("open");
            row.setAttribute("aria-expanded", "false");
        } else {
            item.classList.add("open");
            row.setAttribute("aria-expanded", "true");
        }
    });
})();
