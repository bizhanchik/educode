"""
EduCode Backend - Quiz/Test Model

Defines the Quiz entity for tests and quizzes attached to lessons.
Teachers can create quizzes with questions and answer options.
"""

from datetime import datetime
from typing import List, Optional
import enum

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class QuestionType(str, enum.Enum):
    """Types of quiz questions"""
    MULTIPLE_CHOICE = "multiple_choice"
    SINGLE_CHOICE = "single_choice"
    TRUE_FALSE = "true_false"
    TEXT = "text"


class Quiz(Base):
    """
    Quiz model representing tests and quizzes for lessons.
    
    A quiz contains multiple questions that can be of different types.
    Quizzes are attached to lessons and can be accessed by students.
    
    Attributes:
        id: Primary key
        lesson_id: Foreign key to Lesson
        title: Quiz title
        description: Quiz description
        created_at: Timestamp when quiz was created
        updated_at: Timestamp when quiz was last updated
    """
    
    __tablename__ = "quizzes"
    
    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Quiz information
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    
    # Foreign keys
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False, index=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    lesson = relationship("Lesson", back_populates="quizzes", lazy="selectin")
    questions = relationship("QuizQuestion", back_populates="quiz", cascade="all, delete-orphan", lazy="selectin")
    
    def __repr__(self) -> str:
        return f"<Quiz(id={self.id}, title='{self.title}', lesson_id={self.lesson_id})>"


class QuizQuestion(Base):
    """
    QuizQuestion model representing individual questions in a quiz.
    
    Questions can be of different types (multiple choice, single choice, etc.)
    Each question has a body and correct answers.
    
    Attributes:
        id: Primary key
        quiz_id: Foreign key to Quiz
        question_type: Type of question (multiple_choice, single_choice, etc.)
        body: Question text
        correct_answer: Correct answer text or JSON
        points: Points awarded for correct answer
        created_at: Timestamp when question was created
    """
    
    __tablename__ = "quiz_questions"
    
    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Question information
    question_type = Column(Enum(QuestionType, name="questiontype", create_type=True), nullable=False, index=True)
    body = Column(Text, nullable=False)
    correct_answer = Column(Text, nullable=False)  # JSON string for options/correct answer
    points = Column(Integer, default=1, nullable=False)
    
    # Foreign keys
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False, index=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    quiz = relationship("Quiz", back_populates="questions", lazy="selectin")
    
    def __repr__(self) -> str:
        return f"<QuizQuestion(id={self.id}, question_type='{self.question_type.value}', quiz_id={self.quiz_id})>"

