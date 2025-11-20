# AI Task Generation System - Implementation Summary

## Overview
This document summarizes the implementation of the AI-powered task generation system for EduCode. The system allows teachers to attach materials to lessons and automatically generate programming tasks using AI.

---

## ✅ COMPLETED - Backend Implementation

### 1. Database Models (`/backend/app/models/`)

#### New Models Created:

**`teacher_subject_group.py`** - Links teachers to subjects in specific groups
- Fields: `teacher_id`, `subject_id`, `group_id`
- Unique constraint on (teacher, subject, group) combination
- Used by admins to assign teachers to subjects in groups

**`lesson_assignment.py`** - Assigns lessons to groups with deadlines
- Fields: `lesson_id`, `group_id`, `deadline_at`
- Allows same lesson to be assigned to multiple groups with different deadlines
- Unique constraint on (lesson, group) combination

**`task_test.py`** - Structure for future unit test implementation
- Fields: `task_id`, `test_name`, `test_input`, `expected_output`, `test_type`, `weight`, `timeout_seconds`
- TestType enum: UNIT, INTEGRATION, CUSTOM
- Prepared for future automatic testing feature

#### Updated Models:

**`lesson_material.py`**
- Added enum values: `PDF`, `PPTX`, `DOCX` to MaterialType
- New field: `extracted_text` (Text, nullable) - stores extracted text content
- New field: `use_for_ai_generation` (Boolean, default=False) - marks materials for AI use

**Relationship Updates:**
- `User` → added `teaching_assignments` relationship
- `Subject` → added `teacher_assignments` relationship
- `Group` → added `teacher_assignments`, `lesson_assignments` relationships
- `Lesson` → added `assignments` relationship
- `Task` → added `tests` relationship

### 2. Database Migration (`/backend/alembic/versions/`)

**`a1b2c3d4e5f6_add_ai_generation_features.py`**
- ALTER TYPE commands to add new MaterialType enum values
- ADD COLUMN for extracted_text and use_for_ai_generation
- CREATE TABLE for teacher_subject_groups, lesson_assignments, task_tests
- Complete downgrade function for rollback

**STATUS:** Migration file created, needs to be run with `alembic upgrade head`

### 3. Services (`/backend/app/services/`)

**`file_processor.py`** - Text extraction from various file formats
- `extract_text_from_pdf()` - uses pdfplumber
- `extract_text_from_pptx()` - uses python-pptx
- `extract_text_from_docx()` - uses python-docx
- `process_lesson_material()` - main entry point
- `process_multiple_materials()` - combines text from multiple materials

**`ai_task_generator.py`** - AI-powered task generation
- `AITaskGenerator` class with OpenAI and Anthropic support
- `generate_tasks_from_materials()` - main generation method
- Generates: task descriptions, reference solutions, test structures
- Validates and structures output into database-ready format

### 4. API Routes (`/backend/app/routes/`)

**`teacher_assignments.py`** - Teacher-Subject-Group management
- `POST /` - Create assignment
- `GET /` - List assignments (with filters)
- `GET /teacher/{id}/subjects` - Get teacher's subjects in a group
- `GET /teacher/{id}/groups` - Get teacher's groups for a subject
- `DELETE /{id}` - Delete assignment
- `DELETE /teacher/{id}/bulk` - Bulk delete assignments

**`lesson_assignments.py`** - Lesson-Group assignments
- `POST /` - Create assignment
- `POST /bulk` - Bulk create to multiple groups
- `GET /` - List assignments (with filters)
- `GET /group/{id}/active` - Get active assignments for group
- `PUT /{id}` - Update deadline
- `DELETE /{id}` - Delete assignment

**`ai_generation.py`** - AI task generation endpoints
- `POST /generate-tasks` - Generate tasks from materials
- `POST /extract-material-text/{id}` - Extract text from single material
- `GET /preview-generation/{lesson_id}` - Preview materials for generation

**Main App Updates** (`main.py`):
- Added router imports and registrations
- Routes available at `/api/v1/teacher-assignments/`, `/api/v1/lesson-assignments/`, `/api/v1/ai-generation/`

### 5. Schemas (`/backend/app/schemas/`)

**`teacher_subject_group.py`**
- TeacherSubjectGroupCreate, Read, WithDetails, List
- TeacherSubjectsResponse, TeacherGroupsResponse

**`lesson_assignment.py`**
- LessonAssignmentCreate, Read, WithDetails, List
- LessonAssignmentBulkCreate

### 6. Celery Tasks (`/backend/app/tasks/`)

