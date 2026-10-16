# ✦ PathFinder AI

### Find your direction. Build your future.

**An AI-powered career exploration platform that helps students turn their interests, skills, and ambitions into actionable career paths.**

PathFinder AI brings career discovery, personalized recommendations, learning roadmaps, and an AI career mentor into one interactive workspace.

Instead of leaving students overwhelmed by endless career options and scattered learning resources, PathFinder AI helps them explore possibilities and identify practical next steps.

---

## ✨ What is PathFinder AI?

Choosing a career can be difficult. Students often struggle to understand which careers align with their interests, which skills they need to develop, and where to begin learning.

PathFinder AI addresses this challenge with a personalized career exploration experience that connects **who you are, what you want to pursue, and what you can learn next.**

### 🚀 Key Features

- **🎯 Personalized Career Matching** — Discover career paths based on your education level, interests, and existing skills.
- **📊 Ranked Career Recommendations** — Explore potential career options with match scores and explanations of how your profile aligns with each path.
- **🗺️ Learning Roadmaps** — Generate structured learning plans to help you progress toward a selected career.
- **🤖 AI Career Mentor** — Ask career-related questions, explore learning options, and get guidance as you navigate your next steps.
- **💬 Conversational Interface** — Interact with the AI through a chat-based experience.
- **🧭 Unified Career Workspace** — Explore your mission, career matches, and learning roadmap in one place.
- **🎨 Immersive Dark UI** — A modern interface with an indigo-violet visual identity, subtle gradients, and responsive components.
- **⚡ Full-Stack Architecture** — A React frontend communicates with a FastAPI backend for career matching and AI-powered features.

---

## 🖥️ The Experience

PathFinder AI is organized around three core areas:

| Workspace   | Purpose                                                             |
| ----------- | ------------------------------------------------------------------- |
| **Mission** | Access your career exploration workspace and guidance.              |
| **Matches** | Review ranked career recommendations based on your profile.         |
| **Roadmap** | Explore a structured plan for progressing toward a selected career. |

The goal is not simply to tell users what career to choose. It is to help them explore options and understand what they could do next.

---

## 🏗️ Tech Stack

### Frontend

- **React** — Component-based user interface
- **Vite** — Development server and build tooling
- **Tailwind CSS v4** — Utility-first styling
- **shadcn-style UI components / Base UI** — Interface primitives
- **Lucide React** — Icons
- **Motion** — Interface animations

### Backend

- **Python** — Backend application logic
- **FastAPI** — REST API and request handling
- **Groq** — AI inference for supported conversational and generation features
- **PostgreSQL** — Relational data storage, including chat history where configured

### Architecture

```text
┌──────────────────────────────┐
│       React + Vite           │
│                              │
│ Profile · Chat · Workspace   │
└──────────────┬───────────────┘
               │ HTTP / JSON
               ▼
┌──────────────────────────────┐
│         FastAPI              │
│                              │
│ Career Matching              │
│ Roadmap Generation           │
│ AI Mentor / Chat             │
└───────┬──────────────┬───────┘
        │              │
        ▼              ▼
┌──────────────┐  ┌──────────────┐
│ Groq API     │  │ PostgreSQL   │
│ AI features  │  │ Stored data  │
└──────────────┘  └──────────────┘
```

*The diagram represents the high-level architecture; exact persistence and AI usage depend on the implementation of each feature.*

---

## 🧠 How Career Matching Works

PathFinder AI uses a user's profile to identify career paths worth exploring.

1. **Profile collection** — The user provides relevant information, including education, interests, and existing skills.
2. **Profile evaluation** — The backend compares the profile with information associated with available career paths.
3. **Career ranking** — The system returns recommendations ordered by its matching logic.
4. **Career exploration** — The user reviews the results and selects a path to explore further.
5. **Roadmap generation** — The application can generate a learning roadmap for a selected career.

### An important distinction

Career match scores are **heuristic indicators**, not validated measures of aptitude, guaranteed employment outcomes, or predictions of future success.

PathFinder AI is designed to support exploration and decision-making—not make career decisions on a user's behalf.

---

## 🛠️ Getting Started

Follow these instructions to run PathFinder AI locally.

### Prerequisites

Make sure you have installed:

