# Troubleshooting

## The page says it cannot connect to the AI engine

1. Confirm the API is running in its own terminal: `python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000` from `D:\EventLens\backend`.
2. Open `http://127.0.0.1:8000/health`. If it does not load, the problem is backend startup or the port, not Gemini.
3. Check the backend terminal for Python import errors. Install dependencies in the active environment with `pip install -r requirements.txt`.
4. If the API is online but `ai_powered` is false, check that `backend/.env` contains a valid `GEMINI_API_KEY`, then restart the backend.
5. Inspect the browser console and backend terminal for the specific error. Do not share API keys in screenshots or logs.

## Python cannot be found

The project uses a Python backend. Install Python 3.11 or later and ensure the Python launcher or executable is available. On Windows, verify `py -3 --version` or `python --version`. If a Python command points to a missing installation, repair the Python installation or use the full path to the intended executable. Codex's bundled Python may not include FastAPI or Gemini dependencies; install `backend/requirements.txt` in a project virtual environment.

## `ModuleNotFoundError` for `fastapi` or `google`

Activate the backend virtual environment and run `pip install -r requirements.txt`. Confirm the same environment is used to launch Uvicorn.

## Browser reports a CORS error

The frontend and backend must run on different local ports; the backend must allow the frontend origin. The current local backend permits development origins. For production, allow only the deployed frontend origin and do not enable credentialed wildcard CORS.

## The dashboard sends me back to the event form

The dashboard depends on `eventLensEvent` and `eventLensAnalysis` in browser local storage. Create an event from the form in the same browser profile. Clearing browser site data removes the saved plan.

## Gemini is unavailable but a plan still appears

EventLens uses its rules-based fallback when the key is absent or Gemini requests fail. The dashboard marks fallback output as non-AI. Check the backend log and key/model configuration to restore Gemini mode.
