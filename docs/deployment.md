# Deployment notes

EventLens currently contains a local-development frontend and a FastAPI backend. It does not include a production hosting configuration, domain, database, authentication, rate limiting, or CI deployment workflow.

## Separate frontend and backend hosting

1. Host the static files (`index.html`, `event.html`, `dashboard.html`, `css/`, and `js/`) on a static site host.
2. Host `backend/main.py` as an HTTPS FastAPI service with the packages in `backend/requirements.txt`.
3. Configure `GEMINI_API_KEY` and optionally `GEMINI_MODEL` as backend secrets/environment variables.
4. Update the frontend API URL in `js/event.js` from its local development address (`http://127.0.0.1:8000`) to the deployed HTTPS backend URL.
5. Restrict backend CORS to the exact frontend origin before opening the service to the public.
6. Confirm `GET /` works, submit a sample event, and inspect the response's `ai_powered` field to verify which mode ran.

The browser must never receive the Gemini key. The API URL is public configuration and is safe to put in frontend code.

## Persistent plans

Plans currently live only in browser local storage. For accounts, cross-device access, or durable event history, the project needs a database, authentication, ownership checks, retention rules, and privacy controls. These are not implemented.

## Production readiness checklist

- Use HTTPS for both site and API.
- Store secrets in the hosting provider's secret manager.
- Set production CORS origins and rate limits.
- Add monitoring for API errors, latency, and Gemini quota.
- Decide data retention and privacy policy for event details.
- Validate backup/restore if a database is added.
- Pin and update dependencies; run automated checks in CI.
