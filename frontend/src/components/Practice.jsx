import React, { useState, useEffect, useMemo } from "react";
import Editor from "@monaco-editor/react";
import { practiceApi } from "../utils/practiceApi.js";
import TestResultsPanel from "./TestResultsPanel.jsx";

const MAX_ATTEMPTS = 3;
const MIN_SCORE_TO_SUBMIT = 60;

const Practice = ({ lessonId, tasks = [], isTeacher = false }) => {
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [code, setCode] = useState("");
  const [output, setOutput] = useState({ stdout: "", stderr: "", exit_code: 0 });
  const [isRunning, setIsRunning] = useState(false);
  const [isTestsRunning, setIsTestsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState({});
  const [testResults, setTestResults] = useState(null);
  const [attempts, setAttempts] = useState({});

  // Load saved code and attempts on task change
  useEffect(() => {
    if (tasks.length > 0 && tasks[currentTaskIndex]) {
      const taskId = tasks[currentTaskIndex].id;
      // Load saved code
      const savedCode = localStorage.getItem(`task-${taskId}-code`);
      setCode(savedCode || 'print("Привет, мир!")');
      // Load saved attempts
      const savedAttempts = localStorage.getItem(`task-${taskId}-attempts`);
      if (savedAttempts) {
        setAttempts(prev => ({ ...prev, [taskId]: parseInt(savedAttempts, 10) }));
      }
      // Clear test results when switching tasks
      setTestResults(null);
      setOutput({ stdout: "", stderr: "", exit_code: 0 });
    }
  }, [currentTaskIndex, tasks]);

  // Save code on change
  useEffect(() => {
    if (tasks.length > 0 && tasks[currentTaskIndex]) {
      const taskId = tasks[currentTaskIndex].id;
      if (code) {
        localStorage.setItem(`task-${taskId}-code`, code);
      }
    }
  }, [code, currentTaskIndex, tasks]);

  const handleRun = async () => {
    if (!code.trim()) return;

    setIsRunning(true);
    setTestResults(null);
    try {
      const response = await practiceApi.executeCode(code, "python");
      setOutput(response.data || { stdout: "", stderr: "", exit_code: 0 });
    } catch (error) {
      console.error("Failed to execute code:", error);
      setOutput({
        stdout: "",
        stderr: `Ошибка выполнения: ${error.message}`,
        exit_code: 1,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunTests = async () => {
    const task = displayTasks[currentTaskIndex];
    if (!task || !code.trim()) return;

    setIsTestsRunning(true);
    setOutput({ stdout: "", stderr: "", exit_code: 0 });
    try {
      const response = await practiceApi.runTests(task.id, code, "python");
      setTestResults(response.data);
    } catch (error) {
      console.error("Failed to run tests:", error);
      setTestResults(null);
      setOutput({
        stdout: "",
        stderr: `Ошибка выполнения тестов: ${error.message}`,
        exit_code: 1,
      });
    } finally {
      setIsTestsRunning(false);
    }
  };

  const handleSubmit = async () => {
    const task = displayTasks[currentTaskIndex];
    if (!task || !code.trim()) return;

    const currentAttempts = attempts[task.id] || 0;

    // Check attempts limit
    if (currentAttempts >= MAX_ATTEMPTS) {
      alert(`Вы исчерпали все ${MAX_ATTEMPTS} попытки для этого задания.`);
      return;
    }

    // Check if tests were run and passed threshold
    if (!testResults) {
      alert("Сначала запустите тесты, чтобы проверить решение.");
      return;
    }

    if (testResults.score < MIN_SCORE_TO_SUBMIT) {
      alert(`Для отправки решения необходимо набрать минимум ${MIN_SCORE_TO_SUBMIT}% на тестах. Текущий результат: ${Math.round(testResults.score)}%`);
      return;
    }

    setIsSubmitting(true);
    try {
      // Submit for AI evaluation with test results
      const submitResponse = await practiceApi.submitPractice(lessonId, {
        task_id: task.id,
        code: code,
        execution_result: {
          test_score: testResults.score,
          passed_tests: testResults.passed_tests,
          total_tests: testResults.total_tests,
          verdict: testResults.verdict,
        },
      });

      // Update attempts
      const newAttempts = currentAttempts + 1;
      setAttempts(prev => ({ ...prev, [task.id]: newAttempts }));
      localStorage.setItem(`task-${task.id}-attempts`, newAttempts.toString());

      // Mark as submitted if max attempts reached or score is good
      const practiceScore = submitResponse?.data?.practice_score ?? 0;
      if (newAttempts >= MAX_ATTEMPTS || practiceScore >= 80) {
        setSubmitted(prev => ({ ...prev, [task.id]: true }));
      }

      alert(
        `Решение отправлено!\n` +
        `Попытка: ${newAttempts}/${MAX_ATTEMPTS}\n` +
        `Тесты: ${testResults.passed_tests}/${testResults.total_tests}\n` +
        `Итоговая оценка: ${Math.round(practiceScore)}%`
      );
    } catch (error) {
      console.error("Failed to submit practice:", error);
      alert(`Не удалось отправить решение: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // For students, select up to 10 random tasks
  const displayTasks = useMemo(() => {
    if (isTeacher) {
      return tasks;
    } else {
      if (tasks.length <= 10) {
        return tasks;
      }
      // Use lesson ID as seed for consistent randomization
      const shuffled = [...tasks].sort((a, b) => {
        const hashA = (a.id * 31 + lessonId) % 1000;
        const hashB = (b.id * 31 + lessonId) % 1000;
        return hashA - hashB;
      });
      return shuffled.slice(0, 10);
    }
  }, [tasks, isTeacher, lessonId]);

  // Teacher view
  if (isTeacher) {
    if (tasks.length === 0) {
      return (
        <div className="bg-white border-0 p-12 text-center">
          <p className="text-gray-600">Задачи для этого урока пока не созданы</p>
        </div>
      );
    }

    return (
      <div className="bg-white border-0 p-0">
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-4">
            Всего задач: {tasks.length}
          </p>
        </div>
        <div className="space-y-4">
          {tasks.map((task, index) => (
            <div key={task.id || index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-base font-semibold text-gray-900">
                  {task.title || `Задание ${index + 1}`}
                </h4>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  ID: {task.id}
                </span>
              </div>
              <div className="text-sm text-gray-700 whitespace-pre-wrap mb-2">
                {task.body || task.description || "Описание отсутствует"}
              </div>
              <div className="flex gap-2 mt-3">
                {task.language && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    Язык: {task.language}
                  </span>
                )}
                {task.deadline_at && (
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                    Дедлайн: {new Date(task.deadline_at).toLocaleDateString('ru-RU')}
                  </span>
                )}
                {task.is_expired && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                    Просрочено
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Student view
  const currentTask = displayTasks[currentTaskIndex];
  if (!currentTask) {
    return (
      <div className="bg-white border-0 p-12 text-center">
        <p className="text-gray-600">Задачи для этого урока пока не созданы</p>
      </div>
    );
  }

  const currentAttempts = attempts[currentTask.id] || 0;
  const canSubmit = testResults && testResults.score >= MIN_SCORE_TO_SUBMIT && currentAttempts < MAX_ATTEMPTS;
  const isFullySubmitted = submitted[currentTask.id] || currentAttempts >= MAX_ATTEMPTS;

  return (
    <div className="bg-white border-0 p-0">
      {/* Task header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">
            Задание {currentTaskIndex + 1} из {displayTasks.length}
            {tasks.length > 10 && (
              <span className="text-gray-500 ml-1">(из {tasks.length} доступных)</span>
            )}
          </span>
          {/* Attempts counter */}
          <div className="flex items-center gap-2">
            <span className={`text-sm px-2 py-1 rounded ${
              currentAttempts >= MAX_ATTEMPTS
                ? 'bg-red-100 text-red-700'
                : 'bg-blue-100 text-blue-700'
            }`}>
              Попытки: {currentAttempts}/{MAX_ATTEMPTS}
            </span>
          </div>
        </div>

        {/* Task navigation buttons */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {displayTasks.map((task, index) => (
            <button
              key={index}
              onClick={() => setCurrentTaskIndex(index)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                index === currentTaskIndex
                  ? "bg-blue-600 text-white"
                  : submitted[task.id] || (attempts[task.id] || 0) >= MAX_ATTEMPTS
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2">{currentTask.title}</h3>
        <p className="text-sm text-gray-700 mb-4 whitespace-pre-wrap">{currentTask.body}</p>
      </div>

      {/* Code editor */}
      <div className="border border-gray-300 rounded-lg overflow-hidden mb-4">
        <div className="bg-gray-800 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-white text-sm ml-2">main.py</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Run button */}
            <button
              onClick={handleRun}
              disabled={isRunning || isTestsRunning || !code.trim()}
              className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
              {isRunning ? "..." : "Запустить"}
            </button>
            {/* Run Tests button */}
            <button
              onClick={handleRunTests}
              disabled={isRunning || isTestsRunning || !code.trim()}
              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {isTestsRunning ? "Проверка..." : "Проверить тесты"}
            </button>
          </div>
        </div>
        <Editor
          height="400px"
          defaultLanguage="python"
          value={code}
          onChange={(value) => setCode(value || "")}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
          }}
        />
      </div>

      {/* Simple output (for Run button) */}
      {(output.stdout || output.stderr) && !testResults && (
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg mb-4 font-mono text-sm">
          {output.stdout && <div className="whitespace-pre-wrap">{output.stdout}</div>}
          {output.stderr && (
            <div className="text-red-400 whitespace-pre-wrap">{output.stderr}</div>
          )}
          {output.exit_code !== 0 && (
            <div className="text-red-400 mt-2">Exit code: {output.exit_code}</div>
          )}
        </div>
      )}

      {/* Test Results Panel */}
      {(testResults || isTestsRunning) && (
        <div className="mb-4">
          <TestResultsPanel results={testResults} isRunning={isTestsRunning} />
        </div>
      )}

      {/* Submit section */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {isFullySubmitted ? (
            <span className="text-green-600 font-medium">Задание завершено</span>
          ) : testResults ? (
            testResults.score >= MIN_SCORE_TO_SUBMIT ? (
              <span className="text-green-600">Можно отправить решение</span>
            ) : (
              <span className="text-orange-600">
                Необходимо набрать минимум {MIN_SCORE_TO_SUBMIT}% (сейчас {Math.round(testResults.score)}%)
              </span>
            )
          ) : (
            <span className="text-gray-500">Запустите тесты для проверки решения</span>
          )}
        </div>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting || isFullySubmitted}
          className={`px-6 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            isFullySubmitted
              ? "bg-green-100 text-green-700 cursor-not-allowed"
              : canSubmit
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
          }`}
        >
          {isSubmitting ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Отправка...
            </>
          ) : isFullySubmitted ? (
            "Отправлено"
          ) : (
            "Отправить решение"
          )}
        </button>
      </div>
    </div>
  );
};

export default Practice;
