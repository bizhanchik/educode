import React from 'react';

/**
 * TheoryFormatter - Professional theory renderer (Metanit.com style)
 * 
 * CLEAN, READABLE THEORY RENDERING:
 * 1. Text → readable paragraphs
 * 2. Code → dark code blocks with syntax highlighting
 * 3. No HTML artifacts, no tokenizer output
 * 4. Smart code detection - only real code, not text with brackets
 */
const TheoryFormatter = ({ text, lessonTitle }) => {
  if (!text || !text.trim()) {
    return <p className="text-gray-500">Теоретический материал не добавлен</p>;
  }

  // Remove ALL HTML artifacts - ULTRA AGGRESSIVE
  const removeAllArtifacts = (str) => {
    if (!str || typeof str !== 'string') return '';
    
    let clean = str;
    
    // Remove ALL HTML tags
    clean = clean.replace(/<[^>]+>/g, '');
    
    // Remove ALL patterns with quotes and > (the main problem) - ULTRA AGGRESSIVE
    clean = clean.replace(/code-keyword\s*=\s*['"]code-keyword['"]/g, '');
    clean = clean.replace(/code-keyword\s*=\s*code-keyword/g, '');
    clean = clean.replace(/"code-keyword">/g, '');
    clean = clean.replace(/'code-keyword'>/g, '');
    clean = clean.replace(/code-keyword">/g, '');
    clean = clean.replace(/="code-keyword">/g, '');
    clean = clean.replace(/='code-keyword'>/g, '');
    clean = clean.replace(/=code-keyword">/g, '');
    // Remove ALL variations of code-keyword patterns
    clean = clean.replace(/["']code-keyword["']\s*>/g, '');
    clean = clean.replace(/code-keyword\s*>/g, '');
    clean = clean.replace(/>code-keyword</g, '><');
    clean = clean.replace(/code-keyword/g, ''); // Remove any remaining code-keyword
    
    // Remove all code-* patterns
    clean = clean.replace(/code-[\w-]+\s*=\s*['"]code-[\w-]+['"]/g, '');
    clean = clean.replace(/code-[\w-]+\s*=\s*code-[\w-]+/g, '');
    clean = clean.replace(/"code-[\w-]+">/g, '');
    clean = clean.replace(/'code-[\w-]+'>/g, '');
    clean = clean.replace(/code-[\w-]+">/g, '');
    clean = clean.replace(/="code-[\w-]+">/g, '');
    clean = clean.replace(/='code-[\w-]+'>/g, '');
    clean = clean.replace(/=code-[\w-]+">/g, '');
    
    // Remove line-* patterns
    clean = clean.replace(/"line-[\w-]+">/g, '');
    clean = clean.replace(/'line-[\w-]+'>/g, '');
    clean = clean.replace(/line-[\w-]+">/g, '');
    
    // Remove theory-* patterns
    clean = clean.replace(/"theory-[\w-]+">/g, '');
    clean = clean.replace(/'theory-[\w-]+'>/g, '');
    clean = clean.replace(/theory-[\w-]+">/g, '');
    
    // Remove any remaining attribute patterns
    clean = clean.replace(/[\w-]+\s*=\s*['"][\w-]+['"]/g, '');
    clean = clean.replace(/[\w-]+\s*=\s*[\w-]+/g, '');
    clean = clean.replace(/="[\w-]+">/g, '');
    clean = clean.replace(/='[\w-]+'>/g, '');
    clean = clean.replace(/"[\w-]+">/g, '');
    clean = clean.replace(/'[\w-]+'>/g, '');
    clean = clean.replace(/[\w-]+">/g, '');
    
    // Remove broken patterns
    clean = clean.replace(/=\s*def/g, 'def');
    clean = clean.replace(/class\s*==/g, 'class');
    clean = clean.replace(/class\s*=/g, 'class');
    clean = clean.replace(/^\s*=\s*/gm, '');
    clean = clean.replace(/\s*=\s*$/gm, '');
    clean = clean.replace(/\s*=\s*/g, ' ');
    
    // Remove orphaned brackets
    clean = clean.replace(/^\s*\(\)\s*$/gm, '');
    clean = clean.replace(/\(\)\s*\(\)/g, '()');
    
    // Remove orphaned > and <
    clean = clean.replace(/^\s*>\s*/gm, '');
    clean = clean.replace(/\s*>\s*$/gm, '');
    clean = clean.replace(/\s*>\s+/g, ' ');
    clean = clean.replace(/^\s*<\s*/gm, '');
    clean = clean.replace(/\s*<\s*$/gm, '');
    clean = clean.replace(/\s*<\s+/g, ' ');
    
    // Decode HTML entities
    clean = clean.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    clean = clean.replace(/&quot;/g, '"').replace(/&#039;/g, "'");
    clean = clean.replace(/&nbsp;/g, ' ');
    
    // Normalize whitespace (preserve line breaks)
    clean = clean.replace(/[ \t]+/g, ' ');
    clean = clean.replace(/\n{3,}/g, '\n\n');
    
    return clean.trim();
  };

  // Remove line numbers from the beginning of lines
  const removeLineNumbers = (line) => {
    if (!line || typeof line !== 'string') return line;
    
    const trimmed = line.trim();
    
    // If line is just a number, return empty string
    if (/^\s*\d+\s*$/.test(trimmed)) {
      return '';
    }
    
    // Pattern: line starts with optional whitespace, then a number, then whitespace
    let cleaned = line.replace(/^\s*\d+\s+/g, '');
    
    return cleaned;
  };

  // Check if line is REAL code (not text with brackets) - STRICT DETECTION
  const isCodeLine = (line, trimmed) => {
    if (!line || !trimmed) return false;
    
    // Remove line numbers first for detection
    const lineWithoutNumbers = removeLineNumbers(trimmed);
    if (!lineWithoutNumbers.trim()) return false;
    
    const cleanLine = lineWithoutNumbers.trim();
    
    // EXCLUDE: If line contains too many Russian/Cyrillic characters, it's text, not code
    const cyrillicCount = (cleanLine.match(/[а-яёА-ЯЁ]/g) || []).length;
    const totalChars = cleanLine.length;
    const cyrillicRatio = totalChars > 0 ? cyrillicCount / totalChars : 0;
    
    // If more than 20% Cyrillic characters, it's text, not code (более строгая проверка)
    if (cyrillicRatio > 0.2) {
      return false;
    }
    
    // EXCLUDE: If line is mostly text with punctuation (sentence-like)
    // Check for common sentence patterns
    if (/^[А-ЯЁ]/.test(cleanLine) && /[\.!?]\s*$/.test(cleanLine)) {
      // Starts with capital Cyrillic and ends with punctuation - likely text
      if (cyrillicCount > 3) {
        return false;
      }
    }
    
    // EXCLUDE: If line looks like a sentence (has spaces and Cyrillic words)
    const words = cleanLine.split(/\s+/);
    const cyrillicWords = words.filter(w => /[а-яёА-ЯЁ]/.test(w)).length;
    if (words.length > 2 && cyrillicWords > words.length * 0.3) {
      return false;
    }
    
    // STRICT CODE DETECTION: Must have multiple code indicators
    
    // 1. Python keywords at start of line (strong indicator)
    const hasCodeKeyword = /^\s*(def|class|if|elif|else|for|while|import|from|return|print|try|except|with|async|await|pass|lambda|yield|break|continue|raise|assert|del|global|nonlocal)\s/.test(lineWithoutNumbers);
    
    // 2. Python special methods
    const hasSpecialMethod = /^\s*__\w+__\s*\(/.test(lineWithoutNumbers);
    
    // 3. Indentation (Python uses indentation) - 2+ spaces is enough
    const hasIndentation = /^\s{2,}/.test(line) && lineWithoutNumbers.length > 0;
    
    // 4. Assignment with proper syntax (variable = value, not text)
    const hasAssignment = /^\s*[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*[^=]/.test(lineWithoutNumbers) && 
                          !/[а-яёА-ЯЁ]/.test(lineWithoutNumbers.split('=')[0] || '');
    
    // 5. Comments (always code)
    const hasComment = /^\s*#/.test(lineWithoutNumbers);
    
    // 6. Code structure with proper syntax (brackets, colons)
    const hasCodeStructure = /[():\[\]{}]/.test(lineWithoutNumbers);
    
    // 7. Method calls (object.method())
    const hasMethodCall = /[a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*\s*\(/.test(lineWithoutNumbers);
    
    // 8. String literals (quotes)
    const hasStringLiteral = /["']/.test(lineWithoutNumbers);
    
    // CODE DETECTION RULES (more flexible):
    // 1. Has keyword (even without structure - keywords are strong indicators)
    // 2. Has indentation (2+ spaces) AND (structure OR assignment OR method call)
    // 3. Has assignment AND no Cyrillic in variable name (even without structure)
    // 4. Is a comment
    // 5. Has special method (__str__, __init__, etc.)
    // 6. Has method call AND no Cyrillic
    // 7. Has structure (brackets/colons) AND low Cyrillic ratio
    
    // Also check for method calls with comments (e.g., "tom.display_info() # Name: Tom Age: 23")
    const hasMethodCallWithComment = /[a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*\s*\([^)]*\)\s*#/.test(lineWithoutNumbers) && 
                                     !/[а-яёА-ЯЁ]/.test(lineWithoutNumbers.split('#')[0] || '');
    // Simple function calls (e.g., "print(tom)")
    const hasSimpleFunctionCall = /^[a-zA-Z_][a-zA-Z0-9_]*\s*\([^)]*\)/.test(lineWithoutNumbers) && 
                                  !/[а-яёА-ЯЁ]/.test(lineWithoutNumbers.split('(')[0] || '');
    
    const isCode = 
      hasCodeKeyword ||  // Keywords are strong indicators, even alone
      (hasIndentation && (hasCodeStructure || hasAssignment || hasMethodCall || hasStringLiteral)) ||
      (hasAssignment && !/[а-яёА-ЯЁ]/.test(lineWithoutNumbers.split('=')[0] || '')) ||
      hasComment ||
      hasSpecialMethod ||
      (hasMethodCall && cyrillicRatio < 0.15) ||
      hasMethodCallWithComment ||  // Method calls with comments are code
      (hasSimpleFunctionCall && cyrillicRatio < 0.2) ||  // Simple function calls with low Cyrillic
      (hasCodeStructure && cyrillicRatio < 0.15 && (hasStringLiteral || hasMethodCall || /[a-zA-Z_][a-zA-Z0-9_]*\s*\(/.test(lineWithoutNumbers)));
    
    return isCode;
  };

  // Parse content - extract code blocks with STRICT detection
  const parseContent = (rawText) => {
    if (!rawText || typeof rawText !== 'string') return [];
    
    const blocks = [];
    const lines = rawText.split('\n');
    let currentParagraph = [];
    let currentCodeBlock = null;
    let inCodeBlock = false;
    let accumulatedCodeLines = [];
    let numberSequenceStart = -1;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      // Fenced code blocks (```)
      if (trimmed.startsWith('```')) {
        // Save accumulated code if exists
        if (accumulatedCodeLines.length > 0) {
          const codeLines = accumulatedCodeLines.map(l => removeLineNumbers(l)).filter(l => l.trim() || l === '');
          if (codeLines.length > 0) {
            blocks.push({ type: 'code', language: 'python', lines: codeLines });
          }
          accumulatedCodeLines = [];
        }
        
        if (inCodeBlock) {
          if (currentCodeBlock && currentCodeBlock.lines.length > 0) {
            blocks.push(currentCodeBlock);
          }
          currentCodeBlock = null;
          inCodeBlock = false;
        } else {
          if (currentParagraph.length > 0) {
            blocks.push({ type: 'text', content: currentParagraph.join('\n').trim() });
            currentParagraph = [];
          }
          const language = trimmed.slice(3).trim() || 'python';
          currentCodeBlock = { type: 'code', language, lines: [] };
          inCodeBlock = true;
        }
        numberSequenceStart = -1;
        continue;
      }
      
      if (inCodeBlock) {
        if (currentCodeBlock) {
          currentCodeBlock.lines.push(line);
        }
        continue;
      }
      
      // Check if line is just a number (potential line number)
      if (/^\s*\d+\s*$/.test(trimmed)) {
        // If we're not in a number sequence, check if this starts one
        if (numberSequenceStart === -1) {
          // Look ahead to see if there's code after this number sequence
          let lookAhead = i + 1;
          let foundCode = false;
          
          // Skip consecutive numbers and empty lines
          while (lookAhead < lines.length) {
            const nextTrimmed = lines[lookAhead].trim();
            if (/^\s*\d+\s*$/.test(nextTrimmed)) {
              lookAhead++;
              continue;
            }
            if (nextTrimmed === '') {
              lookAhead++;
              continue;
            }
            // Found non-number, non-empty line - check if it's code
            // More aggressive check: if it starts with Python keywords, it's definitely code
            const looksLikeCode = /^\s*(class|def|if|elif|else|for|while|import|from|return|print|try|except|with|async|await|pass|lambda|yield|break|continue|raise|assert|del|global|nonlocal|__\w+__)\s/.test(nextTrimmed) ||
                                  /^\s*[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*/.test(nextTrimmed) ||
                                  /^\s*#/.test(nextTrimmed) ||
                                  isCodeLine(lines[lookAhead], nextTrimmed);
            
            if (looksLikeCode) {
              foundCode = true;
            }
            break;
          }
          
          if (foundCode) {
            // This is the start of a number sequence before code
            numberSequenceStart = i;
            // Save current paragraph
            if (currentParagraph.length > 0) {
              blocks.push({ type: 'text', content: currentParagraph.join('\n').trim() });
              currentParagraph = [];
            }
            // Add this number line to accumulated code
            accumulatedCodeLines.push(line);
          }
        } else {
          // We're in a number sequence, continue accumulating
          accumulatedCodeLines.push(line);
        }
        continue;
      }
      
      // Reset number sequence if we hit non-number, non-empty line
      if (numberSequenceStart !== -1 && trimmed !== '') {
        numberSequenceStart = -1;
      }
      
      // Check if this line is code (with more aggressive detection)
      // First check: does it look like code even if isCodeLine says no?
      const looksLikeCode = /^\s*(class|def|if|elif|else|for|while|import|from|return|print|try|except|with|async|await|pass|lambda|yield|break|continue|raise|assert|del|global|nonlocal|__\w+__)\s/.test(trimmed) ||
                            /^\s*[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*/.test(trimmed) ||
                            /^\s*#/.test(trimmed) ||
                            isCodeLine(line, trimmed);
      
      if (looksLikeCode) {
        // If we were accumulating numbers, this is code after numbers
        if (accumulatedCodeLines.length > 0) {
          // Add this code line
          accumulatedCodeLines.push(line);
        } else {
          // Save current paragraph if exists
          if (currentParagraph.length > 0) {
            blocks.push({ type: 'text', content: currentParagraph.join('\n').trim() });
            currentParagraph = [];
          }
          // Start new code block
          accumulatedCodeLines.push(line);
        }
        
        // Collect consecutive code lines
        let j = i + 1;
        while (j < lines.length) {
          const nextLine = lines[j];
          const nextTrimmed = nextLine.trim();
          
          // Skip line number only lines
          if (/^\s*\d+\s*$/.test(nextTrimmed)) {
            accumulatedCodeLines.push(nextLine);
            j++;
            continue;
          }
          
          if (nextTrimmed === '') {
            // Check if next non-empty line is code
            let k = j + 1;
            while (k < lines.length && lines[k].trim() === '') k++;
            if (k < lines.length) {
              const nextNonEmpty = lines[k];
              const nextNonEmptyTrimmed = nextNonEmpty.trim();
              
              // Skip if it's just a number
              if (/^\s*\d+\s*$/.test(nextNonEmptyTrimmed)) {
                accumulatedCodeLines.push(lines[k]);
                j = k + 1;
                continue;
              }
              
              if (isCodeLine(nextNonEmpty, nextNonEmptyTrimmed)) {
                // Add empty line and continue
                accumulatedCodeLines.push('');
                j = k;
                continue;
              } else {
                break;
              }
            } else {
              break;
            }
          } else if (isCodeLine(nextLine, nextTrimmed)) {
            accumulatedCodeLines.push(nextLine);
            j++;
          } else {
            break;
          }
        }
        
        // Save accumulated code block
        if (accumulatedCodeLines.length > 0) {
          const codeLines = accumulatedCodeLines.map(l => removeLineNumbers(l)).filter(l => l.trim() || l === '');
          if (codeLines.length > 0) {
            blocks.push({ type: 'code', language: 'python', lines: codeLines });
          }
          accumulatedCodeLines = [];
        }
        
        numberSequenceStart = -1;
        i = j - 1;
        continue;
      }
      
      // Regular text
      if (trimmed === '') {
        // If we have accumulated code, save it
        if (accumulatedCodeLines.length > 0) {
          const codeLines = accumulatedCodeLines.map(l => removeLineNumbers(l)).filter(l => l.trim() || l === '');
          if (codeLines.length > 0) {
            blocks.push({ type: 'code', language: 'python', lines: codeLines });
          }
          accumulatedCodeLines = [];
          numberSequenceStart = -1;
        }
        
        // Empty line - end current paragraph if exists
        if (currentParagraph.length > 0) {
          const paraText = currentParagraph.join(' ').trim();
          if (paraText.length > 0) {
            blocks.push({ type: 'text', content: paraText });
          }
          currentParagraph = [];
        }
      } else {
        // If we have accumulated code, save it before adding text
        if (accumulatedCodeLines.length > 0) {
          const codeLines = accumulatedCodeLines.map(l => removeLineNumbers(l)).filter(l => l.trim() || l === '');
          if (codeLines.length > 0) {
            blocks.push({ type: 'code', language: 'python', lines: codeLines });
          }
          accumulatedCodeLines = [];
          numberSequenceStart = -1;
        }
        
        // Add line to current paragraph (join with space, not newline)
        currentParagraph.push(line.trim());
      }
    }
    
    // Save remaining accumulated code
    if (accumulatedCodeLines.length > 0) {
      const codeLines = accumulatedCodeLines.map(l => removeLineNumbers(l)).filter(l => l.trim() || l === '');
      if (codeLines.length > 0) {
        blocks.push({ type: 'code', language: 'python', lines: codeLines });
      }
    }
    
    // Save remaining paragraph
    if (currentParagraph.length > 0) {
      const paraText = currentParagraph.join(' ').trim();
      if (paraText.length > 0) {
        blocks.push({ type: 'text', content: paraText });
      }
    }
    
    // Save remaining code block
    if (currentCodeBlock && currentCodeBlock.lines.length > 0) {
      blocks.push(currentCodeBlock);
    }
    
    return blocks.filter(block => {
      if (block.type === 'text') {
        return block.content && block.content.trim().length > 0;
      }
      return block.lines && block.lines.length > 0;
    });
  };

  // Syntax highlighting (clean, applied at render time)
  const highlightCode = (codeLine) => {
    if (!codeLine || typeof codeLine !== 'string') return '';
    
    // EXTRA aggressive cleanup for code - remove ALL artifacts
    let clean = removeAllArtifacts(codeLine);
    clean = removeAllArtifacts(clean);
    clean = removeAllArtifacts(clean);
    // Remove ALL code-keyword patterns - ULTRA AGGRESSIVE
    clean = clean.replace(/code-keyword\s*=\s*['"]code-keyword['"]/g, '');
    clean = clean.replace(/code-keyword\s*=\s*code-keyword/g, '');
    clean = clean.replace(/["']code-keyword["']\s*>/g, '');
    clean = clean.replace(/code-keyword\s*>/g, '');
    clean = clean.replace(/=\s*["']code-keyword["']\s*>/g, '');
    clean = clean.replace(/=\s*code-keyword\s*>/g, '');
    clean = clean.replace(/code-keyword/g, ''); // Remove ANY remaining code-keyword
    // Remove broken patterns
    clean = clean.replace(/=\s*["'][\w-]+["']\s*>/g, '');
    clean = clean.replace(/["'][\w-]+["']\s*>/g, '');
    clean = clean.replace(/[\w-]+\s*=\s*['"][\w-]+['"]/g, '');
    // Remove orphaned > and = symbols
    clean = clean.replace(/\s*>\s*/g, ' ');
    clean = clean.replace(/\s*=\s*>\s*/g, ' ');
    
    // Escape HTML
    let highlighted = clean
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    // Apply syntax highlighting
    const keywords = ['def', 'class', 'if', 'elif', 'else', 'for', 'while', 'import', 'from', 'return', 'pass', 'break', 'continue', 'try', 'except', 'finally', 'with', 'as', 'lambda', 'yield', 'async', 'await', 'True', 'False', 'None', 'and', 'or', 'not', 'in', 'is', 'self', '__str__', '__init__', '__repr__', '__len__', '__getitem__', '__setitem__', '__delitem__', '__iter__', '__next__', '__enter__', '__exit__', 'raise', 'assert', 'del', 'global', 'nonlocal'];
    
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      highlighted = highlighted.replace(regex, `<span class="code-keyword">${keyword}</span>`);
    });

    highlighted = highlighted.replace(/(['"])((?:(?=(\\?))\3.)*?)\1/g, '<span class="code-string">$1$2$1</span>');
    highlighted = highlighted.replace(/#.*$/gm, '<span class="code-comment">$&</span>');
    highlighted = highlighted.replace(/([a-zA-Z_][a-zA-Z0-9_]*)(\s*\()/g, (match, funcName, bracket) => {
      if (match.includes('<span')) return match;
      return `<span class="code-function">${funcName}</span>${bracket}`;
    });
    highlighted = highlighted.replace(/\b(\d+\.?\d*)\b/g, '<span class="code-number">$1</span>');

    return highlighted;
  };

  // Main formatting
  const formatTheory = (rawText) => {
    // First pass: remove artifacts
    let cleaned = removeAllArtifacts(rawText);
    cleaned = removeAllArtifacts(cleaned);
    cleaned = removeAllArtifacts(cleaned);
    
    if (!cleaned.trim()) {
      return '<p class="theory-paragraph">Теоретический материал не добавлен</p>';
    }
    
    // Parse into blocks
    let blocks = parseContent(cleaned);
    
    // POST-PROCESSING: Split text blocks that contain code
    // If a text block contains code patterns, try to extract code from it
    const processedBlocks = [];
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      
      if (block.type === 'text' && block.content) {
        // Debug: check if this block contains code patterns
        if (import.meta.env.DEV) {
          const hasClass = /class\s+\w+/.test(block.content);
          const hasDef = /def\s+\w+/.test(block.content);
          const hasPrint = /print\s*\(/.test(block.content);
          if (hasClass || hasDef || hasPrint) {
            console.log(`[TheoryFormatter] Post-processing text block ${i} - contains code patterns`);
          }
        }
        // Check if this text block contains code
        let textLines = block.content.split('\n');
        
        // If text is all in one line, try to split it intelligently
        if (textLines.length === 1 && block.content.length > 100) {
          // Try to split by code patterns
          const content = block.content;
          
          // Split by line numbers followed by code (e.g., "1 2 3 class Person:")
          const lineNumberPattern = /(\d+\s+)+/g;
          const matches = [...content.matchAll(/(\d+\s+)+/g)];
          
          if (matches.length > 0) {
            // Found line numbers - try to extract code after them
            const parts = [];
            let lastIndex = 0;
            
            for (const match of matches) {
              const beforeMatch = content.substring(lastIndex, match.index).trim();
              if (beforeMatch) {
                parts.push({ type: 'text', content: beforeMatch });
              }
              
              // Extract code after line numbers
              const afterNumbers = content.substring(match.index + match[0].length);
              // Find where code ends (next text or end of string)
              const codeEndMatch = afterNumbers.match(/^([^\n]*?)(?=\s+[А-ЯЁ]|$)/);
              if (codeEndMatch) {
                const codePart = codeEndMatch[1].trim();
                // Check if it looks like code
                if (/^(class|def|if|elif|else|for|while|import|from|return|print|try|except|with|async|await|pass|lambda|yield|break|continue|raise|assert|del|global|nonlocal|__\w+__|#|[a-zA-Z_][a-zA-Z0-9_]*\s*=)/.test(codePart)) {
                  // Split code by common patterns to get multiple lines
                  const codeLines = codePart.split(/(?=\d+\s+)|(?=class\s+\w+)|(?=def\s+\w+)|(?=if\s+)|(?=for\s+)|(?=while\s+)|(?=print\s*\()/).filter(l => l.trim());
                  if (codeLines.length > 0) {
                    parts.push({ type: 'code', lines: codeLines.map(l => l.trim()) });
                  }
                  lastIndex = match.index + match[0].length + codeEndMatch[0].length;
                } else {
                  lastIndex = match.index + match[0].length;
                }
              } else {
                lastIndex = match.index + match[0].length;
              }
            }
            
            // Add remaining text
            const remaining = content.substring(lastIndex).trim();
            if (remaining) {
              parts.push({ type: 'text', content: remaining });
            }
            
            if (parts.some(p => p.type === 'code')) {
              processedBlocks.push(...parts);
              continue;
            }
          }
          
          // Alternative: split by code keywords if line numbers not found
          // Split text by code patterns (class, def, etc.)
          const codeKeywordPattern = /(class\s+\w+|def\s+\w+|if\s+|for\s+|while\s+|print\s*\()/g;
          const codeMatches = [...content.matchAll(codeKeywordPattern)];
          
          if (codeMatches.length > 0) {
            const parts = [];
            let lastIndex = 0;
            
            for (const match of codeMatches) {
              const beforeCode = content.substring(lastIndex, match.index).trim();
              if (beforeCode) {
                parts.push({ type: 'text', content: beforeCode });
              }
              
              // Extract code block (until next text or end)
              const codeStart = match.index;
              const afterCode = content.substring(codeStart);
              // Find end of code (next sentence starting with capital Cyrillic or end)
              const codeEndMatch = afterCode.match(/^([^\n]*?)(?=\s+[А-ЯЁ][а-яё]|\.\s+[А-ЯЁ]|$)/);
              if (codeEndMatch) {
                const codeText = codeEndMatch[1].trim();
                // Split code into lines by common delimiters
                const codeLines = codeText.split(/(?=class\s+\w+)|(?=def\s+\w+)|(?=if\s+)|(?=for\s+)|(?=while\s+)|(?=print\s*\()|(?=\d+\s+)/).filter(l => l.trim() && !/^[А-ЯЁ]/.test(l.trim()));
                if (codeLines.length > 0) {
                  parts.push({ type: 'code', lines: codeLines.map(l => l.trim()) });
                }
                lastIndex = codeStart + codeEndMatch[0].length;
              } else {
                lastIndex = codeStart;
              }
            }
            
            // Add remaining text
            const remaining = content.substring(lastIndex).trim();
            if (remaining) {
              parts.push({ type: 'text', content: remaining });
            }
            
            if (parts.some(p => p.type === 'code')) {
              processedBlocks.push(...parts);
              continue;
            }
          }
        }
        
        // Debug: log how text is split
        if (import.meta.env.DEV) {
          const hasClass = /class\s+\w+/.test(block.content);
          const hasDef = /def\s+\w+/.test(block.content);
          if (hasClass || hasDef) {
            console.log(`[TheoryFormatter] Post-processing: textLines.length = ${textLines.length}`);
            if (textLines.length === 1) {
              console.log(`[TheoryFormatter] Text is in one line, trying to extract code...`);
            }
          }
        }
        
        const newBlocks = [];
        let currentText = [];
        let currentCode = [];
        let inCodeBlock = false;
        
        for (let j = 0; j < textLines.length; j++) {
          const line = textLines[j];
          const trimmed = line.trim();
          
          // Check if this line is code (more aggressive check)
          // Also check for method calls with comments (e.g., "tom.display_info() # Name: Tom Age: 23")
          const hasMethodCallWithComment = /[a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*\s*\([^)]*\)\s*#/.test(trimmed);
          const hasSimpleFunctionCall = /^[a-zA-Z_][a-zA-Z0-9_]*\s*\([^)]*\)/.test(trimmed);
          const methodCallPart = hasMethodCallWithComment ? trimmed.split('#')[0] || '' : (hasSimpleFunctionCall ? trimmed.split('(')[0] || '' : '');
          const noCyrillicInCall = !/[а-яёА-ЯЁ]/.test(methodCallPart);
          
          const isCode = /^\s*(class|def|if|elif|else|for|while|import|from|return|print|try|except|with|async|await|pass|lambda|yield|break|continue|raise|assert|del|global|nonlocal|__\w+__)\s/.test(trimmed) ||
                        /^\s*[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*[^=]/.test(trimmed) ||
                        /^\s*#/.test(trimmed) ||
                        (/^\s{2,}/.test(line) && /[():\[\]{}]/.test(trimmed) && !/[а-яёА-ЯЁ]/.test(trimmed)) ||
                        // Method calls with comments (e.g., "tom.display_info() # Name: Tom Age: 23")
                        (hasMethodCallWithComment && noCyrillicInCall) ||
                        // Simple method calls (e.g., "print(tom)")
                        (hasSimpleFunctionCall && noCyrillicInCall) ||
                        isCodeLine(line, trimmed);
          
          // Check if line is just a number (line number)
          const isLineNumber = /^\s*\d+\s*$/.test(trimmed);
          
          if (isLineNumber) {
            // If we're in code block, add it; otherwise, check if next line is code
            if (inCodeBlock) {
              currentCode.push(line);
            } else {
              // Look ahead to see if next line is code
              let nextIdx = j + 1;
              while (nextIdx < textLines.length && textLines[nextIdx].trim() === '') nextIdx++;
              if (nextIdx < textLines.length) {
                const nextLine = textLines[nextIdx];
                const nextTrimmed = nextLine.trim();
                const nextHasMethodCall = /[a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*\s*\([^)]*\)/.test(nextTrimmed);
                const nextHasFunctionCall = /^[a-zA-Z_][a-zA-Z0-9_]*\s*\([^)]*\)/.test(nextTrimmed);
                const nextIsCode = /^\s*(class|def|if|elif|else|for|while|import|from|return|print|try|except|with|async|await|pass|lambda|yield|break|continue|raise|assert|del|global|nonlocal|__\w+__)\s/.test(nextTrimmed) ||
                                  /^\s*[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*[^=]/.test(nextTrimmed) ||
                                  /^\s*#/.test(nextTrimmed) ||
                                  (nextHasMethodCall && !/[а-яёА-ЯЁ]/.test(nextTrimmed.split('(')[0] || '')) ||
                                  (nextHasFunctionCall && !/[а-яёА-ЯЁ]/.test(nextTrimmed.split('(')[0] || '')) ||
                                  isCodeLine(nextLine, nextTrimmed);
                
                if (nextIsCode) {
                  // Start code block
                  if (currentText.length > 0) {
                    newBlocks.push({ type: 'text', content: currentText.join(' ').trim() });
                    currentText = [];
                  }
                  inCodeBlock = true;
                  currentCode.push(line);
                } else {
                  // Just a number, skip it
                }
              }
            }
          } else if (isCode) {
            // This is code
            if (!inCodeBlock) {
              // Start new code block
              if (currentText.length > 0) {
                newBlocks.push({ type: 'text', content: currentText.join(' ').trim() });
                currentText = [];
              }
              inCodeBlock = true;
            }
            currentCode.push(line);
          } else if (trimmed === '') {
            // Empty line
            if (inCodeBlock) {
              currentCode.push('');
            } else {
              if (currentText.length > 0) {
                newBlocks.push({ type: 'text', content: currentText.join(' ').trim() });
                currentText = [];
              }
            }
          } else {
            // This is text
            if (inCodeBlock) {
              // End code block
              if (currentCode.length > 0) {
                const codeLines = currentCode.map(l => removeLineNumbers(l)).filter(l => l.trim() || l === '');
                if (codeLines.length > 0) {
                  newBlocks.push({ type: 'code', language: 'python', lines: codeLines });
                }
                currentCode = [];
              }
              inCodeBlock = false;
            }
            currentText.push(line.trim());
          }
        }
        
        // Save remaining blocks
        if (currentText.length > 0) {
          newBlocks.push({ type: 'text', content: currentText.join(' ').trim() });
        }
        if (currentCode.length > 0) {
          const codeLines = currentCode.map(l => removeLineNumbers(l)).filter(l => l.trim() || l === '');
          if (codeLines.length > 0) {
            newBlocks.push({ type: 'code', language: 'python', lines: codeLines });
          }
        }
        
        // If we found code, use new blocks; otherwise, keep original
        const foundCode = newBlocks.some(b => b.type === 'code');
        if (foundCode) {
          if (import.meta.env.DEV) {
            console.log(`[TheoryFormatter] Post-processing: Split text block into ${newBlocks.length} blocks (${newBlocks.filter(b => b.type === 'code').length} code, ${newBlocks.filter(b => b.type === 'text').length} text)`);
          }
          processedBlocks.push(...newBlocks);
        } else {
          if (import.meta.env.DEV && (block.content.includes('class ') || block.content.includes('def ') || block.content.includes('print('))) {
            console.log(`[TheoryFormatter] Post-processing: Code patterns found but not extracted. Lines:`, textLines.length);
            console.log(`[TheoryFormatter] Sample lines:`, textLines.slice(0, 10));
          }
          processedBlocks.push(block);
        }
      } else {
        processedBlocks.push(block);
      }
    }
    
    blocks = processedBlocks.filter(block => {
      if (block.type === 'text') {
        return block.content && block.content.trim().length > 0;
      }
      return block.lines && block.lines.length > 0;
    });
    
    // Debug: log blocks
    if (import.meta.env.DEV) {
      const codeBlocks = blocks.filter(b => b.type === 'code').length;
      const textBlocks = blocks.filter(b => b.type === 'text').length;
      console.log(`[TheoryFormatter] Parsed ${blocks.length} blocks: ${textBlocks} text, ${codeBlocks} code`);
      
      if (codeBlocks > 0) {
        console.log(`[TheoryFormatter] ✓ Code blocks found after post-processing!`);
      }
    }
    
    // Render blocks
    const rendered = blocks.map((block) => {
      if (block.type === 'code') {
        // Clean each code line EXTRA aggressively - ULTRA CLEAN
        let cleanCodeLines = block.lines
          .map(line => {
            // Remove line numbers if still present
            let clean = removeLineNumbers(line);
            // Remove ALL artifacts multiple times
            clean = removeAllArtifacts(clean);
            clean = removeAllArtifacts(clean);
            clean = removeAllArtifacts(clean);
            // Remove ANY remaining code-keyword patterns - ALL VARIATIONS
            clean = clean.replace(/code-keyword/g, '');
            clean = clean.replace(/["']code-keyword["']/g, '');
            clean = clean.replace(/code-keyword\s*>/g, '');
            clean = clean.replace(/=\s*["']code-keyword["']\s*>/g, '');
            clean = clean.replace(/=\s*code-keyword\s*>/g, '');
            clean = clean.replace(/["']code-keyword["']\s*>/g, '');
            clean = clean.replace(/>code-keyword</g, '><');
            // Remove broken patterns with quotes and >
            clean = clean.replace(/=\s*["'][\w-]+["']\s*>/g, '');
            clean = clean.replace(/["'][\w-]+["']\s*>/g, '');
            clean = clean.replace(/\s*>\s*/g, ' ');
            clean = clean.replace(/\s*=\s*>\s*/g, ' ');
            // Remove orphaned quotes
            clean = clean.replace(/^["']\s*/g, '');
            clean = clean.replace(/\s*["']$/g, '');
            return clean;
          })
          .filter(line => line.trim().length > 0 || line === ''); // Keep empty lines for formatting
        
        // Remove multiple consecutive empty lines (keep max 1)
        cleanCodeLines = cleanCodeLines.reduce((acc, line, index) => {
          const isEmpty = line.trim().length === 0;
          const prevIsEmpty = index > 0 && acc[acc.length - 1].trim().length === 0;
          
          if (isEmpty && prevIsEmpty) {
            // Skip this empty line if previous was also empty
            return acc;
          }
          acc.push(line);
          return acc;
        }, []);
        
        // Remove leading and trailing empty lines
        while (cleanCodeLines.length > 0 && cleanCodeLines[0].trim().length === 0) {
          cleanCodeLines.shift();
        }
        while (cleanCodeLines.length > 0 && cleanCodeLines[cleanCodeLines.length - 1].trim().length === 0) {
          cleanCodeLines.pop();
        }
        
        if (cleanCodeLines.length === 0) return '';
        
        // Render code block with inline styles
        const codeLines = cleanCodeLines.map((line, lineIndex) => {
          if (line === '') {
            return `<div class="code-line" data-line="${lineIndex + 1}" style="display: flex; padding: 2px 0; position: relative;"><span class="line-content" style="flex: 1; padding: 0 12px; white-space: pre; overflow-x: auto;"> </span></div>`;
          }
          
          // ULTRA AGGRESSIVE cleanup before highlighting
          let ultraClean = line;
          // Remove ALL code-keyword patterns
          ultraClean = ultraClean.replace(/code-keyword/g, '');
          ultraClean = ultraClean.replace(/["']code-keyword["']/g, '');
          ultraClean = ultraClean.replace(/code-keyword\s*>/g, '');
          ultraClean = ultraClean.replace(/=\s*["']code-keyword["']\s*>/g, '');
          ultraClean = ultraClean.replace(/=\s*code-keyword\s*>/g, '');
          ultraClean = ultraClean.replace(/["']code-keyword["']\s*>/g, '');
          ultraClean = ultraClean.replace(/>code-keyword</g, '><');
          // Remove broken patterns
          ultraClean = ultraClean.replace(/=\s*["'][\w-]+["']\s*>/g, '');
          ultraClean = ultraClean.replace(/["'][\w-]+["']\s*>/g, '');
          ultraClean = ultraClean.replace(/\s*>\s*/g, ' ');
          ultraClean = ultraClean.replace(/\s*=\s*>\s*/g, ' ');
          // Remove orphaned quotes and brackets
          ultraClean = ultraClean.replace(/^["']\s*/g, '');
          ultraClean = ultraClean.replace(/\s*["']$/g, '');
          
          const highlighted = highlightCode(ultraClean);
          return `<div class="code-line" data-line="${lineIndex + 1}" style="display: flex; padding: 2px 0; position: relative;"><span style="display: inline-block; width: 2.5rem; padding: 0 8px; text-align: right; color: #999; user-select: none; background: transparent; font-size: 0.75rem; flex-shrink: 0;">${lineIndex + 1}</span><span class="line-content" style="flex: 1; padding: 0 12px; white-space: pre; overflow-x: auto; color: #2d3748;">${highlighted}</span></div>`;
        }).join('');
        
        return `<div class="theory-code-block-wrapper" style="margin: 1rem 0; border: 1px solid #e2e8f0; border-radius: 4px; overflow: hidden; background: #f7fafc;"><pre class="theory-code-block" style="background: #f7fafc; color: #2d3748; padding: 12px 0; margin: 0; overflow-x: auto; font-family: 'Consolas', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 0.875rem; line-height: 1.5; border: none;"><code style="background: transparent; padding: 0; border: none; color: inherit; display: block;">${codeLines}</code></pre></div>`;
      } else {
        // Text block - clean and format as readable paragraphs
        let text = removeAllArtifacts(block.content);
        
        // Split into paragraphs for better readability
        // First, split by double newlines (paragraph breaks)
        let paragraphs = text.split(/\n\s*\n+/).filter(p => p.trim().length > 0);
        
        // If no double newlines, try to split by single newlines if text is very long
        if (paragraphs.length === 1 && text.length > 500) {
          // Split by single newlines and group into logical paragraphs
          const lines = text.split(/\n/).filter(l => l.trim().length > 0);
          paragraphs = [];
          let currentPara = [];
          
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            // If line ends with sentence-ending punctuation, it's end of paragraph
            if (/[.!?]\s*$/.test(line) && currentPara.length > 0) {
              currentPara.push(line);
              paragraphs.push(currentPara.join(' '));
              currentPara = [];
            } else {
              currentPara.push(line);
            }
          }
          
          if (currentPara.length > 0) {
            paragraphs.push(currentPara.join(' '));
          }
        }
        
        // If still one big paragraph, split by sentence endings for very long text
        if (paragraphs.length === 1 && paragraphs[0].length > 1000) {
          const longText = paragraphs[0];
          const sentences = longText.split(/([.!?]\s+)/);
          paragraphs = [];
          let currentPara = [];
          
          for (let i = 0; i < sentences.length; i += 2) {
            const sentence = sentences[i] + (sentences[i + 1] || '');
            currentPara.push(sentence.trim());
            
            // Every 3-4 sentences, start new paragraph
            if (currentPara.length >= 3 && /[.!?]\s*$/.test(sentence)) {
              paragraphs.push(currentPara.join(' '));
              currentPara = [];
            }
          }
          
          if (currentPara.length > 0) {
            paragraphs.push(currentPara.join(' '));
          }
        }
        
        // Format each paragraph and highlight terms
        const formattedParagraphs = paragraphs.map(para => {
          // Clean paragraph
          let cleanPara = para.trim();
          
          // Escape HTML
          let escaped = cleanPara
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
          
          // Normalize multiple spaces
          escaped = escaped.replace(/\s+/g, ' ');
          
          // Highlight terms (only if no code blocks in theory)
          const hasCodeBlocks = blocks.some(b => b.type === 'code');
          if (!hasCodeBlocks) {
            // Highlight technical terms
            // 1. Words in backticks or quotes (e.g., `__str__`, "object")
            escaped = escaped.replace(/([`"])([^`"]+)\1/g, '<strong class="theory-term">$2</strong>');
            
            // 2. Python special methods (__str__, __init__, etc.)
            escaped = escaped.replace(/(__\w+__)/g, '<strong class="theory-term">$1</strong>');
            
            // 3. Technical terms after colons (e.g., "метод __str__():")
            escaped = escaped.replace(/(метод|класс|функция|метод|объект|переменная|атрибут|параметр)\s+([а-яёА-ЯЁ\w_]+)/gi, 
              '<strong class="theory-term">$1 $2</strong>');
            
            // 4. Common Python terms
            const pythonTerms = ['object', 'class', 'def', 'self', 'method', 'function', 'attribute', 'parameter', 'argument', 'return', 'print', 'import', 'from'];
            pythonTerms.forEach(term => {
              const regex = new RegExp(`\\b${term}\\b`, 'gi');
              escaped = escaped.replace(regex, (match) => {
                // Don't replace if already in a tag
                if (escaped.indexOf(`<strong class="theory-term">${match}</strong>`) !== -1) {
                  return match;
                }
                return `<strong class="theory-term">${match}</strong>`;
              });
            });
            
            // 5. Russian technical terms
            const russianTerms = ['метод', 'класс', 'функция', 'объект', 'переменная', 'атрибут', 'параметр', 'аргумент', 'возвращает', 'вызывает', 'определяет', 'создает'];
            russianTerms.forEach(term => {
              const regex = new RegExp(`\\b${term}\\b`, 'gi');
              escaped = escaped.replace(regex, (match) => {
                // Don't replace if already in a tag
                if (escaped.indexOf(`<strong class="theory-term">${match}</strong>`) !== -1) {
                  return match;
                }
                return `<strong class="theory-term">${match}</strong>`;
              });
            });
          }
          
          return escaped;
        }).filter(p => p.length > 0);
        
        // Return formatted paragraphs with proper spacing
        return formattedParagraphs.map(p => `<p class="theory-paragraph">${p}</p>`).join('\n');
      }
    }).join('\n');
    
    return rendered;
  };

  const formattedText = formatTheory(text);
  
  // Debug: log what we're rendering
  if (import.meta.env.DEV) {
    console.log('[TheoryFormatter] Rendering theory, blocks found:', formattedText.includes('theory-code-block-wrapper') ? 'YES (has code blocks)' : 'NO (text only)');
  }

  return (
    <div className="theory-content" style={{ width: '100%' }}>
      <div 
        className="theory-formatted-text"
        dangerouslySetInnerHTML={{ __html: formattedText }}
        style={{ width: '100%' }}
      />
      <style>{`
        .theory-content {
          max-width: 100%;
          line-height: 1.75;
          color: #2d3748;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
          font-size: 1.05rem;
        }
        
        .theory-formatted-text {
          color: #2d3748;
          font-size: 1.05rem;
          line-height: 1.75;
          white-space: normal;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        
        .theory-paragraph {
          margin-bottom: 1.25rem;
          line-height: 1.75;
          text-align: left;
          color: #2d3748;
          white-space: normal;
          font-size: 1.05rem;
          text-indent: 0;
          padding: 0;
          max-width: 100%;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        
        .theory-paragraph:first-of-type {
          margin-top: 0;
        }
        
        .theory-paragraph:last-of-type {
          margin-bottom: 0;
        }
        
        .theory-term {
          font-weight: 600;
          color: #1a202c;
          background: transparent;
        }
        
        .theory-code-block-wrapper {
          margin: 1rem 0 !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 4px !important;
          overflow: hidden !important;
          background: #f7fafc !important;
        }
        
        .theory-code-block-wrapper:first-child {
          margin-top: 0 !important;
        }
        
        .theory-code-block-wrapper:last-child {
          margin-bottom: 0 !important;
        }
        
        .theory-code-block {
          background: #f7fafc !important;
          color: #2d3748 !important;
          padding: 12px 0 !important;
          margin: 0 !important;
          overflow-x: auto !important;
          font-family: 'Consolas', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace !important;
          font-size: 0.875rem !important;
          line-height: 1.5 !important;
          border: none !important;
        }
        
        .theory-code-block code {
          background: transparent !important;
          padding: 0 !important;
          border: none !important;
          color: inherit !important;
          display: block !important;
        }
        
        .code-line {
          display: flex !important;
          padding: 2px 0 !important;
          position: relative !important;
        }
        
        .code-line:hover {
          background: transparent !important;
        }
        
        /* Line numbers are now inline, not via ::before */
        .code-line::before {
          display: none !important;
        }
        
        .line-content {
          flex: 1 !important;
          padding: 0 12px !important;
          white-space: pre !important;
          overflow-x: auto !important;
        }
        
        .code-keyword {
          color: #805ad5;
          font-weight: 600;
        }
        
        .code-string {
          color: #c53030;
        }
        
        .code-comment {
          color: #38a169;
          font-style: italic;
        }
        
        .code-function {
          color: #2c5282;
          font-weight: 500;
        }
        
        .code-number {
          color: #d69e2e;
        }
        
        .theory-formatted-text p:first-child {
          margin-top: 0;
        }
        
        .theory-formatted-text p:last-child {
          margin-bottom: 0;
        }
      `}</style>
    </div>
  );
};

export default TheoryFormatter;
