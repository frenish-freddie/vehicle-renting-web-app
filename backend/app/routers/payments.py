from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models import Payment, Booking, User
from app.schemas import PaymentCreate, PaymentResponse
from app.auth.jwt import RoleChecker

router = APIRouter(prefix="/api/payments", tags=["Payments"])

@router.post("/create", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def process_payment(
    payment_in: PaymentCreate,
    current_user: User = Depends(RoleChecker(["guest", "admin"])),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == payment_in.booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Corresponding booking transaction was not found"
        )

    # Authorization Check
    if booking.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to make a payment for this booking"
        )

    # Price Validation Check — accept either full total or the partial (30%) amount
    partial_amount = round((booking.total_amount or 0) * 0.30, 2)
    is_valid_amount = (
        round(payment_in.amount, 2) == round(booking.total_amount, 2)
        or round(payment_in.amount, 2) == partial_amount
        or (booking.partial_amount and round(payment_in.amount, 2) == round(booking.partial_amount, 2))
    )
    if not is_valid_amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment amount does not match the total booking price or partial amount"
        )

    # Check already paid
    existing_payment = db.query(Payment).filter(Payment.booking_id == payment_in.booking_id).first()
    if existing_payment and existing_payment.status == "success":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This booking has already been paid for"
        )

    # Create Payment database entry
    new_payment = Payment(
        booking_id=payment_in.booking_id,
        amount=payment_in.amount,
        status="success",
        method=payment_in.method,
        gateway_ref=payment_in.gateway_ref
    )

    # Update booking transaction
    booking.status = "confirmed"
    booking.payment_id = payment_in.gateway_ref

    db.add(new_payment)
    db.commit()
    db.refresh(new_payment)

    return new_payment
