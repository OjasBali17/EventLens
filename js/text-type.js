(() => {
    const headings = [...document.querySelectorAll("h1, h2")].filter((heading) => {
        return Number.parseFloat(getComputedStyle(heading).fontSize) >= 28;
    });
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function collect(node, baseColor, inheritedColor, result) {
        if (node.nodeType === Node.TEXT_NODE) {
            for (const character of node.nodeValue) result.push({ character, color: inheritedColor });
            return;
        }

        if (node.nodeType !== Node.ELEMENT_NODE) return;
        if (node.tagName === "BR") {
            result.push({ lineBreak: true, color: inheritedColor });
            return;
        }

        const ownColor = getComputedStyle(node).color;
        const color = ownColor && ownColor !== baseColor ? ownColor : inheritedColor;
        node.childNodes.forEach((child) => collect(child, baseColor, color, result));
    }

    function normalize(items) {
        const output = [];
        let pendingSpace = false;

        for (const item of items) {
            if (item.lineBreak) {
                while (output.at(-1)?.character === " ") output.pop();
                pendingSpace = false;
                if (output.length && output.at(-1)?.character !== "\n") output.push({ character: "\n", color: item.color });
                continue;
            }

            if (/\s/.test(item.character)) {
                pendingSpace = true;
                continue;
            }

            if (pendingSpace && output.length && output.at(-1)?.character !== "\n") {
                output.push({ character: " ", color: item.color });
            }
            pendingSpace = false;
            output.push(item);
        }

        while ([" ", "\n"].includes(output.at(-1)?.character)) output.pop();
        return output;
    }

    function startTyping(heading) {
        if (heading.dataset.textTypeReady) return;
        heading.dataset.textTypeReady = "true";

        const baseColor = getComputedStyle(heading).color;
        const pieces = [];
        heading.childNodes.forEach((child) => collect(child, baseColor, null, pieces));
        const characters = normalize(pieces);
        const fullText = characters.map((item) => item.character).join("");
        const accessibleText = document.createElement("span");
        const visualText = document.createElement("span");
        accessibleText.className = "text-type__sr";
        accessibleText.textContent = fullText.replace(/\n/g, " ");
        visualText.className = "text-type__content";
        visualText.setAttribute("aria-hidden", "true");
        heading.classList.add("text-type");
        heading.setAttribute("aria-label", accessibleText.textContent);
        heading.replaceChildren(accessibleText, visualText);

        const glyphs = characters.map(({ character, color }) => {
            if (character === "\n" || character === " ") return document.createTextNode(character);
            const glyph = document.createElement("span");
            glyph.className = "text-type__char";
            glyph.textContent = character;
            if (color) glyph.style.color = color;
            return glyph;
        });

        if (reduceMotion) {
            visualText.append(...glyphs);
            return;
        }

        const cursor = document.createElement("span");
        cursor.className = "text-type__cursor";
        visualText.append(cursor);
        let position = 0;

        const typeNext = () => {
            if (position >= glyphs.length) return;
            const glyph = glyphs[position];
            visualText.insertBefore(glyph, cursor);
            if (glyph instanceof HTMLElement && glyph.style.color) cursor.style.borderColor = glyph.style.color;
            position += 1;
            window.setTimeout(typeNext, position === 1 ? 110 : 28);
        };

        typeNext();
    }

    if (!("IntersectionObserver" in window)) {
        headings.forEach(startTyping);
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            startTyping(entry.target);
            observer.unobserve(entry.target);
        });
    }, { rootMargin: "0px 0px -4% 0px", threshold: 0.05 });

    headings.forEach((heading) => observer.observe(heading));
})();
