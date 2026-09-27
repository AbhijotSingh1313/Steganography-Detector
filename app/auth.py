from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from typing import Dict, Any, List

from app.schemas import (
    UserRegister,
    UserLogin,
    TokenResponse,
    UserResponse,
    PasswordResetRequest,
    PasswordChangeRequest,
    UserUpdateRequest,
    MessageResponse,
)
from app.database import (
    get_user_by_username,
    get_user_by_email,
    get_user_by_id,
    create_user,
    list_users,
    update_user_password,
    update_user_name,
    delete_user,
)
from app.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")


async def get_current_user(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    """Dependency to retrieve the authenticated user from the Bearer JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    username: str = payload.get("sub")
    if username is None:
        raise credentials_exception

    user = get_user_by_username(username)
    if user is None:
        user = get_user_by_email(username)
    if user is None:
        raise credentials_exception

    return {
        "id": user["id"],
        "username": user["username"],
        "email": user["email"],
        "name": user.get("name", user["username"]),
        "created_at": str(user["created_at"]),
    }


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
async def register(user_data: UserRegister):
    """Register a new user account with unique username and email."""
    if get_user_by_username(user_data.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this username already exists",
        )

    if get_user_by_email(user_data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists",
        )

    hashed_pw = hash_password(user_data.password)
    # Store lowercase security answer for robust matching
    hashed_answer = hash_password(user_data.security_answer.strip().lower()) if user_data.security_answer else None

    new_user = create_user(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_pw,
        name=user_data.name or user_data.username,
        security_question=user_data.security_question,
        security_answer=hashed_answer,
    )

    return {
        "id": new_user["id"],
        "username": new_user["username"],
        "email": new_user["email"],
        "name": new_user.get("name"),
        "security_question": new_user.get("security_question"),
        "created_at": str(new_user["created_at"]),
    }


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="User login with JSON body",
)
async def login_json(credentials: UserLogin):
    """Authenticate with username/email and password, returns a JWT access token."""
    user = get_user_by_username(credentials.username)
    if not user:
        user = get_user_by_email(credentials.username)

    if not user or not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        data={"sub": user["username"], "user_id": user["id"]}
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "name": user.get("name", user["username"]),
        },
    }


@router.post(
    "/token",
    response_model=TokenResponse,
    summary="OAuth2 compatible token login (form data)",
)
async def login_form(form_data: OAuth2PasswordRequestForm = Depends()):
    """OAuth2 password form endpoint for Swagger UI interactive 'Authorize' button."""
    user = get_user_by_username(form_data.username)
    if not user:
        user = get_user_by_email(form_data.username)

    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        data={"sub": user["username"], "user_id": user["id"]}
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "name": user.get("name", user["username"]),
        },
    }


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Retrieve current user profile",
)
async def read_users_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Fetch profile information for the currently authenticated user."""
    return current_user


@router.get(
    "/users",
    response_model=List[Dict[str, Any]],
    summary="List all registered accounts",
)
async def get_all_users():
    """Returns list of registered users for multi-account switcher."""
    return list_users()


@router.post(
    "/security-question",
    summary="Get security question for password recovery",
)
async def get_security_question(payload: Dict[str, str]):
    """Returns security question associated with the provided email."""
    email = payload.get("email", "").strip().lower()
    user = get_user_by_email(email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found. Please verify your email.",
        )
    question = user.get("security_question")
    if not question:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No security question was configured for this account.",
        )
    return {"success": True, "securityQuestion": question}


@router.post(
    "/reset-password",
    response_model=MessageResponse,
    summary="Reset password using security question answer",
)
async def reset_password(payload: PasswordResetRequest):
    """Verify security answer and update account password."""
    user = get_user_by_email(payload.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found. Please try again.",
        )

    stored_answer_hash = user.get("security_answer")
    if not stored_answer_hash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No security question configured for this account.",
        )

    clean_answer = payload.security_answer.strip().lower()
    if not verify_password(clean_answer, stored_answer_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect answer to the security question.",
        )

    update_user_password(payload.email, hash_password(payload.new_password))
    return {"message": "Password reset successfully! You can now log in with your new password."}


@router.post(
    "/change-password",
    response_model=MessageResponse,
    summary="Change password with old password verification",
)
async def change_password(payload: PasswordChangeRequest):
    """Change password verifying the current old password."""
    user = get_user_by_email(payload.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found.",
        )

    if not verify_password(payload.old_password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password does not match our records.",
        )

    update_user_password(payload.email, hash_password(payload.new_password))
    return {"message": "Password updated successfully!"}


@router.delete(
    "/user/{user_id_or_email}",
    response_model=MessageResponse,
    summary="Delete user account",
)
async def delete_account_endpoint(user_id_or_email: str):
    """Delete a user account by ID or email."""
    success = delete_user(user_id_or_email)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account could not be found.",
        )
    return {"message": "Account deleted successfully."}
