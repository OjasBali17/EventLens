(() => {
    const palette = ["#FFC933", "#FF4F9A", "#22C99A", "#3DB9FF", "#7B3FF2", "#EDE4FF"];
    const fields = document.querySelectorAll(".polka-field");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    fields.forEach((field) => {
        if (field.dataset.ready) return;
        field.dataset.ready = "true";
        const count = window.matchMedia("(max-width: 700px)").matches ? 22 : 38;

        for (let index = 0; index < count; index += 1) {
            const dot = document.createElement("span");
            const size = 10 + Math.random() * (window.innerWidth < 700 ? 28 : 58);
            dot.className = "polka-dot";
            dot.style.setProperty("--dot-x", `${Math.random() * 98}%`);
            dot.style.setProperty("--dot-y", `${Math.random() * 96}%`);
            dot.style.setProperty("--dot-size", `${size.toFixed(0)}px`);
            dot.style.setProperty("--dot-color", palette[Math.floor(Math.random() * palette.length)]);
            dot.style.setProperty("--dot-delay", `${(Math.random() * (reducedMotion ? 0 : 1.2)).toFixed(2)}s`);
            dot.style.setProperty("--dot-duration", `${(0.35 + Math.random() * 0.7).toFixed(2)}s`);
            field.appendChild(dot);
        }
    });
})();
