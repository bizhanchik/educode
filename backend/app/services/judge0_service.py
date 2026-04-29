
import asyncio
import base64
import logging
from typing import Dict, List, Any

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

JUDGE0_LANGUAGE_MAP = {
    "python": 71,
    "javascript": 63,
    "java": 62,
    "cpp": 54,
    "csharp": 51,
    "dart": 90,
}

SUPPORTED_LANGUAGES = list(JUDGE0_LANGUAGE_MAP.keys())


class Judge0ServiceError(Exception):
    pass


class Judge0LanguageNotSupported(Judge0ServiceError):
    pass


class Judge0ExecutionError(Judge0ServiceError):
    pass


class Judge0Service:

    def __init__(self):
        self.base_url = settings.JUDGE0_API_URL.rstrip('/')
        self.rapidapi_key = settings.JUDGE0_RAPIDAPI_KEY
        self.rapidapi_host = settings.JUDGE0_RAPIDAPI_HOST
        self.timeout = settings.JUDGE0_TIMEOUT_SECONDS
        self.max_retries = settings.JUDGE0_MAX_RETRIES

    def _get_headers(self) -> Dict[str, str]:
        return {
            "Content-Type": "application/json",
            "x-rapidapi-key": self.rapidapi_key,
            "x-rapidapi-host": self.rapidapi_host,
        }

    def map_language_to_id(self, language: str) -> int:
        language_lower = language.lower()
        if language_lower not in JUDGE0_LANGUAGE_MAP:
            raise Judge0LanguageNotSupported(
                f"Language '{language}' not supported. "
                f"Supported languages: {', '.join(SUPPORTED_LANGUAGES)}"
            )
        return JUDGE0_LANGUAGE_MAP[language_lower]

    async def submit_code(
        self,
        source_code: str,
        language_id: int,
        stdin: str = ""
    ) -> Dict[str, Any]:
        if not self.rapidapi_key:
            raise Judge0ServiceError("JUDGE0_RAPIDAPI_KEY is not configured")

        source_code_b64 = base64.b64encode(source_code.encode()).decode()
        stdin_b64 = base64.b64encode(stdin.encode()).decode() if stdin else ""

        submission_data = {
            "language_id": language_id,
            "source_code": source_code_b64,
            "stdin": stdin_b64,
        }

        headers = self._get_headers()

        for attempt in range(self.max_retries):
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    response = await client.post(
                        f"{self.base_url}/submissions?base64_encoded=true&wait=true&fields=*",
                        json=submission_data,
                        headers=headers
                    )

                    if response.status_code != 200 and response.status_code != 201:
                        error_text = response.text[:500]
                        logger.warning(
                            f"Judge0 API error (attempt {attempt + 1}): "
                            f"HTTP {response.status_code} - {error_text}"
                        )
                        if response.status_code == 401:
                            raise Judge0ServiceError("Invalid RapidAPI key")
                        if response.status_code == 429:
                            await asyncio.sleep(5 * (attempt + 1))
                            continue
                        if attempt == self.max_retries - 1:
                            raise Judge0ServiceError(
                                f"Judge0 API error: HTTP {response.status_code}"
                            )
                        await asyncio.sleep(2 ** attempt)
                        continue

                    result = response.json()
                    return self._parse_judge0_response(result)

            except httpx.TimeoutException as e:
                logger.warning(
                    f"Judge0 request timeout (attempt {attempt + 1}/{self.max_retries}): {e}"
                )
                if attempt == self.max_retries - 1:
                    raise Judge0ServiceError(
                        f"Judge0 request timed out after {self.max_retries} attempts"
                    )
                await asyncio.sleep(2 ** attempt)

            except httpx.RequestError as e:
                logger.warning(
                    f"Judge0 connection error (attempt {attempt + 1}/{self.max_retries}): {e}"
                )
                if attempt == self.max_retries - 1:
                    raise Judge0ServiceError(
                        f"Failed to connect to Judge0: {str(e)}"
                    )
                await asyncio.sleep(2 ** attempt)

            except Judge0ServiceError:
                raise

            except Exception as e:
                logger.error(f"Unexpected error in Judge0 submission: {e}")
                raise Judge0ServiceError(f"Unexpected error: {str(e)}")

        raise Judge0ServiceError("Failed to execute code after all retries")

    async def run_tests(
        self,
        source_code: str,
        language: str,
        tests: List[Dict[str, str]]
    ) -> List[Dict[str, Any]]:
        language_id = self.map_language_to_id(language)

        semaphore = asyncio.Semaphore(5)

        async def run_with_semaphore(test):
            async with semaphore:
                test_input = test.get("input", "")
                expected_output = test.get("expected_output", "")
                return await self._run_single_test(
                    source_code,
                    language_id,
                    test_input,
                    expected_output
                )

        results = await asyncio.gather(
            *[run_with_semaphore(test) for test in tests],
            return_exceptions=True
        )

        processed_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                processed_results.append({
                    "input": tests[i].get("input", ""),
                    "expected_output": tests[i].get("expected_output", ""),
                    "actual_output": "",
                    "passed": False,
                    "time": None,
                    "memory": None,
                    "stderr": str(result)
                })
            else:
                processed_results.append(result)

        return processed_results

    async def _run_single_test(
        self,
        source_code: str,
        language_id: int,
        test_input: str,
        expected_output: str
    ) -> Dict[str, Any]:
        try:
            result = await self.submit_code(source_code, language_id, test_input)

            actual_output = result.get("stdout", "")
            stderr = result.get("stderr", "")
            compile_output = result.get("compile_output", "")

            passed = self._compare_outputs(expected_output, actual_output)

            return {
                "input": test_input,
                "expected_output": expected_output,
                "actual_output": actual_output,
                "passed": passed,
                "time": result.get("time"),
                "memory": result.get("memory"),
                "stderr": stderr or compile_output
            }

        except Exception as e:
            logger.error(f"Error running test: {e}")
            return {
                "input": test_input,
                "expected_output": expected_output,
                "actual_output": "",
                "passed": False,
                "time": None,
                "memory": None,
                "stderr": str(e)
            }

    def _compare_outputs(self, expected: str, actual: str) -> bool:
        expected_lines = [line.rstrip() for line in expected.strip().split('\n')]
        actual_lines = [line.rstrip() for line in actual.strip().split('\n')]

        return expected_lines == actual_lines

    def _parse_judge0_response(self, response: Dict[str, Any]) -> Dict[str, Any]:
        stdout = response.get("stdout", "") or ""
        stderr = response.get("stderr", "") or ""
        compile_output = response.get("compile_output", "") or ""

        try:
            if stdout:
                stdout = base64.b64decode(stdout).decode('utf-8', errors='replace')
        except Exception:
            pass

        try:
            if stderr:
                stderr = base64.b64decode(stderr).decode('utf-8', errors='replace')
        except Exception:
            pass

        try:
            if compile_output:
                compile_output = base64.b64decode(compile_output).decode('utf-8', errors='replace')
        except Exception:
            pass

        return {
            "stdout": stdout,
            "stderr": stderr,
            "compile_output": compile_output,
            "status": {
                "id": response.get("status", {}).get("id", 0),
                "description": response.get("status", {}).get("description", "Unknown")
            },
            "time": float(response.get("time") or 0.0),
            "memory": int(response.get("memory") or 0)
        }
