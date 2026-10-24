const eventData = JSON.parse(localStorage.getItem("eventLensEvent") || "null");
const analysisData = JSON.parse(localStorage.getItem("eventLensAnalysis") || "null");

if (!eventData || !analysisData?.analysis?.shots) {
    window.location.replace("event.html");
} else {
    const shots = analysisData.analysis.shots;
    const checklist = document.getElementById("liveChecklist");
    const progressLabel = document.getElementById("completionPercent");
    const progressBar = document.getElementById("completionBar");
    let runId = localStorage.getItem("eventLensAnalysisRunId");
    if (!runId) {
        runId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        localStorage.setItem("eventLensAnalysisRunId", runId);
    }
    const storageKey = `eventLensChecklist:${runId}`;
    let checked = {};
    try { checked = JSON.parse(localStorage.getItem(storageKey) || "{}"); } catch { checked = {}; }

    const eventDetails = [eventData.name, eventData.type, eventData.venue].filter(Boolean).join(" · ");
    document.getElementById("checklistEvent").textContent = `${eventDetails} · ${shots.length} priority shots for your team.`;

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
        const priority = String(shot.priority || "MEDIUM").toUpperCase();
        const priorityClass = ["CRITICAL", "HIGH", "MEDIUM"].includes(priority) ? priority.toLowerCase() : "medium";
        const row = document.createElement("div");
        row.className = `live-item live-item--${priorityClass}${checked[key] ? " done" : ""}`;
        row.innerHTML = `<span class="live-item-number">${escapeHtml(shot.number ?? index + 1)}</span><div class="live-item-copy"><strong>${escapeHtml(shot.name)}</strong><div class="live-item-meta"><small>${escapeHtml(shot.category || "SHOT")}</small><span class="importance-pill importance-pill--${priorityClass}">${escapeHtml(priority)} PRIORITY</span></div></div><button type="button" aria-label="Mark ${escapeHtml(shot.name)} complete" aria-pressed="${Boolean(checked[key])}">${checked[key] ? "✓" : "○"}</button>`;
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
