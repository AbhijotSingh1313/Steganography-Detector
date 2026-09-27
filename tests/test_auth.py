import os
import tempfile
import pytest
from fastapi.testclient import TestClient

# Create a temporary database for testing before importing app
temp_db = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
temp_db_path = temp_db.name
temp_db.close()

os.environ["DATABASE_FILE"] = temp_db_path

import app.config as config
config.DATABASE_FILE = temp_db_path

import app.database as database
database.DATABASE_FILE = temp_db_path
database.init_db()

from app.main import app

client = TestClient(app)


@pytest.fixture(scope="session", autouse=True)
def cleanup():
    yield
    try:
        if os.path.exists(temp_db_path):
            os.remove(temp_db_path)
    except Exception:
        pass


def test_root_endpoint():
    """Verify health check / root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "docs" in data


def test_register_user_success():
    """Verify successful user registration."""
    payload = {
        "username": "testuser",
        "email": "testuser@example.com",
        "password": "SecretPassword123!"
    }
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "testuser"
    assert data["email"] == "testuser@example.com"
    assert "id" in data
    assert "password" not in data
    assert "hashed_password" not in data


def test_register_duplicate_username():
    """Verify registration fails when username already exists."""
    payload = {
        "username": "testuser",
        "email": "another@example.com",
        "password": "Password123!"
    }
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 400
    assert "username already exists" in response.json()["detail"]


def test_register_duplicate_email():
    """Verify registration fails when email already exists."""
    payload = {
        "username": "anotheruser",
        "email": "testuser@example.com",
        "password": "Password123!"
    }
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 400
    assert "email already exists" in response.json()["detail"]


def test_login_json_success():
    """Verify successful login with JSON payload returns JWT."""
    payload = {
        "username": "testuser",
        "password": "SecretPassword123!"
    }
    response = client.post("/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert len(data["access_token"]) > 20


def test_login_by_email_success():
    """Verify successful login using email instead of username."""
    payload = {
        "username": "testuser@example.com",
        "password": "SecretPassword123!"
    }
    response = client.post("/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data


def test_login_wrong_password():
    """Verify login failure with incorrect password."""
    payload = {
        "username": "testuser",
        "password": "WrongPassword!"
    }
    response = client.post("/auth/login", json=payload)
    assert response.status_code == 401
    assert "Incorrect username or password" in response.json()["detail"]


def test_login_nonexistent_user():
    """Verify login failure for non-existent user."""
    payload = {
        "username": "nonexistent",
        "password": "SomePassword123!"
    }
    response = client.post("/auth/login", json=payload)
    assert response.status_code == 401


def test_login_oauth2_form_success():
    """Verify OAuth2 password form login endpoint (/auth/token)."""
    form_data = {
        "username": "testuser",
        "password": "SecretPassword123!"
    }
    response = client.post("/auth/token", data=form_data)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_get_current_user_me():
    """Verify /auth/me returns current user info when authorized."""
    # Obtain token
    login_resp = client.post(
        "/auth/login",
        json={"username": "testuser", "password": "SecretPassword123!"}
    )
    token = login_resp.json()["access_token"]

    # Call /auth/me with bearer header
    headers = {"Authorization": f"Bearer {token}"}
    me_resp = client.get("/auth/me", headers=headers)
    assert me_resp.status_code == 200
    user_data = me_resp.json()
    assert user_data["username"] == "testuser"
    assert user_data["email"] == "testuser@example.com"


def test_protected_route_with_token():
    """Verify /protected route works with valid token."""
    login_resp = client.post(
        "/auth/login",
        json={"username": "testuser", "password": "SecretPassword123!"}
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/protected", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "Hello testuser!" in data["message"]


def test_protected_route_without_token():
    """Verify protected route fails without authorization header."""
    response = client.get("/protected")
    assert response.status_code == 401


def test_protected_route_with_invalid_token():
    """Verify protected route fails with invalid/tampered token."""
    headers = {"Authorization": "Bearer invalid.fake.token"}
    response = client.get("/protected", headers=headers)
    assert response.status_code == 401
