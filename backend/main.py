import json
import os
from pathlib import Path

# Safe dotenv import with zero-dependency fallback so IDE never flags import errors
try:
    from dotenv import load_dotenv
    env_file = Path(__file__).resolve().parent / ".env"
    load_dotenv(dotenv_path=env_file)
except Exception:
    pass

# Built-in fallback .env reader to guarantee environment variables are loaded
def _read_env_manually():
    candidate_paths = [
        Path(__file__).resolve().parent / ".env",
        Path.cwd() / ".env",
        Path.cwd() / "backend" / ".env"
    ]
    for p in candidate_paths:
        if p.exists():
            try:
                with open(p, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            k, v = k.strip(), v.strip().strip("'\"")
                            if k and k not in os.environ:
                                os.environ[k] = v
            except Exception:
                pass

_read_env_manually()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, field_validator
from google import genai
from google.genai import types

app = FastAPI(title="EventLens AI")
PROJECT_ROOT = Path(__file__).resolve().parent.parent

FRONTEND_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGINS",
        "https://evventlens.vercel.app,http://127.0.0.1:5500,http://localhost:5500",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"]
)

PRIMARY_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")
FALLBACK_MODELS = ["gemini-3.1-flash-lite"]


def get_gemini_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key.strip() in ("", "YOUR_API_KEY_HERE"):
        return None
    try:
        return genai.Client(
            api_key=api_key.strip(),
            http_options=types.HttpOptions(
                timeout=30_000,
                retry_options=types.HttpRetryOptions(attempts=1),
            ),
        )
    except Exception as e:
        print(f"[EventLens] Error configuring Gemini client: {e}", flush=True)
        return None


class EventData(BaseModel):
    name: str
    type: str
    venue: str
    date: str
    startTime: str
    endTime: str
    attendees: int
    photographers: int
    environment: str
    style: str
    importantDetails: str


class Stage(BaseModel):
    number: str
    name: str
    description: str

    @field_validator("number", mode="before")
    @classmethod
    def stringify_number(cls, value):
        return str(value)


class KeyMoment(BaseModel):
    priority: str
    name: str
    description: str


class ActivityPeriod(BaseModel):
    name: str
    description: str
    photography_demand: str


class EventAnalysis(BaseModel):
    event_summary: str
    stages: list[Stage]
    key_moments: list[KeyMoment]
    activity_periods: list[ActivityPeriod]
    coverage_requirements: list[str]
    potential_conflicts: list[str]

    @field_validator("potential_conflicts", mode="before")
    @classmethod
    def normalize_conflicts(cls, value):
        if not isinstance(value, list):
            return value
        normalized = []
        for item in value:
            if isinstance(item, dict):
                item = (
                    item.get("conflict")
                    or item.get("description")
                    or item.get("text")
                    or json.dumps(item)
                )
            normalized.append(str(item))
        return normalized


class Shot(BaseModel):
    number: str
    category: str
    name: str
    description: str
    technique: str
    priority: str

    @field_validator("number", mode="before")
    @classmethod
    def stringify_number(cls, value):
        return str(value)


class Risk(BaseModel):
    level: str
    title: str
    description: str


class Assignment(BaseModel):
    photographer: str
    role: str
    description: str
    focus: list[str]


class CreativeSuggestion(BaseModel):
    type: str
    title: str
    description: str


class FinalAnalysis(BaseModel):
    shots: list[Shot]
    risks: list[Risk]
    assignments: list[Assignment]
    dont_miss: list[str]
    creative_suggestions: list[CreativeSuggestion]
    critique: list[str]


def run_gemini(client, prompt: str, schema):
    candidate_models = [PRIMARY_MODEL] + [m for m in FALLBACK_MODELS if m != PRIMARY_MODEL]
    prompt = (
        f"{prompt}\n\nReturn only one valid JSON object matching this structure:\n"
        f"{json.dumps(schema.model_json_schema(), separators=(',', ':'))}"
    )
    last_error = None
    for model_name in candidate_models:
        try:
            print(f"[EventLens AI] Querying Google Gemini ({model_name})...", flush=True)
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    max_output_tokens=4096,
                )
            )
            if response and response.text:
                print(f"[EventLens AI] Received response from {model_name} ({len(response.text)} bytes)", flush=True)
                return schema.model_validate_json(response.text), model_name
        except Exception as e:
            last_error = e
            print(f"[EventLens AI] Model {model_name} error: {str(e)[:120]}", flush=True)
            continue
    if last_error:
        print(f"[EventLens AI] All Gemini models failed: {last_error}", flush=True)
    return None, None


