const eventData = JSON.parse(localStorage.getItem("eventLensEvent") || "null");
const analysisData = JSON.parse(localStorage.getItem("eventLensAnalysis") || "null");

if (!eventData || !analysisData?.analysis?.shots) {
    window.location.replace("event.html");
} else {
    const shots = analysisData.analysis.shots;
    const checklist = document.getElementById("liveChecklist");
    const progressLabel = document.getElementById("completionPercent");
    const progressBar = document.getElementById("completionBar");
    const storageKey = `eventLensChecklist:${eventData.name}:${eventData.date || "undated"}`;
    let checked = {};
    try { checked = JSON.parse(localStorage.getItem(storageKey) || "{}"); } catch { checked = {}; }

    document.getElementById("checklistEvent").textContent = `${eventData.name} · Check off each moment as your team captures it.`;

    function updateProgress() {
        const total = shots.length;
        const done = Object.values(checked).filter(Boolean).length;
        const percent = total ? Math.round(done / total * 100) : 0;
        progressLabel.textContent = `${percent}%`;
        progressBar.style.width = `${percent}%`;
        localStorage.setItem(storageKey, JSON.stringify(checked));
    }

    shots.forEach((shot, index) => {
        const key = String(index);
        const row = document.createElement("div");
        row.className = `live-item${checked[key] ? " done" : ""}`;
        row.innerHTML = `<span>${escapeHtml(shot.number ?? index + 1)}</span><div><strong>${escapeHtml(shot.name)}</strong><small>${escapeHtml(shot.priority)}</small></div><button type="button" aria-label="Mark ${escapeHtml(shot.name)} complete" aria-pressed="${Boolean(checked[key])}">${checked[key] ? "✓" : "○"}</button>`;
        row.querySelector("button").addEventListener("click", (event) => {
            checked[key] = !checked[key];
            row.classList.toggle("done", checked[key]);
            event.currentTarget.setAttribute("aria-pressed", String(checked[key]));
            event.currentTarget.textContent = checked[key] ? "✓" : "○";
            updateProgress();
        });
        checklist.appendChild(row);
    });
    updateProgress();
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
}
