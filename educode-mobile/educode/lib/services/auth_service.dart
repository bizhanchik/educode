import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class UserInfo {
  final int id;
  final String name;
  final String email;
  final String role;
  final int? groupId;

  UserInfo({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.groupId,
  });

  factory UserInfo.fromJson(Map<String, dynamic> json) {
    return UserInfo(
      id: json['id'] as int,
      name: json['name'] as String? ?? '',
      email: json['email'] as String? ?? '',
      role: json['role'] as String? ?? 'student',
      groupId: json['group_id'] as int?,
    );
  }
}

class AuthService {
  static const String baseUrl = 'http://localhost:8000';
  static const String _tokenKey = 'access_token';
  static const String _roleKey = 'user_role';
  static const String _userIdKey = 'user_id';
  static const String _userNameKey = 'user_name';
  static const String _userEmailKey = 'user_email';

  static Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/v1/auth/login'),
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'email': email,
          'password': password,
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        // Save token and role
        if (data['access_token'] != null) {
          await _saveToken(data['access_token']);
        }
        if (data['role'] != null) {
          await _saveRole(data['role']);
        }
        return {'success': true, 'data': data};
      } else {
        return {
          'success': false,
          'message': data['detail'] ?? 'Invalid email or password',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Connection error: ${e.toString()}',
      };
    }
  }

  static Future<void> _saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
  }

  static Future<void> _saveRole(String role) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_roleKey, role);
  }

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  static Future<String?> getRole() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_roleKey);
  }

  static Future<bool> isLoggedIn() async {
    final token = await getToken();
    return token != null && token.isNotEmpty;
  }

  static Future<UserInfo?> getCurrentUser() async {
    final token = await getToken();
    if (token == null || token.isEmpty) return null;

    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/v1/auth/me'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 401) {
        await logout();
        return null;
      }

      if (response.statusCode != 200) return null;

      final data = jsonDecode(response.body) as Map<String, dynamic>;
      final user = UserInfo.fromJson(data);

      final prefs = await SharedPreferences.getInstance();
      await prefs.setInt(_userIdKey, user.id);
      await prefs.setString(_userNameKey, user.name);
      await prefs.setString(_userEmailKey, user.email);

      return user;
    } catch (_) {
      return null;
    }
  }

  static Future<int?> getUserId() async {
    final prefs = await SharedPreferences.getInstance();
    final cached = prefs.getInt(_userIdKey);
    if (cached != null) return cached;

    final user = await getCurrentUser();
    return user?.id;
  }

  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_roleKey);
    await prefs.remove(_userIdKey);
    await prefs.remove(_userNameKey);
    await prefs.remove(_userEmailKey);
  }
}