def generate_tailored_plan(event_data: dict) -> dict:
    name = event_data.get("name", "Special Event")
    ev_type = event_data.get("type", "General Event").capitalize()
    venue = event_data.get("venue", "Main Venue")
    attendees = event_data.get("attendees", 100)
    num_photographers = max(1, event_data.get("photographers", 1))
    env = event_data.get("environment", "Mixed")
    style = event_data.get("style", "Editorial") or "Editorial"
    details = event_data.get("importantDetails", "Key celebrations and interactions.")
    start_t = event_data.get("startTime", "18:00")
    end_t = event_data.get("endTime", "23:00")

    summary = (
        f"{name} is a {style.lower()}-focused {ev_type.lower()} held at {venue} "
        f"with approximately {attendees} attendees and {num_photographers} photographer(s) deployed. "
        f"The {env.lower()} lighting and atmosphere require coordinated timing between {start_t} and {end_t}."
    )

    stages = [
        Stage(
            number="01",
            name="Arrival & Atmosphere Setup",
            description=f"Initial guest reception, venue architecture at {venue}, ambient lighting, and early mingling."
        ),
        Stage(
            number="02",
            name="Opening & Core Highlights",
            description=f"Keynotes, ceremonial rituals, speeches, or primary proceedings central to {name}."
        ),
        Stage(
            number="03",
            name="Interactive Engagement & Dining",
            description=f"Candid group discussions, networking, meal service, and vibrant room energy."
        ),
        Stage(
            number="04",
            name="Culmination & Final Moments",
            description="Climactic celebrations, grand finale, farewell gestures, and closing attendee interactions."
        )
    ]

    key_moments = [
        KeyMoment(
            priority="CRITICAL",
            name=f"Grand Entry & Opening Address",
            description=f"The official kickoff of {name}; key VIP or host arrival and crowd initial reactions."
        ),
        KeyMoment(
            priority="CRITICAL",
            name=f"Signature Milestone / Focal Ceremony",
            description=f"Unrepeatable centerpiece moment highlighting {details[:60] if details else 'the main milestone'}."
        ),
        KeyMoment(
            priority="HIGH",
            name="VIP & Key Stakeholder Interactions",
            description="Organized portraiture and unposed natural conversations among honored guests."
        ),
        KeyMoment(
            priority="MEDIUM",
            name="Spontaneous Crowd Reactions & Atmosphere",
            description=f"Laughter, applause, and emotive attendee engagements styled in {style} aesthetic."
        )
    ]

    activity_periods = [
        ActivityPeriod(
            name="Guest Flow & Welcome Period",
            description=f"First 45 minutes at {venue}. Steady stream of arrivals needing fast-paced coverage.",
            photography_demand="HIGH"
        ),
        ActivityPeriod(
            name="Main Stage & Official Presentations",
            description="Peak ceremonial segment requiring continuous focal tracking and prime angle control.",
            photography_demand="PEAK"
        ),
        ActivityPeriod(
            name="Open Socializing & Ambient Exploration",
            description="Relaxed phase allowing roving photographers to capture artistic candids and room details.",
            photography_demand="MODERATE"
        )
    ]

    coverage_requirements = [
        f"Continuous visual tracking of key hosts and VIP attendees across {venue}.",
        f"Fast lens adjustments suited for {env.lower()} ambient conditions.",
        f"Consistent aesthetic matching the requested '{style}' style guidelines.",
        f"Complete shot roster verified before conclusion at {end_t}."
    ]

    potential_conflicts = [
        f"High guest count ({attendees}) relative to {num_photographers} photographer(s) limits simultaneous multi-room capture.",
        f"Lighting shifts in {env.lower()} setting between day and evening may require prompt ISO and strobe recalibration.",
        "Unscheduled VIP movements can split photographic focus during peak crowd interactions."
    ]

    shots = [
        Shot(
            number="01",
            category="ENVIRONMENT",
            name=f"Establishing Panorama of {venue}",
            description=f"Wide pristine wide shot of {venue} before heavy foot traffic, capturing spatial design.",
            technique="24mm wide angle, f/5.6, tripod mounted or stabilized, balanced ambient exposure.",
            priority="CRITICAL"
        ),
        Shot(
            number="02",
            category="PEOPLE",
            name="Host & VIP Welcome Protocol",
            description="Key figures greeting arriving attendees; capturing genuine eye contact and warmth.",
            technique="50mm or 85mm prime, f/2.0, natural depth of field with fast shutter.",
            priority="CRITICAL"
        ),
        Shot(
            number="03",
            category="ACTION",
            name="Keynote / Focal Ceremony Climax",
            description="The central expressive gesture or speech peak during the main presentation.",
            technique="70-200mm telephoto, f/2.8, continuous burst, tracking autofocus on eyes.",
            priority="CRITICAL"
        ),
        Shot(
            number="04",
            category="CANDID",
            name="Crowd Resonance & Emotional Reaction",
            description="Audience members engrossed, smiling, laughing, or applauding in response.",
            technique="85mm medium telephoto, wide aperture, silent electronic shutter.",
            priority="HIGH"
        ),
        Shot(
            number="05",
            category="DETAIL",
            name="Curated Design & Branding Elements",
            description=f"Close-up details of signage, floral arrangements, architectural motifs, and badges at {venue}.",
            technique="Macro or 50mm, f/2.8, soft bokeh highlighting textural craftsmanship.",
            priority="HIGH"
        ),
        Shot(
            number="06",
            category="BEHIND-THE-SCENES",
            name="Pre-Event Preparations & Anticipation",
            description="Quiet preparatory moments right before doors opened, capturing quiet focus.",
            technique="35mm documentary framing, natural room glow, high dynamic range.",
            priority="MEDIUM"
        ),
        Shot(
            number="07",
            category="REACTION",
            name="Celebratory Cheers & Group Bonding",
            description="Spontaneous cluster of friends or colleagues raising glasses or sharing an energetic moment.",
            technique="35mm dynamic perspective, quick fill-flash bounced from wall or ceiling.",
            priority="HIGH"
        ),
        Shot(
            number="08",
            category="BRANDING",
            name=f"{name} Step-and-Repeat / Backdrop Feature",
            description="Crisp full-body and medium portraits with the event backdrop or marquee clearly visible.",
            technique="50mm, f/4.0 for tack-sharp logo definition, balanced speedlight with diffuser.",
            priority="MEDIUM"
        )
    ]

    risks = [
        Risk(
            level="HIGH" if num_photographers == 1 and attendees > 80 else "MODERATE",
            title=f"Coverage Bottleneck ({attendees} Guests / {num_photographers} Shooter{'s' if num_photographers > 1 else ''})",
            description=(
                f"With {num_photographers} photographer(s) covering {attendees} guests across {venue}, "
                "rapid concurrent moments (e.g. stage speech vs. VIP entrance) cannot be captured simultaneously without strict timetable choreography."
            )
        )
    ]

    assignments = []
    roles = [
        ("Lead Director & Keynote Focus", "Anchors stage presentations, VIP milestones, and hero portraits."),
        ("Roving Candid & Atmosphere Specialist", "Circulates through audience capture, ambient interactions, and room architecture."),
        ("Detail & Group Portrait Specialist", "Stationed at entrance step-and-repeat, capturing formal groups and curated vignettes.")
    ]
    for i in range(1, num_photographers + 1):
        role_info = roles[(i - 1) % len(roles)]
        assignments.append(
            Assignment(
                photographer=f"Photographer {i}",
                role=role_info[0],
                description=role_info[1],
                focus=["VIP Keynotes", "Stage Action"] if i == 1 else ["Candids", "Atmosphere", "Detail Vignettes"]
            )
        )

    dont_miss = [
        f"VIP / Host opening speech and ceremonial climax at {venue}",
        f"Wide establishing shot of {name} during maximum room capacity",
        "Official speaker or honoree portrait with backdrop branding",
        "Spontaneous standing ovation or heartfelt crowd interaction",
        f"Artistic detail shot capturing the '{style}' signature aesthetic"
    ]

    creative_suggestions = [
        CreativeSuggestion(
            type="PERSPECTIVE",
            title="Elevated Vantage Overview",
            description=f"Capture a high balcony or staircase perspective of {venue} showing crowd density and architectural grandeur."
        ),
        CreativeSuggestion(
            type="COMPOSITION",
            title="Foreground Framing",
            description="Shoot through ambient architectural glass, foliage, or gentle silhouette out-of-focus elements for depth."
        ),
        CreativeSuggestion(
            type="MOTION",
            title="Slow Shutter Ambient Drag",
            description="Use 1/15s shutter with gentle rear-curtain flash sync to convey energetic crowd motion while retaining sharp subjects."
        )
    ]

    critique = [
        f"Plan successfully scales across the {start_t} to {end_t} timeline.",
        f"Priorities directly reflect the selected {style} photography style.",
        f"Photographer allocation strictly matches the available team of {num_photographers}."
    ]

    return {
        "event": event_data,
        "analysis": {
            "event_summary": summary,
            "stages": [stage.model_dump() for stage in stages],
            "key_moments": [moment.model_dump() for moment in key_moments],
            "activity_periods": [period.model_dump() for period in activity_periods],
            "coverage_requirements": coverage_requirements,
            "potential_conflicts": potential_conflicts,
            "shots": [shot.model_dump() for shot in shots],
            "risks": [risk.model_dump() for risk in risks],
            "assignments": [assignment.model_dump() for assignment in assignments],
            "dont_miss": dont_miss,
            "creative_suggestions": [suggestion.model_dump() for suggestion in creative_suggestions],
            "critique": critique
        }
    }


