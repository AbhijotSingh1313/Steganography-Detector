"""
Simple in-memory brute-force protection for login endpoints.
Tracks failed login attempts per IP and enforces a lockout period.
"""

import time
from collections import defaultdict
from threading import Lock
from typing import Dict, Tuple

from app.config import MAX_LOGIN_ATTEMPTS, LOGIN_LOCKOUT_SECONDS


# {ip: (fail_count, first_fail_timestamp)}
_attempt_store: Dict[str, Tuple[int, float]] = defaultdict(lambda: (0, 0.0))
_lock = Lock()


def _is_locked_out(ip: str) -> Tuple[bool, int]:
    """Check if an IP is currently locked out.
    Returns (is_locked, seconds_remaining).
    """
    count, first_fail_time = _attempt_store[ip]
    if count >= MAX_LOGIN_ATTEMPTS:
        elapsed = time.time() - first_fail_time
        remaining = int(LOGIN_LOCKOUT_SECONDS - elapsed)
        if remaining > 0:
            return True, remaining
        # Lockout expired — reset
        with _lock:
            _attempt_store[ip] = (0, 0.0)
    return False, 0


def record_failed_attempt(ip: str) -> None:
    """Increment the failed attempt counter for an IP."""
    with _lock:
        count, first_fail_time = _attempt_store[ip]
        if count == 0:
            first_fail_time = time.time()
        _attempt_store[ip] = (count + 1, first_fail_time)


def reset_attempts(ip: str) -> None:
    """Clear failed attempts on successful login."""
    with _lock:
        _attempt_store[ip] = (0, 0.0)


def get_client_ip(request) -> str:
    """Extract the real client IP, respecting X-Forwarded-For if present."""
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.client.host
