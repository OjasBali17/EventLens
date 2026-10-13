const cursor = document.querySelector(".cursor");

if (cursor) {
    document.addEventListener("mousemove", (e) => {
        cursor.style.left = `${e.clientX}px`;
        cursor.style.top = `${e.clientY}px`;
    });

    document.querySelectorAll("a, button").forEach((element) => {
        element.addEventListener("mouseenter", () => {
            cursor.style.width = "18px";
            cursor.style.height = "18px";
        });

        element.addEventListener("mouseleave", () => {
            cursor.style.width = "8px";
            cursor.style.height = "8px";
        });
    });
}

const revealElements = document.querySelectorAll(
    ".statement-content, .process-item, .closing h2, .hero-content"
);

const observer = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = "1";
                entry.target.style.transform = "translateY(0)";
            }
        });
    },
    {
        threshold: 0.15
    }
);

revealElements.forEach((element) => {
    element.style.opacity = "0";
    element.style.transform = "translateY(35px)";
    element.style.transition =
        "opacity 0.9s ease, transform 0.9s cubic-bezier(.16,1,.3,1)";
    observer.observe(element);
});