@app.get("/health")
def root():
    api_key_set = bool(os.getenv("GEMINI_API_KEY"))
    return {
        "status": "online",
        "service": "EventLens AI",
        "model": PRIMARY_MODEL,
        "provider": "Google Gemini",
        "api_key_configured": api_key_set,
        "mode": "Gemini AI" if api_key_set else "Intelligent Fallback / Ready Mode"
    }


@app.post("/analyze-event")
def analyze_event(event: EventData):
    event_data = event.model_dump()
    client = get_gemini_client()

    if client:
        analysis_prompt = f"""
You are EventLens, an expert event photography director.

Analyze the following event before photographers arrive.

EVENT CONTEXT:

Event Name:
{event_data["name"]}

Event Type:
{event_data["type"]}

Venue:
{event_data["venue"]}

Date:
{event_data["date"]}

Start Time:
{event_data["startTime"]}

End Time:
{event_data["endTime"]}

Expected Attendees:
{event_data["attendees"]}

Number of Photographers:
{event_data["photographers"]}

Environment:
{event_data["environment"]}

Photography Style:
{event_data["style"]}

Important Details:
{event_data["importantDetails"]}

Identify:

1. Major event stages
2. Important moments
3. High-activity periods
4. Photography demand
5. Coverage requirements
6. Potential simultaneous-event conflicts

OUTPUT SIZE:

- Use exactly 4 stages, up to 4 key moments, up to 3 activity periods, up to 4 coverage requirements, and up to 3 potential conflicts.
- Keep the event summary under 50 words and each description to one concise sentence.

CONSTRAINTS:

- Respect the provided number of photographers.
- Do not invent named people.
- Do not invent specific performances unless supported by the event information.
- Generic stages are allowed when reasonable for the event type.
- Prioritize moments that cannot easily be recreated.
- Keep recommendations practical for real event photographers.
- The photography style must influence the recommendations.
- The venue and environment must influence the recommendations.
- Return structured information only.
"""

        event_analysis, model1 = run_gemini(client, analysis_prompt, EventAnalysis)

        if event_analysis:
            planning_prompt = f"""
You are EventLens, a professional event photography planning system.

You are the second stage of a multi-step prompt-engineering pipeline.

The first stage analyzed the event.

EVENT DATA:

{event_data}

EVENT ANALYSIS:

{event_analysis.model_dump_json(indent=2)}

Now create the final photography plan.

SHOT LIST:

Create an intelligent shot list.

Every shot must contain:

- number
- category
- name
- description
- technique
- priority

Allowed priorities:

CRITICAL
HIGH
MEDIUM
OPTIONAL

Use appropriate categories such as:

PEOPLE
CANDID
ACTION
ENVIRONMENT
DETAIL
REACTION
BRANDING
BEHIND-THE-SCENES
PERFORMANCE

PHOTOGRAPHER ASSIGNMENTS:

Assign no more photographers than are actually available.

Each photographer must have:

- photographer
- role
- description
- focus

Use names such as:

Photographer 1
Photographer 2
Photographer 3

COVERAGE RISKS:

Identify realistic risks involving:

- simultaneous important activities
- photographer count
- attendance
- indoor/outdoor movement
- important moments without dedicated coverage
- event complexity

DON'T-MISS CHECKLIST:

Create a concise list of photographs that absolutely should be captured.

CREATIVE SUGGESTIONS:

Provide practical creative photography ideas involving:

- perspective
- composition
- motion
- framing
- foreground/background
- environmental portraits
- storytelling

QUALITY CONTROL:

Critique the photography plan.

Look for:

- missing critical moments
- unrealistic assignments
- coverage conflicts
- too many low-priority shots
- important moments without coverage
- gaps between event analysis and photography plan

OUTPUT SIZE:

- Create exactly 8 shots, up to 3 risks, one assignment per available photographer, up to 5 don't-miss items, up to 3 creative suggestions, and up to 3 critique points.
- Keep descriptions concise (one sentence); keep each technique under 15 words.

CONSTRAINTS:

- Do not invent unsupported specific events.
- Do not assign unavailable photographers.
- Do not recommend unrealistic equipment.
- Keep the plan practical for real photographers.
- Respect the original event context.
- Prioritize important moments over filler shots.
- Return structured information only.
"""

            final_analysis, model2 = run_gemini(client, planning_prompt, FinalAnalysis)

            if final_analysis:
                active_model = model2 or model1 or PRIMARY_MODEL
                print(f"[EventLens AI] Full event plan successfully generated by Google Gemini ({active_model}) for: {event_data.get('name')}", flush=True)
                return {
                    "event": event_data,
                    "engine": f"Google Gemini AI ({active_model})",
                    "ai_powered": True,
                    "model": active_model,
                    "analysis": {
                        "event_summary": event_analysis.event_summary,
                        "stages": [stage.model_dump() for stage in event_analysis.stages],
                        "key_moments": [moment.model_dump() for moment in event_analysis.key_moments],
                        "activity_periods": [period.model_dump() for period in event_analysis.activity_periods],
                        "coverage_requirements": event_analysis.coverage_requirements,
                        "potential_conflicts": event_analysis.potential_conflicts,
                        "shots": [shot.model_dump() for shot in final_analysis.shots],
                        "risks": [risk.model_dump() for risk in final_analysis.risks],
                        "assignments": [assignment.model_dump() for assignment in final_analysis.assignments],
                        "dont_miss": final_analysis.dont_miss,
                        "creative_suggestions": [suggestion.model_dump() for suggestion in final_analysis.creative_suggestions],
                        "critique": final_analysis.critique
                    }
                }

    # If GEMINI_API_KEY is not set or if Gemini call failed, generate tailored plan
    print("[EventLens] Using intelligent tailored plan generator for event:", event_data.get("name"), flush=True)
    fallback = generate_tailored_plan(event_data)
    fallback["engine"] = "Pre-computed Fallback Information (Non-AI Mode)"
    fallback["ai_powered"] = False
    fallback["model"] = "None (Offline Rules)"
    return fallback


@app.get("/", include_in_schema=False)
def home_page():
    return FileResponse(PROJECT_ROOT / "index.html")


@app.get("/event.html", include_in_schema=False)
def event_page():
    return FileResponse(PROJECT_ROOT / "event.html")


@app.get("/about.html", include_in_schema=False)
def about_page():
    return FileResponse(PROJECT_ROOT / "about.html")


@app.get("/process.html", include_in_schema=False)
def process_page():
    return FileResponse(PROJECT_ROOT / "process.html")


@app.get("/dashboard.html", include_in_schema=False)
def dashboard_page():
    return FileResponse(PROJECT_ROOT / "dashboard.html")


for static_dir in ("css", "js", "assets"):
    static_path = PROJECT_ROOT / static_dir
    if static_path.is_dir():
        app.mount(f"/{static_dir}", StaticFiles(directory=static_path), name=static_dir)
