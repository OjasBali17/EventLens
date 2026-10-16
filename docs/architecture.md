# Architecture and API

## Request flow

```text
Browser: event.html + js/event.js
    │ POST /analyze-event (event details)
    ▼
FastAPI: backend/main.py
    ├── Gemini configured and successful → two-stage AI plan
    └── Missing key or Gemini failure → rules-based plan
    │ JSON response
    ▼
Browser localStorage → dashboard.html + js/dashboard.js
```

The frontend is plain HTML, CSS, and JavaScript; it has no build step or frontend package manager. The backend validates requests with Pydantic models and uses FastAPI. The Gemini SDK is `google-genai`.

## Pages and scripts

- `index.html`: minimal headline landing page.
- `about.html` and `process.html`: standalone product overview and photography workflow pages.
- `event.html` and `js/event.js`: event form, request state, API request, and local storage writes.
- `dashboard.html` and `js/dashboard.js`: reads the saved event/analysis, renders the plan, and filters the shot list.
- `checklist.html` and `js/checklist.js`: standalone, event-specific live checklist with completion saved in browser local storage.
- `js/text-type.js` and `js/polka-dots.js`: accessible heading type-on animation and decorative pastel dots.
- `css/style.css`, `css/event.css`, `css/dashboard.css`, `css/pages.css`: shared and page-specific styling.

The browser experience uses plain HTML, CSS, and JavaScript. The large-heading effect is a lightweight vanilla-JavaScript adaptation of the React Bits TextType visual treatment; the project does not require React or a frontend build step.

## `GET /health`

Health and configuration summary. Example fields:

```json
{
  "status": "online",
  "service": "EventLens AI",
  "model": "gemini-3.1-flash-lite",
  "provider": "Google Gemini",
  "api_key_configured": true,
  "mode": "Gemini AI"
}
```

The endpoint never returns the API key.

## Website routes

The FastAPI app serves the landing page at `/`, with the About and Process pages at `/about.html` and `/process.html`. The event form, plan dashboard and live checklist are served at `/event.html`, `/dashboard.html` and `/checklist.html`. CSS and JavaScript files are served from `/css/` and `/js/`.

## `POST /analyze-event`

The frontend sends these fields:

```json
{
  "name": "Example event",
  "type": "Conference",
  "venue": "Main Hall",
  "date": "2026-10-13",
  "startTime": "09:00",
  "endTime": "17:00",
  "attendees": 250,
  "photographers": 2,
  "environment": "Indoor",
  "style": "Documentary",
  "importantDetails": "Opening talk and awards"
}
```

The response contains `event`, `analysis`, `engine`, `ai_powered`, and `model`. `analysis` includes `event_summary`, `stages`, `key_moments`, `activity_periods`, `coverage_requirements`, `potential_conflicts`, `shots`, `risks`, `assignments`, `dont_miss`, `creative_suggestions`, and `critique`.

The AI plan is generated in two calls: first event structure and moments, then a photography plan based on that analysis. Each provider request has a bounded timeout and the output size is capped. If either call fails or the key is absent, the backend returns the rules-based plan with `ai_powered: false`.

## Browser storage

- `eventLensEvent`: submitted event details.
- `eventLensAnalysis`: API response.

These values remain in the current browser profile until cleared. The app currently has no server-side database or account system.
