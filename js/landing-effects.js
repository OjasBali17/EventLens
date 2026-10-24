(() => {
    const reveals = document.querySelectorAll(".landing-reveal");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion || !("IntersectionObserver" in window)) {
        reveals.forEach((item) => item.classList.add("is-visible"));
        return;
    }

    document.documentElement.classList.add("has-scroll-reveal");
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
        });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });

    reveals.forEach((item) => observer.observe(item));
})();
