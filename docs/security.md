# Security and secrets

## API key handling

- Store `GEMINI_API_KEY` only in `backend/.env` or in the hosting provider's server-side secret manager.
- Do not place credentials in frontend code. Anything shipped in HTML or JavaScript is visible to every visitor.
- `.gitignore` excludes `.env` and `backend/.env`; keep that rule in place.
- A key that has ever appeared in source, screenshots, logs, or a public repository should be revoked and replaced. Removing it from the current file does not invalidate the old key.
- The backend health endpoint reports whether a key is present, but must never return the key value.

## Event data

Event details and generated plans are sent from the browser to the configured API and are also stored in browser local storage. Avoid putting sensitive personal information in event notes. Clearing site data removes the browser's locally saved plan.

## Dashboard rendering

Event-provided and AI-generated strings are untrusted input. `js/dashboard.js` escapes dynamic text before inserting it into HTML. Preserve this when adding new rendered fields; do not interpolate raw user/AI strings into `innerHTML`.

## Before public deployment

The current API is a development service. Before exposing it publicly, configure CORS to allow only the production frontend origin, add request rate limiting and abuse controls, set bounded request sizes/timeouts, and use HTTPS. Do not rely on CORS as authentication. Keep the Gemini key server-side and monitor provider usage.
