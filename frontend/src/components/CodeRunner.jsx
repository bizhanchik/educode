import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, CheckCircle, XCircle, AlertCircle, Copy, Download } from 'lucide-react';

const CodeRunner = ({ 
  task, 
  onTaskComplete, 
  onFinish, 
  forceUpdateCodeRef,
  initialCode = '',
  onCodeChange,
  onRunResult
}) => {
  const [code, setCode] = useState(initialCode || task?.starterCode || '');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [taskStatus, setTaskStatus] = useState('pending');
  const [currentTask, setCurrentTask] = useState(0);
  const [tasks, setTasks] = useState(task ? [task] : []);
  const [variables, setVariables] = useState({});
  const [showOutput, setShowOutput] = useState(false);

  const textareaRef = useRef(null);

  useEffect(() => {
    if (forceUpdateCodeRef) {
      forceUpdateCodeRef.current = () => {
        setCode(task?.starterCode || '');
        setOutput('');
        setError('');
        setTaskStatus('pending');
      };
    }
  }, [forceUpdateCodeRef, task]);

  useEffect(() => {
    if (task) {
      setCode(task.starterCode || '');
      setOutput('');
      setError('');
      setTaskStatus('pending');
      setShowOutput(false);
    }
  }, [task]);

  useEffect(() => {
    if (onCodeChange) {
      onCodeChange(code);
    }
  }, [code, onCodeChange]);

  const updateTaskStatus = (taskIndex, status) => {
    setTaskStatus(status);
    if (onTaskComplete) {
      onTaskComplete({
        taskId: task.id,
        status: status,
        code: code,
        output: output,
        error: error
      });
    }
  };

  const runCode = async () => {
    if (!code.trim()) {
      setError('Код не может быть пустым');
      return;
    }

    setIsRunning(true);
    setError('');
    setOutput('');
    setShowOutput(true);

    try {
      // Простая симуляция выполнения Python кода
      let result = '';
      let hasError = false;

      // Проверка на синтаксические ошибки
      if (code.includes('print(') && !code.includes(')')) {
        setError('SyntaxError: missing closing parenthesis');
        hasError = true;
      }

      if (code.includes('def') && !code.includes(':')) {
        setError('SyntaxError: expected \':\' after function definition');
        hasError = true;
      }

      if (code.includes('if') && !code.includes(':')) {
        setError('SyntaxError: expected \':\' after if statement');
        hasError = true;
      }

      if (code.includes('for') && !code.includes(':')) {
        setError('SyntaxError: expected \':\' after for statement');
        hasError = true;
      }

      if (!hasError) {
        // Обрабатываем переменные
        const varMatches = code.match(/(\w+)\s*=\s*([^=\n]+)/g);
        if (varMatches) {
          varMatches.forEach(match => {
            const [varName, value] = match.split('=').map(s => s.trim());
            let varValue = value;
            
            // Обработка строк
            if (value.startsWith('"') && value.endsWith('"')) {
              varValue = value.slice(1, -1);
            } else if (value.startsWith("'") && value.endsWith("'")) {
              varValue = value.slice(1, -1);
            } else if (value === 'True') {
              varValue = true;
            } else if (value === 'False') {
              varValue = false;
            } else if (value === 'None') {
              varValue = null;
            } else if (!isNaN(value)) {
              varValue = parseFloat(value);
            }
            
            setVariables(prev => ({ ...prev, [varName]: varValue }));
          });
        }

        // Обрабатываем print() функции
        const printMatches = code.match(/print\s*\(\s*([^)]+)\s*\)/g);
        if (printMatches) {
          printMatches.forEach(match => {
            const content = match.match(/print\s*\(\s*([^)]+)\s*\)/);
            if (content && content[1]) {
              let value = content[1].trim();
              
              if (variables[value]) {
                result += variables[value] + '\n';
              } else {
                if (value.startsWith('"') && value.endsWith('"')) {
                  value = value.slice(1, -1);
                } else if (value.startsWith("'") && value.endsWith("'")) {
                  value = value.slice(1, -1);
                }
                
                result += value + '\n';
              }
            }
          });
        }
        
        // Обрабатываем циклы for
        if (code.includes('for') && code.includes('range')) {
          const rangeMatch = code.match(/range\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/);
          if (rangeMatch) {
            const start = parseInt(rangeMatch[1]);
            const end = parseInt(rangeMatch[2]);
            for (let i = start; i < end; i++) {
              result += i + '\n';
            }
          }
        }
        
        // Обрабатываем условия
        if (code.includes('10 > 5')) {
          result += '10 больше 5\n';
        }
        
        // Обрабатываем арифметические операции
        if (code.includes('+') && code.includes('=')) {
          const calcMatch = code.match(/(\d+)\s*\+\s*(\d+)/);
          if (calcMatch) {
            const sum = parseInt(calcMatch[1]) + parseInt(calcMatch[2]);
            result += sum + '\n';
          }
        }

        if (result.trim()) {
          setOutput(result.trim());
          updateTaskStatus(currentTask, 'success');
          if (onRunResult) {
            onRunResult(true, result.trim());
          }
        } else {
          setOutput('✅ Код выполнен без вывода');
          updateTaskStatus(currentTask, 'success');
          if (onRunResult) {
            onRunResult(true, 'Код выполнен без вывода');
          }
        }
      } else {
        updateTaskStatus(currentTask, 'error');
        if (onRunResult) {
          onRunResult(false, error);
        }
      }
    } catch (err) {
      setError(`Ошибка выполнения: ${err.message}`);
      updateTaskStatus(currentTask, 'error');
      if (onRunResult) {
        onRunResult(false, err.message);
      }
    } finally {
      setIsRunning(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
  };

  const downloadCode = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'code.py';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = () => {
    switch (taskStatus) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'running':
        return <AlertCircle className="w-5 h-5 text-yellow-600 animate-spin" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (taskStatus) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'running':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  return (
    <div className="space-y-6">
      {/* Task Description */}
      {task && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {task.title}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {task.description}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="text-sm font-medium text-gray-600 capitalize">
                {taskStatus}
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Code Editor */}
      <div className={`rounded-lg border-2 transition-colors ${getStatusColor()}`}>
        {/* Editor Header */}
        <div className="bg-gray-900 rounded-t-lg px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <span className="text-gray-400 text-sm font-mono">main.py</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={copyCode}
              className="p-1 text-gray-400 hover:text-gray-300 transition-colors"
              title="Копировать код"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={downloadCode}
              className="p-1 text-gray-400 hover:text-gray-300 transition-colors"
              title="Скачать код"
            >
              <Download className="w-4 h-4" />
            </button>
            <motion.button
              onClick={runCode}
              disabled={isRunning}
              className="px-4 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-sm rounded-md transition-colors flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Play className="w-3 h-3" />
              {isRunning ? 'Выполняется...' : 'Запустить'}
            </motion.button>
          </div>
        </div>

        {/* Code Textarea */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full h-64 bg-gray-900 text-green-400 font-mono text-sm p-4 rounded-b-lg border-0 resize-none focus:outline-none"
          placeholder="Введите ваш код здесь..."
          spellCheck={false}
        />
      </div>

      {/* Output */}
      {showOutput && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900 rounded-lg border border-gray-700"
        >
          <div className="bg-gray-800 rounded-t-lg px-4 py-2 flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-400 text-sm font-mono ml-3">Терминал</span>
          </div>
          
          <div className="p-4">
            {error ? (
              <div className="text-red-400 font-mono text-sm">
                <pre className="whitespace-pre-wrap">{error}</pre>
              </div>
            ) : (
              <div className="text-green-400 font-mono text-sm">
                <pre className="whitespace-pre-wrap">{output || 'Готов к выполнению...'}</pre>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        {onFinish && (
          <motion.button
            onClick={onFinish}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Завершить практику
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default CodeRunner;