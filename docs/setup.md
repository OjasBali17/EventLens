# Local setup and usage

This guide runs the frontend and API as two local development servers.

## Requirements

- Windows 10/11 or a compatible environment.
- Python 3.11 or later. The app uses FastAPI, Pydantic, Uvicorn, and Google's `google-genai` SDK.
- A browser.
- Optional: a Gemini API key for AI-generated plans. Without it, EventLens uses its built-in rules-based planner.

## 1. Prepare the backend

Open PowerShell in the project folder:

```powershell
cd D:\EventLens\backend
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

If PowerShell prevents activation, use the virtual environment's Python directly instead:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

For AI mode, copy the example settings and add your own key:

```powershell
Copy-Item .env.example .env
notepad .env
```

Set `GEMINI_API_KEY` in `backend/.env`. Do not add quotes unless the key itself requires them. The `.env` file is ignored by Git.

Start the API from the `backend` directory:

```powershell
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Keep this terminal open. Visit `http://127.0.0.1:8000/` to confirm the API reports `"status":"online"`.

## 2. Start the frontend

Open a second PowerShell window in the project root:

```powershell
cd D:\EventLens
python -m http.server 5500 --bind 127.0.0.1
```

Open `http://127.0.0.1:5500` in a browser. Use **Create Event**, submit an event, and the site should take you to the plan dashboard.

If Python is not on the system PATH, run the static server with the same Python executable used to create the backend virtual environment. For example, with the virtual environment activated, `python -m http.server ...` uses that interpreter.

## Using EventLens

1. Enter event details and select the photography style.
2. Submit the form and wait for the analysis. Gemini mode usually takes longer than the offline planner.
3. Review the event stages, important moments, timeline, shot list, assignments, risks, and creative suggestions.
4. Use the checklist to track captured shots. The plan is stored in this browser's local storage.

## Configuration

`backend/.env` supports:

| Setting | Required | Default | Purpose |
| --- | --- | --- | --- |
| `GEMINI_API_KEY` | No | unset | Enables Gemini-generated analysis. |
| `GEMINI_MODEL` | No | `gemini-3.1-flash-lite` | Primary Gemini model. The backend tries configured fallback models if a request fails. |

Never put `GEMINI_API_KEY` in a file under `js/`, HTML, or any other frontend asset.
