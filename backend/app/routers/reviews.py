# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.connection import get_db
from app.models import Review, User
from app.schemas import ReviewCreate, ReviewResponse
from app.auth.jwt import get_current_user, RoleChecker

router = APIRouter(prefix="/api/reviews", tags=["Reviews"])

@router.post("", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def post_review(
    review_in: ReviewCreate,
    current_user: User = Depends(RoleChecker(["customer", "admin"])),
    db: Session = Depends(get_db)
):
    if not review_in.vehicle_id and not review_in.driver_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A review must target either a vehicle or a driver profile"
        )

    new_review = Review(
        user_id=current_user.id,
        **review_in.dict()
    )

    db.add(new_review)
    db.commit()
    db.refresh(new_review)

    # Attach current user info to response
    new_review.user = current_user
    return new_review

@router.get("", response_model=List[ReviewResponse])
def get_reviews(
    vehicle_id: Optional[int] = Query(None),
    driver_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Review)
    if vehicle_id:
        query = query.filter(Review.vehicle_id == vehicle_id)
    if driver_id:
        query = query.filter(Review.driver_id == driver_id)

    reviews = query.all()
    
    # Eagerly load user data
    for r in reviews:
        r.user = db.query(User).filter(User.id == r.user_id).first()

    return reviews
