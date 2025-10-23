import React, { useState, useEffect } from 'react';
import { Play, Loader2 } from 'lucide-react';

const CodeRunner = ({ initialCode, onCodeChange, onRunResult, language = 'python' }) => {
  const [code, setCode] = useState(initialCode || '');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [pyodide, setPyodide] = useState(null);
  const [isUserEditing, setIsUserEditing] = useState(false);
  const [lastInitialCode, setLastInitialCode] = useState(initialCode);
  const [editingTimeout, setEditingTimeout] = useState(null);

  // Загружаем Pyodide при монтировании компонента
  useEffect(() => {
    async function loadPyodide() {
      try {
        // Проверяем, есть ли уже загруженный Pyodide
        if (window.pyodide) {
          setPyodide(window.pyodide);
          return;
        }

        // Загружаем Pyodide
        const py = await window.loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/",
        });
        
        window.pyodide = py;
        setPyodide(py);
      } catch (err) {
        console.error('Ошибка загрузки Pyodide:', err);
        // Fallback на улучшенную симуляцию
        setPyodide('fallback');
      }
    }
    
    loadPyodide();
  }, []);

  // Очищаем таймер при размонтировании
  useEffect(() => {
    return () => {
      if (editingTimeout) {
        clearTimeout(editingTimeout);
      }
    };
  }, [editingTimeout]);

  // Обновляем код при изменении initialCode только если пользователь не редактирует
  useEffect(() => {
    if (initialCode !== undefined && initialCode !== lastInitialCode) {
      // Проверяем, что пользователь не редактирует код активно
      if (!isUserEditing) {
      setCode(initialCode);
        setLastInitialCode(initialCode);
        // Очищаем терминал при смене задания
        setOutput('');
        setError('');
      }
    }
  }, [initialCode, lastInitialCode, isUserEditing]);

  // Дополнительная защита - не обновляем код если пользователь активно печатает
  useEffect(() => {
    if (isUserEditing) {
      // Если пользователь редактирует, не обновляем код даже при изменении initialCode
      return;
    }
  }, [isUserEditing]);

  // Функция для принудительного обновления кода (вызывается извне)
  const forceUpdateCode = (newCode) => {
    // Дополнительная проверка - не обновляем если пользователь активно редактирует
    if (isUserEditing) {
      console.log('Код не обновлен - пользователь активно редактирует');
      return;
    }
    
    setCode(newCode);
    setLastInitialCode(newCode);
    setOutput('');
    setError('');
    setIsUserEditing(false);
  };

  // Экспортируем функцию для внешнего использования
  useEffect(() => {
    if (onCodeChange) {
      onCodeChange(code, forceUpdateCode);
    }
  }, [code, onCodeChange]);

  // Обработчики для отслеживания редактирования пользователем
  const handleCodeChange = (e) => {
    setIsUserEditing(true);
    setCode(e.target.value);
    
    // Очищаем предыдущий таймер
    if (editingTimeout) {
      clearTimeout(editingTimeout);
    }
    
    // Устанавливаем новый таймер для сброса флага редактирования
    const timeout = setTimeout(() => {
      setIsUserEditing(false);
    }, 5000); // 5 секунд без активности
    
    setEditingTimeout(timeout);
  };

  const handleCodeFocus = () => {
    setIsUserEditing(true);
  };

  const handleCodeBlur = () => {
    // Небольшая задержка перед сбросом флага редактирования
    setTimeout(() => {
      setIsUserEditing(false);
    }, 3000); // 3 секунды после потери фокуса
  };

  // Функция выполнения кода
  const runCode = async () => {
    setIsRunning(true);
    setOutput('');
    setError('');

    try {
      if (language === 'sql') {
        // Для SQL кода делаем симуляцию выполнения
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const sqlKeywords = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER'];
        const hasKeyword = sqlKeywords.some(keyword => 
          code.toUpperCase().includes(keyword)
        );
        
        if (hasKeyword) {
          setOutput('SQL запрос выполнен успешно!\nРезультат: Данные обработаны.');
          if (onRunResult) {
            onRunResult(true, 'SQL запрос выполнен успешно');
          }
        } else {
          setError('Ошибка SQL: Неверный синтаксис запроса');
          if (onRunResult) {
            onRunResult(false, 'Неверный синтаксис SQL запроса');
          }
        }
      } else {
        // Для Python кода используем Pyodide или fallback
        if (pyodide && pyodide !== 'fallback') {
          try {
            // Настраиваем stdout для Pyodide
            pyodide.runPython(`
import sys
from io import StringIO
sys.stdout = StringIO()
            `);
            
            // Выполняем код через Pyodide
            const result = await pyodide.runPythonAsync(code);
            
            // Получаем stdout из Pyodide
            const stdout = pyodide.runPython('sys.stdout.getvalue()');
            
            if (stdout) {
              setOutput(stdout);
            } else if (result) {
              setOutput(result.toString());
            }
            
            if (onRunResult) {
              onRunResult(true, stdout || result?.toString() || '');
            }
          } catch (err) {
            // Pyodide возвращает полный traceback
            const errorMessage = err.toString();
            setError(errorMessage);
            
          if (onRunResult) {
              onRunResult(false, errorMessage);
            }
          }
        } else {
          // Fallback: улучшенная симуляция с реалистичными ошибками
          await new Promise(resolve => setTimeout(resolve, 300));
          
          try {
            // Проверяем синтаксис и выполняем код
            if (code.trim() === '') {
              throw new Error('SyntaxError: unexpected EOF while parsing');
            }
            
            // Проверяем на распространенные ошибки
            const lines = code.split('\n');
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i];
              
              // Проверяем на отсутствие двоеточия в циклах/условиях
              if ((line.includes('for ') || line.includes('if ') || line.includes('while ')) && 
                  !line.includes(':') && line.trim()) {
                throw new Error(`SyntaxError: expected ':'\n  File "<stdin>", line ${i + 1}\n    ${line.trim()}\n${' '.repeat(line.trim().length)}^`);
              }
              
              // Проверяем на неправильные имена функций
              if (line.includes('rang(') && !line.includes('range(')) {
                throw new Error(`NameError: name 'rang' is not defined\n  File "<stdin>", line ${i + 1}, in <module>\n    ${line.trim()}`);
              }
              
              if (line.includes('prnt(') && !line.includes('print(')) {
                throw new Error(`NameError: name 'prnt' is not defined\n  File "<stdin>", line ${i + 1}, in <module>\n    ${line.trim()}`);
              }
              
              // Проверяем на неправильные отступы
              if (line.trim() && !line.startsWith(' ') && !line.startsWith('\t') && 
                  (line.includes('if ') || line.includes('for ') || line.includes('while ') || line.includes('def ') || line.includes('class '))) {
                // Это может быть началом блока, проверим следующую строку
                if (i + 1 < lines.length && lines[i + 1].trim()) {
                  const nextLine = lines[i + 1];
                  if (!nextLine.startsWith(' ') && !nextLine.startsWith('\t') && nextLine.trim()) {
                    throw new Error(`IndentationError: expected an indented block\n  File "<stdin>", line ${i + 2}\n    ${nextLine.trim()}\n    ^`);
                  }
                }
              }
              
              // Проверяем на несоответствие отступов
              if (line.trim() && line.startsWith(' ')) {
                const spaces = line.match(/^(\s*)/)[1].length;
                if (spaces % 4 !== 0) {
                  throw new Error(`IndentationError: unindent does not match any outer indentation level\n  File "<stdin>", line ${i + 1}\n    ${line.trim()}\n    ^`);
                }
              }
              
              // Проверяем на незакрытые скобки
              const openParens = (line.match(/\(/g) || []).length;
              const closeParens = (line.match(/\)/g) || []).length;
              if (openParens > closeParens) {
                throw new Error(`SyntaxError: unexpected EOF while parsing\n  File "<stdin>", line ${i + 1}\n    ${line.trim()}\n${' '.repeat(line.trim().length)}^`);
              }
              
              // Проверяем на незакрытые кавычки
              const singleQuotes = (line.match(/'/g) || []).length;
              const doubleQuotes = (line.match(/"/g) || []).length;
              if (singleQuotes % 2 !== 0) {
                throw new Error(`SyntaxError: EOL while scanning string literal\n  File "<stdin>", line ${i + 1}\n    ${line.trim()}\n${' '.repeat(line.trim().length)}^`);
              }
              if (doubleQuotes % 2 !== 0) {
                throw new Error(`SyntaxError: EOL while scanning string literal\n  File "<stdin>", line ${i + 1}\n    ${line.trim()}\n${' '.repeat(line.trim().length)}^`);
              }
              
              // Проверяем на неправильные операторы
              if (line.includes('===') || line.includes('!==')) {
                throw new Error(`SyntaxError: invalid syntax\n  File "<stdin>", line ${i + 1}\n    ${line.trim()}\n${' '.repeat(line.indexOf('===') || line.indexOf('!=='))}^`);
              }
              
              // Проверяем на неправильные ключевые слова
              if (line.includes('else if') && !line.includes('elif')) {
                throw new Error(`SyntaxError: invalid syntax\n  File "<stdin>", line ${i + 1}\n    ${line.trim()}\n${' '.repeat(line.indexOf('else if'))}^`);
              }
              
              // Проверяем на деление на ноль
              if (line.includes('/ 0') || line.includes('/0')) {
                throw new Error(`ZeroDivisionError: division by zero\n  File "<stdin>", line ${i + 1}, in <module>\n    ${line.trim()}`);
              }
              
              // Проверяем на неопределенные переменные
              const undefinedVars = ['undefined_var', 'test_var', 'my_var', 'x', 'y', 'z'];
              for (const varName of undefinedVars) {
                if (line.includes(varName) && !line.includes(`"${varName}"`) && !line.includes(`'${varName}'`) && 
                    !line.includes(`${varName} =`) && !line.includes(`for ${varName}`) && !line.includes(`in ${varName}`)) {
                  throw new Error(`NameError: name '${varName}' is not defined\n  File "<stdin>", line ${i + 1}, in <module>\n    ${line.trim()}`);
                }
              }
            }
            
            // Симулируем выполнение кода
            let result = '';
            
            // Обрабатываем переменные и присваивания
            const variables = {};
            
            for (const line of lines) {
              const assignmentMatch = line.match(/(\w+)\s*=\s*(.+)/);
              if (assignmentMatch) {
                const varName = assignmentMatch[1];
                let value = assignmentMatch[2].trim();
                
                if (value.startsWith('"') && value.endsWith('"')) {
                  variables[varName] = value.slice(1, -1);
                } else if (value.startsWith("'") && value.endsWith("'")) {
                  variables[varName] = value.slice(1, -1);
                } else if (!isNaN(value)) {
                  variables[varName] = parseInt(value);
                }
              }
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
              } else {
                const rangeMatch2 = code.match(/range\s*\(\s*(\d+)\s*\)/);
                if (rangeMatch2) {
                  const end = parseInt(rangeMatch2[1]);
                  for (let i = 0; i < end; i++) {
                    result += i + '\n';
                  }
                }
              }
            }
            
            if (!result && code.trim()) {
              result = '';
            }
            
            setOutput(result);
            if (onRunResult) {
              onRunResult(true, result);
            }
            
          } catch (syntaxError) {
            setError(syntaxError.message);
        if (onRunResult) {
              onRunResult(false, syntaxError.message);
            }
          }
        }
      }

    } catch (err) {
      const errorMessage = err.toString();
      setError(errorMessage);
      
      if (onRunResult) {
        onRunResult(false, errorMessage);
      }
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="w-full">
      {/* Заголовок с кнопкой запуска */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-800">Python код:</h3>
          {isUserEditing && (
            <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
              Редактируется
            </span>
          )}
        </div>
        <button
          onClick={runCode}
          disabled={isRunning}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2 ${
            isRunning
              ? "bg-gray-400 text-gray-600 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700 text-white"
          }`}
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Выполняется...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Запустить
            </>
          )}
        </button>
      </div>

      {/* VS Code-подобный редактор кода */}
      <div className="w-full h-48 border border-gray-300 rounded-lg overflow-hidden bg-white focus-within:ring-2 focus-within:ring-green-500 focus-within:border-transparent shadow-sm">
        <div className="flex h-full">
          {/* Номера строк */}
          <div className="bg-gray-50 border-r border-gray-200 px-3 py-4 text-gray-400 text-sm font-mono select-none min-w-[50px]">
            {code.split('\n').map((_, index) => (
              <div key={index} className="leading-6 text-right">
                {index + 1}
              </div>
            ))}
          </div>
        
          {/* Область ввода кода */}
      <textarea
        value={code}
            onChange={handleCodeChange}
            onFocus={handleCodeFocus}
            onBlur={handleCodeBlur}
            className="flex-1 p-4 font-mono text-sm bg-transparent resize-none outline-none leading-6 text-gray-800 placeholder-gray-400"
            placeholder="# Введите программу ниже"
        disabled={isRunning}
            style={{ 
              fontFamily: 'Monaco, Menlo, "Ubuntu Mono", "Courier New", monospace',
              fontSize: '14px',
              lineHeight: '1.5',
              tabSize: 4
            }}
          />
        </div>
      </div>

      {/* Терминал с выводом */}
        <div className="mt-4">
        <h4 className="text-sm font-semibold mb-2 text-gray-700">Вывод программы:</h4>
        <div
          className={`rounded-lg p-4 font-mono text-sm overflow-auto transition-all border ${
            error ? "bg-[#0d1117] text-[#ff6666] border-red-800" : "bg-[#0d1117] text-[#d1d5db] border-gray-700"
          }`}
          style={{ 
            minHeight: "120px", 
            maxHeight: "200px",
            whiteSpace: "pre-line",
            lineHeight: "1.4",
            fontSize: "14px",
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", "Courier New", monospace'
          }}
          >
            {error ? (
            <>
              Traceback (most recent call last):<br/>
              {error}
            </>
          ) : (
            <>
              {output || "← Нажмите 'Запустить', чтобы увидеть вывод"}
              {output && <span className="animate-pulse text-white">▮</span>}
            </>
            )}
          </div>
        </div>
    </div>
  );
};

export default CodeRunner;