
from app.schemas.user import UserBase, UserCreate, UserRead
from app.schemas.group import GroupBase, GroupCreate, GroupRead
from app.schemas.subject import SubjectBase, SubjectCreate, SubjectRead
from app.schemas.lesson import LessonBase, LessonCreate, LessonRead
from app.schemas.lesson_material import LessonMaterialBase, LessonMaterialCreate, LessonMaterialRead
from app.models.lesson_material import MaterialType
from app.schemas.task import TaskBase, TaskCreate, TaskRead
from app.schemas.submission import SubmissionBase, SubmissionCreate, SubmissionRead
from app.schemas.evaluation import EvaluationBase, EvaluationCreate, EvaluationRead
from app.schemas.ai_solution import AISolutionBase, AISolutionCreate, AISolutionRead

__all__ = [
    "UserBase", "UserCreate", "UserRead",
    "GroupBase", "GroupCreate", "GroupRead",
    "SubjectBase", "SubjectCreate", "SubjectRead",
    "LessonBase", "LessonCreate", "LessonRead",
    "LessonMaterialBase", "LessonMaterialCreate", "LessonMaterialRead", "MaterialType",
    "TaskBase", "TaskCreate", "TaskRead",
    "SubmissionBase", "SubmissionCreate", "SubmissionRead",
    "EvaluationBase", "EvaluationCreate", "EvaluationRead",
    "AISolutionBase", "AISolutionCreate", "AISolutionRead"
]