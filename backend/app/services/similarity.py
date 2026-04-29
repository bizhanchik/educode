
import re
import ast
import logging
from typing import Dict, List, Any, Optional

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

logger = logging.getLogger(__name__)


class SimilarityCalculator:

    def __init__(self):
        self.tfidf_vectorizer = TfidfVectorizer(
            token_pattern=r'\b\w+\b',
            lowercase=True,
            stop_words=None
        )

    def normalize_code(self, code: str) -> str:
        code = re.sub(r'//.*$', '', code, flags=re.MULTILINE)
        code = re.sub(r'#.*$', '', code, flags=re.MULTILINE)

        code = re.sub(r'/\*.*?\*/', '', code, flags=re.DOTALL)
        code = re.sub(r'""".*?"""', '', code, flags=re.DOTALL)
        code = re.sub(r"'''.*?'''", '', code, flags=re.DOTALL)

        code = re.sub(r'\s+', ' ', code)

        code = re.sub(r'\s*([{}();,=+\-*/])\s*', r'\1', code)

        return code.strip().lower()

    def tokenize_code(self, code: str) -> List[str]:
        normalized = self.normalize_code(code)

        tokens = re.findall(r'\b\w+\b|[{}();,=+\-*/]', normalized)

        return [token for token in tokens if len(token) > 1 or token in '{}();,=+-*/']

    def calculate_token_similarity(self, code1: str, code2: str) -> Dict[str, Any]:
        tokens1 = set(self.tokenize_code(code1))
        tokens2 = set(self.tokenize_code(code2))

        if not tokens1 and not tokens2:
            return {"similarity": 1.0, "method": "token", "tokens1": 0, "tokens2": 0, "intersection": 0}

        if not tokens1 or not tokens2:
            return {"similarity": 0.0, "method": "token", "tokens1": len(tokens1), "tokens2": len(tokens2), "intersection": 0}

        intersection = tokens1.intersection(tokens2)
        union = tokens1.union(tokens2)

        jaccard_similarity = len(intersection) / len(union) if union else 0.0

        return {
            "similarity": jaccard_similarity,
            "method": "token",
            "tokens1": len(tokens1),
            "tokens2": len(tokens2),
            "intersection": len(intersection),
            "union": len(union)
        }

    def calculate_semantic_similarity(self, code1: str, code2: str) -> Dict[str, Any]:
        try:
            docs = [self.normalize_code(code1), self.normalize_code(code2)]

            if not docs[0] and not docs[1]:
                return {"similarity": 1.0, "method": "semantic"}

            if not docs[0] or not docs[1]:
                return {"similarity": 0.0, "method": "semantic"}

            tfidf_matrix = self.tfidf_vectorizer.fit_transform(docs)

            similarity_matrix = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])
            semantic_similarity = similarity_matrix[0][0]

            return {
                "similarity": float(semantic_similarity),
                "method": "semantic",
                "features": tfidf_matrix.shape[1]
            }

        except Exception as e:
            logger.warning(f"Semantic similarity calculation failed: {str(e)}")
            return self.calculate_token_similarity(code1, code2)

    def calculate_structural_similarity(self, code1: str, code2: str) -> Dict[str, Any]:
        try:
            ast1 = self._get_ast_structure(code1)
            ast2 = self._get_ast_structure(code2)

            if not ast1 and not ast2:
                return {"similarity": 1.0, "method": "structural"}

            if not ast1 or not ast2:
                return {"similarity": 0.0, "method": "structural"}

            similarity = self._compare_ast_structures(ast1, ast2)

            return {
                "similarity": similarity,
                "method": "structural",
                "ast1_nodes": len(ast1),
                "ast2_nodes": len(ast2)
            }

        except Exception as e:
            logger.warning(f"Structural similarity calculation failed: {str(e)}")
            return self.calculate_token_similarity(code1, code2)

    def _get_ast_structure(self, code: str) -> List[str]:
        try:
            tree = ast.parse(code)
            nodes = []

            for node in ast.walk(tree):
                nodes.append(type(node).__name__)

            return nodes

        except SyntaxError:
            return self._extract_basic_structure(code)

    def _extract_basic_structure(self, code: str) -> List[str]:
        structure = []

        patterns = {
            'function': r'\b(def|function|func)\s+\w+',
            'class': r'\bclass\s+\w+',
            'if': r'\bif\s*\(',
            'for': r'\bfor\s*\(',
            'while': r'\bwhile\s*\(',
            'try': r'\btry\s*:',
            'return': r'\breturn\b',
            'assignment': r'\w+\s*=\s*',
        }

        for construct, pattern in patterns.items():
            matches = re.findall(pattern, code, re.IGNORECASE)
            structure.extend([construct] * len(matches))

        return structure

    def _compare_ast_structures(self, ast1: List[str], ast2: List[str]) -> float:
        set1 = set(ast1)
        set2 = set(ast2)

        if not set1 and not set2:
            return 1.0

        if not set1 or not set2:
            return 0.0

        intersection = set1.intersection(set2)
        union = set1.union(set2)

        return len(intersection) / len(union) if union else 0.0

    def calculate_hybrid_similarity(self, code1: str, code2: str) -> Dict[str, Any]:
        token_result = self.calculate_token_similarity(code1, code2)
        semantic_result = self.calculate_semantic_similarity(code1, code2)
        structural_result = self.calculate_structural_similarity(code1, code2)

        weights = {"token": 0.4, "semantic": 0.4, "structural": 0.2}

        hybrid_similarity = (
            weights["token"] * token_result["similarity"] +
            weights["semantic"] * semantic_result["similarity"] +
            weights["structural"] * structural_result["similarity"]
        )

        return {
            "similarity": hybrid_similarity,
            "method": "hybrid",
            "components": {
                "token": token_result["similarity"],
                "semantic": semantic_result["similarity"],
                "structural": structural_result["similarity"]
            },
            "weights": weights
        }

    def get_similarity(self, code1: str, code2: str, method: str = "hybrid") -> float:
        if method == "token":
            result = self.calculate_token_similarity(code1, code2)
        elif method == "semantic":
            result = self.calculate_semantic_similarity(code1, code2)
        elif method == "structural":
            result = self.calculate_structural_similarity(code1, code2)
        elif method == "hybrid":
            result = self.calculate_hybrid_similarity(code1, code2)
        else:
            raise ValueError(f"Invalid method '{method}'. Use 'token', 'semantic', 'structural', or 'hybrid'")

        return max(0.0, min(1.0, result["similarity"]))

    def compare_detailed(self, code1: str, code2: str, method: str = "hybrid") -> Dict[str, Any]:
        if method == "token":
            result = self.calculate_token_similarity(code1, code2)
        elif method == "semantic":
            result = self.calculate_semantic_similarity(code1, code2)
        elif method == "structural":
            result = self.calculate_structural_similarity(code1, code2)
        elif method == "hybrid":
            result = self.calculate_hybrid_similarity(code1, code2)
        else:
            raise ValueError(f"Invalid method '{method}'. Use 'token', 'semantic', 'structural', or 'hybrid'")

        result["similarity"] = max(0.0, min(1.0, result["similarity"]))

        return result

    def get_max_similarity(self, target_code: str, reference_codes: List[str], method: str = "hybrid") -> float:
        if not reference_codes:
            return 0.0

        max_similarity = 0.0

        for ref_code in reference_codes:
            try:
                similarity = self.get_similarity(target_code, ref_code, method)
                max_similarity = max(max_similarity, similarity)
            except Exception as e:
                logger.warning(f"Failed to compare with reference code: {str(e)}")
                continue

        return max_similarity

    def get_average_similarity(self, target_code: str, reference_codes: List[str], method: str = "hybrid") -> float:
        if not reference_codes:
            return 0.0

        similarities = []

        for ref_code in reference_codes:
            try:
                similarity = self.get_similarity(target_code, ref_code, method)
                similarities.append(similarity)
            except Exception as e:
                logger.warning(f"Failed to compare with reference code: {str(e)}")
                continue

        return sum(similarities) / len(similarities) if similarities else 0.0


similarity_calculator = SimilarityCalculator()


def get_similarity(code_a: str, code_b: str, method: str = "hybrid") -> float:
    return similarity_calculator.get_similarity(code_a, code_b, method)


def get_ai_similarity(student_code: str, ai_codes: List[str]) -> float:
    return similarity_calculator.get_max_similarity(student_code, ai_codes, "hybrid")


def get_average_group_similarity(student_code: str, other_submissions: List[str]) -> float:
    return similarity_calculator.get_average_similarity(student_code, other_submissions, "hybrid")


def get_group_similarities(submissions: List[str]) -> Dict[str, Dict[str, float]]:
    similarities = {}

    for i, code_a in enumerate(submissions):
        similarities[f"submission_{i}"] = {}

        for j, code_b in enumerate(submissions):
            if i != j:
                try:
                    similarity = similarity_calculator.get_similarity(code_a, code_b, "hybrid")
                    similarities[f"submission_{i}"][f"submission_{j}"] = similarity
                except Exception as e:
                    logger.warning(f"Failed to compare submissions {i} and {j}: {str(e)}")
                    similarities[f"submission_{i}"][f"submission_{j}"] = 0.0

    return similarities