# Vercel deployment

EventLens can run as one Vercel FastAPI project. The FastAPI app serves the website, static assets, and `/analyze-event` from the same origin.

## Vercel project settings

- **Root Directory:** repository root (`.`), not `backend`
- **Framework preset:** FastAPI (or Other if Vercel does not select it automatically)
- **Python entry point:** `backend.main:app`, configured in the root `pyproject.toml`
- **Environment variable:** `GEMINI_API_KEY`, set as a Vercel Secret for Production
- **Optional environment variable:** `GEMINI_MODEL`

The Gemini key belongs in Vercel's Environment Variables settings and in the ignored local `backend/.env` only. Never add it to browser JavaScript or Git.

## Deploy

1. In Vercel, open the EventLens project and set its Root Directory to the repository root.
2. Save the setting and deploy the latest commit from the `main` branch.
3. Confirm the website opens at the project's production domain.
4. Open `/health` on that domain and confirm `api_key_configured` is `true`.
5. Create a sample event from the website and confirm the resulting plan identifies Google Gemini as its engine.

The frontend uses a same-origin request in production, so no second backend URL or cross-origin CORS setup is needed. For local development, it continues to call `http://127.0.0.1:8000`.

## Current limitations

- Plans are kept in browser local storage. There is no account system or shared cloud history.
- The public analysis endpoint has no authentication or rate limiting. Set a conservative Gemini quota and monitor usage before sharing the site widely.
- Event details sent for analysis are processed by the configured Gemini API and retained only in that user's browser by this application.
