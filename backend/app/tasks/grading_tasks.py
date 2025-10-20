"""
Grading-related Celery tasks for EduCode platform.

This module handles:
- AI similarity calculation between student and AI solutions
- Intra-group similarity calculation among student submissions
- Final grade generation using AI evaluation
- Batch grading operations and deadline processing
"""

import logging
import json
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime

from celery import current_app as celery_app, current_task, group

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


@celery_app.task(bind=True, max_retries=3, default_retry_delay=30)
def calculate_ai_similarity(self, submission_id: int, student_code: str, ai_solutions: List[Dict]):
    """
    Calculate similarity between student submission and AI-generated solutions.
    
    Args:
        submission_id (int): Database ID of the student submission
        student_code (str): Student's submitted code
        ai_solutions (List[Dict]): List of AI-generated reference solutions
        
    Returns:
        dict: Similarity scores and analysis results
    """
    try:
        logger.info(f"Calculating AI similarity for submission {submission_id}")
        
        current_task.update_state(
            state="PROGRESS",
            meta={"current": 0, "total": len(ai_solutions), "status": "Starting similarity calculation"}
        )
        
        similarity_scores = []
        
        for i, ai_solution in enumerate(ai_solutions):
            try:
                current_task.update_state(
                    state="PROGRESS",
                    meta={"current": i + 1, "total": len(ai_solutions), "status": f"Comparing with AI solution {i + 1}"}
                )
                
                # Calculate similarity using the similarity service
                similarity_score = _calculate_code_similarity(
                    student_code, 
                    ai_solution["code"],
                    method="cosine_embedding"
                )
                
                similarity_scores.append({
                    "ai_solution_id": ai_solution.get("id"),
                    "provider": ai_solution.get("provider"),
                    "variant_index": ai_solution.get("variant_index"),
                    "similarity_score": similarity_score,
                    "comparison_method": "cosine_embedding"
                })
                
            except Exception as e:
                logger.error(f"Failed to calculate similarity with AI solution {i + 1}: {str(e)}")
                similarity_scores.append({
                    "ai_solution_id": ai_solution.get("id"),
                    "provider": ai_solution.get("provider"),
                    "variant_index": ai_solution.get("variant_index"),
                    "similarity_score": 0.0,
                    "error": str(e)
                })
        
        # Calculate overall AI similarity (average of all valid scores)
        valid_scores = [s["similarity_score"] for s in similarity_scores if s["similarity_score"] > 0]
        overall_ai_similarity = sum(valid_scores) / len(valid_scores) if valid_scores else 0.0
        
        # Store similarity results
        result = {
            "submission_id": submission_id,
            "overall_ai_similarity": overall_ai_similarity,
            "individual_similarities": similarity_scores,
            "total_comparisons": len(ai_solutions),
            "successful_comparisons": len(valid_scores),
            "status": "completed"
        }
        
        # Update database with similarity scores
        _store_ai_similarity_results(submission_id, result)
        
        logger.info(f"Completed AI similarity calculation for submission {submission_id}")
        return result
        
    except Exception as exc:
        logger.error(f"AI similarity calculation failed for submission {submission_id}: {str(exc)}")
        raise self.retry(exc=exc)


