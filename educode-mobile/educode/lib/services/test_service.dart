import 'api_client.dart';

class TestQuestion {
  final int id;
  final String question;
  final List<String> options;
  final String? explanation;
  final String? topic;
  final String? difficulty;

  TestQuestion({
    required this.id,
    required this.question,
    required this.options,
    this.explanation,
    this.topic,
    this.difficulty,
  });

  factory TestQuestion.fromJson(Map<String, dynamic> json) {
    final rawOptions = json['options'];
    final options = rawOptions is List
        ? rawOptions.map((e) => e.toString()).toList()
        : <String>[];
    return TestQuestion(
      id: json['id'] as int,
      question: json['question'] as String? ?? '',
      options: options,
      explanation: json['explanation'] as String?,
      topic: json['topic'] as String?,
      difficulty: json['difficulty'] as String?,
    );
  }
}

class TestAttempt {
  final int questionId;
  final int studentAnswer;

  TestAttempt({required this.questionId, required this.studentAnswer});

  Map<String, dynamic> toJson() => {
        'question_id': questionId,
        'student_answer': studentAnswer,
      };
}

class TestResult {
  final int id;
  final int lessonId;
  final double score;
  final int totalQuestions;
  final int correctAnswers;
  final List<int> incorrectQuestionIds;
  final int? timeTakenSeconds;
  final bool passed;

  TestResult({
    required this.id,
    required this.lessonId,
    required this.score,
    required this.totalQuestions,
    required this.correctAnswers,
    required this.incorrectQuestionIds,
    this.timeTakenSeconds,
    required this.passed,
  });

  factory TestResult.fromJson(Map<String, dynamic> json) {
    final rawIds = json['incorrect_question_ids'];
    final incorrectIds = rawIds is List
        ? rawIds.map((e) => e as int).toList()
        : <int>[];
    return TestResult(
      id: json['id'] as int,
      lessonId: json['lesson_id'] as int,
      score: (json['score'] as num?)?.toDouble() ?? 0,
      totalQuestions: json['total_questions'] as int? ?? 0,
      correctAnswers: json['correct_answers'] as int? ?? 0,
      incorrectQuestionIds: incorrectIds,
      timeTakenSeconds: json['time_taken_seconds'] as int?,
      passed: json['passed'] == true,
    );
  }
}

class TestService {
  static Future<List<TestQuestion>> getQuestions(
    int lessonId, {
    int count = 12,
  }) async {
    final data = await ApiClient.get(
      '/api/v1/tests/lessons/$lessonId/questions',
      queryParams: {'count': count.toString()},
    );

    final questionsData = data['questions'] as List<dynamic>? ?? [];
    return questionsData
        .map((e) => TestQuestion.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  static Future<TestResult> submitTest({
    required int lessonId,
    required List<TestAttempt> attempts,
    required int timeTakenSeconds,
    required DateTime startedAt,
  }) async {
    final data = await ApiClient.post(
      '/api/v1/tests/lessons/$lessonId/submit',
      body: {
        'lesson_id': lessonId,
        'attempts': attempts.map((a) => a.toJson()).toList(),
        'time_taken_seconds': timeTakenSeconds,
        'started_at': startedAt.toUtc().toIso8601String(),
      },
    );
    return TestResult.fromJson(data);
  }
}
