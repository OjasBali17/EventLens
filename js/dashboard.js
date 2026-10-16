const eventData = JSON.parse(
    localStorage.getItem("eventLensEvent")
);

const analysisData = JSON.parse(
    localStorage.getItem("eventLensAnalysis")
);

if (!eventData || !analysisData) {
    window.location.href = "event.html";
}

const analysis = analysisData.analysis;

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

const engineBadge = analysisData.engine || (analysisData.ai_powered ? "Google Gemini AI" : "EventLens Analysis");
const isAi = analysisData.ai_powered !== false;
const engineName = document.getElementById("engineName");
if (engineName) engineName.textContent = engineBadge.toUpperCase();
const engineStatus = document.querySelector(".engine-badge .nav-status");
if (engineStatus) engineStatus.classList.toggle("engine-fallback", !isAi);

document.getElementById("navEventName").textContent =
    eventData.name.toUpperCase();

document.getElementById("eventNameDisplay").textContent =
    eventData.name;

document.getElementById("eventTypeDisplay").textContent =
    eventData.type;

document.getElementById("venueDisplay").textContent =
    eventData.venue;

document.getElementById("photographersDisplay").textContent =
    eventData.photographers;

document.getElementById("attendeesDisplay").textContent =
    eventData.attendees;

document.getElementById("environmentDisplay").textContent =
    eventData.environment;

document.getElementById("styleDisplay").textContent =
    eventData.style;

if (eventData.date) {
    const date = new Date(eventData.date);
    document.getElementById("analysisDate").textContent =
        date.getFullYear();
}

function calculateDuration(startTime, endTime) {

    const start = startTime.split(":");
    const end = endTime.split(":");

    const startMinutes =
        Number(start[0]) * 60 +
        Number(start[1]);

    const endMinutes =
        Number(end[0]) * 60 +
        Number(end[1]);

    let difference =
        endMinutes - startMinutes;

    if (difference < 0) {
        difference += 1440;
    }

    const hours =
        Math.floor(difference / 60);

    const minutes =
        difference % 60;

    if (minutes > 0) {
        return `${hours}H ${minutes}M`;
    }

    return `${hours}H`;
}

document.getElementById(
    "durationDisplay"
).textContent =
    calculateDuration(
        eventData.startTime,
        eventData.endTime
    );

const structureList =
    document.querySelector(".structure-list");

structureList.innerHTML = "";

analysis.stages.forEach((stage) => {

    const item =
        document.createElement("div");

    item.innerHTML = `
        <span>${escapeHtml(stage.number)}</span>
        <strong>${escapeHtml(stage.name.toUpperCase())}</strong>
        <p>${escapeHtml(stage.description)}</p>
    `;

    structureList.appendChild(item);
});

const momentStack =
    document.querySelector(".moment-stack");

momentStack.innerHTML = "";

analysis.key_moments.forEach((moment) => {

    const item =
        document.createElement("div");

    item.className = "moment";

    item.innerHTML = `
        <span class="priority ${escapeHtml(moment.priority.toLowerCase())}">
            ${escapeHtml(moment.priority)}
        </span>

        <strong>
            ${escapeHtml(moment.name)}
        </strong>

        <p>
            ${escapeHtml(moment.description)}
        </p>
    `;

    momentStack.appendChild(item);
});

const shotList =
    document.querySelector(".shot-list");

shotList.innerHTML = "";

analysis.shots.forEach((shot) => {

    const row =
        document.createElement("div");

    row.className = "shot-row";

    row.dataset.priority =
        shot.priority.toLowerCase();

    row.innerHTML = `
        <div class="shot-number">
            ${escapeHtml(shot.number)}
        </div>

        <div class="shot-info">

            <span class="shot-category">
            ${escapeHtml(shot.category)}
            </span>

            <h3>
                ${escapeHtml(shot.name)}
            </h3>

            <p>
                ${escapeHtml(shot.description)}
            </p>

        </div>

        <div class="shot-technique">

            <span>
                TECHNIQUE
            </span>

            <strong>
                ${escapeHtml(shot.technique)}
            </strong>

        </div>

        <div class="shot-priority ${escapeHtml(shot.priority.toLowerCase())}">
            ${escapeHtml(shot.priority)}
        </div>

        <button class="shot-check">
            ✓
        </button>
    `;

    row.querySelector(
        ".shot-check"
    ).addEventListener(
        "click",
        () => {
            row.classList.toggle(
                "completed"
            );
        }
    );

    shotList.appendChild(row);
});