**`ai_generation_tasks.py`** - Background tasks for async processing
- `extract_material_text_task` - Extract text from uploaded material
- `generate_tasks_from_materials_task` - Generate tasks in background
- `bulk_extract_materials_task` - Process multiple materials at once

**Celery Configuration Updates** (`celery_app.py`):
- Added ai_generation_tasks to includes
- Routed ai_generation tasks to ai_queue
- Configured retries and timeouts

### 7. Dependencies (`requirements.txt`)

Added:
```
pdfplumber
python-pptx
python-docx
```

---

## ✅ COMPLETED - Frontend Implementation (Partial)

### API Utilities (`/frontend/src/utils/`)

**`teacherAssignmentsApi.js`**
- createTeacherAssignment()
- getTeacherAssignments()
- getTeacherSubjectsByGroup()
- getTeacherGroupsBySubject()
- deleteTeacherAssignment()
- bulkDeleteTeacherAssignments()

**`lessonAssignmentsApi.js`**
- createLessonAssignment()
- bulkCreateLessonAssignments()
- getLessonAssignments()
- getActiveAssignmentsForGroup()
- updateLessonAssignment()
- deleteLessonAssignment()

**`aiGenerationApi.js`**
- generateTasksFromMaterials()
- extractMaterialText()
- previewGenerationMaterials()

### Components (`/frontend/src/pages/`)

**`TeacherAssignments.jsx`** - Admin interface for managing teacher assignments
- View all teacher-subject-group assignments
- Filter by teacher, subject, or group
- Create new assignments
- Delete assignments
- Pagination support

---

## ⏳ PENDING - Frontend Implementation

### 1. Teacher Dashboard Updates (`TeacherDashboard.jsx`)

**Required Changes:**
- Add "Create Lesson" button/card
- Navigate to improved lesson creation flow
- Display assigned groups and subjects

### 2. Lesson Creation/Edit UI

**New Component:** `LessonCreator.jsx` or update existing

**Features Needed:**
- Material upload section with file type support (PDF, PPTX, DOCX, YouTube, Text)
- Checkbox for "Use for AI generation" on each material
- Option to manually create tasks OR generate with AI
- Manual task creation form (title, body, language, tests)
- AI generation button with configuration:
  - Number of tasks (1-10)
  - Programming languages (multi-select)
  - AI provider (OpenAI/Anthropic)
  - Preview materials before generation
  - Warning: "YouTube materials cannot be used for AI generation"

### 3. Lesson Assignment UI

**New Component:** `LessonAssignmentManager.jsx`

**Features Needed:**
- View lesson details
- Select multiple groups to assign
- Set individual deadlines for each group
- Bulk assignment creation
- View existing assignments
- Update/delete assignments

### 4. AI Generation UI for Teachers

**New Component:** `AITaskGenerator.jsx` or modal in lesson creator

**Features Needed:**
- Material selection (show extractable vs non-extractable)
- Preview combined text
- Generation configuration:
  - Number of tasks slider (1-10)
  - Language checkboxes
  - AI provider toggle
- Progress indicator during generation
- Results display (tasks created, test counts)
- Option to edit generated tasks

### 5. PDF/PPTX Viewer

**Library to Install:**
```bash
npm install react-pdf pdfjs-dist
```

**Component:** `MaterialViewer.jsx`

**Features Needed:**
- PDF viewer with page navigation
- PPTX display (might need conversion or preview)
- DOCX display
- YouTube embed for video links
- Text display for text materials
- Download button

### 6. Updates to Existing Pages

**`SubmitTask.jsx`**
- Update to show materials from assigned lesson
- Display assignment deadline (from lesson_assignment)
- Check group membership for access

**`MyGrades.jsx`**
- Update to show assignments by group
- Filter by subject/teacher

**`TaskManagement.jsx`**
- Update to show tasks from lesson assignments
- Display which groups have assignments

### 7. Admin Dashboard Integration

**`AdminDashboard.jsx`**

**Add Navigation Item:**
```javascript
{ id: 'teacher-assignments', label: 'Teacher Assignments', icon: UserCheck }
```

**Add View:**
- Render `<TeacherAssignments />` when view is 'teacher-assignments'

---

## 📋 Setup Instructions

### Backend Setup

1. **Install dependencies:**
```bash
cd backend
pip install -r requirements.txt
```

2. **Run database migration:**
```bash
alembic upgrade head
```

3. **Start Celery worker (for background tasks):**
```bash
celery -A app.tasks.celery_app worker --loglevel=info -Q ai_queue,grading_queue,celery
```

