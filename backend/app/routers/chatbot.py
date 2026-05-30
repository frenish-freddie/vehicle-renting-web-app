from fastapi import APIRouter
from app.schemas import ChatQuery, ChatQueryResponse

router = APIRouter(prefix="/api/chatbot", tags=["Chatbot"])

@router.post("/message", response_model=ChatQueryResponse)
def get_chat_response(query: ChatQuery):
    # Stub implementation for now
    return {
        "reply": "Hello, I am RentBot. How can I help you?",
        "messageType": "text",
        "data": None,
        "quickReplies": ["Available vehicles", "Driver service"]
    }