const assignmentGrid =
    document.getElementById(
        "assignmentGrid"
    );

assignmentGrid.innerHTML = "";

analysis.assignments.forEach(
    (assignment) => {

        const card =
            document.createElement(
                "article"
            );

        card.className =
            "assignment-card";

        card.innerHTML = `
            <span class="assignment-number">
                ${escapeHtml(assignment.photographer)}
            </span>

            <h3>
                ${escapeHtml(assignment.role)}
            </h3>

            <p>
                ${escapeHtml(assignment.description)}
            </p>

            <div class="assignment-focus">
                ${assignment.focus
                .map(
                    tag =>
                        `<span>${escapeHtml(tag)}</span>`
                )
                .join("")}
            </div>
        `;

        assignmentGrid.appendChild(card);
    }
);

const riskPanel =
    document.querySelector(
        ".risk-panel"
    );

if (analysis.risks.length > 0) {

    const risk =
        analysis.risks[0];

    riskPanel.innerHTML = `
        <div class="risk-icon">
            !
        </div>

        <div>

            <span>
                COVERAGE RISK / ${escapeHtml(risk.level)}
            </span>

            <h3>
                ${escapeHtml(risk.title)}
            </h3>

            <p>
                ${escapeHtml(risk.description)}
            </p>

        </div>
    `;
}

const dontMissGrid =
    document.querySelector(
        ".dont-miss-grid"
    );

dontMissGrid.innerHTML = "";

analysis.dont_miss.forEach(
    (item, index) => {

        const element =
            document.createElement(
                "div"
            );

        element.className =
            "dont-miss-item";

        element.innerHTML = `
            <span>
                ${String(index + 1).padStart(2, "0")}
            </span>

            <div>

                <strong>
                    ${escapeHtml(item.toUpperCase())}
                </strong>

                <p>
                    Priority coverage item identified by EventLens.
                </p>

            </div>
        `;

        dontMissGrid.appendChild(
            element
        );
    }
);

const creativeGrid =
    document.querySelector(
        ".creative-grid"
    );

creativeGrid.innerHTML = "";

analysis.creative_suggestions.forEach(
    (suggestion, index) => {

        const card =
            document.createElement(
                "article"
            );

        card.className =
            "creative-card";

        card.innerHTML = `
            <span>
                ${String(index + 1).padStart(2, "0")}
                /
                ${escapeHtml(suggestion.type)}
            </span>

            <h3>
                ${escapeHtml(suggestion.title)}
            </h3>

            <p>
                ${escapeHtml(suggestion.description)}
            </p>
        `;

        creativeGrid.appendChild(card);
    }
);

const filterButtons =
    document.querySelectorAll(
        ".shot-filter"
    );

filterButtons.forEach(
    (button) => {

        button.addEventListener(
            "click",
            () => {

                filterButtons.forEach(
                    (item) => {
                        item.classList.remove(
                            "active"
                        );
                    }
                );

                button.classList.add(
                    "active"
                );

                const filter =
                    button.dataset.filter;

                document
                    .querySelectorAll(
                        ".shot-row"
                    )
                    .forEach(
                        (row) => {

                            if (
                                filter === "all" ||
                                row.dataset.priority === filter
                            ) {
                                row.style.display =
                                    "grid";
                            } else {
                                row.style.display =
                                    "none";
                            }

                        }
                    );
            }
        );
    }
);

const revealItems =
    document.querySelectorAll(
        ".section-heading, .intel-card, .timeline-item, .shot-row, .assignment-card, .dont-miss-item, .creative-card, .prompt-node, .prompt-side, .live-item"
    );

const observer =
    new IntersectionObserver(
        (entries) => {

            entries.forEach(
                (entry) => {

                    if (
                        entry.isIntersecting
                    ) {

                        entry.target.classList.add(
                            "revealed"
                        );
                    }
                }
            );

        },
        {
            threshold: 0.12
        }
    );

revealItems.forEach(
    (item) => {

        item.classList.add(
            "dashboard-reveal"
        );

        observer.observe(item);
    }
);