@celery_app.task(bind=True, max_retries=3, default_retry_delay=30)
def calculate_intra_group_similarity(self, task_id: int, submissions: List[Dict]):
    """
    Calculate similarity between student submissions within the same group.
    
    Args:
        task_id (int): Database ID of the programming task
        submissions (List[Dict]): List of student submissions in the group
        
    Returns:
        dict: Intra-group similarity matrix and statistics
    """
    try:
        logger.info(f"Calculating intra-group similarity for task {task_id}")
        
        num_submissions = len(submissions)
        total_comparisons = (num_submissions * (num_submissions - 1)) // 2
        
        current_task.update_state(
            state="PROGRESS",
            meta={"current": 0, "total": total_comparisons, "status": "Starting intra-group similarity calculation"}
        )
        
        similarity_matrix = {}
        comparison_count = 0
        
        # Calculate pairwise similarities
        for i in range(num_submissions):
            for j in range(i + 1, num_submissions):
                try:
                    comparison_count += 1
                    current_task.update_state(
                        state="PROGRESS",
                        meta={"current": comparison_count, "total": total_comparisons, "status": f"Comparing submissions {i + 1} and {j + 1}"}
                    )
                    
                    submission_a = submissions[i]
                    submission_b = submissions[j]
                    
                    similarity_score = _calculate_code_similarity(
                        submission_a["code"],
                        submission_b["code"],
                        method="cosine_embedding"
                    )
                    
                    # Store bidirectional similarity
                    key_ab = f"{submission_a['id']}_{submission_b['id']}"
                    key_ba = f"{submission_b['id']}_{submission_a['id']}"
                    
                    similarity_matrix[key_ab] = {
                        "submission_a_id": submission_a["id"],
                        "submission_b_id": submission_b["id"],
                        "similarity_score": similarity_score,
                        "comparison_method": "cosine_embedding"
                    }
                    similarity_matrix[key_ba] = similarity_matrix[key_ab]
                    
                except Exception as e:
                    logger.error(f"Failed to calculate similarity between submissions {i + 1} and {j + 1}: {str(e)}")
        
        # Calculate statistics for each submission
        submission_stats = {}
        for submission in submissions:
            submission_id = submission["id"]
            
            # Find all similarities involving this submission
            related_similarities = [
                sim["similarity_score"] for key, sim in similarity_matrix.items()
                if sim["submission_a_id"] == submission_id and sim["submission_a_id"] != sim["submission_b_id"]
            ]
            
            if related_similarities:
                submission_stats[submission_id] = {
                    "max_similarity": max(related_similarities),
                    "avg_similarity": sum(related_similarities) / len(related_similarities),
                    "min_similarity": min(related_similarities),
                    "num_comparisons": len(related_similarities)
                }
            else:
                submission_stats[submission_id] = {
                    "max_similarity": 0.0,
                    "avg_similarity": 0.0,
                    "min_similarity": 0.0,
                    "num_comparisons": 0
                }
        
        result = {
            "task_id": task_id,
            "similarity_matrix": similarity_matrix,
            "submission_stats": submission_stats,
            "total_submissions": num_submissions,
            "total_comparisons": total_comparisons,
            "successful_comparisons": len(similarity_matrix) // 2,  # Divide by 2 due to bidirectional storage
            "status": "completed"
        }
        
        # Store intra-group similarity results
        _store_intra_group_similarity_results(task_id, result)
        
        logger.info(f"Completed intra-group similarity calculation for task {task_id}")
        return result
        
    except Exception as exc:
        logger.error(f"Intra-group similarity calculation failed for task {task_id}: {str(exc)}")
        raise self.retry(exc=exc)


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def generate_final_grade(self, submission_id: int, task_description: str, correctness_score: float, 
                        ai_similarity: float, intra_group_similarity: float):
    """
    Generate final grade using AI evaluation based on correctness and similarity scores.
    
    Args:
        submission_id (int): Database ID of the student submission
        task_description (str): Description of the programming task
        correctness_score (float): Code correctness score (0-100)
        ai_similarity (float): Similarity to AI solutions (0-1)
        intra_group_similarity (float): Maximum similarity to peer submissions (0-1)
        
    Returns:
        dict: Final grade and rationale
    """
    try:
        logger.info(f"Generating final grade for submission {submission_id}")
        
        current_task.update_state(
            state="PROGRESS",
            meta={"status": "Preparing grade evaluation prompt"}
        )
        
        # Prepare prompt for AI grading
        grading_prompt = f"""You are a strict but fair teacher grading student code originality.

Task description: {task_description}

Evaluation metrics:
- Correctness score: {correctness_score}/100
- AI similarity: {ai_similarity:.3f} (0 = completely original, 1 = identical to AI)
- Group similarity: {intra_group_similarity:.3f} (0 = unique in group, 1 = identical to peers)

Grading guidelines:
- High correctness with low AI similarity = excellent grade
- High AI similarity (>0.8) should significantly reduce the grade
- High group similarity (>0.9) suggests potential collaboration/copying
- Balance originality and correctness in your evaluation

Generate a JSON response with the following format:
{{"score": <integer between 1 and 100>, "rationale": "<brief explanation of the grade>"}}"""
        
        current_task.update_state(
            state="PROGRESS",
            meta={"status": "Requesting AI grade evaluation"}
        )
        
        # Get AI evaluation (placeholder implementation)
        ai_evaluation = _get_ai_grade_evaluation(grading_prompt)
        
        # Validate AI response
        if not ai_evaluation or "score" not in ai_evaluation:
            # Fallback grading logic
            logger.warning(f"AI grading failed for submission {submission_id}, using fallback logic")
            ai_evaluation = _fallback_grading_logic(correctness_score, ai_similarity, intra_group_similarity)
        
        # Ensure score is within valid range
        final_score = max(1, min(100, int(ai_evaluation["score"])))
        rationale = ai_evaluation.get("rationale", "Grade calculated using automated evaluation")
        
        result = {
            "submission_id": submission_id,
            "final_score": final_score,
            "rationale": rationale,
            "evaluation_metrics": {
                "correctness_score": correctness_score,
                "ai_similarity": ai_similarity,
                "intra_group_similarity": intra_group_similarity
            },
            "grading_method": "ai_assisted" if "score" in ai_evaluation else "fallback",
            "status": "completed"
        }
        
        # Store final grade
        _store_final_grade(submission_id, result)
        
        logger.info(f"Generated final grade {final_score} for submission {submission_id}")
        return result
        
    except Exception as exc:
        logger.error(f"Final grade generation failed for submission {submission_id}: {str(exc)}")
        
        # For critical grading failures, use fallback logic
        try:
            fallback_result = _fallback_grading_logic(correctness_score, ai_similarity, intra_group_similarity)
            fallback_result.update({
                "submission_id": submission_id,
                "grading_method": "fallback_emergency",
                "error": str(exc),
                "status": "completed_with_fallback"
            })
            _store_final_grade(submission_id, fallback_result)
            return fallback_result
        except Exception as fallback_exc:
            logger.error(f"Even fallback grading failed: {str(fallback_exc)}")
            raise self.retry(exc=exc)


