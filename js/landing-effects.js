(() => {
    const scene = document.querySelector(".polaroid-experience");
    if (!scene) return;

    const reveals = scene.querySelectorAll(".landing-reveal");
    const actionLabel = scene.querySelector(".camera-action-label");
    const scrollInstruction = document.querySelector("#scrollInstruction");
    const print = scene.querySelector(".instant-print");
    const printCaption = print?.querySelector(".print-caption > span");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let hasShot = false;
    let isPrinting = false;
    let shotScrollY = 0;

    const setLabel = (message) => {
        if (actionLabel) actionLabel.textContent = message;
        if (scrollInstruction) scrollInstruction.innerHTML = `${message} <b aria-hidden="true">↓</b>`;
    };

    const playShutter = () => {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        try {
            const context = new AudioContext();
            const duration = 0.055;
            const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate);
            const samples = buffer.getChannelData(0);
            for (let i = 0; i < samples.length; i += 1) {
                samples[i] = (Math.random() * 2 - 1) * (1 - i / samples.length);
            }
            const source = context.createBufferSource();
            const filter = context.createBiquadFilter();
            const gain = context.createGain();
            source.buffer = buffer;
            filter.type = "highpass";
            filter.frequency.value = 1200;
            gain.gain.value = 0.075;
            source.connect(filter);
            filter.connect(gain);
            gain.connect(context.destination);
            source.onended = () => context.close();
            source.start();
        } catch (_) {
            // The visual shutter still works when the browser blocks audio.
        }
    };

    const finishDevelopment = () => {
        print?.classList.remove("is-developing");
        print?.classList.add("is-developed");
        if (printCaption) printCaption.textContent = "THE MOMENT IS YOURS";
        setLabel("YOUR PHOTO IS READY");
    };

    const startPrint = () => {
        if (isPrinting) return;
        isPrinting = true;
        window.removeEventListener("scroll", onFurtherScroll);
        scene.classList.add("is-printing");
        setLabel("PHOTO COMING THROUGH");
        window.setTimeout(() => {
            if (printCaption) printCaption.textContent = "DEVELOPING IN FULL COLOR";
            print?.classList.add("is-developing");
            if (reducedMotion) finishDevelopment();
            else window.setTimeout(finishDevelopment, 5600);
        }, reducedMotion ? 0 : 1050);
    };

    function onFurtherScroll() {
        if (!hasShot || isPrinting) return;
        const scrollNeeded = Math.max(150, Math.round(window.innerHeight * 0.24));
        if (window.scrollY >= shotScrollY + scrollNeeded) startPrint();
    }

    const takeShot = () => {
        if (hasShot) return;
        hasShot = true;
        shotScrollY = window.scrollY;
        reveals.forEach((item) => item.classList.add("is-visible"));
        scene.classList.add("is-shot");
        setLabel("KEEP SCROLLING TO PRINT");
        if (printCaption) printCaption.textContent = "WAITING FOR THE NEXT FRAME";
        playShutter();
        window.addEventListener("scroll", onFurtherScroll, { passive: true });
    };

    if ("IntersectionObserver" in window) {
        document.documentElement.classList.add("has-scroll-reveal");
        const observer = new IntersectionObserver((entries) => {
            if (!entries.some((entry) => entry.isIntersecting)) return;
            observer.disconnect();
            takeShot();
        }, { rootMargin: "0px 0px -10% 0px", threshold: 0.12 });
        observer.observe(scene);
    } else {
        const revealOnScroll = () => {
            if (scene.getBoundingClientRect().top < window.innerHeight * 0.9) {
                window.removeEventListener("scroll", revealOnScroll);
                takeShot();
            }
        };
        window.addEventListener("scroll", revealOnScroll, { passive: true });
    }
})();
