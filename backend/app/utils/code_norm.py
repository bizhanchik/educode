
import re
import ast
from typing import List, Dict, Set, Optional, Tuple


def normalize_code(code: str, language: str = "python") -> str:
    if not code:
        return ""

    if language in ["python", "ruby", "perl"]:
        code = re.sub(r'#.*$', '', code, flags=re.MULTILINE)
        code = re.sub(r'""".*?"""', '', code, flags=re.DOTALL)
        code = re.sub(r"'''.*?'''", '', code, flags=re.DOTALL)

    elif language in ["javascript", "typescript", "java", "cpp", "c", "go", "rust", "php"]:
        code = re.sub(r'//.*$', '', code, flags=re.MULTILINE)
        code = re.sub(r'/\*.*?\*/', '', code, flags=re.DOTALL)

    code = re.sub(r'\s+', ' ', code)

    code = re.sub(r'\s*([{}();,=+\-*/\[\]])\s*', r'\1', code)

    code = code.lower()

    return code.strip()


def tokenize_code(code: str, language: str = "python") -> List[str]:
    normalized = normalize_code(code, language)

    tokens = re.findall(r'\b\w+\b|[{}();,=+\-*/\[\]]', normalized)

    return [token for token in tokens if len(token) > 1 or token in '{}();,=+-*/[]']


def extract_functions(code: str, language: str = "python") -> List[Dict[str, str]]:
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
            pattern = r'def\s+(\w+)\s*\((.*?)\)\s*:'
            matches = re.findall(pattern, code)
            for name, params in matches:
                functions.append({
                    "name": name,
                    "params": [p.strip() for p in params.split(',') if p.strip()],
                    "line": 0
                })

    elif language in ["javascript", "typescript"]:
        pattern = r'function\s+(\w+)\s*\((.*?)\)'
        matches = re.findall(pattern, code)
        for name, params in matches:
            functions.append({
                "name": name,
                "params": [p.strip() for p in params.split(',') if p.strip()],
                "line": 0
            })

        pattern = r'(?:const|let|var)\s+(\w+)\s*=\s*\(([^)]*)\)\s*=>'
        matches = re.findall(pattern, code)
        for name, params in matches:
            functions.append({
                "name": name,
                "params": [p.strip() for p in params.split(',') if p.strip()],
                "line": 0
            })

    elif language in ["java", "cpp", "c"]:
        pattern = r'(?:public|private|protected)?\s*(?:static)?\s*\w+\s+(\w+)\s*\(([^)]*)\)'
        matches = re.findall(pattern, code)
        for name, params in matches:
            if name not in ["if", "while", "for", "switch"]:
                functions.append({
                    "name": name,
                    "params": [p.strip().split()[-1] for p in params.split(',') if p.strip()],
                    "line": 0
                })

    return functions


def extract_variables(code: str, language: str = "python") -> Set[str]:
    variables = set()

    if language == "python":
        pattern = r'^\s*(\w+)\s*='
        matches = re.findall(pattern, code, re.MULTILINE)
        variables.update(matches)

    elif language in ["javascript", "typescript"]:
        pattern = r'(?:const|let|var)\s+(\w+)'
        matches = re.findall(pattern, code)
        variables.update(matches)

    elif language in ["java", "cpp", "c"]:
        pattern = r'\w+\s+(\w+)\s*='
        matches = re.findall(pattern, code)
        variables.update(matches)

    return variables


def calculate_code_metrics(code: str) -> Dict[str, int]:
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
    if re.search(r'\bdef\s+\w+\s*\(', code) or re.search(r'\bimport\s+\w+', code):
        return "python"

    if re.search(r'\bfunction\s+\w+', code) or re.search(r'=>', code) or re.search(r'\bconsole\.log', code):
        return "javascript"

    if re.search(r'\bclass\s+\w+', code) and re.search(r'\bpublic\s+static\s+void\s+main', code):
        return "java"

    if re.search(r'#include\s*<', code) or re.search(r'\bint\s+main\s*\(', code):
        return "cpp"

    return "unknown"


def remove_strings_and_comments(code: str, language: str = "python") -> str:
    code = re.sub(r'"[^"]*"', '""', code)
    code = re.sub(r"'[^']*'", "''", code)

    code = normalize_code(code, language)

    return code


def get_code_structure(code: str, language: str = "python") -> Dict[str, any]:
    return {
        "functions": extract_functions(code, language),
        "variables": list(extract_variables(code, language)),
        "metrics": calculate_code_metrics(code),
        "tokens": len(tokenize_code(code, language))
    }