4. **Start backend server:**
```bash
python -m app.main
```

### Frontend Setup

1. **Install react-pdf (if not already):**
```bash
cd frontend
npm install react-pdf pdfjs-dist
```

2. **Update App.jsx routing** (add new routes as needed)

3. **Start frontend:**
```bash
npm run dev
```

---

## 🔄 Workflow

### Admin Workflow:
1. Create global groups (already exists)
2. Create subjects (already exists)
3. Create teacher users (already exists)
4. **NEW:** Assign teachers to subjects in groups (`TeacherAssignments` page)

### Teacher Workflow:
1. Login and see assigned subjects/groups
2. **NEW:** Create lesson with materials:
   - Upload PDF/PPTX/DOCX files
   - Add YouTube links or text
   - Mark materials for AI generation
3. **CHOOSE:**
   - **Option A:** Manually create tasks with tests
   - **Option B:** Generate tasks with AI:
     - System extracts text from PDF/PPTX/DOCX
     - AI generates task descriptions + reference solutions + tests
     - Teacher can edit generated tasks
4. **NEW:** Assign lesson to groups with deadlines:
   - Select groups from assigned list
   - Set individual deadlines
   - Bulk assign
5. After deadline or manual trigger: grading starts automatically

### Student Workflow:
1. Login and see assigned lessons by group
2. View lesson materials (PDF/PPTX viewer)
3. Submit solutions before deadline
4. View grades and AI rationale

---

## 🎯 Key Features

### ✅ Implemented:
- Global group system (groups are not per-teacher)
- Teacher-subject-group assignments (admin managed)
- Lesson creation with multiple material types
- Text extraction from PDF, PPTX, DOCX
- AI task generation (OpenAI & Anthropic)
- Reference solution generation for plagiarism detection
- Test structure generation (for future)
- Lesson assignment to multiple groups with individual deadlines
- Background processing with Celery

### ⏳ To Be Implemented:
- Frontend UI for all new features
- Material viewer component
- Lesson creation/edit flow
- AI generation interface
- Assignment management interface
- Integration with existing student/teacher pages

---

## 🐛 Known Limitations

1. **YouTube Materials:** Text extraction not implemented (too complex). Frontend should show warning when trying to use YouTube for AI generation.

2. **Test Execution:** Test structure exists in database but automatic test running is not implemented yet. This is a future feature.

3. **Migration:** Alembic migration must be run manually with `alembic upgrade head`

4. **Celery:** Background tasks require Celery worker to be running

---

## 📚 API Endpoints Summary

### Teacher Assignments
- `POST /api/v1/teacher-assignments/` - Create
- `GET /api/v1/teacher-assignments/` - List with filters
- `GET /api/v1/teacher-assignments/teacher/{id}/subjects?group_id=X` - Get subjects
- `GET /api/v1/teacher-assignments/teacher/{id}/groups?subject_id=X` - Get groups
- `DELETE /api/v1/teacher-assignments/{id}` - Delete
- `DELETE /api/v1/teacher-assignments/teacher/{id}/bulk` - Bulk delete

### Lesson Assignments
- `POST /api/v1/lesson-assignments/` - Create
- `POST /api/v1/lesson-assignments/bulk` - Bulk create
- `GET /api/v1/lesson-assignments/` - List with filters
- `GET /api/v1/lesson-assignments/group/{id}/active` - Active for group
- `PUT /api/v1/lesson-assignments/{id}` - Update deadline
- `DELETE /api/v1/lesson-assignments/{id}` - Delete

### AI Generation
- `POST /api/v1/ai-generation/generate-tasks` - Generate tasks
- `POST /api/v1/ai-generation/extract-material-text/{id}` - Extract text
- `GET /api/v1/ai-generation/preview-generation/{lesson_id}` - Preview materials

---

## 🚀 Next Steps

1. **Run the migration** to update database schema
2. **Test backend endpoints** using `/docs` (Swagger UI)
3. **Implement frontend components** (see PENDING section above)
4. **Test end-to-end workflow**:
   - Admin assigns teacher to subject in group
   - Teacher creates lesson with PDF material
   - Teacher generates tasks with AI
   - Teacher assigns lesson to groups
   - Students see assignments and submit
5. **Add error handling and validation** throughout
6. **Create user documentation** for teachers and admins

---

## 📝 Notes

- All backend code follows existing patterns in the codebase
- API responses use standard format: `{data: {...}, status: "success"}`
- Authentication and authorization use existing middleware
- Background tasks use existing Celery infrastructure
- Frontend follows existing glassmorphism style with Framer Motion animations
