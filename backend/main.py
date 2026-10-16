import math
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

import asyncio

import database

logger = logging.getLogger(__name__)
load_dotenv()

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")


MAX_HISTORY_MESSAGES = 6
MAX_HISTORY_MESSAGE_CHARS = 1800
MAX_REPLY_TOKENS = 700

MAX_GROQ_RETRIES = 1
GROQ_RETRY_MAX_WAIT_SECONDS = 5.0


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


# Additional curated career paths.
# Keep the original five CAREERS entries unchanged.

ADDITIONAL_CAREERS = [
    {
        "id": "frontend-developer",
        "title": "Frontend Developer",
        "field": "Software Engineering",
        "description": "Build accessible, responsive user interfaces and interactive web applications.",
        "skills": ["javascript", "html", "css", "react", "accessibility", "api integration"],
        "interests": ["programming", "design", "web development", "creativity", "technology"],
        "projects": [
            "Build a responsive portfolio with React",
            "Create a dashboard that consumes a public API",
            "Build an accessible multi-page application"
        ],
        "resources": [
            {"title": "MDN Web Docs", "url": "https://developer.mozilla.org/"},
            {"title": "React Learn", "url": "https://react.dev/learn"}
        ],
    },
    {
        "id": "backend-developer",
        "title": "Backend Developer",
        "field": "Software Engineering",
        "description": "Design APIs, application logic, databases, and reliable server-side systems.",
        "skills": ["python", "sql", "api development", "databases", "testing", "security"],
        "interests": ["programming", "problem solving", "databases", "technology", "systems"],
        "projects": [
            "Build a REST API with FastAPI",
            "Add authentication and database persistence",
            "Write automated tests for an API"
        ],
        "resources": [
            {"title": "FastAPI Tutorial", "url": "https://fastapi.tiangolo.com/tutorial/"},
            {"title": "PostgreSQL Documentation", "url": "https://www.postgresql.org/docs/"}
        ],
    },
    {
        "id": "full-stack-developer",
        "title": "Full-Stack Developer",
        "field": "Software Engineering",
        "description": "Develop complete applications spanning frontend interfaces, backend services, and data storage.",
        "skills": ["javascript", "react", "python", "api development", "sql", "git"],
        "interests": ["programming", "web development", "problem solving", "technology", "building products"],
        "projects": [
            "Build a full-stack task management app",
            "Deploy a React and FastAPI application",
            "Add login, database storage, and error handling"
        ],
        "resources": [
            {"title": "React Learn", "url": "https://react.dev/learn"},
            {"title": "FastAPI Tutorial", "url": "https://fastapi.tiangolo.com/tutorial/"}
        ],
    },
    {
        "id": "mobile-developer",
        "title": "Mobile App Developer",
        "field": "Software Engineering",
        "description": "Create mobile applications with intuitive interfaces, device integrations, and reliable data handling.",
        "skills": ["javascript", "python", "ui design", "api integration", "testing", "databases"],
        "interests": ["programming", "mobile apps", "design", "technology", "creativity"],
        "projects": [
            "Build a mobile-friendly habit tracker",
            "Create an app that consumes an API",
            "Prototype and test a mobile application"
        ],
        "resources": [
            {"title": "React Native Documentation", "url": "https://reactnative.dev/docs/getting-started"},
            {"title": "Flutter Documentation", "url": "https://docs.flutter.dev/"}
        ],
    },
    {
        "id": "data-scientist",
        "title": "Data Scientist",
        "field": "Data & AI",
        "description": "Use statistics, programming, and machine learning to discover patterns and support decisions.",
        "skills": ["python", "statistics", "linear algebra", "machine learning", "data visualization", "sql"],
        "interests": ["data", "math", "research", "artificial intelligence", "problem solving"],
        "projects": [
            "Perform exploratory analysis on a public dataset",
            "Train and evaluate a predictive model",
            "Build a data storytelling dashboard"
        ],
        "resources": [
            {"title": "Kaggle Learn", "url": "https://www.kaggle.com/learn"},
            {"title": "scikit-learn User Guide", "url": "https://scikit-learn.org/stable/user_guide.html"}
        ],
    },
    {
        "id": "data-engineer",
        "title": "Data Engineer",
        "field": "Data Engineering",
        "description": "Build data pipelines and infrastructure that make trustworthy data available for analysis and AI.",
        "skills": ["python", "sql", "databases", "data pipelines", "data modeling", "cloud computing"],
        "interests": ["data", "programming", "systems", "problem solving", "technology"],
        "projects": [
            "Build a pipeline that cleans and loads public data",
            "Design a relational database schema",
            "Schedule and monitor a repeatable data workflow"
        ],
        "resources": [
            {"title": "PostgreSQL Documentation", "url": "https://www.postgresql.org/docs/"},
            {"title": "Apache Airflow Documentation", "url": "https://airflow.apache.org/docs/"}
        ],
    },
    {
        "id": "cybersecurity-analyst",
        "title": "Cybersecurity Analyst",
        "field": "Cybersecurity",
        "description": "Help protect systems and data by identifying vulnerabilities, monitoring threats, and investigating incidents.",
        "skills": ["networking", "linux", "python", "security fundamentals", "log analysis", "risk assessment"],
        "interests": ["cybersecurity", "programming", "systems", "investigation", "problem solving"],
        "projects": [
            "Build a home lab for safe security practice",
            "Analyze sample security logs",
            "Document a threat model for a demo application"
        ],
        "resources": [
            {"title": "OWASP Top 10", "url": "https://owasp.org/www-project-top-ten/"},
            {"title": "Cisco Skills for All", "url": "https://skillsforall.com/"}
        ],
    },
    {
        "id": "cloud-devops-engineer",
        "title": "Cloud / DevOps Engineer",
        "field": "Cloud & Infrastructure",
        "description": "Automate software delivery and operate applications using cloud infrastructure, containers, and monitoring.",
        "skills": ["linux", "git", "python", "networking", "docker", "cloud computing"],
        "interests": ["programming", "automation", "systems", "technology", "problem solving"],
        "projects": [
            "Containerize a web application",
            "Create a basic continuous integration workflow",
            "Deploy an application with health checks and logs"
        ],
        "resources": [
            {"title": "Docker Get Started", "url": "https://docs.docker.com/get-started/"},
            {"title": "GitHub Actions Documentation", "url": "https://docs.github.com/en/actions"}
        ],
    },
    {
        "id": "nlp-engineer",
        "title": "Natural Language Processing Engineer",
        "field": "Artificial Intelligence",
        "description": "Build systems that process, understand, search, and generate human language.",
        "skills": ["python", "machine learning", "statistics", "natural language processing", "deep learning", "data processing"],
        "interests": ["artificial intelligence", "language", "programming", "math", "research"],
        "projects": [
            "Build a text classification model",
            "Create a semantic search prototype",
            "Evaluate a question-answering system on sample data"
        ],
        "resources": [
            {"title": "Hugging Face NLP Course", "url": "https://huggingface.co/learn/nlp-course/"},
            {"title": "spaCy Documentation", "url": "https://spacy.io/usage"}
        ],
    },
    {
        "id": "computer-vision-engineer",
        "title": "Computer Vision Engineer",
        "field": "Artificial Intelligence",
        "description": "Develop systems that interpret images and video using image processing and machine learning.",
        "skills": ["python", "linear algebra", "statistics", "machine learning", "deep learning", "image processing"],
        "interests": ["artificial intelligence", "math", "programming", "robotics", "visual computing"],
        "projects": [
            "Build an image classifier",
            "Create an object detection demo",
            "Compare model performance on a documented test set"
        ],
        "resources": [
            {"title": "OpenCV Tutorials", "url": "https://docs.opencv.org/"},
            {"title": "PyTorch Tutorials", "url": "https://pytorch.org/tutorials/"}
        ],
    },
    {
        "id": "robotics-engineer",
        "title": "Robotics Engineer",
        "field": "Robotics & Automation",
        "description": "Combine programming, mathematics, sensors, and control systems to build autonomous machines.",
        "skills": ["python", "linear algebra", "calculus", "control systems", "electronics", "robotics"],
        "interests": ["robotics", "physics", "math", "programming", "engineering"],
        "projects": [
            "Simulate a robot moving toward a target",
            "Build a sensor-based obstacle detector",
            "Explore robot motion using a simulator"
        ],
        "resources": [
            {"title": "ROS 2 Documentation", "url": "https://docs.ros.org/"},
            {"title": "Python Documentation", "url": "https://docs.python.org/3/"}
        ],
    },
    {
        "id": "embedded-systems-engineer",
        "title": "Embedded Systems Engineer",
        "field": "Electronics & Computing",
        "description": "Develop software that runs close to hardware in devices, sensors, and real-time systems.",
        "skills": ["python", "c programming", "electronics", "microcontrollers", "debugging", "computer architecture"],
        "interests": ["programming", "electronics", "physics", "engineering", "hardware"],
        "projects": [
            "Read sensor data using a microcontroller",
            "Build a simple data logger",
            "Investigate timing and memory constraints in a small device"
        ],
        "resources": [
            {"title": "Arduino Documentation", "url": "https://docs.arduino.cc/"},
            {"title": "Raspberry Pi Documentation", "url": "https://www.raspberrypi.com/documentation/"}
        ],
    },
    {
        "id": "electrical-engineer",
        "title": "Electrical Engineer",
        "field": "Engineering",
        "description": "Study and design electrical systems, circuits, power systems, and related technologies.",
        "skills": ["calculus", "physics", "circuit analysis", "electronics", "mathematics", "simulation"],
        "interests": ["physics", "math", "engineering", "energy", "electronics"],
        "projects": [
            "Simulate a basic electrical circuit",
            "Analyze a simple power system",
            "Build and document a low-voltage electronics project"
        ],
        "resources": [
            {"title": "All About Circuits", "url": "https://www.allaboutcircuits.com/"},
            {"title": "NPTEL", "url": "https://nptel.ac.in/"}
        ],
    },
    {
        "id": "mechanical-engineer",
        "title": "Mechanical Engineer",
        "field": "Engineering",
        "description": "Design and analyze mechanical systems using mechanics, materials, and engineering tools.",
        "skills": ["physics", "calculus", "mechanics", "thermodynamics", "cad", "simulation"],
        "interests": ["physics", "math", "engineering", "design", "manufacturing"],
        "projects": [
            "Model a simple mechanical assembly",
            "Simulate motion in a mechanical system",
            "Compare material properties for a design problem"
        ],
        "resources": [
            {"title": "MIT OpenCourseWare", "url": "https://ocw.mit.edu/"},
            {"title": "NPTEL", "url": "https://nptel.ac.in/"}
        ],
    },
    {
        "id": "civil-engineer",
        "title": "Civil Engineer",
        "field": "Engineering",
        "description": "Plan and design infrastructure such as buildings, roads, bridges, and water systems.",
        "skills": ["physics", "mathematics", "structural analysis", "materials", "cad", "project planning"],
        "interests": ["engineering", "math", "design", "construction", "sustainability"],
        "projects": [
            "Create a basic structural design study",
            "Map a small infrastructure problem",
            "Compare sustainable construction materials"
        ],
        "resources": [
            {"title": "NPTEL", "url": "https://nptel.ac.in/"},
            {"title": "Autodesk Education", "url": "https://www.autodesk.com/education/home"}
        ],
    },
    {
        "id": "bioinformatics-scientist",
        "title": "Bioinformatics Scientist",
        "field": "Computational Biology",
        "description": "Use programming and statistics to analyze biological data, including genes and proteins.",
        "skills": ["python", "statistics", "biology", "data analysis", "algorithms", "linear algebra"],
        "interests": ["biology", "programming", "data", "research", "math"],
        "projects": [
            "Analyze a public biological dataset",
            "Write a sequence analysis script",
            "Visualize a biological data trend"
        ],
        "resources": [
            {"title": "NCBI Learn", "url": "https://www.ncbi.nlm.nih.gov/home/learn/"},
            {"title": "Biopython Documentation", "url": "https://biopython.org/wiki/Documentation"}
        ],
    },
    {
        "id": "computational-physicist",
        "title": "Computational Physicist",
        "field": "Scientific Computing",
        "description": "Use numerical methods and programming to model physical systems and investigate scientific questions.",
        "skills": ["python", "linear algebra", "differential equations", "numerical methods", "physics", "scientific modeling"],
        "interests": ["physics", "math", "programming", "research", "simulation"],
        "projects": [
            "Simulate a physical system with numerical integration",
            "Compare numerical results with an analytical solution",
            "Visualize a parameter-dependent physics model"
        ],
        "resources": [
            {"title": "SciPy Lecture Notes", "url": "https://scipy-lectures.org/"},
            {"title": "NPTEL", "url": "https://nptel.ac.in/"}
        ],
    },
    {
        "id": "quantitative-analyst",
        "title": "Quantitative Analyst",
        "field": "Quantitative Finance",
        "description": "Apply mathematics, statistics, and programming to financial models and quantitative decision-making.",
        "skills": ["python", "statistics", "probability", "linear algebra", "data analysis", "financial mathematics"],
        "interests": ["math", "finance", "programming", "data", "problem solving"],
        "projects": [
            "Analyze historical market data without making investment claims",
            "Simulate a simple stochastic process",
            "Compare a quantitative model with a baseline"
        ],
        "resources": [
            {"title": "Khan Academy Finance & Capital Markets", "url": "https://www.khanacademy.org/economics-finance-domain"},
            {"title": "NumPy Documentation", "url": "https://numpy.org/doc/"}
        ],
    },
    {
        "id": "business-analyst",
        "title": "Business Analyst",
        "field": "Business & Analytics",
        "description": "Translate business needs into requirements, process improvements, and data-informed recommendations.",
        "skills": ["sql", "data analysis", "communication", "requirements analysis", "problem solving", "data visualization"],
        "interests": ["business", "data", "people", "problem solving", "strategy"],
        "projects": [
            "Analyze a sample business dataset",
            "Document requirements for a small application",
            "Create a dashboard with actionable findings"
        ],
        "resources": [
            {"title": "Microsoft Learn", "url": "https://learn.microsoft.com/"},
            {"title": "Kaggle Learn", "url": "https://www.kaggle.com/learn"}
        ],
    },
    {
        "id": "financial-analyst",
        "title": "Financial Analyst",
        "field": "Finance",
        "description": "Evaluate financial information, build forecasts, and communicate evidence-based business insights.",
        "skills": ["excel", "statistics", "financial modeling", "data analysis", "accounting", "communication"],
        "interests": ["finance", "business", "data", "math", "strategy"],
        "projects": [
            "Build a sample budget and forecast",
            "Analyze a public company's published financial statements",
            "Create a financial metrics dashboard"
        ],
        "resources": [
            {"title": "Khan Academy Finance & Capital Markets", "url": "https://www.khanacademy.org/economics-finance-domain"},
            {"title": "Microsoft Learn", "url": "https://learn.microsoft.com/"}
        ],
    },
    {
        "id": "ui-ux-designer",
        "title": "UI/UX Designer",
        "field": "Design",
        "description": "Research user needs and design clear, usable digital experiences through prototyping and iteration.",
        "skills": ["user research", "wireframing", "prototyping", "visual design", "accessibility", "usability testing"],
        "interests": ["design", "psychology", "creativity", "people", "technology"],
        "projects": [
            "Redesign a confusing user flow",
            "Create and test an interactive prototype",
            "Conduct usability tests and summarize findings"
        ],
        "resources": [
            {"title": "Figma Learn", "url": "https://help.figma.com/hc/en-us/categories/360002051613-Learn-design"},
            {"title": "Nielsen Norman Group", "url": "https://www.nngroup.com/articles/"}
        ],
    },
    {
        "id": "graphic-designer",
        "title": "Graphic Designer",
        "field": "Creative Design",
        "description": "Communicate ideas visually through layouts, typography, illustration, and brand systems.",
        "skills": ["visual design", "typography", "composition", "color theory", "illustration", "communication"],
        "interests": ["design", "creativity", "art", "visual communication", "branding"],
        "projects": [
            "Create a visual identity for a fictional brand",
            "Design a poster series",
            "Build a portfolio case study explaining design choices"
        ],
        "resources": [
            {"title": "Canva Design School", "url": "https://www.canva.com/designschool/"},
            {"title": "Adobe Learn", "url": "https://www.adobe.com/learn"}
        ],
    },
    {
        "id": "technical-writer",
        "title": "Technical Writer",
        "field": "Technical Communication",
        "description": "Turn complex technical information into clear documentation, guides, and tutorials.",
        "skills": ["writing", "communication", "research", "editing", "technical documentation", "information architecture"],
        "interests": ["writing", "technology", "teaching", "research", "communication"],
        "projects": [
            "Write a beginner-friendly guide for an open-source tool",
            "Improve documentation for a small project",
            "Create a troubleshooting guide from user questions"
        ],
        "resources": [
            {"title": "Google Technical Writing", "url": "https://developers.google.com/tech-writing"},
            {"title": "Write the Docs", "url": "https://www.writethedocs.org/guide/"}
        ],
    },
    {
        "id": "game-developer",
        "title": "Game Developer",
        "field": "Interactive Software",
        "description": "Build interactive games by combining programming, systems design, visual assets, and gameplay logic.",
        "skills": ["python", "c programming", "linear algebra", "game design", "debugging", "3d mathematics"],
        "interests": ["programming", "games", "math", "design", "creativity"],
        "projects": [
            "Build a small 2D game",
            "Prototype a physics-based interaction",
            "Create a playable level and gather feedback"
        ],
        "resources": [
            {"title": "Godot Documentation", "url": "https://docs.godotengine.org/"},
            {"title": "Unity Learn", "url": "https://learn.unity.com/"}
        ],
    },
    {
        "id": "qa-automation-engineer",
        "title": "QA Automation Engineer",
        "field": "Software Quality",
        "description": "Improve software reliability through test design, automated checks, and systematic debugging.",
        "skills": ["python", "javascript", "testing", "debugging", "api testing", "git"],
        "interests": ["programming", "problem solving", "quality", "systems", "technology"],
        "projects": [
            "Write automated tests for a web form",
            "Create API tests for a sample backend",
            "Set up a test workflow that runs on each code change"
        ],
        "resources": [
            {"title": "Playwright Documentation", "url": "https://playwright.dev/docs/intro"},
            {"title": "pytest Documentation", "url": "https://docs.pytest.org/"}
        ],
    },
    {
        "id": "environmental-data-scientist",
        "title": "Environmental Data Scientist",
        "field": "Environment & Sustainability",
        "description": "Analyze environmental observations to study climate, ecosystems, pollution, and sustainability challenges.",
        "skills": ["python", "statistics", "data visualization", "data analysis", "geospatial analysis", "environmental science"],
        "interests": ["environment", "data", "research", "biology", "math"],
        "projects": [
            "Visualize public air-quality data",
            "Analyze a climate dataset",
            "Map environmental trends and document limitations"
        ],
        "resources": [
            {"title": "NASA Earthdata", "url": "https://www.earthdata.nasa.gov/"},
            {"title": "Our World in Data", "url": "https://ourworldindata.org/"}
        ],
    },
    {
        "id": "operations-research-analyst",
        "title": "Operations Research Analyst",
        "field": "Applied Mathematics",
        "description": "Use optimization, probability, and mathematical modeling to improve complex decisions and processes.",
        "skills": ["linear algebra", "statistics", "probability", "optimization", "python", "mathematical modeling"],
        "interests": ["math", "problem solving", "programming", "research", "strategy"],
        "projects": [
            "Solve a small scheduling optimization problem",
            "Compare routing strategies on a toy dataset",
            "Build a model that allocates limited resources"
        ],
        "resources": [
            {"title": "SciPy Optimization", "url": "https://docs.scipy.org/doc/scipy/tutorial/optimize.html"},
            {"title": "Google OR-Tools", "url": "https://developers.google.com/optimization"}
        ],
    },
    {
        "id": "renewable-energy-engineer",
        "title": "Renewable Energy Engineer",
        "field": "Energy Engineering",
        "description": "Help design and evaluate energy systems such as solar, wind, storage, and efficient power networks.",
        "skills": ["physics", "mathematics", "electrical engineering", "simulation", "data analysis", "energy systems"],
        "interests": ["physics", "engineering", "energy", "environment", "sustainability"],
        "projects": [
            "Estimate energy production from sample solar data",
            "Model household energy demand",
            "Compare renewable energy scenarios using transparent assumptions"
        ],
        "resources": [
            {"title": "NREL", "url": "https://www.nrel.gov/"},
            {"title": "NPTEL", "url": "https://nptel.ac.in/"}
        ],
    },
]

