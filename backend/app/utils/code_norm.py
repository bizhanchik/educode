"""
EduCode Backend - Code Normalization Utilities

Tools for normalizing, tokenizing, and analyzing code submissions.
"""

import re
import ast
from typing import List, Dict, Set, Optional, Tuple


def normalize_code(code: str, language: str = "python") -> str:
    """
    Normalize code by removing comments, extra whitespace, and standardizing formatting.

    Args:
        code: Source code string
        language: Programming language (python, javascript, java, cpp)

    Returns:
        Normalized code string
    """
    if not code:
        return ""

    # Remove comments based on language
    if language in ["python", "ruby", "perl"]:
        # Remove single-line comments
        code = re.sub(r'#.*$', '', code, flags=re.MULTILINE)
        # Remove docstrings
        code = re.sub(r'""".*?"""', '', code, flags=re.DOTALL)
        code = re.sub(r"'''.*?'''", '', code, flags=re.DOTALL)

    elif language in ["javascript", "typescript", "java", "cpp", "c", "go", "rust", "php"]:
        # Remove single-line comments
        code = re.sub(r'//.*$', '', code, flags=re.MULTILINE)
        # Remove multi-line comments
        code = re.sub(r'/\*.*?\*/', '', code, flags=re.DOTALL)

    # Normalize whitespace
    code = re.sub(r'\s+', ' ', code)

    # Remove extra spaces around operators and punctuation
    code = re.sub(r'\s*([{}();,=+\-*/\[\]])\s*', r'\1', code)

    # Convert to lowercase for comparison (optional, can be disabled)
    code = code.lower()

    return code.strip()


def tokenize_code(code: str, language: str = "python") -> List[str]:
    """
    Extract meaningful tokens from code.

    Args:
        code: Source code string
        language: Programming language

    Returns:
        List of code tokens
    """
    normalized = normalize_code(code, language)

    # Extract identifiers, keywords, operators, and literals
    tokens = re.findall(r'\b\w+\b|[{}();,=+\-*/\[\]]', normalized)

    # Filter out very short tokens (but keep operators)
    return [token for token in tokens if len(token) > 1 or token in '{}();,=+-*/[]']


def extract_functions(code: str, language: str = "python") -> List[Dict[str, str]]:
    """
    Extract function definitions from code.

    Args:
        code: Source code string
        language: Programming language

    Returns:
        List of dictionaries with function info (name, params, body)
    """
    functions = []

    if language == "python":
        try:
            tree = ast.parse(code)
            for node in ast.walk(tree):
                if isinstance(node, ast.FunctionDef):
                    functions.append({
                        "name": node.name,
                        "params": [arg.arg for arg in node.args.args],
                        "line": node.lineno
                    })
        except SyntaxError:
            # Fallback to regex if parsing fails
            pattern = r'def\s+(\w+)\s*\((.*?)\)\s*:'
            matches = re.findall(pattern, code)
            for name, params in matches:
                functions.append({
                    "name": name,
                    "params": [p.strip() for p in params.split(',') if p.strip()],
                    "line": 0
                })

    elif language in ["javascript", "typescript"]:
        # Match function declarations
        pattern = r'function\s+(\w+)\s*\((.*?)\)'
        matches = re.findall(pattern, code)
        for name, params in matches:
            functions.append({
                "name": name,
                "params": [p.strip() for p in params.split(',') if p.strip()],
                "line": 0
            })

        # Match arrow functions assigned to variables
        pattern = r'(?:const|let|var)\s+(\w+)\s*=\s*\(([^)]*)\)\s*=>'
        matches = re.findall(pattern, code)
        for name, params in matches:
            functions.append({
                "name": name,
                "params": [p.strip() for p in params.split(',') if p.strip()],
                "line": 0
            })

    elif language in ["java", "cpp", "c"]:
        # Match method/function declarations
        pattern = r'(?:public|private|protected)?\s*(?:static)?\s*\w+\s+(\w+)\s*\(([^)]*)\)'
        matches = re.findall(pattern, code)
        for name, params in matches:
            if name not in ["if", "while", "for", "switch"]:  # Filter out control structures
                functions.append({
                    "name": name,
                    "params": [p.strip().split()[-1] for p in params.split(',') if p.strip()],
                    "line": 0
                })

    return functions


def extract_variables(code: str, language: str = "python") -> Set[str]:
    """
    Extract variable names from code.

    Args:
        code: Source code string
        language: Programming language

    Returns:
        Set of variable names
    """
    variables = set()

    if language == "python":
        # Match variable assignments
        pattern = r'^\s*(\w+)\s*='
        matches = re.findall(pattern, code, re.MULTILINE)
        variables.update(matches)

    elif language in ["javascript", "typescript"]:
        # Match variable declarations
        pattern = r'(?:const|let|var)\s+(\w+)'
        matches = re.findall(pattern, code)
        variables.update(matches)

    elif language in ["java", "cpp", "c"]:
        # Match variable declarations
        pattern = r'\w+\s+(\w+)\s*='
        matches = re.findall(pattern, code)
        variables.update(matches)

    return variables


def calculate_code_metrics(code: str) -> Dict[str, int]:
    """
    Calculate basic code metrics.

    Args:
        code: Source code string

    Returns:
        Dictionary with code metrics (lines, chars, etc.)
    """
    lines = code.split('\n')
    non_empty_lines = [line for line in lines if line.strip()]

    return {
        "total_lines": len(lines),
        "code_lines": len(non_empty_lines),
        "characters": len(code),
        "words": len(code.split()),
        "avg_line_length": len(code) // len(lines) if lines else 0
    }


def detect_language(code: str) -> str:
    """
    Attempt to detect programming language from code.

    Args:
        code: Source code string

    Returns:
        Detected language (python, javascript, java, cpp, or unknown)
    """
    # Python indicators
    if re.search(r'\bdef\s+\w+\s*\(', code) or re.search(r'\bimport\s+\w+', code):
        return "python"

    # JavaScript/TypeScript indicators
    if re.search(r'\bfunction\s+\w+', code) or re.search(r'=>', code) or re.search(r'\bconsole\.log', code):
        return "javascript"

    # Java indicators
    if re.search(r'\bclass\s+\w+', code) and re.search(r'\bpublic\s+static\s+void\s+main', code):
        return "java"

    # C/C++ indicators
    if re.search(r'#include\s*<', code) or re.search(r'\bint\s+main\s*\(', code):
        return "cpp"

    return "unknown"


def remove_strings_and_comments(code: str, language: str = "python") -> str:
    """
    Remove string literals and comments from code for structural analysis.

    Args:
        code: Source code string
        language: Programming language

    Returns:
        Code without strings and comments
    """
    # Remove string literals
    code = re.sub(r'"[^"]*"', '""', code)
    code = re.sub(r"'[^']*'", "''", code)

    # Remove comments
    code = normalize_code(code, language)

    return code


def get_code_structure(code: str, language: str = "python") -> Dict[str, any]:
    """
    Extract structural information from code.

    Args:
        code: Source code string
        language: Programming language

    Returns:
        Dictionary with structural information
    """
    return {
        "functions": extract_functions(code, language),
        "variables": list(extract_variables(code, language)),
        "metrics": calculate_code_metrics(code),
        "tokens": len(tokenize_code(code, language))
    }
