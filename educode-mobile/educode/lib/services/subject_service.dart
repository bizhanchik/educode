import 'api_client.dart';

class Subject {
  final int id;
  final String name;
  final String? code;
  final String? status;
  final String? color;
  final String? image;
  final String? imagePresignedUrl;

  Subject({
    required this.id,
    required this.name,
    this.code,
    this.status,
    this.color,
    this.image,
    this.imagePresignedUrl,
  });

  factory Subject.fromJson(Map<String, dynamic> json) {
    return Subject(
      id: json['id'] as int,
      name: json['name'] as String? ?? '',
      code: json['code'] as String?,
      status: json['status'] as String?,
      color: json['color'] as String?,
      image: json['image'] as String?,
      imagePresignedUrl: json['image_presigned_url'] as String?,
    );
  }
}

class SubjectListResponse {
  final List<Subject> subjects;
  final int total;
  final int page;
  final int size;

  SubjectListResponse({
    required this.subjects,
    required this.total,
    required this.page,
    required this.size,
  });
}

class SubjectService {
  static Future<SubjectListResponse> getSubjects({
    int page = 1,
    int size = 20,
  }) async {
    final data = await ApiClient.get(
      '/api/v1/subjects',
      queryParams: {
        'page': page.toString(),
        'size': size.toString(),
      },
    );

    final subjectsData = data['subjects'] as List<dynamic>? ?? [];
    final subjects = subjectsData
        .map((e) => Subject.fromJson(e as Map<String, dynamic>))
        .toList();

    return SubjectListResponse(
      subjects: subjects,
      total: data['total'] as int? ?? 0,
      page: data['page'] as int? ?? page,
      size: data['size'] as int? ?? size,
    );
  }
}
