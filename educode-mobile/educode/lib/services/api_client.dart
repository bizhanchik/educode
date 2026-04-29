import 'dart:convert';
import 'package:http/http.dart' as http;

import 'auth_service.dart';

class ApiException implements Exception {
  final int? statusCode;
  final String message;
  final bool isUnauthorized;

  ApiException(this.message, {this.statusCode, this.isUnauthorized = false});

  @override
  String toString() => message;
}

class ApiClient {
  static Future<Map<String, dynamic>> get(
    String path, {
    Map<String, String>? queryParams,
  }) async {
    final token = await AuthService.getToken();
    if (token == null || token.isEmpty) {
      await AuthService.logout();
      throw ApiException('Not authenticated', isUnauthorized: true);
    }

    var uri = Uri.parse('${AuthService.baseUrl}$path');
    if (queryParams != null && queryParams.isNotEmpty) {
      uri = uri.replace(queryParameters: queryParams);
    }

    final response = await http.get(
      uri,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    return _handleResponse(response);
  }

  static Future<Map<String, dynamic>> post(
    String path, {
    Map<String, dynamic>? body,
  }) async {
    final token = await AuthService.getToken();
    if (token == null || token.isEmpty) {
      await AuthService.logout();
      throw ApiException('Not authenticated', isUnauthorized: true);
    }

    final response = await http.post(
      Uri.parse('${AuthService.baseUrl}$path'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: body != null ? jsonEncode(body) : null,
    );

    return _handleResponse(response);
  }

  static Future<Map<String, dynamic>> _handleResponse(http.Response response) async {
    if (response.statusCode == 401) {
      await AuthService.logout();
      throw ApiException(
        'Session expired. Please log in again.',
        statusCode: 401,
        isUnauthorized: true,
      );
    }

    Map<String, dynamic> parsed;
    try {
      parsed = jsonDecode(response.body) as Map<String, dynamic>;
    } catch (_) {
      throw ApiException(
        response.statusCode >= 400
            ? 'Request failed: ${response.body}'
            : 'Invalid response from server',
        statusCode: response.statusCode,
      );
    }

    if (response.statusCode >= 400) {
      final detail = parsed['detail'];
      final message = detail is String
          ? detail
          : (detail is List && detail.isNotEmpty)
              ? detail[0].toString()
              : 'Request failed';
      throw ApiException(message, statusCode: response.statusCode);
    }

    if (parsed['status'] == 'success' && parsed.containsKey('data')) {
      final data = parsed['data'];
      return data is Map<String, dynamic> ? data : {'data': data};
    }

    return parsed;
  }
}
