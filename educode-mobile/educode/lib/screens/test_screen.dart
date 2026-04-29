import 'dart:async';
import 'package:flutter/material.dart';
import '../services/test_service.dart';
import '../services/api_client.dart';
import 'login_screen.dart';

class TestScreen extends StatefulWidget {
  final int lessonId;
  final String lessonTitle;

  const TestScreen({
    super.key,
    required this.lessonId,
    required this.lessonTitle,
  });

  @override
  State<TestScreen> createState() => _TestScreenState();
}

enum _TestPhase { loading, error, intro, quiz, submitting, results }

class _TestScreenState extends State<TestScreen> {
  _TestPhase _phase = _TestPhase.loading;
  String? _errorMessage;

  List<TestQuestion> _questions = [];
  // Maps question index → selected option index
  final Map<int, int> _answers = {};

  int _currentIndex = 0;
  DateTime? _startedAt;

  // Timer
  late Timer _timer;
  int _elapsedSeconds = 0;

  TestResult? _result;

  @override
  void initState() {
    super.initState();
    _loadQuestions();
  }

  @override
  void dispose() {
    if (_phase == _TestPhase.quiz) _timer.cancel();
    super.dispose();
  }

  Future<void> _loadQuestions() async {
    setState(() {
      _phase = _TestPhase.loading;
      _errorMessage = null;
    });
    try {
      final questions = await TestService.getQuestions(widget.lessonId);
      if (!mounted) return;
      if (questions.isEmpty) {
        setState(() {
          _errorMessage = 'No test questions available for this lesson yet.';
          _phase = _TestPhase.error;
        });
        return;
      }
      setState(() {
        _questions = questions;
        _phase = _TestPhase.intro;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      if (e.isUnauthorized) {
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => const LoginScreen()),
          (r) => false,
        );
        return;
      }
      setState(() {
        _errorMessage = e.message;
        _phase = _TestPhase.error;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e.toString();
        _phase = _TestPhase.error;
      });
    }
  }

