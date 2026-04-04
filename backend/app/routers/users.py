from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import User
from ..schemas import UserResponse

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db)):
    """Return all active users (for user selection lists)."""
    return db.query(User).filter(User.is_active == True).order_by(User.name.asc()).all()


@router.get("/all", response_model=List[UserResponse])
def get_all_users(
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """Return all users including inactive (for admin)."""
    return db.query(User).order_by(User.name.asc()).all()
