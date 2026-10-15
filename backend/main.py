
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

MAX_HISTORY_MESSAGES = 12
MAX_HISTORY_MESSAGE_CHARS = 6000
MAX_REPLY_TOKENS = 1000

app = FastAPI(
    title="PathFinder AI API",
    description="Career discovery, skill-gap analysis, and roadmap planning",
    version="0.4.1",
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


# --------------------------------------------------
# Chat system prompt
# --------------------------------------------------

def build_system_prompt(
    profile: StudentProfile,
    matches: list[dict],
) -> str:
    """Build instructions that encourage concise, personalized conversation."""

    match_lines = "\n".join(
        f"- {m['title']} (catalog alignment: {m['match_score']}%): "
        f"matched skills: [{', '.join(m['matched_skills']) or 'none yet'}]; "
        f"skills to develop: [{', '.join(m['missing_skills']) or 'none listed'}]"
        for m in matches
    )

    return (
        "IDENTITY:\n"
        "You are PathFinder, a thoughtful, approachable career mentor "
        "helping students explore careers and take realistic next steps. "
        "You are a conversational assistant, not a report generator.\n\n"

        "CONVERSATION STYLE:\n"
        "- Answer the user's actual question directly and naturally.\n"
        "- Start with the useful answer, not a formal introduction.\n"
        "- For ordinary questions, aim for 80-180 words or less when "
        "the question can be answered simply.\n"
        "- Usually use 2-5 short paragraphs or a small bullet list.\n"
        "- Be concise by default, but give a detailed explanation when "
        "the user explicitly asks for one.\n"
        "- Do not automatically produce a roadmap, resource catalogue, "
        "portfolio checklist, weekly schedule, and conclusion in every answer.\n"
        "- Never use Markdown tables unless the user explicitly requests one.\n"
        "- Avoid excessive headings, nested lists, repeated summaries, "
        "and unnecessary introductions.\n"
        "- Use bold text sparingly and use Markdown lists when useful.\n"
        "- Do not force career advice into greetings or unrelated questions.\n"
        "- Ask at most one clarifying question, and only when it is useful.\n"
        "- Avoid repeating information the user has already received.\n\n"

        "PERSONALIZATION:\n"
        "- Use previous conversation messages to understand follow-up questions.\n"
        "- Resolve references such as 'it', 'that career', 'this skill', "
        "and 'what should I do next?' from the conversation when possible.\n"
        "- Do not ask the user to repeat information already provided.\n"
        "- Tailor advice to the student's stated skills, interests, goals, "
        "education, time, and budget when relevant.\n"
        "- Do not assume missing qualifications, interests, or experience.\n"
        "- Explain why a recommendation fits the student instead of merely "
        "calling it a perfect or natural fit.\n"
        "- When useful, give one practical next action rather than a long "
        "list of things the student could do.\n"
        "- Be encouraging without exaggerated praise or unrealistic promises.\n\n"

        "ACCURACY:\n"
        "- Be honest about uncertainty and distinguish facts from suggestions.\n"
        "- Do not invent course details, certifications, salaries, statistics, "
        "job openings, or employment guarantees.\n"
        "- Do not claim career-match scores predict hiring outcomes, aptitude, "
        "or future success.\n"
        "- Treat the curated career catalog as a limited set of suggestions, "
        "not a complete list of every possible career.\n"
        "- Prefer free or low-cost resources when appropriate.\n"
        "- Do not claim to have browsed the web or verified current facts "
        "unless a tool actually did so.\n\n"

        "FORMATTING:\n"
        "- Return clean Markdown that can be rendered by a chat interface.\n"
        "- Do not output raw Markdown table syntax.\n"
        "- Do not use a formal report title unless the user asks for a report.\n"
        "- For a simple question, answer simply.\n"
        "- For an explicit planning request, provide an appropriately "
        "structured plan without unnecessary filler.\n\n"

        "STUDENT PROFILE:\n"
        f"- Education: {profile.education_level}\n"
        f"- Interests: {', '.join(profile.interests) or 'Not provided'}\n"
        f"- Skills: {', '.join(profile.skills) or 'Not provided'}\n"
        f"- Goals: {profile.goals or 'Not provided'}\n"
        f"- Available study time: {profile.weekly_hours} hours per week\n"
        f"- Monthly budget: INR {profile.monthly_budget:g}\n\n"

        "TOP CAREER MATCHES FROM THE CURATED CATALOG:\n"
        f"{match_lines}\n\n"

        "The catalog alignment scores are heuristic indicators only. "
        "Use these matches only when they help answer the question. "
        "Do not force every reply to discuss careers, list every match, "
        "or repeat the student's entire profile."
    )


# --------------------------------------------------
# General helpers
# --------------------------------------------------

def get_profile(profile_data: dict) -> StudentProfile:
    """Validate the profile; use safe defaults if it is malformed."""
    try:
        return StudentProfile(**profile_data)
    except (ValidationError, TypeError):
        logger.warning("Invalid student profile received; using defaults")
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


def build_chat_history(history: list[dict]) -> list[dict]:
    """
    Return a bounded history of valid user/assistant messages.

    Message contents are truncated individually to avoid sending very large
    previous replies back to the model.
    """
    valid_messages = []

    for item in history:
        role = item.get("role")
        content = item.get("content")

        if role not in ("user", "assistant"):
            continue

        if not isinstance(content, str) or not content.strip():
            continue

        content = content.strip()

        if len(content) > MAX_HISTORY_MESSAGE_CHARS:
            content = (
                content[:MAX_HISTORY_MESSAGE_CHARS].rstrip()
                + "\n[Earlier message truncated for context.]"
            )

        valid_messages.append({
            "role": role,
            "content": content,
        })

    recent = valid_messages[-MAX_HISTORY_MESSAGES:]

    # Keep the history starting at a user message where possible, so the
    # model is less likely to receive an orphaned assistant response.
    while recent and recent[0]["role"] == "assistant":
        recent.pop(0)

    return recent


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

    user_message = request.message.strip()

    if not user_message:
        raise HTTPException(
            status_code=422,
            detail="Message cannot be empty.",
        )

    session_id = request.session_id or uuid4()
    conversation_id = request.conversation_id

    # Verify that the conversation belongs to the supplied session.
    if conversation_id is not None:
        try:
            belongs = await database.conversation_belongs_to_session(
                conversation_id,
                session_id,
            )
        except (psycopg.Error, RuntimeError):
            logger.exception("Could not verify conversation ownership")
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

    messages = [
        {
            "role": "system",
            "content": build_system_prompt(profile, matches),
        }
    ]

    # Load recent messages so follow-up questions have context.
    if conversation_id is not None:
        try:
            history = await database.get_conversation_messages(
                conversation_id
            )
        except (psycopg.Error, RuntimeError):
            logger.exception("Could not load conversation history")
            raise database_error()

        messages.extend(build_chat_history(history))

    # Add the current user message once.
    messages.append({
        "role": "user",
        "content": user_message,
    })

    payload = {
        "model": GROQ_MODEL,
        "messages": messages,
        "temperature": 0.5,
        "max_tokens": MAX_REPLY_TOKENS,
    }

    try:
        async with httpx.AsyncClient(
            timeout=httpx.Timeout(60.0, connect=10.0)
        ) as client:
            response = await client.post(
                GROQ_URL,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )

        response.raise_for_status()
        data = response.json()
        choices = data.get("choices", [])

        if not choices:
            logger.error("Groq returned no choices")
            raise HTTPException(
                status_code=502,
                detail="The AI returned no answer. Please try again.",
            )

        choice = choices[0]
        reply = choice.get("message", {}).get("content", "")

        if not isinstance(reply, str) or not reply.strip():
            logger.error("Groq returned an empty or invalid reply")
            raise HTTPException(
                status_code=502,
                detail="The AI returned an empty answer. Please try again.",
            )

        reply = reply.strip()

        if choice.get("finish_reason") == "length":
            logger.warning(
                "Groq response reached max_tokens for model %s",
                GROQ_MODEL,
            )

    except httpx.TimeoutException:
        logger.warning("Groq request timed out")
        raise HTTPException(
            status_code=504,
            detail="The AI service timed out. Please try again.",
        )

    except httpx.HTTPStatusError as exc:
        logger.error(
            "Groq returned HTTP %s: %s",
            exc.response.status_code,
            exc.response.text[:500],
        )
        raise HTTPException(
            status_code=502,
            detail=(
                f"The AI service returned an error "
                f"({exc.response.status_code}). Please try again."
            ),
        )

    except httpx.HTTPError:
        logger.exception("Could not communicate with Groq")
        raise HTTPException(
            status_code=502,
            detail="Could not reach the AI service. Please try again.",
        )

    except (ValueError, KeyError, IndexError, TypeError):
        logger.exception("Could not parse Groq response")
        raise HTTPException(
            status_code=502,
            detail="The AI service returned an invalid response.",
        )

    # Save the exchange after the AI has responded successfully.
    try:
        if conversation_id is None:
            conversation_id = await database.create_conversation(
                session_id=session_id,
                title=make_conversation_title(user_message),
            )

        await database.save_messages(
            conversation_id=conversation_id,
            user_message=user_message,
            assistant_reply=reply,
        )

    except (psycopg.Error, RuntimeError):
        logger.exception("Could not save conversation")
        raise database_error()

    return {
        "reply": reply,
        "session_id": session_id,
        "conversation_id": conversation_id,
    }
