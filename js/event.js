document.addEventListener("DOMContentLoaded", () => {

    // The Gemini key stays on the backend; only the public API URL belongs here.
    const API_URL = "https://evventlens.vercel.app/analyze-event";

    const form = document.getElementById("eventForm");
    const button = document.querySelector(".generate-button");
    const overlay = document.getElementById("aiOverlay");

    if (!form) {
        console.error("eventForm NOT FOUND");
        return;
    }

    form.addEventListener("submit", async (e) => {

        e.preventDefault();

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
                document.getElementById("importantDetails").value
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
