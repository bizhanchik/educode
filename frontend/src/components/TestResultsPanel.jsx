import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  Lock,
  Clock,
  ChevronDown,
  ChevronUp,
  Cpu,
  AlertTriangle,
  Trophy,
  Loader2
} from 'lucide-react';

/**
 * LeetCode-style test results panel
 * Shows test case results with expandable details for public tests
 * Hidden tests only show pass/fail status
 */
const TestResultsPanel = ({ results, isRunning }) => {
  const [expandedTests, setExpandedTests] = useState({});

  if (isRunning) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-center gap-3 text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Выполнение тестов...</span>
        </div>
      </div>
    );
  }

  if (!results) {
    return null;
  }

  const {
    total_tests,
    passed_tests,
    failed_tests,
    score,
    verdict,
    results: testResults,
    execution_time_total_ms
  } = results;

  const toggleExpand = (testId) => {
    setExpandedTests((prev) => ({
      ...prev,
      [testId]: !prev[testId]
    }));
  };

  const getVerdictColor = (verdict) => {
    switch (verdict) {
      case 'Accepted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Wrong Answer':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Runtime Error':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Compilation Error':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getVerdictIcon = (verdict) => {
    switch (verdict) {
      case 'Accepted':
        return <Trophy className="w-5 h-5" />;
      case 'Wrong Answer':
        return <XCircle className="w-5 h-5" />;
      case 'Runtime Error':
      case 'Compilation Error':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <AlertTriangle className="w-5 h-5" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header with verdict */}
      <div className={`px-6 py-4 border-b ${getVerdictColor(verdict)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getVerdictIcon(verdict)}
            <div>
              <h3 className="text-lg font-semibold">{verdict}</h3>
              <p className="text-sm opacity-75">
                Пройдено {passed_tests} из {total_tests} тестов
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{Math.round(score)}%</div>
            <div className="text-xs opacity-75 flex items-center justify-end gap-1">
              <Clock className="w-3 h-3" />
              {execution_time_total_ms.toFixed(0)} мс
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
        <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-gray-200">
          {testResults.map((test, idx) => (
            <div
              key={test.test_id}
              className={`flex-1 transition-colors ${
                test.passed ? 'bg-green-500' : 'bg-red-500'
              }`}
              title={test.test_name}
            />
          ))}
        </div>
      </div>

      {/* Test results list */}
      <div className="divide-y divide-gray-100">
        {testResults.map((test, index) => (
          <TestResultItem
            key={test.test_id}
            test={test}
            index={index}
            isExpanded={expandedTests[test.test_id]}
            onToggle={() => toggleExpand(test.test_id)}
          />
        ))}
      </div>

      {/* Summary footer */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-sm text-gray-600">
        <span>
          {passed_tests === total_tests
            ? 'Все тесты пройдены!'
            : `Не пройдено: ${failed_tests} тест(ов)`}
        </span>
        <span className="flex items-center gap-1">
          <Cpu className="w-4 h-4" />
          Общее время: {execution_time_total_ms.toFixed(0)} мс
        </span>
      </div>
    </div>
  );
};

const TestResultItem = ({ test, index, isExpanded, onToggle }) => {
  const {
    test_name,
    passed,
    is_public,
    input,
    expected_output,
    actual_output,
    execution_time_ms,
    memory_kb,
    error
  } = test;

  return (
    <div className="px-6">
      <button
        onClick={is_public ? onToggle : undefined}
        className={`w-full py-3 flex items-center justify-between text-left ${
          is_public ? 'cursor-pointer hover:bg-gray-50' : 'cursor-default'
        }`}
        disabled={!is_public}
      >
        <div className="flex items-center gap-3">
          {passed ? (
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          )}
          <div className="flex items-center gap-2">
            {!is_public && (
              <Lock className="w-4 h-4 text-gray-400" />
            )}
            <span className={`font-medium ${passed ? 'text-gray-900' : 'text-red-900'}`}>
              {test_name}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          {execution_time_ms !== null && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {execution_time_ms.toFixed(0)} мс
            </span>
          )}
          {memory_kb && (
            <span className="flex items-center gap-1">
              <Cpu className="w-3 h-3" />
              {(memory_kb / 1024).toFixed(1)} МБ
            </span>
          )}
          {is_public && (
            isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )
          )}
        </div>
      </button>

      {/* Expanded details for public tests */}
      <AnimatePresence>
        {is_public && isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pb-4 space-y-3">
              {/* Input */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Входные данные
                </label>
                <pre className="mt-1 p-3 bg-gray-900 text-gray-100 rounded-lg text-sm font-mono overflow-x-auto">
                  {input || '(пусто)'}
                </pre>
              </div>

              {/* Expected output */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Ожидаемый результат
                </label>
                <pre className="mt-1 p-3 bg-gray-900 text-green-400 rounded-lg text-sm font-mono overflow-x-auto">
                  {expected_output || '(пусто)'}
                </pre>
              </div>

              {/* Actual output */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Ваш результат
                </label>
                <pre
                  className={`mt-1 p-3 bg-gray-900 rounded-lg text-sm font-mono overflow-x-auto ${
                    passed ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {actual_output || '(пусто)'}
                </pre>
              </div>

              {/* Error message if any */}
              {error && (
                <div>
                  <label className="text-xs font-medium text-red-500 uppercase tracking-wide">
                    Ошибка
                  </label>
                  <pre className="mt-1 p-3 bg-red-900/20 text-red-400 rounded-lg text-sm font-mono overflow-x-auto border border-red-900/30">
                    {error}
                  </pre>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden test hint */}
      {!is_public && !passed && error && (
        <div className="pb-3 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
};

export default TestResultsPanel;
