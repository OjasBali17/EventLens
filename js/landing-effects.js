(() => {
    const scene = document.querySelector(".polaroid-experience");
    if (!scene) return;

    const reveals = scene.querySelectorAll(".landing-reveal");
    const actionLabel = scene.querySelector(".camera-action-label");
    let hasShot = false;

    const playShutter = () => {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        try {
            const context = new AudioContext();
            const duration = 0.055;
            const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate);
            const samples = buffer.getChannelData(0);
            for (let i = 0; i < samples.length; i += 1) {
                const fade = 1 - i / samples.length;
                samples[i] = (Math.random() * 2 - 1) * fade;
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
            // The camera animation still plays if the browser blocks audio.
        }
    };

    const takeShot = () => {
        if (hasShot) return;
        hasShot = true;
        reveals.forEach((item) => item.classList.add("is-visible"));
        scene.classList.add("is-shot");
        if (actionLabel) actionLabel.textContent = "YOUR PHOTO IS READY";
        playShutter();
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
        takeShot();
    }
})();
