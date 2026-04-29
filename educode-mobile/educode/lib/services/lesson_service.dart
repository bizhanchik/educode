import 'api_client.dart';

class Lesson {
  final int id;
  final String title;
  final String? description;
  final int subjectId;
  final int? teacherId;
  final int? order;

  Lesson({
    required this.id,
    required this.title,
    this.description,
    required this.subjectId,
    this.teacherId,
    this.order,
  });

  factory Lesson.fromJson(Map<String, dynamic> json) {
    return Lesson(
      id: json['id'] as int,
      title: json['title'] as String? ?? '',
      description: json['description'] as String?,
      subjectId: json['subject_id'] as int? ?? 0,
      teacherId: json['teacher_id'] as int?,
      order: json['order'] as int?,
    );
  }
}

class LessonListResponse {
  final List<Lesson> lessons;
  final int total;
  final int page;
  final int size;

  LessonListResponse({
    required this.lessons,
    required this.total,
    required this.page,
    required this.size,
  });
}

class LessonMaterial {
  final int id;
  final int lessonId;
  final String type;
  final String title;
  final String? content;
  final String? fileUrl;
  final String? youtubeUrl;
  final String? extractedText;
  final bool useForAiGeneration;

  LessonMaterial({
    required this.id,
    required this.lessonId,
    required this.type,
    required this.title,
    this.content,
    this.fileUrl,
    this.youtubeUrl,
    this.extractedText,
    this.useForAiGeneration = false,
  });

  factory LessonMaterial.fromJson(Map<String, dynamic> json) {
    return LessonMaterial(
      id: json['id'] as int,
      lessonId: json['lesson_id'] as int? ?? 0,
      type: (json['type'] as String? ?? 'text').toLowerCase(),
      title: json['title'] as String? ?? '',
      content: json['content'] as String?,
      fileUrl: json['file_url'] as String?,
      youtubeUrl: json['youtube_url'] as String?,
      extractedText: json['extracted_text'] as String?,
      useForAiGeneration: json['use_for_ai_generation'] == true,
    );
  }

  String? get videoId {
    if (youtubeUrl == null || youtubeUrl!.isEmpty) return null;
    final url = youtubeUrl!;
    if (url.contains('youtu.be/')) {
      final parts = url.split('youtu.be/');
      if (parts.length > 1) return parts[1].split('?').first;
    }
    if (url.contains('v=')) {
      final match = RegExp(r'v=([^&]+)').firstMatch(url);
      return match?.group(1);
    }
    return null;
  }
}

class LessonMaterialsResponse {
  final List<LessonMaterial> materials;
  final int total;

  LessonMaterialsResponse({
    required this.materials,
    required this.total,
  });
}

class LessonStatus {
  final int lessonId;
  final double testScore;
  final double practiceScore;
  final double finalScore;
  final bool isLocked;
  final bool canProceed;
  final bool passed;

  LessonStatus({
    required this.lessonId,
    required this.testScore,
    required this.practiceScore,
    required this.finalScore,
    required this.isLocked,
    required this.canProceed,
    required this.passed,
  });

  factory LessonStatus.fromJson(Map<String, dynamic> json) {
    return LessonStatus(
      lessonId: json['lesson_id'] as int? ?? 0,
      testScore: (json['test_score'] as num?)?.toDouble() ?? 0,
      practiceScore: (json['practice_score'] as num?)?.toDouble() ?? 0,
      finalScore: (json['final_score'] as num?)?.toDouble() ?? 0,
      isLocked: json['is_locked'] == true,
      canProceed: json['can_proceed'] == true,
      passed: json['passed'] == true,
    );
  }
}

class LessonService {
  static Future<LessonListResponse> getLessons({
    int? subjectId,
    int page = 1,
    int size = 20,
  }) async {
    final queryParams = <String, String>{
      'page': page.toString(),
      'size': size.toString(),
    };
    if (subjectId != null) {
      queryParams['subject_id'] = subjectId.toString();
    }

    final data = await ApiClient.get(
      '/api/v1/lessons',
      queryParams: queryParams,
    );

    final lessonsData = data['lessons'] as List<dynamic>? ?? [];
    final lessons = lessonsData
        .map((e) => Lesson.fromJson(e as Map<String, dynamic>))
        .toList();

    return LessonListResponse(
      lessons: lessons,
      total: data['total'] as int? ?? 0,
      page: data['page'] as int? ?? page,
      size: data['size'] as int? ?? size,
    );
  }

  static Future<Lesson> getLesson(int id) async {
    final data = await ApiClient.get('/api/v1/lessons/$id');
    return Lesson.fromJson(data);
  }

  static Future<LessonMaterialsResponse> getLessonMaterials(int lessonId) async {
    final data = await ApiClient.get(
      '/api/v1/lessons/$lessonId/materials',
    );

    final materialsData = data['materials'] as List<dynamic>? ?? [];
    final materials = materialsData
        .map((e) => LessonMaterial.fromJson(e as Map<String, dynamic>))
        .toList();

    return LessonMaterialsResponse(
      materials: materials,
      total: data['total'] as int? ?? materials.length,
    );
  }

  static Future<LessonStatus> getLessonStatus(int lessonId) async {
    final data = await ApiClient.get(
      '/api/v1/lessons/$lessonId/status',
    );
    return LessonStatus.fromJson(data);
  }
}