# Append additions while preserving existing career IDs and templates.
_existing_career_ids = {career["id"] for career in CAREERS}
CAREERS.extend(
    career for career in ADDITIONAL_CAREERS
    if career["id"] not in _existing_career_ids
)



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


CAREER_GOAL_KEYWORDS.update({
    "frontend-developer": [
        "frontend", "front end", "web developer", "web development",
        "user interface", "interactive websites"
    ],
    "backend-developer": [
        "backend", "back end", "api developer", "server side",
        "backend systems"
    ],
    "full-stack-developer": [
        "full stack", "fullstack", "web application", "full stack developer"
    ],
    "mobile-developer": [
        "mobile developer", "mobile app", "android developer",
        "ios developer", "mobile application"
    ],
    "data-scientist": [
        "data scientist", "data science", "predictive modeling",
        "statistical modeling"
    ],
    "data-engineer": [
        "data engineer", "data pipelines", "data infrastructure",
        "big data"
    ],
    "cybersecurity-analyst": [
        "cybersecurity", "cyber security", "security analyst",
        "penetration testing", "information security"
    ],
    "cloud-devops-engineer": [
        "devops", "cloud engineer", "cloud computing",
        "infrastructure automation", "site reliability"
    ],
    "nlp-engineer": [
        "natural language processing", "nlp", "language models",
        "text processing", "language ai"
    ],
    "computer-vision-engineer": [
        "computer vision", "image recognition", "image processing",
        "object detection"
    ],
    "robotics-engineer": [
        "robotics", "robotics engineer", "autonomous robots",
        "robot control"
    ],
    "embedded-systems-engineer": [
        "embedded systems", "firmware", "microcontrollers",
        "hardware programming"
    ],
    "electrical-engineer": [
        "electrical engineering", "power systems", "circuit design",
        "electrical systems"
    ],
    "mechanical-engineer": [
        "mechanical engineering", "mechanical design",
        "thermodynamics", "product mechanisms"
    ],
    "civil-engineer": [
        "civil engineering", "structural engineering",
        "infrastructure", "construction engineering"
    ],
    "bioinformatics-scientist": [
        "bioinformatics", "computational biology",
        "genomics", "biological data"
    ],
    "computational-physicist": [
        "computational physics", "scientific computing",
        "physics simulation", "physics modeling"
    ],
    "quantitative-analyst": [
        "quantitative analyst", "quant", "quantitative finance",
        "financial mathematics"
    ],
    "business-analyst": [
        "business analyst", "business analysis",
        "business intelligence", "requirements analysis"
    ],
    "financial-analyst": [
        "financial analyst", "financial analysis",
        "financial modeling", "corporate finance"
    ],
    "ui-ux-designer": [
        "ui ux", "ux designer", "ui designer",
        "user experience", "product design"
    ],
    "graphic-designer": [
        "graphic design", "graphic designer",
        "visual design", "brand design"
    ],
    "technical-writer": [
        "technical writer", "technical writing",
        "developer documentation", "documentation"
    ],
    "game-developer": [
        "game developer", "game development",
        "game programming", "game design"
    ],
    "qa-automation-engineer": [
        "qa automation", "test automation",
        "software testing", "quality assurance"
    ],
    "environmental-data-scientist": [
        "environmental data", "climate data",
        "environmental science", "sustainability analytics"
    ],
    "operations-research-analyst": [
        "operations research", "optimization",
        "decision science", "resource optimization"
    ],
    "renewable-energy-engineer": [
        "renewable energy", "solar energy",
        "wind energy", "energy engineering"
    ],
})


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
    """
    Score how closely a student's declared skills, interests, and goals
    align with a career in the curated catalog.

    Scores describe catalog alignment, not aptitude or job probability.
    Existing response keys are preserved for frontend compatibility.
    """

    # 1. Normalize student and career data.
    student_skills = normalize(profile.skills)
    student_interests = normalize(profile.interests)

    required_skills = normalize(career.get("skills", []))
    career_interests = normalize(career.get("interests", []))

    # 2. Find overlaps and gaps.
    matched_skills = sorted(student_skills & required_skills)
    missing_skills = sorted(required_skills - student_skills)
    matched_interests = sorted(student_interests & career_interests)

    # 3. Calculate skill coverage.
    # An empty skills list means "not assessed yet", not zero potential.
    skill_coverage = (
        round(len(matched_skills) / len(required_skills) * 100)
        if required_skills
        else 0
    )

    # 4. Calculate interest fit.
    interest_fit = (
        round(len(matched_interests) / len(career_interests) * 100)
        if career_interests
        else 0
    )

    # 5. Match goals using the existing keyword catalog.
    goal_text = normalize_goal_text(profile.goals or "")
    goal_keywords = CAREER_GOAL_KEYWORDS.get(career["id"], [])

    normalized_goal = clean_text(goal_text)
    matched_goal_keywords = []

    if normalized_goal:
        for keyword in goal_keywords:
            normalized_keyword = clean_text(keyword)

            if not normalized_keyword:
                continue

            # Match phrases as words/phrases rather than arbitrary
            # substrings. This reduces accidental matches.
            pattern = (
                r"(?<!\w)"
                + re.escape(normalized_keyword)
                + r"(?!\w)"
            )

            if re.search(pattern, normalized_goal):
                matched_goal_keywords.append(keyword)

    goal_alignment = (
        round(
            len(matched_goal_keywords)
            / len(goal_keywords)
            * 100
        )
        if goal_text and goal_keywords
        else None
    )

    # 6. Score using only the evidence available.
    #
    # Goals are optional. When supplied, the weights are:
    # skills 45%, interests 35%, goals 20%.
    #
    # Without goals:
    # skills 55%, interests 45%.
    #
    # We do not award points simply because a student has many
    # missing skills; missing skills are displayed as learning gaps.
    if goal_alignment is not None:
        skills_weight = 45
        interests_weight = 35
        goals_weight = 20

        match_score = (
            skill_coverage * skills_weight / 100
            + interest_fit * interests_weight / 100
            + goal_alignment * goals_weight / 100
        )
    else:
        skills_weight = 55
        interests_weight = 45
        goals_weight = 0

        match_score = (
            skill_coverage * skills_weight / 100
            + interest_fit * interests_weight / 100
        )

    match_score = max(0, min(100, round(match_score)))

    # 7. Explain exactly how the score was calculated.
    score_breakdown = {
        "skills_weight": skills_weight,
        "interests_weight": interests_weight,
        "goals_weight": goals_weight,
        "skills_contribution": round(
            skill_coverage * skills_weight / 100, 1
        ),
        "interests_contribution": round(
            interest_fit * interests_weight / 100, 1
        ),
        "goals_contribution": round(
            (goal_alignment or 0) * goals_weight / 100, 1
        ),
    }

    # 8. Generate human-readable reasons for the recommendation.
    reasons = []

    if matched_interests:
        reasons.append(
            "Your interests align with: "
            + ", ".join(matched_interests[:5])
            + "."
        )

    if matched_skills:
        reasons.append(
            "You already have relevant skills: "
            + ", ".join(matched_skills[:5])
            + "."
        )

    if matched_goal_keywords:
        reasons.append(
            "Your stated goals mention: "
            + ", ".join(matched_goal_keywords[:5])
            + "."
        )

    if missing_skills:
        reasons.append(
            "Skills you could develop next include: "
            + ", ".join(missing_skills[:5])
            + "."
        )

    if not reasons:
        reasons.append(
            "There is not enough overlapping profile information "
            "to establish a strong match yet. Explore this career "
            "and add more skills or interests for a more useful comparison."
        )

    # 9. Preserve existing fields and add explanations.
    return {
        "career_id": career["id"],
        "title": career["title"],
        "field": career["field"],
        "description": career["description"],
        "match_score": match_score,
        "skill_coverage": skill_coverage,
        "interest_fit": interest_fit,
        "goal_alignment": goal_alignment,
        "score_breakdown": score_breakdown,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "matched_interests": matched_interests,
        "matched_goal_keywords": matched_goal_keywords,
        "projects": career.get("projects", []),
        "reasons": reasons,
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


def get_groq_retry_delay(response: httpx.Response) -> float | None:
    """Extract a short retry delay from Groq's rate-limit response."""

    retry_after = response.headers.get("retry-after")

    if retry_after:
        try:
            delay = float(retry_after)
            if delay >= 0:
                return delay
        except ValueError:
            pass

    try:
        data = response.json()
        message = data.get("error", {}).get("message", "")
    except (ValueError, AttributeError):
        message = ""

    match = re.search(
        r"try again in\s+([\d.]+)\s*s",
        message,
        re.IGNORECASE,
    )

    if match:
        return float(match.group(1))

    return None

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
# Adaptive roadmap generation
# --------------------------------------------------


# --------------------------------------------------
# Adaptive roadmap generation
# --------------------------------------------------

ROADMAP_TEMPLATES = {
    "ai-ml-engineer": [
        {
            "title": "Strengthen the foundations",
            "skills": ["python", "linear algebra", "statistics"],
            "hours": 18,
            "milestone": "Complete exercises using Python, vectors, and basic statistics.",
            "project": "Analyze a small dataset with Python and NumPy.",
        },
        {
            "title": "Learn machine learning",
            "skills": ["machine learning", "statistics"],
            "hours": 28,
            "milestone": "Train and evaluate a baseline machine-learning model.",
            "project": "Build a predictor and compare multiple evaluation metrics.",
        },
        {
            "title": "Build a practical ML project",
            "skills": ["machine learning", "python"],
            "hours": 30,
            "milestone": "Deliver a reproducible project with documented results.",
            "project": "Build and deploy a machine-learning prediction app.",
        },
        {
            "title": "Prepare a professional portfolio",
            "skills": ["software engineering", "machine learning"],
            "hours": 20,
            "milestone": "Publish a polished repository with setup instructions and a clear README.",
            "project": "Improve the project with tests, error handling, and a demo.",
        },
    ],
    "data-analyst": [
        {
            "title": "Learn data fundamentals",
            "skills": ["sql", "statistics"],
            "hours": 20,
            "milestone": "Query a dataset and explain its basic statistical properties.",
            "project": "Explore a public dataset and document initial findings.",
        },
        {
            "title": "Clean and analyze data",
            "skills": ["python", "statistics"],
            "hours": 24,
            "milestone": "Clean missing or inconsistent data and answer analytical questions.",
            "project": "Create a reproducible exploratory data analysis.",
        },
        {
            "title": "Communicate insights visually",
            "skills": ["data visualization", "communication"],
            "hours": 24,
            "milestone": "Present evidence-backed findings with clear visualizations.",
            "project": "Build an interactive analytics dashboard.",
        },
        {
            "title": "Create an end-to-end case study",
            "skills": ["sql", "data visualization", "communication"],
            "hours": 18,
            "milestone": "Publish a case study explaining the problem, method, and recommendations.",
            "project": "Complete an end-to-end analysis for a real-world question.",
        },
    ],
    "scientific-computing": [
        {
            "title": "Build scientific Python foundations",
            "skills": ["python", "linear algebra"],
            "hours": 20,
            "milestone": "Implement numerical calculations and visualize their results.",
            "project": "Explore a mathematical system using NumPy and Matplotlib.",
        },
        {
            "title": "Study numerical methods",
            "skills": ["numerical methods", "linear algebra"],
            "hours": 26,
            "milestone": "Compare numerical solutions with known analytical results.",
            "project": "Implement and test a numerical solver.",
        },
        {
            "title": "Model a scientific system",
            "skills": ["differential equations", "scientific modeling"],
            "hours": 30,
            "milestone": "Build a simulation and explain its assumptions and limitations.",
            "project": "Simulate a physical or engineering system.",
        },
        {
            "title": "Validate and present the simulation",
            "skills": ["scientific modeling", "numerical methods"],
            "hours": 20,
            "milestone": "Document convergence, accuracy, and numerical limitations.",
            "project": "Create an interactive visualization of the simulation.",
        },
    ],
    "ux-designer": [
        {
            "title": "Understand users and problems",
            "skills": ["user research", "communication"],
            "hours": 16,
            "milestone": "Identify a user problem supported by research.",
            "project": "Conduct interviews or analyze user feedback.",
        },
        {
            "title": "Design the experience",
            "skills": ["wireframing", "visual design"],
            "hours": 22,
            "milestone": "Create user flows and wireframes for the main experience.",
            "project": "Design a user journey and low-fidelity wireframes.",
        },
        {
            "title": "Build and test a prototype",
            "skills": ["prototyping", "visual design"],
            "hours": 26,
            "milestone": "Test a prototype and identify usability issues.",
            "project": "Create an interactive prototype and run usability tests.",
        },
        {
            "title": "Present a UX case study",
            "skills": ["communication", "user research"],
            "hours": 18,
            "milestone": "Explain the problem, design decisions, feedback, and iterations.",
            "project": "Publish a portfolio case study.",
        },
    ],
    "product-manager": [
        {
            "title": "Discover user problems",
            "skills": ["user research", "communication"],
            "hours": 16,
            "milestone": "Define a user problem and support it with evidence.",
            "project": "Write a concise problem-discovery brief.",
        },
        {
            "title": "Define the product",
            "skills": ["problem solving", "prioritization"],
            "hours": 22,
            "milestone": "Write requirements and prioritize a focused set of features.",
            "project": "Create a product requirements document.",
        },
        {
            "title": "Use data to make decisions",
            "skills": ["data analysis", "prioritization"],
            "hours": 24,
            "milestone": "Define success metrics and explain prioritization decisions.",
            "project": "Create a metrics and experiment proposal.",
        },
        {
            "title": "Present a product case study",
            "skills": ["communication", "user research"],
            "hours": 18,
            "milestone": "Present a coherent product proposal backed by user needs and metrics.",
            "project": "Build and present a product case study.",
        },
    ],
}


def build_adaptive_phases(request: RoadmapRequest, career: dict) -> dict:
    """Generate a roadmap adapted to skills, goals, education, time, and budget."""

    templates = ROADMAP_TEMPLATES.get(career["id"])

    if not templates:
        templates = [
            {
                "title": f"Build foundations in {career['title']}",
                "skills": career["skills"][:2],
                "hours": 20,
                "milestone": "Complete foundational exercises.",
                "project": career["projects"][0],
            },
            {
                "title": f"Practice {career['title']} skills",
                "skills": career["skills"][2:4],
                "hours": 28,
                "milestone": "Apply the skills to a guided project.",
                "project": career["projects"][-1],
            },
        ]

    student_skills = normalize(request.skills)
    required_skills = normalize(career["skills"])
    missing_skills = required_skills - student_skills

    goals = normalize_goal_text(request.goals)
    education = request.education_level.lower()

    # More specific goal categories must be checked before broad categories.
    if any(word in goals for word in ("interview", "resume", "cv")):
        goal_focus = "interviews"
    elif any(word in goals for word in ("internship", "job", "employment", "career")):
        goal_focus = "career"
    elif any(word in goals for word in ("portfolio", "project", "build", "deploy")):
        goal_focus = "projects"
    elif any(word in goals for word in ("fundamentals", "basics", "learn", "understand")):
        goal_focus = "foundations"
    else:
        goal_focus = "balanced"

    is_beginner = not student_skills or (
        "self-taught" in education and len(student_skills) < 2
    )

    selected_templates = []

    for template in templates:
        relevant_skills = [
            skill
            for skill in template["skills"]
            if canonicalize(skill) in missing_skills
        ]

        title = template["title"].lower()
        is_project_phase = any(
            word in title
            for word in ("project", "portfolio", "case study", "present", "prototype")
        )

        if relevant_skills or is_project_phase:
            selected_templates.append((template, relevant_skills))

    if not selected_templates:
        selected_templates = [(templates[-1], [])]

    adjusted = []

    for template, relevant_skills in selected_templates:
        hours = template["hours"]
        title = template["title"].lower()

        if is_beginner and any(
            word in title for word in ("foundation", "fundamental")
        ):
            hours = round(hours * 1.25)

        if (
            ("postgraduate" in education or "working professional" in education)
            and relevant_skills
            and all(
                canonicalize(skill) in student_skills
                for skill in template["skills"]
            )
        ):
            hours = round(hours * 0.85)

        adjusted.append({
            **template,
            "skills": relevant_skills or template["skills"],
            "estimated_hours": max(4, hours),
        })

    # Adapt time allocation to the student's goal.
    for phase in adjusted:
        title = phase["title"].lower()

        if goal_focus == "projects" and any(
            word in title for word in ("project", "portfolio", "case study", "prototype")
        ):
            phase["estimated_hours"] = round(phase["estimated_hours"] * 1.15)

        elif goal_focus == "foundations" and any(
            word in title for word in ("foundation", "learn")
        ):
            phase["estimated_hours"] = round(phase["estimated_hours"] * 1.15)

        elif goal_focus in ("career", "interviews") and any(
            word in title for word in ("portfolio", "case study", "present")
        ):
            phase["estimated_hours"] = round(phase["estimated_hours"] * 1.2)

    total_hours = sum(phase["estimated_hours"] for phase in adjusted)

    # Each phase receives at least one week. The resulting duration can
    # therefore never be shorter than the number of selected phases.
    total_weeks = max(
        len(adjusted),
        math.ceil(total_hours / request.weekly_hours),
    )

    # Proportionally allocate the total weeks without assigning fewer
    # than one week to any phase.
    remaining_weeks = total_weeks
    phases = []

    for index, phase in enumerate(adjusted):
        phases_left = len(adjusted) - index - 1

        if phases_left == 0:
            duration_weeks = remaining_weeks
        else:
            proportional_weeks = round(
                total_weeks * phase["estimated_hours"] / total_hours
            )

            duration_weeks = max(
                1,
                min(proportional_weeks, remaining_weeks - phases_left),
            )

        remaining_weeks -= duration_weeks

        phases.append({
            "phase": index + 1,
            "title": phase["title"],
            "duration_weeks": duration_weeks,
            "estimated_hours": phase["estimated_hours"],
            "estimated_minutes": phase["estimated_hours"] * 60,
            "weekly_hours": request.weekly_hours,
            "skills": phase["skills"],
            "milestone": phase["milestone"],
            "project": phase["project"],
        })

    if request.weekly_hours <= 3:
        pacing = "Light: focus on a few small tasks each week."
    elif request.weekly_hours <= 7:
        pacing = "Steady: balance learning with regular practice."
    elif request.weekly_hours <= 15:
        pacing = "Focused: combine structured learning and project work."
    else:
        pacing = "Intensive: use a structured schedule and avoid burnout."

    if goal_focus == "career":
        focus_note = (
            "Career preparation: emphasize demonstrable work and portfolio evidence."
        )
    elif goal_focus == "projects":
        focus_note = (
            "Project-focused: prioritize building, testing, and presenting practical work."
        )
    elif goal_focus == "foundations":
        focus_note = (
            "Foundations-focused: spend more time understanding core concepts."
        )
    elif goal_focus == "interviews":
        focus_note = (
            "Interview-focused: practice explaining decisions and trade-offs."
        )
    else:
        focus_note = (
            "Balanced plan: combine fundamentals, practice, and a demonstrable project."
        )

    resource_guidance = (
        "Use free documentation, open courses, and free tools."
        if request.monthly_budget == 0
        else
        "Start with free resources; use your budget only for resources "
        "that address a specific learning gap."
    )

    return {
        "phases": phases,
        "total_hours": total_hours,
        "total_weeks": sum(phase["duration_weeks"] for phase in phases),
        "pacing": pacing,
        "resource_guidance": resource_guidance,
        "goal_focus": goal_focus,
        "focus_note": focus_note,
    }


@app.post("/api/roadmap")
async def create_roadmap(request: RoadmapRequest):
    career = next(
        (item for item in CAREERS if item["id"] == request.career_id),
        None,
    )

    if career is None:
        raise HTTPException(
            status_code=404,
            detail="Career not found. Check career_id in GET /api/careers.",
        )

    match = score_career(request, career)
    plan = build_adaptive_phases(request, career)

    return {
        "career": {
            "id": career["id"],
            "title": career["title"],
        },
        "match_score": match["match_score"],
        "skill_coverage": match["skill_coverage"],
        "current_skills": match["matched_skills"],
        "skills_to_develop": match["missing_skills"],
        "weekly_hours": request.weekly_hours,
        "estimated_total_hours": plan["total_hours"],
        "estimated_duration_weeks": plan["total_weeks"],
        "pacing": plan["pacing"],
        "goal_focus": plan["goal_focus"],
        "focus_note": plan["focus_note"],
        "resource_guidance": plan["resource_guidance"],
        "phases": plan["phases"],
        "note": (
            "Estimates are planning guides, not guarantees. Adjust the plan "
            "based on your progress and the difficulty of each task."
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
            detail="Chat is temporarily unavailable because it is not configured.",
        )

    user_message = request.message.strip()

    if not user_message:
        raise HTTPException(
            status_code=422,
            detail="Message cannot be empty.",
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

    if conversation_id is not None:
        try:
            history = await database.get_conversation_messages(
                conversation_id
            )
        except (psycopg.Error, RuntimeError):
            logger.exception("Could not load conversation history")
            raise database_error()

        messages.extend(build_chat_history(history))

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
            timeout=httpx.Timeout(45.0, connect=10.0)
        ) as client:
            response = None

            for attempt in range(MAX_GROQ_RETRIES + 1):
                response = await client.post(
                    GROQ_URL,
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )

                if response.status_code != 429:
                    break

                delay = get_groq_retry_delay(response)

                # Retry once only when the provider gives a short,
                # usable delay. Avoid retry storms during heavy load.
                if (
                    attempt >= MAX_GROQ_RETRIES
                    or delay is None
                    or delay > GROQ_RETRY_MAX_WAIT_SECONDS
                ):
                    break

                logger.warning(
                    "Groq rate limit reached; retrying once in %.2f seconds",
                    delay,
                )
                await asyncio.sleep(max(0.1, delay))

        if response is None:
            raise HTTPException(
                status_code=502,
                detail="The AI service did not return a response.",
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
            detail="The AI took too long to respond. Please try again.",
        )

    except httpx.HTTPStatusError as exc:
        status = exc.response.status_code

        logger.error(
            "Groq returned HTTP %s: %s",
            status,
            exc.response.text[:500],
        )

        if status == 429:
            raise HTTPException(
                status_code=503,
                detail=(
                    "The AI mentor is temporarily busy. "
                    "Please wait a few seconds before trying again."
                ),
            )

        if status in (401, 403):
            raise HTTPException(
                status_code=503,
                detail=(
                    "The AI service is not currently authorized. "
                    "Please try again later."
                ),
            )

        if status >= 500:
            raise HTTPException(
                status_code=503,
                detail=(
                    "The AI service is temporarily unavailable. "
                    "Please try again shortly."
                ),
            )

        raise HTTPException(
            status_code=502,
            detail="The AI service could not process the request.",
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

    # Persist only after a successful AI response.
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