- [Node.js](https://nodejs.org/) — compatible with your Vite setup
- npm
- [Python](https://www.python.org/)
- PostgreSQL, if running the database-backed features locally
- A Groq API key for AI-powered features that require it

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd <YOUR_PROJECT_DIRECTORY>
```

### 2. Start the frontend

Navigate to your frontend directory:

```bash
cd Frontend
npm install
```

Create or update the frontend `.env` file:

```env
VITE_API_URL=http://127.0.0.1:8000
```

Start the development server:

```bash
npm run dev
```

Vite will print the local URL in your terminal, typically `http://localhost:5173`.

### 3. Start the backend

Open another terminal and navigate to the backend directory:

```bash
cd Backend
```

Create and activate a virtual environment:

**Windows PowerShell**

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install the project's dependencies:

```bash
pip install -r requirements.txt
```

Configure the backend environment variables according to your application:

```env
GROQ_API_KEY=your_groq_api_key
DATABASE_URL=your_postgresql_connection_string
```

Run the FastAPI application using the correct module path for your project. For example, if your entry point is `app.py` and exposes `app`:

```bash
uvicorn app:app --reload
```

The backend should now be available at `http://127.0.0.1:8000`.

**Note:** These commands assume your repository contains `Frontend/`, `Backend/`, `requirements.txt`, and an `app.py` entry point. Adjust the paths, environment variables, and startup command to match your actual repository. Run any required database migrations or initialization steps before using database-backed features.

---

## 🔌 API Overview

The frontend communicates with the backend through HTTP requests.

| Endpoint       | Method | Purpose                                  |
| -------------- | ------ | ---------------------------------------- |
| `/api/health`  | GET    | Check backend health                     |
| `/api/careers` | GET    | Retrieve available career paths          |
| `/api/match`   | POST   | Generate career recommendations          |
| `/api/roadmap` | POST   | Generate a roadmap for a selected career |

### Example: Career Matching

```http
POST /api/match
Content-Type: application/json
```

Example request body:

```json
{
  "education_level": "Undergraduate",
  "interests": [
    "physics",
    "math",
    "programming"
  ],
  "skills": [
    "python"
  ],
  "weekly_hours": 5,
  "monthly_budget": 0
}
```

The actual response schema is determined by the backend implementation. The frontend expects career matching to return a `recommendations` array.

For the full request and response contracts, consult the corresponding FastAPI route definitions.

---

## 🔐 Environment Variables & Security

Keep secrets outside the source code.

- Never commit `.env` files containing API keys or database credentials.
- Add `.env` and other secret-bearing files to `.gitignore`.
- Keep `GROQ_API_KEY` on the backend; do not expose it through a `VITE_` environment variable.
- Configure production CORS to allow only the required frontend origins.
- Use secure database credentials and restrict database access appropriately.
- Avoid committing user conversations or other private data.

Example `.gitignore` entries:

```gitignore
.env
.env.*
!.env.example

.venv/
venv/
__pycache__/
*.py[cod]

node_modules/
dist/

*.log
```

Adjust these entries to match your repository and deployment requirements.

---

## 🌐 Deployment

The deployed backend currently uses:

**Backend URL:** [https://pathfinder-ai-omoc.onrender.com](https://pathfinder-ai-omoc.onrender.com)

To connect a deployed frontend to the backend, configure the frontend's environment variable:

```env
VITE_API_URL=https://pathfinder-ai-omoc.onrender.com
```

Rebuild and redeploy the frontend after changing its environment variables.

Before publishing a release, verify that:

- The deployed frontend loads correctly.
- The backend health endpoint responds successfully.
- Career matching returns valid recommendations.
- Roadmap generation works for a selected career.
- AI features work with valid backend credentials.
- Database-backed features work in the deployed environment.
- Loading, error, and empty states behave correctly.

Deployment availability and response times depend on the hosting configuration and service status.



## 🔮 Future Possibilities

Potential directions for further development include:

- **Explainable recommendations** — Show users which profile attributes contributed to each match.
- **Adaptive roadmaps** — Adjust learning plans as users develop skills and complete milestones.
- **Progress tracking** — Record completed learning activities and roadmap progress.
- **Resource discovery** — Recommend relevant courses, documentation, and practical projects.
- **Career comparison** — Compare different paths by skills, learning requirements, time commitment, and cost.
- **Improved evaluation** — Test recommendation quality using defined criteria and representative user profiles.

These are possible future enhancements, not claims about existing functionality.

---

## 🤝 Contributing

Contributions, bug reports, and suggestions are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make and test your changes.
4. Submit a pull request describing the change.

Keep changes focused, protect user data, and document any new environment variables or setup steps.

---


