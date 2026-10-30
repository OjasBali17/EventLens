document.addEventListener("DOMContentLoaded", () => {

    // Keep local development on its local API; use the same-origin API in production.
    const isLocal = ["localhost", "127.0.0.1"].includes(window.location.hostname);
    const API_URL = isLocal
        ? "http://127.0.0.1:8000/analyze-event"
        : "/analyze-event";

    const form = document.getElementById("eventForm");
    const button = document.querySelector(".generate-button");
    const overlay = document.getElementById("aiOverlay");
    const flowList = document.getElementById("flowList");
    const addFlowButton = document.getElementById("addFlowItem");

    const addMinutes = (time, amount) => {
        if (!time) return "";
        const [hours, minutes] = time.split(":").map(Number);
        const total = (hours * 60 + minutes + amount) % 1440;
        return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
    };

    function addFlowRow(values = {}) {
        if (!flowList) return;
        if (flowList.children.length >= 60) return;
        const previousEnd = flowList.lastElementChild?.querySelector("[data-flow-end]")?.value;
        const row = document.createElement("fieldset");
        row.className = "flow-row";
        row.innerHTML = `
            <legend class="flow-row-title">TIMED MOMENT</legend>
            <div class="flow-row-times">
                <div class="field"><label>START</label><input type="time" data-flow-start required aria-label="Moment start time"></div>
                <span class="flow-time-arrow" aria-hidden="true">→</span>
                <div class="field"><label>END</label><input type="time" data-flow-end required aria-label="Moment end time"></div>
            </div>
            <div class="field"><label>WHAT HAPPENS?</label><input type="text" data-flow-activity maxlength="120" placeholder="e.g. Welcome address" required></div>
            <div class="field"><label>PHOTO NOTES <span>(OPTIONAL)</span></label><textarea data-flow-notes maxlength="500" rows="2" placeholder="People, must-have shots, transitions, or coverage notes"></textarea></div>
            <div class="flow-row-actions">
                <button type="button" data-flow-move="up" aria-label="Move moment up">↑</button>
                <button type="button" data-flow-move="down" aria-label="Move moment down">↓</button>
                <button type="button" data-flow-remove>Remove moment</button>
            </div>`;
        row.querySelector("[data-flow-start]").value = values.start ?? previousEnd ?? document.getElementById("startTime")?.value ?? "";
        row.querySelector("[data-flow-end]").value = values.end ?? addMinutes(previousEnd ?? row.querySelector("[data-flow-start]").value, 60);
        row.querySelector("[data-flow-activity]").value = values.activity ?? "";
        row.querySelector("[data-flow-notes]").value = values.notes ?? "";
        row.querySelector("[data-flow-end]").addEventListener("input", (event) => event.target.setCustomValidity(""));
        row.addEventListener("click", (event) => {
            const action = event.target.closest("button")?.dataset;
            if (!action) return;
            if (action.flowRemove !== undefined) row.remove();
            if (action.flowMove === "up" && row.previousElementSibling) flowList.insertBefore(row, row.previousElementSibling);
            if (action.flowMove === "down" && row.nextElementSibling) flowList.insertBefore(row.nextElementSibling, row);
            refreshFlowControls();
        });
        flowList.appendChild(row);
        refreshFlowControls();
        row.querySelector("[data-flow-activity]").focus();
    }

    function refreshFlowControls() {
        if (!flowList) return;
        [...flowList.children].forEach((row, index, rows) => {
            row.querySelector(".flow-row-title").textContent = `MOMENT ${String(index + 1).padStart(2, "0")}`;
            row.querySelector('[data-flow-move="up"]').disabled = index === 0;
            row.querySelector('[data-flow-move="down"]').disabled = index === rows.length - 1;
        });
        if (addFlowButton) addFlowButton.disabled = flowList.children.length >= 60;
    }

    addFlowButton?.addEventListener("click", () => addFlowRow());

    if (!form) {
        console.error("eventForm NOT FOUND");
        return;
    }

    form.addEventListener("submit", async (e) => {

        e.preventDefault();

        const flow = [...(flowList?.children ?? [])].map((row) => {
            const start = row.querySelector("[data-flow-start]").value;
            const end = row.querySelector("[data-flow-end]").value;
            const endInput = row.querySelector("[data-flow-end]");
            const [startHours, startMinutes] = start.split(":").map(Number);
            const [endHours, endMinutes] = end.split(":").map(Number);
            let duration = endHours * 60 + endMinutes - (startHours * 60 + startMinutes);
            if (duration <= 0) duration += 1440;
            endInput.setCustomValidity(duration >= 1440 ? "A moment must be shorter than 24 hours." : "");
            return {
                start,
                end,
                activity: row.querySelector("[data-flow-activity]").value.trim(),
                notes: row.querySelector("[data-flow-notes]").value.trim()
            };
        });
        const invalidFlowEnd = [...(flowList?.children ?? [])].find((row) => !row.querySelector("[data-flow-end]").checkValidity());
        if (invalidFlowEnd) {
            invalidFlowEnd.querySelector("[data-flow-end]").reportValidity();
            return;
        }

        const selectedStyle = document.querySelector(
            'input[name="style"]:checked'
        );

        const eventData = {
            name: document.getElementById("eventName").value,
            type: document.getElementById("eventType").value,
            venue: document.getElementById("venue").value,
            date: document.getElementById("date").value,
            startTime: document.getElementById("startTime").value,
            endTime: document.getElementById("endTime").value,
            attendees: Number(
                document.getElementById("attendees").value
            ),
            photographers: Number(
                document.getElementById("photographers").value
            ),
            environment: document.getElementById("environment").value,
            style: selectedStyle ? selectedStyle.value : "",
            importantDetails:
                document.getElementById("importantDetails").value,
            flow
        };

        button.disabled = true;
        overlay?.classList.add("active");

        button.innerHTML =
            "<span class='text-animation'>ANALYZING EVENT</span><span class='arrow-animation'>↗</span>";

        try {

            const response = await fetch(
                API_URL,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(eventData)
                }
            );

            const responseText = await response.text();
            let result;
            try {
                result = responseText ? JSON.parse(responseText) : {};
            } catch {
                throw new Error(`Backend returned an unreadable response (${response.status}).`);
            }

            if (!response.ok) {
                const detail = result?.detail;
                const errorMsg = typeof detail === "string"
                    ? detail
                    : detail ? JSON.stringify(detail) : `Analysis failed (${response.status}).`;
                console.error("BACKEND ERROR:", errorMsg);
                throw new Error(errorMsg);
            }

            localStorage.setItem(
                "eventLensEvent",
                JSON.stringify(eventData)
            );

            const analysisRunId = window.crypto?.randomUUID?.()
                || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
            localStorage.setItem("eventLensAnalysisRunId", analysisRunId);

            localStorage.setItem(
                "eventLensAnalysis",
                JSON.stringify(result)
            );

            window.location.href = "dashboard.html";

        } catch (error) {

            console.error("FETCH ERROR:", error);

            button.disabled = false;
            overlay?.classList.remove("active");

            button.innerHTML =
                "<span class='text-animation'>ANALYZE EVENT</span><span class='arrow-animation'>↗</span>";

            const isNetworkError =
                error.name === "TypeError" ||
                (error.message && error.message.toLowerCase().includes("failed to fetch"));

            if (isNetworkError) {
                alert(
                    "EventLens could not connect to its backend. Please try again in a moment."
                );
            } else {
                alert(error.message || "EventLens could not connect to the AI engine. Check the browser console.");
            }
        }
    });
});
