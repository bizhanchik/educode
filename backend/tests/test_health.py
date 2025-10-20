"""
Unit tests for health check endpoints.

This module contains tests for the health check functionality of the EduCode backend API.
Tests include basic health checks, detailed health checks with database connectivity,
and Kubernetes-style readiness/liveness probes.
"""

import pytest
from httpx import AsyncClient
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch

from app.main import app
from app.core.database import get_db


class TestHealthEndpoints:
    """Test class for health check endpoints."""

    @pytest.fixture
    def client(self):
        """Create a test client for the FastAPI application."""
        return TestClient(app)

    @pytest.fixture
    async def async_client(self):
        """Create an async test client for the FastAPI application."""
        async with AsyncClient(app=app, base_url="http://test") as ac:
            yield ac

    def test_health_endpoint_basic(self, client):
        """Test the basic /health endpoint returns 200 OK with correct status."""
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "timestamp" in data
        assert "service" in data
        assert data["service"] == "EduCode Backend"

    def test_health_endpoint_structure(self, client):
        """Test that the health endpoint returns the expected JSON structure."""
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        
        # Check required fields
        required_fields = ["status", "timestamp", "service", "version"]
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
        
        # Check data types
        assert isinstance(data["status"], str)
        assert isinstance(data["timestamp"], str)
        assert isinstance(data["service"], str)
        assert isinstance(data["version"], str)

    @pytest.mark.asyncio
    async def test_health_endpoint_async(self, async_client):
        """Test the health endpoint using async client."""
        response = await async_client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"

    def test_health_detailed_endpoint_success(self, client):
        """Test the detailed health endpoint with successful database connection."""
        with patch("app.core.database.check_database_health", new_callable=AsyncMock) as mock_db_health:
            mock_db_health.return_value = True
            
            response = client.get("/health/detailed")
            
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "ok"
            assert data["database"]["status"] == "connected"
            assert data["database"]["healthy"] is True

    def test_health_detailed_endpoint_db_failure(self, client):
        """Test the detailed health endpoint with database connection failure."""
        with patch("app.core.database.check_database_health", new_callable=AsyncMock) as mock_db_health:
            mock_db_health.return_value = False
            
            response = client.get("/health/detailed")
            
            assert response.status_code == 503
            data = response.json()
            assert data["status"] == "unhealthy"
            assert data["database"]["status"] == "disconnected"
            assert data["database"]["healthy"] is False

    def test_health_detailed_endpoint_db_exception(self, client):
        """Test the detailed health endpoint when database check raises an exception."""
        with patch("app.core.database.check_database_health", new_callable=AsyncMock) as mock_db_health:
            mock_db_health.side_effect = Exception("Database connection error")
            
            response = client.get("/health/detailed")
            
            assert response.status_code == 503
            data = response.json()
            assert data["status"] == "unhealthy"
            assert data["database"]["status"] == "error"
            assert data["database"]["healthy"] is False
            assert "Database connection error" in data["database"]["error"]

    def test_health_ready_endpoint_success(self, client):
        """Test the Kubernetes readiness probe endpoint."""
        with patch("app.core.database.check_database_health", new_callable=AsyncMock) as mock_db_health:
            mock_db_health.return_value = True
            
            response = client.get("/health/ready")
            
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "ready"

    def test_health_ready_endpoint_failure(self, client):
        """Test the Kubernetes readiness probe endpoint with failure."""
        with patch("app.core.database.check_database_health", new_callable=AsyncMock) as mock_db_health:
            mock_db_health.return_value = False
            
            response = client.get("/health/ready")
            
            assert response.status_code == 503
            data = response.json()
            assert data["status"] == "not ready"

    def test_health_live_endpoint(self, client):
        """Test the Kubernetes liveness probe endpoint."""
        response = client.get("/health/live")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "alive"
        assert "timestamp" in data

    def test_health_endpoints_content_type(self, client):
        """Test that all health endpoints return JSON content type."""
        endpoints = ["/health", "/health/detailed", "/health/ready", "/health/live"]
        
        for endpoint in endpoints:
            if endpoint == "/health/detailed":
                # Mock database health for detailed endpoint
                with patch("app.core.database.check_database_health", new_callable=AsyncMock) as mock_db_health:
                    mock_db_health.return_value = True
                    response = client.get(endpoint)
            else:
                response = client.get(endpoint)
            
            assert response.headers["content-type"] == "application/json"

    @pytest.mark.asyncio
    async def test_health_endpoint_performance(self, async_client):
        """Test that health endpoint responds quickly (performance test)."""
        import time
        
        start_time = time.time()
        response = await async_client.get("/health")
        end_time = time.time()
        
        # Health endpoint should respond within 1 second
        response_time = end_time - start_time
        assert response_time < 1.0, f"Health endpoint took {response_time:.2f}s, expected < 1.0s"
        assert response.status_code == 200

    def test_health_endpoint_multiple_requests(self, client):
        """Test that health endpoint handles multiple concurrent requests."""
        responses = []
        
        # Make multiple requests
        for _ in range(10):
            response = client.get("/health")
            responses.append(response)
        
        # All requests should succeed
        for response in responses:
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "ok"

    @pytest.mark.parametrize("endpoint", [
        "/health",
        "/health/ready", 
        "/health/live"
    ])
    def test_health_endpoints_no_auth_required(self, client, endpoint):
        """Test that health endpoints don't require authentication."""
        response = client.get(endpoint)
        
        # Should not return 401 Unauthorized or 403 Forbidden
        assert response.status_code not in [401, 403]
        assert response.status_code in [200, 503]  # 503 possible for ready endpoint


class TestHealthEndpointIntegration:
    """Integration tests for health endpoints with database dependency override."""

    @pytest.fixture
    def client_with_mock_db(self):
        """Create a test client with mocked database dependency."""
        async def mock_get_db():
            """Mock database session."""
            yield AsyncMock()
        
        app.dependency_overrides[get_db] = mock_get_db
        client = TestClient(app)
        yield client
        app.dependency_overrides.clear()

    def test_health_with_mocked_dependencies(self, client_with_mock_db):
        """Test health endpoint with mocked database dependencies."""
        response = client_with_mock_db.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])