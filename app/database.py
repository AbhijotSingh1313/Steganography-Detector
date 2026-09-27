import sqlite3
from typing import Optional, Dict, Any, List
from app.config import DATABASE_FILE


def get_db_connection() -> sqlite3.Connection:
    """Create and return a database connection with dictionary-like row access."""
    conn = sqlite3.connect(DATABASE_FILE)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Initialize database tables with schema migrations."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                hashed_password TEXT NOT NULL,
                name TEXT,
                security_question TEXT,
                security_answer TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        # Safe migration if table exists from earlier versions
        for col, col_type in [
            ("name", "TEXT"),
            ("security_question", "TEXT"),
            ("security_answer", "TEXT"),
        ]:
            try:
                cursor.execute(f"ALTER TABLE users ADD COLUMN {col} {col_type}")
            except sqlite3.OperationalError:
                pass
        conn.commit()


def get_user_by_username(username: str) -> Optional[Dict[str, Any]]:
    """Retrieve user record by username."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
        row = cursor.fetchone()
        return dict(row) if row else None


def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Retrieve user record by email (case-insensitive)."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE LOWER(email) = LOWER(?)", (email,))
        row = cursor.fetchone()
        return dict(row) if row else None


def get_user_by_id(user_id: int) -> Optional[Dict[str, Any]]:
    """Retrieve user record by primary key id."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        return dict(row) if row else None


def list_users() -> List[Dict[str, Any]]:
    """List all registered users without exposing passwords."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, username, email, name, security_question, created_at FROM users")
        return [dict(row) for row in cursor.fetchall()]


def create_user(
    username: str,
    email: str,
    hashed_password: str,
    name: Optional[str] = None,
    security_question: Optional[str] = None,
    security_answer: Optional[str] = None,
) -> Dict[str, Any]:
    """Insert a new user and return the created record."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO users (username, email, hashed_password, name, security_question, security_answer)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (username, email, hashed_password, name or username, security_question, security_answer),
        )
        conn.commit()
        new_id = cursor.lastrowid
        cursor.execute("SELECT * FROM users WHERE id = ?", (new_id,))
        row = cursor.fetchone()
        return dict(row)


def update_user_password(email: str, new_hashed_password: str) -> bool:
    """Update password for an existing user by email."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE users SET hashed_password = ? WHERE LOWER(email) = LOWER(?)",
            (new_hashed_password, email),
        )
        conn.commit()
        return cursor.rowcount > 0


def update_user_name(user_id: int, new_name: str) -> Optional[Dict[str, Any]]:
    """Update user's display name."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET name = ? WHERE id = ?", (new_name, user_id))
        conn.commit()
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        return dict(row) if row else None


def delete_user(user_id_or_email: str) -> bool:
    """Delete a user by ID or email."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if user_id_or_email.isdigit():
            cursor.execute("DELETE FROM users WHERE id = ?", (int(user_id_or_email),))
        else:
            cursor.execute("DELETE FROM users WHERE LOWER(email) = LOWER(?)", (user_id_or_email,))
        conn.commit()
        return cursor.rowcount > 0
