import 'api_client.dart';

class ProgressSummary {
  final int userId;
  final int totalLessons;
  final int completedLessons;
  final int totalSections;
  final int completedSections;
  final double completionPercentage;
  final Map<int, dynamic> lessons;

  ProgressSummary({
    required this.userId,
    required this.totalLessons,
    required this.completedLessons,
    required this.totalSections,
    required this.completedSections,
    required this.completionPercentage,
    required this.lessons,
  });
}

class ProgressService {
  static Future<ProgressSummary> getUserProgressSummary(int userId) async {
    final data = await ApiClient.get(
      '/api/v1/progress/user/$userId/summary',
    );

    final lessonsRaw = data['lessons'] as Map<String, dynamic>? ?? {};
    final lessons = <int, dynamic>{};
    for (final entry in lessonsRaw.entries) {
      final key = int.tryParse(entry.key.toString()) ?? 0;
      lessons[key] = entry.value;
    }

    return ProgressSummary(
      userId: data['user_id'] as int? ?? userId,
      totalLessons: data['total_lessons'] as int? ?? 0,
      completedLessons: data['completed_lessons'] as int? ?? 0,
      totalSections: data['total_sections'] as int? ?? 0,
      completedSections: data['completed_sections'] as int? ?? 0,
      completionPercentage:
          (data['completion_percentage'] as num?)?.toDouble() ?? 0,
      lessons: lessons,
    );
  }
}
