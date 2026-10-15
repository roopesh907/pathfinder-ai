import os

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ValidationError

load_dotenv()

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")


app = FastAPI(
    title="PathFinder AI API",
    description="Career discovery, skill-gap analysis, and roadmap planning",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# Curated career catalog
# --------------------------------------------------

CAREERS = [
    {
        "id": "ai-ml-engineer",
        "title": "AI/ML Engineer",
        "field": "Technology",
        "description": "Build software that learns from data and makes predictions.",
        "skills": [
            "python",
            "linear algebra",
            "statistics",
            "machine learning",
            "software engineering",
        ],
        "interests": ["artificial intelligence", "math", "programming", "data"],
        "projects": [
            "Build and deploy a machine learning predictor.",
            "Create a model evaluation dashboard.",
        ],
        "resources": [
            "Python fundamentals",
            "Linear algebra and statistics",
            "Machine learning fundamentals",
            "Build and deploy an ML project",
        ],
    },
    {
        "id": "data-analyst",
        "title": "Data Analyst",
        "field": "Data",
        "description": "Turn data into insights that help people make decisions.",
        "skills": [
            "sql",
            "python",
            "statistics",
            "data visualization",
            "communication",
        ],
        "interests": ["data", "business", "math", "problem solving"],
        "projects": [
            "Analyze a public dataset.",
            "Build an interactive analytics dashboard.",
        ],
        "resources": [
            "Spreadsheet and SQL fundamentals",
            "Statistics and data cleaning",
            "Data visualization",
            "Complete an end-to-end analysis",
        ],
    },
    {
        "id": "scientific-computing",
        "title": "Scientific Computing Engineer",
        "field": "Science & Engineering",
        "description": "Use numerical methods and simulations to solve scientific problems.",
        "skills": [
            "python",
            "linear algebra",
            "numerical methods",
            "differential equations",
            "scientific modeling",
        ],
        "interests": ["physics", "math", "programming", "research", "simulation"],
        "projects": [
            "Simulate a physical system numerically.",
            "Visualize a scientific model interactively.",
        ],
        "resources": [
            "Scientific Python and NumPy",
            "Linear algebra and differential equations",
            "Numerical methods",
            "Build and validate a simulation",
        ],
    },
    {
        "id": "ux-designer",
        "title": "UX Designer",
        "field": "Design",
        "description": "Design useful digital experiences around people's needs.",
        "skills": [
            "user research",
            "wireframing",
            "prototyping",
            "visual design",
            "communication",
        ],
        "interests": ["design", "psychology", "creativity", "people", "technology"],
        "projects": [
            "Interview users about a real problem.",
            "Prototype and test a redesigned experience.",
        ],
        "resources": [
            "UX principles and user research",
            "Wireframing and information architecture",
            "Interactive prototyping",
            "Test and document a case study",
        ],
    },
    {
        "id": "product-manager",
        "title": "Product Manager",
        "field": "Business",
        "description": "Connect user needs, business goals, and technical teams.",
        "skills": [
            "problem solving",
            "communication",
            "user research",
            "prioritization",
            "data analysis",
        ],
        "interests": ["business", "technology", "people", "strategy", "problem solving"],
        "projects": [
            "Write a product brief for a real user problem.",
            "Prioritize features using user feedback.",
        ],
        "resources": [
            "Problem discovery and user interviews",
            "Product requirements and prioritization",
            "Metrics and product analytics",
            "Create and present a product case study",
        ],
    },
]


# --------------------------------------------------
# Request models
# --------------------------------------------------

class StudentProfile(BaseModel):
    education_level: str = Field(
        default="Undergraduate",
        min_length=1,
        max_length=100,
    )
    interests: list[str] = Field(default_factory=list, max_length=20)
    skills: list[str] = Field(default_factory=list, max_length=50)
    goals: str = Field(default="", max_length=1000)
    weekly_hours: int = Field(default=5, ge=1, le=80)
    monthly_budget: float = Field(default=0, ge=0, le=1000000)


class RoadmapRequest(StudentProfile):
    career_id: str


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    profile: dict = Field(default_factory=dict)


# --------------------------------------------------
# Matching helpers
# --------------------------------------------------

def normalize(items: list[str]) -> set[str]:
    return {
        item.strip().lower()
        for item in items
        if item.strip()
    }


def score_career(profile: StudentProfile, career: dict) -> dict:
    student_skills = normalize(profile.skills)
    student_interests = normalize(profile.interests)

    required_skills = set(career["skills"])
    career_interests = set(career["interests"])

    matched_skills = sorted(student_skills & required_skills)
    missing_skills = sorted(required_skills - student_skills)
    matched_interests = sorted(student_interests & career_interests)

    skill_coverage = round(
        len(matched_skills) / len(required_skills) * 100
    )

    interest_fit = (
        round(len(matched_interests) / len(career_interests) * 100)
        if career_interests
        else 0
    )

    # A transparent heuristic, not a probability of getting hired.
    match_score = round(
        skill_coverage * 0.65 + interest_fit * 0.35
    )

    return {
        "career_id": career["id"],
        "title": career["title"],
        "field": career["field"],
        "description": career["description"],
        "match_score": match_score,
        "skill_coverage": skill_coverage,
        "interest_fit": interest_fit,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "projects": career["projects"],
    }


def build_system_prompt(profile: StudentProfile, matches: list[dict]) -> str:
    match_lines = "\n".join(
        f"- {m['title']} (match {m['match_score']}%): "
        f"has [{', '.join(m['matched_skills']) or 'none yet'}], "
        f"missing [{', '.join(m['missing_skills'])}]"
        for m in matches
    )
    return (
        "You are PathFinder, a career-exploration assistant for students. "
        "Give practical, honest, encouraging advice in plain language. "
        "Keep answers short (under 150 words unless asked for more). "
        "Reply briefly to greetings and ask what they want to explore. "
        "Use plain text. You may use **bold** for key terms, but no italics, headings or tables. "
        "Do not use emoji. Do not claim match scores predict hiring outcomes; "
        "they only measure alignment with a small curated catalog.\n\n"
        "Student profile:\n"
        f"- Education: {profile.education_level}\n"
        f"- Interests: {', '.join(profile.interests) or 'not given'}\n"
        f"- Skills: {', '.join(profile.skills) or 'none listed'}\n"
        f"- Goal: {profile.goals or 'not given'}\n"
        f"- Weekly hours: {profile.weekly_hours}\n"
        f"- Monthly budget (INR): {profile.monthly_budget:g}\n\n"
        "Current top career matches:\n"
        f"{match_lines}\n\n"
        "Ground your advice in this profile and these matches. "
        "Suggest free or low-cost resources when the budget is low."
    )


# --------------------------------------------------
# Routes
# --------------------------------------------------

@app.get("/")
async def root():
    return {
        "app": "PathFinder AI",
        "status": "running",
    }


@app.get("/api/health")
async def health():
    return {
        "status": "healthy",
        "service": "pathfinder-backend",
    }


@app.get("/api/careers")
async def get_careers():
    return {
        "count": len(CAREERS),
        "careers": CAREERS,
    }


@app.post("/api/match")
async def match_careers(profile: StudentProfile):
    results = [
        score_career(profile, career)
        for career in CAREERS
    ]

    results.sort(
        key=lambda item: (
            item["match_score"],
            item["interest_fit"],
            item["skill_coverage"],
        ),
        reverse=True,
    )

    return {
        "method": "weighted_skill_and_interest_heuristic",
        "disclaimer": (
            "Scores indicate profile alignment with this curated catalog. "
            "They are not probabilities of employment or measures of aptitude."
        ),
        "count": len(results),
        "recommendations": results[:3],
    }


@app.post("/api/roadmap")
async def create_roadmap(request: RoadmapRequest):
    career = next(
        (
            item for item in CAREERS
            if item["id"] == request.career_id
        ),
        None,
    )

    if career is None:
        raise HTTPException(
            status_code=404,
            detail="Career not found. Check career_id in GET /api/careers.",
        )

    match = score_career(request, career)
    missing = match["missing_skills"]

    # Divide the missing skills into three learning phases.
    phases = [
        {
            "phase": 1,
            "title": "Build the foundations",
            "duration_weeks": 2,
            "skills": missing[:2],
            "milestone": "Complete foundational exercises.",
        },
        {
            "phase": 2,
            "title": "Develop practical skills",
            "duration_weeks": 3,
            "skills": missing[2:4],
            "milestone": "Apply the skills in a guided mini-project.",
        },
        {
            "phase": 3,
            "title": "Prove your skills",
            "duration_weeks": 3,
            "skills": missing[4:],
            "milestone": career["projects"][0],
        },
    ]

    # A simple budget-aware resource suggestion.
    if request.monthly_budget == 0:
        resource_guidance = (
            "Use free documentation, open courses, and free tools."
        )
    else:
        resource_guidance = (
            "Start with free resources; use the available budget only "
            "for resources that address a specific learning gap."
        )

    # Adapt workload to the student's available weekly time.
    if request.weekly_hours <= 3:
        pacing = "Light: work on one small task at a time."
    elif request.weekly_hours <= 7:
        pacing = "Steady: split time between learning and practice."
    else:
        pacing = "Intensive: combine structured learning with project work."

    return {
        "career": {
            "id": career["id"],
            "title": career["title"],
        },
        "match_score": match["match_score"],
        "skill_coverage": match["skill_coverage"],
        "current_skills": match["matched_skills"],
        "skills_to_develop": missing,
        "weekly_hours": request.weekly_hours,
        "estimated_duration_weeks": sum(
            phase["duration_weeks"] for phase in phases
        ),
        "pacing": pacing,
        "resource_guidance": resource_guidance,
        "phases": phases,
        "note": (
            "This is a starter roadmap. Timelines are illustrative and "
            "should be adjusted to the learner's progress."
        ),
    }


@app.post("/api/chat")
async def chat(request: ChatRequest):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="Chat is not configured. Set GROQ_API_KEY in the backend .env file.",
        )

    try:
        profile = StudentProfile(**request.profile)
    except (ValidationError, TypeError):
        profile = StudentProfile()

    matches = sorted(
        (score_career(profile, career) for career in CAREERS),
        key=lambda m: (m["match_score"], m["interest_fit"], m["skill_coverage"]),
        reverse=True,
    )[:3]

    payload = {
        "model": GROQ_MODEL,
        "messages": [
            {"role": "system", "content": build_system_prompt(profile, matches)},
            {"role": "user", "content": request.message},
        ],
        "temperature": 0.6,
        "max_tokens": 500,
    }

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                GROQ_URL,
                headers={"Authorization": f"Bearer {api_key}"},
                json=payload,
            )
        response.raise_for_status()
        reply = response.json()["choices"][0]["message"]["content"].strip()
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="The AI service timed out. Try again.",
        )
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"The AI service returned an error ({exc.response.status_code}).",
        )
    except (httpx.HTTPError, KeyError, IndexError, ValueError):
        raise HTTPException(
            status_code=502,
            detail="Could not get a reply from the AI service.",
        )

    return {"reply": reply}