@celery_app.task(bind=True)
def batch_grade_submissions(self, task_id: int, deadline_triggered: bool = False):
    """
    Process batch grading for all submissions of a task.
    
    Args:
        task_id (int): Database ID of the programming task
        deadline_triggered (bool): Whether grading was triggered by deadline
        
    Returns:
        dict: Batch grading results and statistics
    """
    try:
        logger.info(f"Starting batch grading for task {task_id}")
        
        # Get all submissions for the task
        submissions = _get_task_submissions(task_id)
        ai_solutions = _get_task_ai_solutions(task_id)
        
        if not submissions:
            return {"task_id": task_id, "message": "No submissions to grade", "status": "completed"}
        
        current_task.update_state(
            state="PROGRESS",
            meta={"current": 0, "total": len(submissions), "status": "Starting batch grading process"}
        )
        
        # Step 1: Calculate AI similarities for all submissions
        ai_similarity_jobs = group(
            calculate_ai_similarity.s(sub["id"], sub["code"], ai_solutions)
            for sub in submissions
        )
        ai_similarity_results = ai_similarity_jobs.apply_async()
        
        # Step 2: Calculate intra-group similarity
        intra_group_result = calculate_intra_group_similarity.apply_async(
            args=[task_id, submissions]
        )
        
        # Wait for similarity calculations to complete
        ai_similarities = ai_similarity_results.get()
        intra_group_data = intra_group_result.get()
        
        # Step 3: Generate final grades for all submissions
        grading_jobs = []
        task_description = _get_task_description(task_id)
        
        for i, submission in enumerate(submissions):
            # Get AI similarity for this submission
            ai_sim_data = next((sim for sim in ai_similarities if sim["submission_id"] == submission["id"]), None)
            ai_similarity = ai_sim_data["overall_ai_similarity"] if ai_sim_data else 0.0
            
            # Get intra-group similarity for this submission
            submission_stats = intra_group_data["submission_stats"].get(str(submission["id"]), {})
            intra_group_similarity = submission_stats.get("max_similarity", 0.0)
            
            # Calculate correctness score (placeholder)
            correctness_score = _calculate_correctness_score(submission["code"], task_id)
            
            # Create grading job
            grading_job = generate_final_grade.s(
                submission["id"],
                task_description,
                correctness_score,
                ai_similarity,
                intra_group_similarity
            )
            grading_jobs.append(grading_job)
        
        # Execute final grading
        final_grading_group = group(grading_jobs)
        final_grades = final_grading_group.apply_async().get()
        
        # Compile results
        grading_summary = {
            "task_id": task_id,
            "total_submissions": len(submissions),
            "successfully_graded": len([g for g in final_grades if g.get("status") == "completed"]),
            "average_score": sum(g["final_score"] for g in final_grades) / len(final_grades),
            "score_distribution": _calculate_score_distribution(final_grades),
            "deadline_triggered": deadline_triggered,
            "grading_completed_at": "2024-01-01T00:00:00Z",  # Placeholder timestamp
            "status": "completed"
        }
        
        # Update task grading status
        _update_task_grading_status(task_id, grading_summary)
        
        logger.info(f"Completed batch grading for task {task_id}")
        return grading_summary
        
    except Exception as exc:
        logger.error(f"Batch grading failed for task {task_id}: {str(exc)}")
        raise self.retry(exc=exc)


# Helper functions (placeholder implementations)

def _calculate_code_similarity(code1: str, code2: str, method: str = "cosine_embedding") -> float:
    """Calculate similarity between two code snippets."""
    # TODO: Implement actual similarity calculation using the similarity service
    import random
    return random.uniform(0.0, 1.0)


def _store_ai_similarity_results(submission_id: int, results: Dict):
    """Store AI similarity results in database."""
    # TODO: Implement database storage
    pass


