"""
EduCode Similarity Service

A FastAPI service that provides code similarity analysis using multiple methods:
- Token-based similarity (Jaccard coefficient)
- Semantic similarity (using sentence transformers)
- Structural similarity (AST-based comparison)
"""

import re
import ast
import hashlib
from typing import Dict, List, Any, Optional
from datetime import datetime

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="EduCode Similarity Service",
    description="AI-powered code similarity analysis service",
    version="1.0.0"
)


class CompareRequest(BaseModel):
    """Request model for code comparison."""
    code1: str = Field(..., description="First code snippet to compare")
    code2: str = Field(..., description="Second code snippet to compare")
    method: str = Field(default="hybrid", description="Similarity method: 'token', 'semantic', 'structural', or 'hybrid'")


class CompareResponse(BaseModel):
    """Response model for code comparison."""
    similarity: float = Field(..., description="Similarity score between 0.0 and 1.0")
    method: str = Field(..., description="Method used for comparison")
    details: Dict[str, Any] = Field(default_factory=dict, description="Additional comparison details")


class SimilarityCalculator:
    """Handles different types of code similarity calculations."""
    
    def __init__(self):
        self.tfidf_vectorizer = TfidfVectorizer(
            token_pattern=r'\b\w+\b',
            lowercase=True,
            stop_words=None
        )
    
    def normalize_code(self, code: str) -> str:
        """Normalize code by removing comments, extra whitespace, and standardizing formatting."""
        # Remove single-line comments
        code = re.sub(r'//.*$', '', code, flags=re.MULTILINE)
        code = re.sub(r'#.*$', '', code, flags=re.MULTILINE)
        
        # Remove multi-line comments
        code = re.sub(r'/\*.*?\*/', '', code, flags=re.DOTALL)
        code = re.sub(r'""".*?"""', '', code, flags=re.DOTALL)
        code = re.sub(r"'''.*?'''", '', code, flags=re.DOTALL)
        
        # Normalize whitespace
        code = re.sub(r'\s+', ' ', code)
        
        # Remove extra spaces around operators and punctuation
        code = re.sub(r'\s*([{}();,=+\-*/])\s*', r'\1', code)
        
        return code.strip().lower()
    
    def tokenize_code(self, code: str) -> List[str]:
        """Extract meaningful tokens from code."""
        normalized = self.normalize_code(code)
        
        # Extract identifiers, keywords, operators, and literals
        tokens = re.findall(r'\b\w+\b|[{}();,=+\-*/]', normalized)
        
        return [token for token in tokens if len(token) > 1 or token in '{}();,=+-*/']
    
    def calculate_token_similarity(self, code1: str, code2: str) -> Dict[str, Any]:
        """Calculate similarity based on token overlap (Jaccard coefficient)."""
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
        """Calculate semantic similarity using TF-IDF and cosine similarity."""
        try:
            # Prepare documents
            docs = [self.normalize_code(code1), self.normalize_code(code2)]
            
            if not docs[0] and not docs[1]:
                return {"similarity": 1.0, "method": "semantic"}
            
            if not docs[0] or not docs[1]:
                return {"similarity": 0.0, "method": "semantic"}
            
            # Calculate TF-IDF vectors
            tfidf_matrix = self.tfidf_vectorizer.fit_transform(docs)
            
            # Calculate cosine similarity
            similarity_matrix = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])
            semantic_similarity = similarity_matrix[0][0]
            
            return {
                "similarity": float(semantic_similarity),
                "method": "semantic",
                "features": tfidf_matrix.shape[1]
            }
            
        except Exception as e:
            logger.warning(f"Semantic similarity calculation failed: {str(e)}")
            # Fallback to token similarity
            return self.calculate_token_similarity(code1, code2)
    
    def calculate_structural_similarity(self, code1: str, code2: str) -> Dict[str, Any]:
        """Calculate structural similarity based on AST comparison."""
        try:
            # Parse AST for both code snippets
            ast1 = self._get_ast_structure(code1)
            ast2 = self._get_ast_structure(code2)
            
            if not ast1 and not ast2:
                return {"similarity": 1.0, "method": "structural"}
            
            if not ast1 or not ast2:
                return {"similarity": 0.0, "method": "structural"}
            
            # Compare AST structures
            similarity = self._compare_ast_structures(ast1, ast2)
            
            return {
                "similarity": similarity,
                "method": "structural",
                "ast1_nodes": len(ast1),
                "ast2_nodes": len(ast2)
            }
            
        except Exception as e:
            logger.warning(f"Structural similarity calculation failed: {str(e)}")
            # Fallback to token similarity
            return self.calculate_token_similarity(code1, code2)
    
    def _get_ast_structure(self, code: str) -> List[str]:
        """Extract AST node types from code."""
        try:
            tree = ast.parse(code)
            nodes = []
            
            for node in ast.walk(tree):
                nodes.append(type(node).__name__)
            
            return nodes
            
        except SyntaxError:
            # If Python parsing fails, try to extract basic structural elements
            return self._extract_basic_structure(code)
    
    def _extract_basic_structure(self, code: str) -> List[str]:
        """Extract basic structural elements when AST parsing fails."""
        structure = []
        
        # Look for common programming constructs
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
        """Compare two AST structures using set similarity."""
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
        """Calculate hybrid similarity combining multiple methods."""
        token_result = self.calculate_token_similarity(code1, code2)
        semantic_result = self.calculate_semantic_similarity(code1, code2)
        structural_result = self.calculate_structural_similarity(code1, code2)
        
        # Weighted combination
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


# Global similarity calculator instance
similarity_calc = SimilarityCalculator()


@app.post("/compare", response_model=CompareResponse)
async def compare_code(request: CompareRequest) -> CompareResponse:
    """
    Compare two code snippets and return similarity score.
    
    Supports multiple comparison methods:
    - token: Token-based similarity using Jaccard coefficient
    - semantic: Semantic similarity using TF-IDF and cosine similarity
    - structural: Structural similarity using AST comparison
    - hybrid: Weighted combination of all methods (default)
    """
    try:
        logger.info(f"Comparing code snippets using method: {request.method}")
        
        if request.method == "token":
            result = similarity_calc.calculate_token_similarity(request.code1, request.code2)
        elif request.method == "semantic":
            result = similarity_calc.calculate_semantic_similarity(request.code1, request.code2)
        elif request.method == "structural":
            result = similarity_calc.calculate_structural_similarity(request.code1, request.code2)
        elif request.method == "hybrid":
            result = similarity_calc.calculate_hybrid_similarity(request.code1, request.code2)
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid method '{request.method}'. Use 'token', 'semantic', 'structural', or 'hybrid'"
            )
        
        # Ensure similarity is between 0 and 1
        similarity = max(0.0, min(1.0, result["similarity"]))
        
        return CompareResponse(
            similarity=round(similarity, 3),
            method=result["method"],
            details=result
        )
        
    except Exception as e:
        logger.error(f"Error comparing code: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Comparison failed: {str(e)}")


@app.get("/ping")
async def ping():
    """Simple ping endpoint for health checks"""
    return {
        "message": "pong",
        "service": "similarity",
        "timestamp": datetime.utcnow().isoformat(),
        "status": "healthy"
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "similarity",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "EduCode Similarity Service",
        "version": "1.0.0",
        "status": "running",
        "endpoints": ["/ping", "/health", "/compare"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)