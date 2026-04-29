import React, { useState, useEffect, useCallback } from "react";
import { Sparkles } from "lucide-react";
import { testsApi } from "../utils/testsApi.js";

const Testing = ({ lessonId, onComplete, isTeacher = false, allQuestions = [], onRegenerateQuestions }) => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(20 * 60); // 20 minutes in seconds
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [startedAt, setStartedAt] = useState(null);

  const handleFinish = useCallback(async () => {
    if (isFinished) return;
    setIsFinished(true);

    try {
      const attempts = questions.map((q) => ({
        question_id: q.id,
        student_answer: answers[q.id] ?? -1,
      }));

      const timeTaken = 20 * 60 - timeRemaining;
      const response = await testsApi.submitTest(lessonId, {
        attempts,
        time_taken_seconds: timeTaken,
        started_at: startedAt ? startedAt.toISOString() : new Date().toISOString(),
      });

      setResult(response.data);
      if (onComplete) {
        onComplete(response.data);
      }
    } catch (error) {
      console.error("Failed to submit test:", error);
      alert("Не удалось отправить тест");
    }
  }, [isFinished, questions, answers, timeRemaining, lessonId, startedAt, onComplete]);

  useEffect(() => {
    if (isStarted && timeRemaining > 0 && !isFinished) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleFinish();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isStarted, timeRemaining, isFinished, handleFinish]);

  // Загружаем вопросы для учителя сразу при монтировании
  useEffect(() => {
    if (isTeacher && allQuestions.length > 0 && !isStarted) {
      setQuestions(allQuestions);
    }
  }, [isTeacher, allQuestions, isStarted]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      if (isTeacher && allQuestions.length > 0) {
        // Для учителя показываем все вопросы
        setQuestions(allQuestions);
      } else {
        // Для студента показываем рандомные 15 вопросов
        const response = await testsApi.getRandomQuestions(lessonId, 15);
        const questionsList = response.data?.questions || response.data?.data?.questions || [];
        
        if (!questionsList || questionsList.length === 0) {
          console.warn("No questions found for lesson:", lessonId);
          setQuestions([]);
          alert("Для этого урока еще не созданы вопросы. Обратитесь к преподавателю.");
          return;
        }
        
        setQuestions(questionsList);
      }
    } catch (error) {
      console.error("Failed to load questions:", error);
      const errorMessage = error.payload?.detail || error.message || "Неизвестная ошибка";
      alert(`Не удалось загрузить вопросы: ${errorMessage}`);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = () => {
    loadQuestions();
    setIsStarted(true);
    setStartedAt(new Date());
  };

  const handleAnswerSelect = (questionId, answerIndex) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answerIndex,
    }));
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Для учителя показываем список всех вопросов сразу
  if (isTeacher && !isStarted) {
    return (
      <div className="bg-white border-0 p-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg
              className="w-6 h-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
                  <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">Тестирование по теме урока</h3>
          </div>
        </div>
        
        {allQuestions.length > 0 ? (
          <div className="space-y-6">
            <p className="text-sm text-gray-600 mb-4">
              Всего вопросов: {allQuestions.length}. Правильные ответы выделены зеленым цветом.
            </p>
            <div className="space-y-6">
              {allQuestions.map((question, index) => (
                <div key={question.id || index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="text-base font-medium text-gray-900">
                      Вопрос {index + 1}: {question.question || question.question_text || question.text}
                    </h4>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      ID: {question.id}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {(question.options || question.answers || []).map((option, optIndex) => {
                      const isCorrect = optIndex === (question.correct_answer_index !== undefined 
                        ? question.correct_answer_index 
                        : (question.correct_answer !== undefined 
                          ? question.correct_answer 
                          : (question.correct_index !== undefined ? question.correct_index : -1)));
                      return (
                        <div
                          key={optIndex}
                          className={`p-3 rounded-lg border ${
                            isCorrect
                              ? "bg-green-50 border-green-300"
                              : "bg-gray-50 border-gray-200"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <span
                              className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                                isCorrect
                                  ? "bg-green-500 text-white"
                                  : "bg-gray-300 text-gray-700"
                              }`}
                            >
                              {String.fromCharCode(65 + optIndex)}
                            </span>
                            <span className={`text-sm ${isCorrect ? "text-green-800 font-medium" : "text-gray-700"}`}>
                              {option}
                            </span>
                            {isCorrect && (
                              <span className="ml-auto text-xs text-green-600 font-semibold">
                                ✓ Правильный ответ
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {question.explanation && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs font-semibold text-blue-800 mb-1">Объяснение:</p>
                      <p className="text-sm text-blue-700">{question.explanation}</p>
                    </div>
                  )}
                  {(question.topic || question.difficulty) && (
                    <div className="mt-2 flex gap-2">
                      {question.topic && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                          Тема: {question.topic}
                        </span>
                      )}
                      {question.difficulty && (
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                          Сложность: {question.difficulty}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">Вопросы еще не сгенерированы для этого урока.</p>
            {onRegenerateQuestions && (
              <button
                onClick={onRegenerateQuestions}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
              >
                <Sparkles className="w-4 h-4" />
                Сгенерировать вопросы по теории
              </button>
            )}
            {!onRegenerateQuestions && (
              <p className="text-sm text-gray-400">
                Создайте урок и сгенерируйте вопросы с помощью ИИ в разделе создания урока.
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  // Для студента показываем обычный экран начала теста
  if (!isStarted) {
    return (
      <div className="bg-white border-0 p-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg
              className="w-6 h-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Тестирование по теме урока</h3>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          Проверьте свои знания с помощью интерактивного тестирования. Ответьте на вопросы по
          изученному материалу. Тест состоит из {questions.length || 12} вопросов с вариантами
          ответов. Время на выполнение: 20 минут.
        </p>
        <button
          onClick={handleStart}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Начать тестирование
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white border-0 p-12 text-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Загрузка вопросов...</p>
      </div>
    );
  }

  if (isFinished && result) {
    const passed = result.score >= 50;
    return (
      <div className="bg-white border-0 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Результаты тестирования</h3>
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${
                passed ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
              }`}
            >
              {Math.round(result.score)}%
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">
                {passed ? "Тест пройден" : "Тест не пройден"}
              </p>
              <p className="text-sm text-gray-600">
                Правильных ответов: {result.correct_answers} из {result.total_questions}
              </p>
            </div>
          </div>
          {result.incorrect_question_ids && result.incorrect_question_ids.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-yellow-800 mb-2">
                Неправильные вопросы: {result.incorrect_question_ids.length}
              </p>
              <p className="text-xs text-yellow-700">
                Эти вопросы будут включены в следующий тест для повторения.
              </p>
            </div>
          )}
        </div>
        {!passed && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-red-800">
              Для прохождения урока необходимо набрать минимум 50%. Пожалуйста, пройдите тест
              заново.
            </p>
          </div>
        )}
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  if (!currentQuestion) {
    return null;
  }

  return (
    <div className="bg-white border-0 p-0">
      {/* Header with question progress and timer */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-0.5">
            Вопрос {currentQuestionIndex + 1} из {questions.length}
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-gray-600 mb-1.5">Осталось времени</div>
          <div
            className={`text-2xl font-bold leading-tight ${
              timeRemaining < 300 ? "text-red-600" : "text-gray-900"
            }`}
          >
            {formatTime(timeRemaining)}
          </div>
        </div>
      </div>

      {/* Question and answers section */}
      <div className="mb-10">
        <h4 className="text-lg font-semibold text-gray-900 mb-8 leading-relaxed">
          {currentQuestion.question}
        </h4>
        <div className="space-y-4">
          {currentQuestion.options.map((option, index) => (
            <label
              key={index}
              className={`flex items-start p-5 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                answers[currentQuestion.id] === index
                  ? "border-blue-500 bg-blue-50 shadow-sm"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name={`question-${currentQuestion.id}`}
                checked={answers[currentQuestion.id] === index}
                onChange={() => handleAnswerSelect(currentQuestion.id, index)}
                className="mt-0.5 mr-4 w-5 h-5 flex-shrink-0"
              />
              <span className="text-base text-gray-700 leading-relaxed flex-1">{option}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Navigation footer */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-100">
        <button
          onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentQuestionIndex === 0}
          className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Назад
        </button>
        <div className="flex gap-2">
          {questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuestionIndex(index)}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                index === currentQuestionIndex
                  ? "bg-blue-600 text-white shadow-sm"
                  : answers[questions[index].id] !== undefined
                  ? "bg-gray-300 text-gray-500 opacity-75 hover:bg-gray-400"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
        {currentQuestionIndex === questions.length - 1 ? (
          <button
            onClick={handleFinish}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            Завершить тест
          </button>
        ) : (
          <button
            onClick={() =>
              setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))
            }
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            Далее
          </button>
        )}
      </div>
    </div>
  );
};

export default Testing;