def _store_intra_group_similarity_results(task_id: int, results: Dict):
    """Store intra-group similarity results in database."""
    # TODO: Implement database storage
    pass


def _get_ai_grade_evaluation(prompt: str) -> Dict:
    """Get grade evaluation from AI service."""
    # TODO: Implement actual AI API integration
    import random
    return {
        "score": random.randint(60, 95),
        "rationale": "Code demonstrates good understanding with moderate originality."
    }


def _fallback_grading_logic(correctness: float, ai_sim: float, group_sim: float) -> Dict:
    """Fallback grading logic when AI services are unavailable."""
    # Apply penalties for high similarity
    ai_penalty = min(30, ai_sim * 40)  # Up to 30 points penalty for AI similarity
    group_penalty = min(20, group_sim * 25)  # Up to 20 points penalty for group similarity
    
    final_score = max(1, min(100, int(correctness - ai_penalty - group_penalty)))
    
    return {
        "score": final_score,
        "rationale": f"Automated grading: {correctness:.1f} correctness, -{ai_penalty:.1f} AI similarity penalty, -{group_penalty:.1f} group similarity penalty"
    }


def _store_final_grade(submission_id: int, grade_data: Dict):
    """Store final grade in database."""
    # TODO: Implement database storage
    pass


def _get_task_submissions(task_id: int) -> List[Dict]:
    """Get all submissions for a task."""
    # TODO: Implement database query
    return [
        {"id": 1, "student_id": 1, "code": "# Sample student code 1", "created_at": "2024-01-01T00:00:00Z"},
        {"id": 2, "student_id": 2, "code": "# Sample student code 2", "created_at": "2024-01-01T00:00:00Z"}
    ]


def _get_task_ai_solutions(task_id: int) -> List[Dict]:
    """Get AI solutions for a task."""
    # TODO: Implement database query
    return [
        {"id": "ai_1", "provider": "openai", "variant_index": 1, "code": "# AI solution 1"},
        {"id": "ai_2", "provider": "openai", "variant_index": 2, "code": "# AI solution 2"}
    ]


def _get_task_description(task_id: int) -> str:
    """Get task description."""
    # TODO: Implement database query
    return "Sample programming task description"


def _calculate_correctness_score(code: str, task_id: int) -> float:
    """Calculate code correctness score."""
    # TODO: Implement actual correctness evaluation
    import random
    return random.uniform(70.0, 100.0)


def _calculate_score_distribution(grades: List[Dict]) -> Dict:
    """Calculate score distribution statistics."""
    scores = [g["final_score"] for g in grades]
    return {
        "min": min(scores),
        "max": max(scores),
        "median": sorted(scores)[len(scores) // 2],
        "std_dev": 0.0  # Placeholder
    }


def _update_task_grading_status(task_id: int, summary: Dict):
    """Update task grading status in database."""
    # TODO: Implement database update
    pass


# Periodic maintenance tasks referenced by Celery Beat
@celery_app.task(bind=True)
def auto_grade_expired_tasks(self):
    """Automatically grade submissions for tasks whose deadlines have passed."""
    try:
        logger.info("Running auto-grade for expired tasks")
        expired_task_ids = _get_expired_tasks()
        if not expired_task_ids:
            logger.info("No expired tasks found for auto-grading")
            return {"status": "completed", "processed": 0}

        # Trigger batch grading for each expired task
        jobs = [batch_grade_submissions.s(task_id, True) for task_id in expired_task_ids]
        result = group(jobs).apply_async().get()
        logger.info(f"Auto-graded {len(expired_task_ids)} expired tasks")
        return {"status": "completed", "processed": len(expired_task_ids), "results": result}
    except Exception as exc:
        logger.error(f"auto_grade_expired_tasks failed: {exc}")
        raise self.retry(exc=exc, countdown=60)


@celery_app.task(bind=True)
def cleanup_old_results(self):
    """Cleanup old task results and transient data to control storage usage."""
    try:
        logger.info("Running cleanup of old results")
        # TODO: Implement cleanup of old Celery results or DB records
        cleaned = _cleanup_transient_data()
        return {"status": "completed", "cleaned": cleaned}
    except Exception as exc:
        logger.error(f"cleanup_old_results failed: {exc}")
        raise self.retry(exc=exc, countdown=300)


def _get_expired_tasks() -> List[int]:
    """Return IDs of tasks past their deadline.

    Placeholder implementation; replace with real DB query.
    """
    # TODO: Query tasks table for expired deadlines
    return []


def _cleanup_transient_data() -> int:
    """Placeholder for cleaning up transient data; returns count cleaned."""
    # TODO: Implement actual cleanup logic
    return 0