"""
routes/auth.py — User authentication and profile management routes.

POST /auth/signup
POST /auth/login
GET  /auth/me
PUT  /auth/update-profile
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, field_validator
from database import get_db
from models.user import User
from services.auth_service import (
    get_user_by_email,
    create_user,
    verify_password,
    get_current_user,
    get_user_by_id,
    hash_password,
)
from services.jwt_service import create_access_token

router = APIRouter(prefix="/auth", tags=["Auth"])

VALID_BLOOD_GROUPS = {"A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", ""}


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------

class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    blood_group: str = ""

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Name cannot be empty")
        return v

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @field_validator("blood_group")
    @classmethod
    def valid_blood_group(cls, v: str) -> str:
        v = v.strip()
        if v and v not in VALID_BLOOD_GROUPS:
            raise ValueError(f"Invalid blood group '{v}'. Must be one of: A+, A-, B+, B-, AB+, AB-, O+, O-")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UpdateProfileRequest(BaseModel):
    name: str | None = None
    blood_group: str | None = None
    current_password: str | None = None
    new_password: str | None = None

    @field_validator("blood_group")
    @classmethod
    def valid_blood_group(cls, v: str | None) -> str | None:
        if v is not None:
            v = v.strip()
            if v and v not in VALID_BLOOD_GROUPS:
                raise ValueError("Invalid blood group")
        return v


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    blood_group: str | None

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    """Create a new user account."""
    if get_user_by_email(db, payload.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )
    create_user(db, payload.name, payload.email, payload.password, payload.blood_group or None)
    return {"message": "Account created successfully"}


@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate and return a JWT access token."""
    user = get_user_by_email(db, payload.email)
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    token = create_access_token(user.id)
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    """Return the profile of the authenticated user."""
    return current_user


@router.put("/update-profile", response_model=UserResponse)
def update_profile(
    payload: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update profile fields. Password change requires current_password."""
    if payload.name is not None:
        name = payload.name.strip()
        if not name:
            raise HTTPException(status_code=400, detail="Name cannot be empty")
        current_user.name = name

    if payload.blood_group is not None:
        current_user.blood_group = payload.blood_group.strip() or None

    if payload.new_password:
        if not payload.current_password:
            raise HTTPException(status_code=400, detail="current_password required to set a new password")
        if not verify_password(payload.current_password, current_user.password_hash):
            raise HTTPException(status_code=401, detail="Current password is incorrect")
        if len(payload.new_password) < 8:
            raise HTTPException(status_code=400, detail="New password must be at least 8 characters")
        current_user.password_hash = hash_password(payload.new_password)

    db.commit()
    db.refresh(current_user)
    return current_user