  void _startQuiz() {
    _startedAt = DateTime.now();
    _elapsedSeconds = 0;
    _answers.clear();
    _currentIndex = 0;

    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) {
        setState(() => _elapsedSeconds++);
      }
    });

    setState(() => _phase = _TestPhase.quiz);
  }

  Future<void> _submitTest() async {
    _timer.cancel();
    setState(() => _phase = _TestPhase.submitting);

    final attempts = <TestAttempt>[];
    for (int i = 0; i < _questions.length; i++) {
      final answer = _answers[i];
      if (answer != null) {
        attempts.add(TestAttempt(
          questionId: _questions[i].id,
          studentAnswer: answer,
        ));
      }
    }

    try {
      final result = await TestService.submitTest(
        lessonId: widget.lessonId,
        attempts: attempts,
        timeTakenSeconds: _elapsedSeconds,
        startedAt: _startedAt!,
      );
      if (!mounted) return;
      setState(() {
        _result = result;
        _phase = _TestPhase.results;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      if (e.isUnauthorized) {
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => const LoginScreen()),
          (r) => false,
        );
        return;
      }
      setState(() {
        _errorMessage = e.message;
        _phase = _TestPhase.error;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e.toString();
        _phase = _TestPhase.error;
      });
    }
  }

  String _formatTime(int seconds) {
    final m = seconds ~/ 60;
    final s = seconds % 60;
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Column(
        children: [
          _buildHeader(),
          Expanded(child: _buildBody()),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 60, 20, 20),
      decoration: const BoxDecoration(
        color: Color(0xFF4169E1),
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(24),
          bottomRight: Radius.circular(24),
        ),
      ),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => Navigator.pop(context),
            child: const Icon(Icons.arrow_back_ios, color: Colors.white, size: 20),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              widget.lessonTitle,
              style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          if (_phase == _TestPhase.quiz)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.white.withAlpha(51),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.timer_outlined, color: Colors.white, size: 16),
                  const SizedBox(width: 4),
                  Text(
                    _formatTime(_elapsedSeconds),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildBody() {
    switch (_phase) {
      case _TestPhase.loading:
        return const Center(
          child: CircularProgressIndicator(
            valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF4169E1)),
          ),
        );
      case _TestPhase.error:
        return _buildErrorView();
      case _TestPhase.intro:
        return _buildIntroView();
      case _TestPhase.quiz:
        return _buildQuizView();
      case _TestPhase.submitting:
        return const Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF4169E1)),
              ),
              SizedBox(height: 16),
              Text('Submitting your answers...', style: TextStyle(fontSize: 16, color: Colors.black54)),
            ],
          ),
        );
      case _TestPhase.results:
        return _buildResultsView();
    }
  }

  Widget _buildErrorView() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              _errorMessage ?? 'An error occurred',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 16, color: Colors.grey[700]),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _loadQuestions,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF4169E1),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('Try Again'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildIntroView() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          const SizedBox(height: 20),
          Container(
            width: 100,
            height: 100,
            decoration: BoxDecoration(
              color: const Color(0xFF4169E1).withAlpha(26),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.quiz_outlined, size: 48, color: Color(0xFF4169E1)),
          ),
          const SizedBox(height: 24),
          Text(
            widget.lessonTitle,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Test your knowledge',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 16, color: Colors.black54),
          ),
          const SizedBox(height: 32),
          _buildInfoTile(Icons.help_outline, 'Questions', '${_questions.length} questions'),
          const SizedBox(height: 12),
          _buildInfoTile(Icons.timer_outlined, 'Timer', 'Timer starts when you begin'),
          const SizedBox(height: 12),
          _buildInfoTile(Icons.check_circle_outline, 'Passing score', '70% or above'),
          const SizedBox(height: 40),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _startQuiz,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF4169E1),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: const Text(
                'Start Test',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoTile(IconData icon, String label, String value) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Row(
        children: [
          Icon(icon, color: const Color(0xFF4169E1), size: 24),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: TextStyle(fontSize: 12, color: Colors.grey[500])),
                const SizedBox(height: 2),
                Text(value, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: Colors.black87)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuizView() {
    final question = _questions[_currentIndex];
    final selectedAnswer = _answers[_currentIndex];
    final progress = (_currentIndex + 1) / _questions.length;
    final answeredCount = _answers.length;

    return Column(
      children: [
        // Progress bar
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Question ${_currentIndex + 1} of ${_questions.length}',
                    style: const TextStyle(fontSize: 13, color: Colors.black54, fontWeight: FontWeight.w500),
                  ),
                  Text(
                    '$answeredCount answered',
                    style: const TextStyle(fontSize: 13, color: Colors.black54),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: progress,
                  minHeight: 6,
                  backgroundColor: Colors.grey[200],
                  valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF4169E1)),
                ),
              ),
            ],
          ),
        ),

        // Question content
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Question card
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: const Color(0xFF4169E1).withAlpha(15),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFF4169E1).withAlpha(40)),
                  ),
                  child: Text(
                    question.question,
                    style: const TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w600,
                      color: Colors.black87,
                      height: 1.4,
                    ),
                  ),
                ),
                const SizedBox(height: 20),

                // Options
                ...List.generate(question.options.length, (optionIndex) {
                  final isSelected = selectedAnswer == optionIndex;
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: GestureDetector(
                      onTap: () {
                        setState(() => _answers[_currentIndex] = optionIndex);
                      },
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 150),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: isSelected ? const Color(0xFF4169E1) : Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isSelected ? const Color(0xFF4169E1) : Colors.grey[300]!,
                            width: isSelected ? 2 : 1,
                          ),
                          boxShadow: isSelected
                              ? [BoxShadow(color: const Color(0xFF4169E1).withAlpha(51), blurRadius: 8, offset: const Offset(0, 2))]
                              : null,
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 28,
                              height: 28,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: isSelected ? Colors.white : Colors.grey[100],
                                border: Border.all(
                                  color: isSelected ? Colors.white : Colors.grey[400]!,
                                ),
                              ),
                              child: Center(
                                child: Text(
                                  String.fromCharCode(65 + optionIndex), // A, B, C, D
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.bold,
                                    color: isSelected ? const Color(0xFF4169E1) : Colors.grey[600],
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                question.options[optionIndex],
                                style: TextStyle(
                                  fontSize: 15,
                                  color: isSelected ? Colors.white : Colors.black87,
                                  height: 1.3,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                }),
              ],
            ),
          ),
        ),

        // Navigation
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
          child: Row(
            children: [
              if (_currentIndex > 0)
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => setState(() => _currentIndex--),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      side: const BorderSide(color: Color(0xFF4169E1)),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Previous', style: TextStyle(color: Color(0xFF4169E1), fontSize: 15)),
                  ),
                ),
              if (_currentIndex > 0) const SizedBox(width: 12),
              Expanded(
                child: _currentIndex < _questions.length - 1
                    ? ElevatedButton(
                        onPressed: () => setState(() => _currentIndex++),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF4169E1),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: const Text('Next', style: TextStyle(fontSize: 15)),
                      )
                    : ElevatedButton(
                        onPressed: _answers.length == _questions.length
                            ? _showSubmitDialog
                            : null,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF27C93F),
                          foregroundColor: Colors.white,
                          disabledBackgroundColor: Colors.grey[300],
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: Text(
                          _answers.length == _questions.length
                              ? 'Submit Test'
                              : '${_questions.length - _answers.length} unanswered',
                          style: const TextStyle(fontSize: 15),
                        ),
                      ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  void _showSubmitDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Submit Test?', style: TextStyle(fontWeight: FontWeight.bold)),
        content: Text(
          'You answered ${_answers.length} of ${_questions.length} questions. Submit now?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Review', style: TextStyle(color: Colors.black54)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              _submitTest();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF4169E1),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('Submit'),
          ),
        ],
      ),
    );
  }

  Widget _buildResultsView() {
    final result = _result!;
    final passed = result.passed;
    final scorePercent = result.score.round();
    final incorrectSet = result.incorrectQuestionIds.toSet();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          const SizedBox(height: 8),

          // Score circle
          Container(
            width: 130,
            height: 130,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: passed ? const Color(0xFF27C93F).withAlpha(26) : Colors.red.withAlpha(26),
              border: Border.all(
                color: passed ? const Color(0xFF27C93F) : Colors.red,
                width: 3,
              ),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  '$scorePercent%',
                  style: TextStyle(
                    fontSize: 34,
                    fontWeight: FontWeight.bold,
                    color: passed ? const Color(0xFF27C93F) : Colors.red,
                  ),
                ),
                Text(
                  passed ? 'Passed' : 'Failed',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: passed ? const Color(0xFF27C93F) : Colors.red,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Stats row
          Row(
            children: [
              Expanded(child: _buildStatCard('Correct', '${result.correctAnswers}', const Color(0xFF27C93F))),
              const SizedBox(width: 12),
              Expanded(
                child: _buildStatCard(
                  'Incorrect',
                  '${result.totalQuestions - result.correctAnswers}',
                  Colors.red,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(child: _buildStatCard('Time', _formatTime(result.timeTakenSeconds ?? _elapsedSeconds), const Color(0xFF4169E1))),
            ],
          ),
          const SizedBox(height: 24),

          // Question breakdown
          if (_questions.isNotEmpty) ...[
            Align(
              alignment: Alignment.centerLeft,
              child: const Text(
                'Question Summary',
                style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: Colors.black87),
              ),
            ),
            const SizedBox(height: 12),
            ...List.generate(_questions.length, (i) {
              final q = _questions[i];
              final isIncorrect = incorrectSet.contains(q.id);
              final wasAnswered = _answers.containsKey(i);
              final correct = wasAnswered && !isIncorrect;

              return Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: correct
                      ? const Color(0xFF27C93F).withAlpha(15)
                      : Colors.red.withAlpha(15),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: correct
                        ? const Color(0xFF27C93F).withAlpha(80)
                        : Colors.red.withAlpha(80),
                  ),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(
                      correct ? Icons.check_circle : Icons.cancel,
                      color: correct ? const Color(0xFF27C93F) : Colors.red,
                      size: 20,
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        q.question,
                        style: const TextStyle(fontSize: 13, color: Colors.black87, height: 1.4),
                      ),
                    ),
                  ],
                ),
              );
            }),
          ],

          const SizedBox(height: 24),

          // Actions
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                setState(() {
                  _phase = _TestPhase.intro;
                  _answers.clear();
                  _elapsedSeconds = 0;
                });
                _loadQuestions();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF4169E1),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: const Text('Try Again', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: () => Navigator.pop(context),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                side: const BorderSide(color: Color(0xFF4169E1)),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: const Text('Back to Lesson', style: TextStyle(fontSize: 16, color: Color(0xFF4169E1))),
            ),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _buildStatCard(String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16),
      decoration: BoxDecoration(
        color: color.withAlpha(20),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withAlpha(60)),
      ),
      child: Column(
        children: [
          Text(value, style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: color)),
          const SizedBox(height: 4),
          Text(label, style: TextStyle(fontSize: 12, color: Colors.grey[600])),
        ],
      ),
    );
  }
}
