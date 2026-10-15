import logging
import os
import re
from uuid import UUID, uuid4

import httpx
import psycopg
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ValidationError

import database

logger = logging.getLogger(__name__)
load_dotenv()

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")

app = FastAPI(
    title="PathFinder AI API",
    description="Career discovery, skill-gap analysis, and roadmap planning",
    version="0.4.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://pathfinder-ai-ashen.vercel.app",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
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
        "interests": [
            "artificial intelligence",
            "math",
            "programming",
            "data",
        ],
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
        "interests": [
            "data",
            "business",
            "math",
            "problem solving",
        ],
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
        "interests": [
            "physics",
            "math",
            "programming",
            "research",
            "simulation",
        ],
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
        "interests": [
            "design",
            "psychology",
            "creativity",
            "people",
            "technology",
        ],
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
        "interests": [
            "business",
            "technology",
            "people",
            "strategy",
            "problem solving",
        ],
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
# Goal keywords
# --------------------------------------------------

# These are transparent keyword-based indicators, not semantic AI analysis.
# Keep these aligned with the career catalog as it evolves.

CAREER_GOAL_KEYWORDS = {
    "ai-ml-engineer": [
        "artificial intelligence",
        "machine learning",
        "deep learning",
        "neural network",
        "predictive model",
        "train a model",
        "data science",
        "build an ai",
    ],
    "data-analyst": [
        "data analysis",
        "analyze data",
        "data visualization",
        "dashboard",
        "sql",
        "business intelligence",
        "business insights",
        "statistics",
    ],
    "scientific-computing": [
        "physics simulation",
        "scientific simulation",
        "numerical methods",
        "differential equations",
        "scientific computing",
        "computational physics",
        "research simulation",
        "mathematical modeling",
    ],
    "ux-designer": [
        "user experience",
        "ux design",
        "user interface",
        "ui design",
        "user research",
        "wireframe",
        "prototype",
        "usability",
    ],
    "product-manager": [
        "product management",
        "product manager",
        "product strategy",
        "product roadmap",
        "user needs",
        "feature prioritization",
        "product requirements",
        "business strategy",
    ],
}

# Common aliases are normalized before comparing profile data with the catalog.
ALIASES = {
    "ml": "machine learning",
    "machinelearning": "machine learning",
    "ai": "artificial intelligence",
    "artificialintelligence": "artificial intelligence",
    "js": "javascript",
    "py": "python",
    "linearalgebra": "linear algebra",
    "datascience": "data science",
    "dataanalysis": "data analysis",
    "datavisualization": "data visualization",
    "differentialequations": "differential equations",
    "numericalmethods": "numerical methods",
    "scientificcomputing": "scientific computing",
    "scientificmodeling": "scientific modeling",
    "problemsolving": "problem solving",
    "problem-solving": "problem solving",
    "ux": "user experience",
    "ui": "user interface",
    "userinterface": "user interface",
    "userexperience": "user experience",
    "deep learning": "deep learning",
    "neural networks": "neural network",
}


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
    session_id: UUID | None = None
    conversation_id: UUID | None = None


# --------------------------------------------------
# Matching helpers
# --------------------------------------------------

def clean_text(value: str) -> str:
    """Normalize punctuation, whitespace, and case."""
    value = str(value).strip().lower()
    value = re.sub(r"[_/]+", " ", value)
    value = re.sub(r"[^a-z0-9+#.\s-]", " ", value)
    value = re.sub(r"\s+", " ", value)
    return value.strip()


def canonicalize(value: str) -> str:
    """Convert common aliases into catalog-compatible terms."""
    cleaned = clean_text(value)
    compact = re.sub(r"[\s-]+", "", cleaned)

    if cleaned in ALIASES:
        return ALIASES[cleaned]

    if compact in ALIASES:
        return ALIASES[compact]

    return cleaned.replace("-", " ")


def normalize(items: list[str]) -> set[str]:
    """Return canonical, non-empty profile terms."""
    normalized = set()

    for item in items:
        if not isinstance(item, str):
            continue

        term = canonicalize(item)

        if term:
            normalized.add(term)

    return normalized


def normalize_goal_text(value: str) -> str:
    """Normalize a free-text goal while preserving searchable phrases."""
    value = clean_text(value)
    value = value.replace("-", " ")
    return re.sub(r"\s+", " ", value).strip()


def score_career(profile: StudentProfile, career: dict) -> dict:
    student_skills = normalize(profile.skills)
    student_interests = normalize(profile.interests)

    required_skills = normalize(career["skills"])
    career_interests = normalize(career["interests"])

    matched_skills = sorted(student_skills & required_skills)
    missing_skills = sorted(required_skills - student_skills)
    matched_interests = sorted(student_interests & career_interests)

    skill_coverage = (
        round(len(matched_skills) / len(required_skills) * 100)
        if required_skills
        else 0
    )

    interest_fit = (
        round(len(matched_interests) / len(career_interests) * 100)
        if career_interests
        else 0
    )

    goal_text = normalize_goal_text(profile.goals)
    goal_keywords = CAREER_GOAL_KEYWORDS.get(career["id"], [])

    matched_goal_keywords = [
        keyword
        for keyword in goal_keywords
        if normalize_goal_text(keyword) in goal_text
    ]

    # An optional goal should not penalize a student who hasn't written one.
    if goal_text and goal_keywords:
        goal_alignment = round(
            len(matched_goal_keywords) / len(goal_keywords) * 100
        )

        match_score = round(
            skill_coverage * 0.55
            + interest_fit * 0.30
            + goal_alignment * 0.15
        )

        score_breakdown = {
            "skills_weight": 55,
            "interests_weight": 30,
            "goals_weight": 15,
            "skills_contribution": round(skill_coverage * 0.55, 1),
            "interests_contribution": round(interest_fit * 0.30, 1),
            "goals_contribution": round(goal_alignment * 0.15, 1),
        }
    else:
        goal_alignment = None

        match_score = round(
            skill_coverage * 0.65
            + interest_fit * 0.35
        )

        score_breakdown = {
            "skills_weight": 65,
            "interests_weight": 35,
            "goals_weight": 0,
            "skills_contribution": round(skill_coverage * 0.65, 1),
            "interests_contribution": round(interest_fit * 0.35, 1),
            "goals_contribution": 0,
        }

    return {
        "career_id": career["id"],
        "title": career["title"],
        "field": career["field"],
        "description": career["description"],
        "match_score": max(0, min(100, match_score)),
        "skill_coverage": skill_coverage,
        "interest_fit": interest_fit,
        "goal_alignment": goal_alignment,
        "score_breakdown": score_breakdown,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "matched_interests": matched_interests,
        "matched_goal_keywords": matched_goal_keywords,
        "projects": career["projects"],
    }


def sort_matches(profile: StudentProfile) -> list[dict]:
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

    return results


def build_system_prompt(
    profile: StudentProfile,
    matches: list[dict],
) -> str:
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
        "Use plain text. You may use **bold** for key terms, but no italics, "
        "headings or tables. Do not use emoji. "
        "Do not claim match scores predict hiring outcomes; "
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


def get_profile(profile_data: dict) -> StudentProfile:
    try:
        return StudentProfile(**profile_data)
    except (ValidationError, TypeError):
        return StudentProfile()


def database_error() -> HTTPException:
    return HTTPException(
        status_code=503,
        detail=(
            "Chat history is temporarily unavailable. "
            "Please try again shortly."
        ),
    )


def make_conversation_title(message: str) -> str:
    title = " ".join(message.split()).strip()

    if len(title) > 80:
        title = title[:77].rstrip() + "..."

    return title or "New conversation"


# --------------------------------------------------
# Basic routes
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


# --------------------------------------------------
# Career matching
# --------------------------------------------------

@app.post("/api/match")
async def match_careers(profile: StudentProfile):
    results = sort_matches(profile)

    return {
        "method": "weighted_profile_alignment_heuristic",
        "disclaimer": (
            "Scores indicate alignment with this curated catalog. "
            "They are not probabilities of employment or measures of aptitude."
        ),
        "count": len(results),
        "recommendations": results[:3],
    }


# --------------------------------------------------
# Roadmap generation
# --------------------------------------------------

@app.post("/api/roadmap")
async def create_roadmap(request: RoadmapRequest):
    career = next(
        (
            item
            for item in CAREERS
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
            "milestone": (
                "Apply the skills in a guided mini-project."
            ),
        },
        {
            "phase": 3,
            "title": "Prove your skills",
            "duration_weeks": 3,
            "skills": missing[4:],
            "milestone": career["projects"][0],
        },
    ]

    if request.monthly_budget == 0:
        resource_guidance = (
            "Use free documentation, open courses, and free tools."
        )
    else:
        resource_guidance = (
            "Start with free resources; use the available budget only "
            "for resources that address a specific learning gap."
        )

    if request.weekly_hours <= 3:
        pacing = "Light: work on one small task at a time."
    elif request.weekly_hours <= 7:
        pacing = "Steady: split time between learning and practice."
    else:
        pacing = (
            "Intensive: combine structured learning with project work."
        )

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


# --------------------------------------------------
# Persistent conversation history
# --------------------------------------------------

@app.get("/api/conversations")
async def list_conversations(
    session_id: UUID = Query(...),
):
    """List conversations belonging to a browser session."""
    try:
        conversations = await database.get_conversations(session_id)
        return {"conversations": conversations}
    except (psycopg.Error, RuntimeError):
        logger.exception("PathFinder database operation failed")
        raise database_error()


@app.get("/api/conversations/{conversation_id}/messages")
async def list_conversation_messages(
    conversation_id: UUID,
    session_id: UUID = Query(...),
):
    """Load messages if the conversation belongs to this session."""
    try:
        belongs = await database.conversation_belongs_to_session(
            conversation_id,
            session_id,
        )

        if not belongs:
            raise HTTPException(
                status_code=404,
                detail="Conversation not found.",
            )

        messages = await database.get_conversation_messages(
            conversation_id
        )

        return {
            "conversation_id": conversation_id,
            "messages": messages,
        }
    except HTTPException:
        raise
    except (psycopg.Error, RuntimeError):
        logger.exception("PathFinder database operation failed")
        raise database_error()


@app.delete("/api/conversations/{conversation_id}")
async def remove_conversation(
    conversation_id: UUID,
    session_id: UUID = Query(...),
):
    """Delete a conversation belonging to the supplied browser session."""
    try:
        deleted = await database.delete_conversation(
            conversation_id,
            session_id,
        )

        if not deleted:
            raise HTTPException(
                status_code=404,
                detail="Conversation not found.",
            )

        return {
            "deleted": True,
            "conversation_id": conversation_id,
        }
    except HTTPException:
        raise
    except (psycopg.Error, RuntimeError):
        logger.exception("PathFinder database operation failed")
        raise database_error()


# --------------------------------------------------
# Groq chat + persistent history
# --------------------------------------------------

@app.post("/api/chat")
async def chat(request: ChatRequest):
    api_key = os.getenv("GROQ_API_KEY")

    if not api_key:
        raise HTTPException(
            status_code=503,
            detail=(
                "Chat is not configured. "
                "Set GROQ_API_KEY in the backend environment."
            ),
        )

    session_id = request.session_id or uuid4()
    conversation_id = request.conversation_id

    if conversation_id is not None:
        try:
            belongs = await database.conversation_belongs_to_session(
                conversation_id,
                session_id,
            )
        except (psycopg.Error, RuntimeError):
            logger.exception("PathFinder database operation failed")
            raise database_error()

        if not belongs:
            raise HTTPException(
                status_code=404,
                detail=(
                    "Conversation not found for this session. "
                    "Start a new conversation."
                ),
            )

    profile = get_profile(request.profile)
    matches = sort_matches(profile)[:3]

    payload = {
        "model": GROQ_MODEL,
        "messages": [
            {
                "role": "system",
                "content": build_system_prompt(profile, matches),
            },
            {
                "role": "user",
                "content": request.message,
            },
        ],
        "temperature": 0.6,
        "max_tokens": 500,
    }

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                GROQ_URL,
                headers={
                    "Authorization": f"Bearer {api_key}",
                },
                json=payload,
            )

        response.raise_for_status()
        reply = (
            response.json()["choices"][0]["message"]["content"].strip()
        )

        if not reply:
            raise ValueError("The AI returned an empty reply.")

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="The AI service timed out. Try again.",
        )
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=502,
            detail=(
                "The AI service returned an error "
                f"({exc.response.status_code})."
            ),
        )
    except (httpx.HTTPError, KeyError, IndexError, ValueError):
        raise HTTPException(
            status_code=502,
            detail="Could not get a reply from the AI service.",
        )

    try:
        if conversation_id is None:
            conversation_id = await database.create_conversation(
                session_id=session_id,
                title=make_conversation_title(request.message),
            )

        await database.save_messages(
            conversation_id=conversation_id,
            user_message=request.message,
            assistant_reply=reply,
        )

    except (psycopg.Error, RuntimeError):
        logger.exception("PathFinder database operation failed")
        raise database_error()

    return {
        "reply": reply,
        "session_id": session_id,
        "conversation_id": conversation_id,
    }