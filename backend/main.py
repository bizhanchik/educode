"""
EduCode Backend - Main FastAPI Application

AI-powered platform for IT college teachers to create programming lessons and tasks,
where students upload their code solutions, and the system automatically evaluates them
using AI-based similarity analysis and grading logic.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import (
    users_router,
    groups_router,
    subjects_router,
    lessons_router,
    tasks_router,
    submissions_router,
    evaluations_router,
    ai_solutions_router
)

# Create FastAPI application
app = FastAPI(
    title="EduCode API",
    description="AI-powered education platform for programming course management and automated code evaluation",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # React frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
app.include_router(users_router)
app.include_router(groups_router)
app.include_router(subjects_router)
app.include_router(lessons_router)
app.include_router(tasks_router)
app.include_router(submissions_router)
app.include_router(evaluations_router)
app.include_router(ai_solutions_router)


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "EduCode API - AI-Powered Education Platform",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "educode-backend"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )